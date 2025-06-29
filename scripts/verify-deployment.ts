import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  console.log("🔍 Verifying Contract Deployment");
  console.log("Network:", network.name, "Chain ID:", network.chainId.toString());
  console.log("Account:", deployer.address);
  
  // Vault addresses based on network
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

  console.log("\n📍 Checking vault contract at:", VAULT_ADDRESS);

  try {
    // Check if contract exists
    const contractCode = await ethers.provider.getCode(VAULT_ADDRESS);
    
    if (contractCode === "0x") {
      console.log("❌ NO CONTRACT FOUND at this address!");
      console.log("🚀 You need to deploy the vault contract first.");
      return;
    }
    
    console.log("✅ Contract exists at address");
    
    // Try to interact with the vault
    const vault = await ethers.getContractAt("PolyLiquidVault", VAULT_ADDRESS);
    
    console.log("\n📊 Vault Information:");
    try {
      const name = await vault.name();
      const symbol = await vault.symbol();
      const totalAssets = await vault.totalAssets();
      const owner = await vault.owner();
      
      console.log("Name:", name);
      console.log("Symbol:", symbol);
      console.log("Total Assets:", ethers.formatEther(totalAssets));
      console.log("Owner:", owner);
      
      // Check supported assets using the correct function
      console.log("\n🔗 Checking Supported Assets:");
      try {
        const supportedAssets = await vault.getSupportedAssets();
        console.log("Supported Assets:", supportedAssets);
        
        for (const [tokenName, address] of Object.entries(TOKEN_ADDRESSES)) {
          const isSupported = supportedAssets.includes(address);
          const maxDepositLimit = await vault.maxDeposit(address);
          console.log(`${tokenName} (${address}):`, 
            isSupported ? "✅ Supported" : "❌ Not Supported",
            `Max: ${ethers.formatEther(maxDepositLimit)}`);
        }
      } catch (error: any) {
        console.log("❌ Error checking supported assets:", error.message);
      }
      
      // Test a small preview deposit
      console.log("\n🧪 Testing Preview Deposit (1 ETH):");
      const testAmount = ethers.parseEther("1");
      
      try {
        const preview = await vault.previewDeposit(TOKEN_ADDRESSES.stETH, testAmount);
        console.log("Preview deposit 1 stETH would give:", ethers.formatEther(preview), "shares");
        console.log("✅ Vault appears functional for deposits");
      } catch (error: any) {
        console.log("❌ Preview deposit failed:", error.message);
      }
      
    } catch (error: any) {
      console.log("❌ Error reading vault properties:", error.message);
      
      if (error.message.includes("unknown function")) {
        console.log("💡 This might not be a PolyLiquidVault contract");
      }
    }
    
  } catch (error: any) {
    console.error("❌ Error checking contract:", error.message);
  }
  
  // Also check token contracts
  console.log("\n🪙 Verifying Token Contracts:");
  for (const [tokenName, address] of Object.entries(TOKEN_ADDRESSES)) {
    try {
      const token = await ethers.getContractAt("MockLST", address);
      const name = await token.name();
      const symbol = await token.symbol();
      console.log(`${tokenName}: ${name} (${symbol}) ✅`);
    } catch (error: any) {
      console.log(`${tokenName}: ❌ Error -`, error.message.slice(0, 50));
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 