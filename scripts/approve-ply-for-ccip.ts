import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  console.log("🔑 Approving PLY Tokens for Cross-Chain Transfers");
  console.log("Network:", network.name, "Chain ID:", network.chainId.toString());
  console.log("Signer:", deployer.address);
  
  // Target user address from failed transaction
  const TARGET_USER = "0x2BCc053BB6915F28aC2041855D2292dDca406903";
  
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

  console.log("\n📍 Contract Addresses:");
  console.log("PLY Token:", PLY_TOKEN_ADDRESS);
  console.log("PolyRouter:", POLYROUTER_ADDRESS);
  console.log("Target User:", TARGET_USER);

  try {
    const plyToken = await ethers.getContractAt("PLYToken", PLY_TOKEN_ADDRESS);
    
    // Check current status
    console.log("\n1️⃣ Checking Current Status...");
    
    const userBalance = await plyToken.balanceOf(TARGET_USER);
    const currentAllowance = await plyToken.allowance(TARGET_USER, POLYROUTER_ADDRESS);
    
    console.log("User PLY Balance:", ethers.formatEther(userBalance));
    console.log("Current Allowance:", ethers.formatEther(currentAllowance));
    
    // Set approval amount (unlimited for convenience)
    const MAX_APPROVAL = ethers.MaxUint256;
    
    console.log("\n2️⃣ Approving PLY Tokens...");
    console.log("Approval Amount: UNLIMITED (MaxUint256)");
    
    // Note: This script runs with the deployer's private key
    // For the actual user to approve, they need to do this in the frontend
    if (deployer.address.toLowerCase() === TARGET_USER.toLowerCase()) {
      console.log("✅ Signer matches target user - proceeding with approval...");
      
      const approveTx = await plyToken.approve(POLYROUTER_ADDRESS, MAX_APPROVAL);
      console.log("⏳ Transaction submitted:", approveTx.hash);
      
      await approveTx.wait();
      console.log("✅ PLY tokens approved for PolyRouter!");
      
      // Verify approval
      const newAllowance = await plyToken.allowance(TARGET_USER, POLYROUTER_ADDRESS);
      console.log("New Allowance:", newAllowance === MAX_APPROVAL ? "UNLIMITED" : ethers.formatEther(newAllowance));
      
    } else {
      console.log("❌ Signer doesn't match target user");
      console.log("   Deployer:", deployer.address);
      console.log("   Target User:", TARGET_USER);
      console.log("\n⚠️  To fix this, the target user needs to:");
      console.log("1. Connect their wallet in the frontend");
      console.log("2. Click 'Approve' button before transferring");
      console.log("3. Or manually approve using this command:");
      console.log(`   contract.approve("${POLYROUTER_ADDRESS}", "${MAX_APPROVAL}")`);
    }
    
    console.log("\n3️⃣ Testing Cross-Chain Transfer (Simulation)...");
    
    // Test if transfer would work now
    const testAmount = ethers.parseEther("1");
    const polyRouter = await ethers.getContractAt("PolyRouter", POLYROUTER_ADDRESS);
    
    try {
      const destChain = network.chainId === 11155111n ? 14767482510784806043n : 16015286601757825753n;
      
      // Simulate the transfer
      await polyRouter.connect(deployer).sendPLY.staticCall(
        destChain,
        TARGET_USER,
        testAmount
      );
      console.log("✅ Cross-chain transfer simulation PASSED!");
      console.log("   Transfer would succeed once approved");
      
    } catch (error: any) {
      console.log("❌ Cross-chain transfer would still fail:", error.message);
      
      if (error.message.includes("InsufficientBalance")) {
        console.log("   Issue: Not enough PLY tokens");
      } else if (error.message.includes("ERC20: insufficient allowance")) {
        console.log("   Issue: Still needs approval");
      } else {
        console.log("   Issue: Other contract error");
      }
    }
    
    console.log("\n✅ Approval Process Complete!");
    console.log("\n📋 Next Steps for User:");
    console.log("1. Ensure you have testnet ETH for gas fees");
    console.log("2. In the frontend, click 'Approve' before 'Send'");
    console.log("3. Once approved, cross-chain transfers should work");
    
    console.log("\n🔗 Test the fix:");
    console.log("- Try a small transfer (1-10 PLY tokens)");
    console.log("- Monitor tx status in the CCIP Status Modal");
    console.log("- Check destination chain for received tokens");
    
  } catch (error: any) {
    console.error("❌ Error during approval process:", error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 