import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  console.log("🛠️  Fixing Cross-Chain Transfer Setup");
  console.log("Network:", network.name, "Chain ID:", network.chainId.toString());
  console.log("Deployer:", deployer.address);
  
  // Target user address from failed transaction
  const TARGET_USER = "0x2BCc053BB6915F28aC2041855D2292dDca406903";
  
  // Contract addresses based on network
  let PLY_TOKEN_ADDRESS: string;
  let POLYROUTER_ADDRESS: string;
  let VAULT_ADDRESS: string;
  
  if (network.chainId === 11155111n) { // Sepolia
    PLY_TOKEN_ADDRESS = "0x7185D90BCD120dE7d091DF6EA8bd26e912571b61";
    POLYROUTER_ADDRESS = "0x44AB25180aA8d41E0b584d9E34C35a5990254A81";
    VAULT_ADDRESS = "0x918DD2C599C24e04069c6f32547Bb987d0Bd8B48";
  } else if (network.chainId === 43113n) { // Fuji
    PLY_TOKEN_ADDRESS = "0x54Ec69d90d7dbf75Ea51C61c8e7DC81fACbe7Fb7";
    POLYROUTER_ADDRESS = "0x918DD2C599C24e04069c6f32547Bb987d0Bd8B48";
    VAULT_ADDRESS = "0x53FD504CE2752AdacDD5F85223Cc45F4E22a2d8d";
  } else {
    console.log("❌ Unsupported network");
    return;
  }

  try {
    const plyToken = await ethers.getContractAt("PLYToken", PLY_TOKEN_ADDRESS);
    const polyRouter = await ethers.getContractAt("PolyRouter", POLYROUTER_ADDRESS);
    
    console.log("\n1️⃣ Checking Current Status...");
    
    // Check current balances
    const userPlyBalance = await plyToken.balanceOf(TARGET_USER);
    const deployerPlyBalance = await plyToken.balanceOf(deployer.address);
    const routerPlyBalance = await plyToken.balanceOf(POLYROUTER_ADDRESS);
    
    console.log("Target User PLY Balance:", ethers.formatEther(userPlyBalance));
    console.log("Deployer PLY Balance:", ethers.formatEther(deployerPlyBalance));
    console.log("Router PLY Balance:", ethers.formatEther(routerPlyBalance));
    
    // Step 1: Transfer PLY tokens to target user if needed
    const requiredAmount = ethers.parseEther("1000"); // 1000 PLY for testing
    
    if (userPlyBalance < requiredAmount) {
      console.log("\n2️⃣ Transferring PLY tokens to target user...");
      
      if (deployerPlyBalance >= requiredAmount) {
        const transferTx = await plyToken.transfer(TARGET_USER, requiredAmount);
        await transferTx.wait();
        console.log("✅ Transferred", ethers.formatEther(requiredAmount), "PLY to target user");
        console.log("Transaction:", transferTx.hash);
      } else {
        console.log("❌ Deployer doesn't have enough PLY tokens");
        console.log("   Deployer needs at least:", ethers.formatEther(requiredAmount));
        console.log("   Current balance:", ethers.formatEther(deployerPlyBalance));
        
        // Try to mint more tokens to deployer first
        console.log("📈 Attempting to mint more PLY tokens...");
        try {
          const mintTx = await plyToken.mint(deployer.address, requiredAmount);
          await mintTx.wait();
          console.log("✅ Minted", ethers.formatEther(requiredAmount), "PLY to deployer");
          
          // Now transfer to target user
          const transferTx = await plyToken.transfer(TARGET_USER, requiredAmount);
          await transferTx.wait();
          console.log("✅ Transferred", ethers.formatEther(requiredAmount), "PLY to target user");
        } catch (mintError: any) {
          console.log("❌ Could not mint PLY tokens:", mintError.message);
          return;
        }
      }
    } else {
      console.log("✅ Target user already has sufficient PLY tokens");
    }
    
    // Step 2: Fund router with PLY tokens for destination minting
    const routerRequiredAmount = ethers.parseEther("10000"); // 10k PLY for router
    
    if (routerPlyBalance < routerRequiredAmount) {
      console.log("\n3️⃣ Funding PolyRouter with PLY tokens...");
      
      try {
        const fundTx = await polyRouter.fundContract(routerRequiredAmount);
        await fundTx.wait();
        console.log("✅ Funded router with", ethers.formatEther(routerRequiredAmount), "PLY");
        console.log("Transaction:", fundTx.hash);
      } catch (fundError: any) {
        console.log("❌ Could not fund router:", fundError.message);
        
        // Alternative: mint directly to router
        try {
          const mintToRouterTx = await plyToken.mint(POLYROUTER_ADDRESS, routerRequiredAmount);
          await mintToRouterTx.wait();
          console.log("✅ Minted", ethers.formatEther(routerRequiredAmount), "PLY directly to router");
        } catch (mintRouterError: any) {
          console.log("❌ Could not mint to router:", mintRouterError.message);
        }
      }
    } else {
      console.log("✅ Router already has sufficient PLY tokens");
    }
    
    // Step 3: Verify chain support
    console.log("\n4️⃣ Verifying Chain Support...");
    
    const SEPOLIA_SELECTOR = 16015286601757825753n;
    const FUJI_SELECTOR = 14767482510784806043n;
    
    const sepoliaSupported = await polyRouter.supportedChains(SEPOLIA_SELECTOR);
    const fujiSupported = await polyRouter.supportedChains(FUJI_SELECTOR);
    
    console.log("Sepolia Supported:", sepoliaSupported ? "✅ YES" : "❌ NO");
    console.log("Fuji Supported:", fujiSupported ? "✅ YES" : "❌ NO");
    
    if (!sepoliaSupported) {
      console.log("📝 Enabling Sepolia chain...");
      const enableSepoliaTx = await polyRouter.setSupportedChain(SEPOLIA_SELECTOR, true);
      await enableSepoliaTx.wait();
      console.log("✅ Sepolia chain enabled");
    }
    
    if (!fujiSupported) {
      console.log("📝 Enabling Fuji chain...");
      const enableFujiTx = await polyRouter.setSupportedChain(FUJI_SELECTOR, true);
      await enableFujiTx.wait();
      console.log("✅ Fuji chain enabled");
    }
    
    console.log("\n✅ Cross-Chain Setup Complete!");
    console.log("\n📋 Summary:");
    console.log("Target User:", TARGET_USER);
    console.log("PLY Token:", PLY_TOKEN_ADDRESS);
    console.log("PolyRouter:", POLYROUTER_ADDRESS);
    console.log("\n⚠️  IMPORTANT: Target user still needs to:");
    console.log("1. Get testnet ETH for gas fees");
    console.log("2. Approve PLY tokens for PolyRouter before transfer");
    console.log("\n🔗 Testnet Faucets:");
    console.log("Sepolia ETH: https://faucet.sepolia.dev/");
    console.log("Fuji AVAX: https://faucet.avax.network/");
    
  } catch (error: any) {
    console.error("❌ Error fixing CCIP setup:", error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 