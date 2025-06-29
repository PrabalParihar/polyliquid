import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  console.log("✅ Approving Tokens for Vault");
  console.log("Network:", network.name, "Chain ID:", network.chainId.toString());
  console.log("Deployer:", deployer.address);
  
  // Contract addresses
  const VAULT_ADDRESS = "0x918DD2C599C24e04069c6f32547Bb987d0Bd8B48";
  
  const TOKEN_ADDRESSES = {
    stETH: '0x0aF203033beb6f48Cd1abbC74B07bE21111F41Bc',
    rETH: '0x53f23483B7B3B0dce2Cee15D72E45f362Cdf053E',
    sAVAX: '0x515958d0e0f2a7B8da4B4D39F8C42d22f2ce0B03',
  };

  // Approve maximum amount (unlimited)
  const APPROVAL_AMOUNT = ethers.MaxUint256;

  console.log("\n🏦 Vault Address:", VAULT_ADDRESS);
  console.log("💰 Approval Amount: Unlimited (MaxUint256)");

  try {
    
    for (const [tokenName, address] of Object.entries(TOKEN_ADDRESSES)) {
      console.log(`\n⏳ Approving ${tokenName}...`);
      
      const token = await ethers.getContractAt("MockLST", address);
      
      // Check current approval
      const currentApproval = await token.allowance(deployer.address, VAULT_ADDRESS);
      console.log(`Current Approval: ${ethers.formatEther(currentApproval)}`);
      
      if (currentApproval >= ethers.parseEther("1000000")) {
        console.log(`✅ ${tokenName} already has sufficient approval`);
        continue;
      }
      
      // Approve tokens
      console.log(`📝 Submitting approval transaction for ${tokenName}...`);
      const approveTx = await token.approve(VAULT_ADDRESS, APPROVAL_AMOUNT);
      console.log(`Transaction Hash: ${approveTx.hash}`);
      
      // Wait for confirmation
      console.log("⏱️ Waiting for confirmation...");
      await approveTx.wait();
      
      // Verify approval
      const newApproval = await token.allowance(deployer.address, VAULT_ADDRESS);
      console.log(`✅ ${tokenName} approved! New allowance: ${ethers.formatEther(newApproval) === "115792089237316195423570985008687907853269984665640564039457.584007913129639935" ? "Unlimited" : ethers.formatEther(newApproval)}`);
    }
    
    console.log("\n🎉 All tokens approved successfully!");
    console.log("\n📝 Summary:");
    console.log("- stETH ✅ Approved for unlimited deposits");
    console.log("- rETH ✅ Approved for unlimited deposits");  
    console.log("- sAVAX ✅ Approved for unlimited deposits");
    
    console.log("\n🚀 You can now deposit tokens in your frontend!");
    console.log("💡 Tip: You only need to approve once. Future deposits will work without additional approvals.");
    
  } catch (error: any) {
    console.error("❌ Error approving tokens:", error.message);
    
    if (error.message.includes("insufficient funds")) {
      console.log("\n💡 Make sure you have enough ETH for gas fees");
    } else if (error.message.includes("nonce")) {
      console.log("\n💡 Try again in a few seconds - nonce issue");
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 