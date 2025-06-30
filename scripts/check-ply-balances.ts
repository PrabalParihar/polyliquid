import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  console.log("🔍 Checking PLY Token & Cross-Chain Transfer Setup");
  console.log("Network:", network.name, "Chain ID:", network.chainId.toString());
  
  // User's address from the failed transaction
  const USER_ADDRESS = "0x2BCc053BB6915F28aC2041855D2292dDca406903";
  
  // Contract addresses based on network
  let PLY_TOKEN_ADDRESS: string;
  let POLYROUTER_ADDRESS: string;
  
  if (network.chainId === 11155111n) { // Sepolia
    PLY_TOKEN_ADDRESS = "0x7185D90BCD120dE7d091DF6EA8bd26e912571b61";
    POLYROUTER_ADDRESS = "0x44AB25180aA8d41E0b584d9E34C35a5990254A81";
  } else if (network.chainId === 43113n) { // Fuji
    PLY_TOKEN_ADDRESS = "0x54Ec69d90d7dbf75Ea51C61c8e7DC81fACbe7Fb7";
    POLYROUTER_ADDRESS = "0x918DD2C599C24e04069c6f32547Bb987d0Bd8B48";
  } else {
    console.log("❌ Unsupported network");
    return;
  }

  console.log("\n👤 User Address:", USER_ADDRESS);
  console.log("💎 PLY Token Address:", PLY_TOKEN_ADDRESS);
  console.log("🌉 PolyRouter Address:", POLYROUTER_ADDRESS);

  try {
    // Check ETH balance
    const ethBalance = await ethers.provider.getBalance(USER_ADDRESS);
    console.log("\n💰 ETH Balance:", ethers.formatEther(ethBalance));

    // Check PLY token balance
    console.log("\n📊 PLY Token Status:");
    const plyToken = await ethers.getContractAt("PLYToken", PLY_TOKEN_ADDRESS);
    
    const plyBalance = await plyToken.balanceOf(USER_ADDRESS);
    console.log("PLY Balance:", ethers.formatEther(plyBalance));
    
    const plyAllowance = await plyToken.allowance(USER_ADDRESS, POLYROUTER_ADDRESS);
    console.log("PLY Allowance for Router:", ethers.formatEther(plyAllowance));
    
    const needsApproval = plyAllowance === 0n;
    console.log("Needs PLY Approval:", needsApproval ? "❌ YES" : "✅ NO");
    
    // Check PolyRouter status
    console.log("\n🌉 PolyRouter Status:");
    const polyRouter = await ethers.getContractAt("PolyRouter", POLYROUTER_ADDRESS);
    
    const totalLocked = await polyRouter.totalLockedTokens();
    console.log("Total Locked PLY Tokens:", ethers.formatEther(totalLocked));
    
    // Check supported chains
    const SEPOLIA_SELECTOR = 16015286601757825753n;
    const FUJI_SELECTOR = 14767482510784806043n;
    
    const sepoliaSupportedSrc = await polyRouter.supportedChains(SEPOLIA_SELECTOR);
    const fujiSupportedSrc = await polyRouter.supportedChains(FUJI_SELECTOR);
    
    console.log("Sepolia Chain Supported:", sepoliaSupportedSrc ? "✅ YES" : "❌ NO");
    console.log("Fuji Chain Supported:", fujiSupportedSrc ? "✅ YES" : "❌ NO");
    
    // Check router's PLY balance
    const routerPlyBalance = await plyToken.balanceOf(POLYROUTER_ADDRESS);
    console.log("Router's PLY Balance:", ethers.formatEther(routerPlyBalance));
    
    console.log("\n🔍 Diagnosis:");
    
    if (ethBalance === 0n) {
      console.log("❌ CRITICAL: No ETH for gas fees!");
      console.log("   Solution: Get testnet ETH from faucet");
    }
    
    if (plyBalance === 0n) {
      console.log("❌ CRITICAL: No PLY tokens to transfer!");
      console.log("   Solution: Mint PLY tokens or deposit to vault first");
    }
    
    if (needsApproval && plyBalance > 0n) {
      console.log("❌ ERROR: PLY tokens not approved for router!");
      console.log("   Solution: Approve PLY tokens for PolyRouter");
    }
    
    if (routerPlyBalance === 0n) {
      console.log("⚠️  WARNING: Router has no PLY tokens for destination minting!");
      console.log("   This may cause issues on destination chain");
    }
    
    // Test cross-chain transfer simulation
    console.log("\n🧪 Testing Cross-Chain Transfer Simulation:");
    const testAmount = ethers.parseEther("1");
    
    if (plyBalance >= testAmount && !needsApproval) {
      try {
        const destChain = network.chainId === 11155111n ? FUJI_SELECTOR : SEPOLIA_SELECTOR;
        
        // This will revert if there's an issue, but we can see what the issue is
        await polyRouter.connect(deployer).sendPLY.staticCall(
          destChain,
          USER_ADDRESS,
          testAmount
        );
        console.log("✅ Cross-chain transfer would succeed");
      } catch (error: any) {
        console.log("❌ Cross-chain transfer would fail:", error.message);
      }
    } else {
      console.log("❌ Cannot test - insufficient balance or no approval");
    }
    
  } catch (error: any) {
    console.error("❌ Error checking PLY setup:", error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 