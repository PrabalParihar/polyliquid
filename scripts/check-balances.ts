import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  console.log("💰 Checking Token Balances & Approvals");
  console.log("Network:", network.name, "Chain ID:", network.chainId.toString());
  
  // User's address
  const USER_ADDRESS = "0xE5FB6be08698719926C54ccC2BF857Bfe8Af0eD8";
  
  // Contract addresses based on network
  let VAULT_ADDRESS: string;
  let TOKEN_ADDRESSES: { [key: string]: string } = {};
  
  if (network.chainId === 11155111n) { // Sepolia
    VAULT_ADDRESS = "0x918DD2C599C24e04069c6f32547Bb987d0Bd8B48";
    TOKEN_ADDRESSES = {
      stETH: '0x0aF203033beb6f48Cd1abbC74B07bE21111F41Bc',
      rETH: '0x53f23483B7B3B0dce2Cee15D72E45f362Cdf053E',
      sAVAX: '0x515958d0e0f2a7B8da4B4D39F8C42d22f2ce0B03',
    };
  } else if (network.chainId === 43113n) { // Fuji
    VAULT_ADDRESS = "0x53FD504CE2752AdacDD5F85223Cc45F4E22a2d8d";
    TOKEN_ADDRESSES = {
      stETH: '0x7185D90BCD120dE7d091DF6EA8bd26e912571b61',
      rETH: '0x0aF203033beb6f48Cd1abbC74B07bE21111F41Bc',
      sAVAX: '0x53f23483B7B3B0dce2Cee15D72E45f362Cdf053E',
    };
  } else {
    console.log("❌ Unsupported network");
    return;
  }

  console.log("\n👤 User Address:", USER_ADDRESS);
  console.log("🏦 Vault Address:", VAULT_ADDRESS);

  try {
    // Check ETH balance
    const ethBalance = await ethers.provider.getBalance(USER_ADDRESS);
    console.log("💎 ETH Balance:", ethers.formatEther(ethBalance));

    console.log("\n📊 Token Balances:");
    
    for (const [tokenName, address] of Object.entries(TOKEN_ADDRESSES)) {
      try {
        const token = await ethers.getContractAt("MockLST", address);
        
        // Check balance
        const balance = await token.balanceOf(USER_ADDRESS);
        console.log(`${tokenName}: ${ethers.formatEther(balance)} tokens`);
        
        // Check approval
        const allowance = await token.allowance(USER_ADDRESS, VAULT_ADDRESS);
        console.log(`${tokenName} Approval: ${ethers.formatEther(allowance)} tokens`);
        
        // Check if approval is sufficient
        const needsApproval = allowance === 0n;
        console.log(`${tokenName} Needs Approval: ${needsApproval ? "❌ YES" : "✅ NO"}`);
        
      } catch (error: any) {
        console.log(`${tokenName}: ❌ Error -`, error.message.slice(0, 50));
      }
    }
    
    // Also check vault status
    console.log("\n🏦 Vault Status:");
    const vault = await ethers.getContractAt("PolyLiquidVault", VAULT_ADDRESS);
    
    const vaultName = await vault.name();
    const totalAssets = await vault.totalAssets();
    const userShares = await vault.balanceOf(USER_ADDRESS);
    
    console.log("Vault Name:", vaultName);
    console.log("Total Assets in Vault:", ethers.formatEther(totalAssets));
    console.log("User's PLY Shares:", ethers.formatEther(userShares));
    
    // Test if deposit would work (simulation)
    console.log("\n🧪 Testing Deposit Simulation:");
    const testAmount = ethers.parseEther("1");
    
    try {
      const previewShares = await vault.previewDeposit(TOKEN_ADDRESSES.stETH, testAmount);
      console.log("✅ Depositing 1 stETH would give:", ethers.formatEther(previewShares), "PLY shares");
    } catch (error: any) {
      console.log("❌ Deposit simulation failed:", error.message);
    }
    
  } catch (error: any) {
    console.error("❌ Error checking balances:", error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 