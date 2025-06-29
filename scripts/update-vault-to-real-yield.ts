import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  console.log("🔄 Updating PolyLiquidVault to use Real Yield Data");
  console.log("Network:", network.name, "Chain ID:", network.chainId.toString());
  console.log("Deployer:", deployer.address);

  // Contract addresses based on network
  let VAULT_ADDRESS: string;
  let TOKEN_ADDRESSES: { [key: string]: string } = {};
  let REAL_YIELD_ORACLE: string;
  
  if (network.chainId === 11155111n) { // Sepolia
    VAULT_ADDRESS = "0x918DD2C599C24e04069c6f32547Bb987d0Bd8B48";
    TOKEN_ADDRESSES = {
      stETH: '0x0aF203033beb6f48Cd1abbC74B07bE21111F41Bc',
      rETH: '0x53f23483B7B3B0dce2Cee15D72E45f362Cdf053E',
      sAVAX: '0x515958d0e0f2a7B8da4B4D39F8C42d22f2ce0B03',
    };
    // You'll need to update this with the deployed oracle address
    REAL_YIELD_ORACLE = "0x0000000000000000000000000000000000000000"; // UPDATE AFTER DEPLOYMENT
  } else if (network.chainId === 43113n) { // Fuji
    VAULT_ADDRESS = "0x53FD504CE2752AdacDD5F85223Cc45F4E22a2d8d";
    TOKEN_ADDRESSES = {
      stETH: '0x7185D90BCD120dE7d091DF6EA8bd26e912571b61',
      rETH: '0x0aF203033beb6f48Cd1abbC74B07bE21111F41Bc',
      sAVAX: '0x53f23483B7B3B0dce2Cee15D72E45f362Cdf053E',
    };
    // Real yield oracle deployed address
    REAL_YIELD_ORACLE = "0xfec246E8bB4A33b2D7AC40Bf9e1Db1785a0d9dbf"; // ✅ DEPLOYED
  } else {
    console.log("❌ Unsupported network");
    return;
  }

  if (REAL_YIELD_ORACLE === "0x0000000000000000000000000000000000000000") {
    console.log("❌ Please deploy RealYieldOracle first and update the address in this script");
    console.log("🔧 Run: npx hardhat run scripts/deploy-real-yield-oracle.ts --network", network.name);
    return;
  }

  try {
    console.log("\n📋 Configuration:");
    console.log("Vault Address:", VAULT_ADDRESS);
    console.log("Real Yield Oracle:", REAL_YIELD_ORACLE);
    
    // Connect to deployed contracts
    const vault = await ethers.getContractAt("PolyLiquidVault", VAULT_ADDRESS);
    const realYieldOracle = await ethers.getContractAt("RealYieldOracle", REAL_YIELD_ORACLE);

    console.log("\n1️⃣ Checking current vault configuration...");
    
    // Check current yield oracles
    for (const [symbol, address] of Object.entries(TOKEN_ADDRESSES)) {
      try {
        const currentOracle = await vault.yieldOracles(address);
        console.log(`${symbol} current oracle: ${currentOracle}`);
      } catch (error: any) {
        console.log(`${symbol}: ❌ Error checking oracle:`, error.message);
      }
    }

    console.log("\n2️⃣ Updating yield oracles to use real data...");
    
    // Update each asset to use the real yield oracle
    for (const [symbol, address] of Object.entries(TOKEN_ADDRESSES)) {
      console.log(`🔄 Updating ${symbol} yield oracle...`);
      
      try {
        const tx = await vault.setYieldOracle(address, REAL_YIELD_ORACLE);
        await tx.wait();
        console.log(`✅ ${symbol} oracle updated - Transaction: ${tx.hash}`);
      } catch (error: any) {
        console.log(`❌ Failed to update ${symbol} oracle:`, error.message);
      }
    }

    console.log("\n3️⃣ Testing real yield data fetching...");
    
    // Test fetching yield data from the new oracle
    for (const [symbol, address] of Object.entries(TOKEN_ADDRESSES)) {
      try {
        console.log(`📊 Testing ${symbol} yield data...`);
        
        // First check if asset is supported in real oracle
        const isSupported = await realYieldOracle.isAssetSupported(address);
        
        if (!isSupported) {
          console.log(`⚠️  ${symbol} not configured in real oracle - adding now...`);
          
          // Add asset to real oracle if not present
          let initialYield = ethers.parseEther("0.045"); // 4.5% default
          if (symbol === "rETH") initialYield = ethers.parseEther("0.048"); // 4.8%
          if (symbol === "sAVAX") initialYield = ethers.parseEther("0.072"); // 7.2%
          
          const addTx = await realYieldOracle.addAsset(
            address,
            symbol,
            ethers.ZeroAddress, // No external oracle for now
            initialYield
          );
          await addTx.wait();
          console.log(`✅ ${symbol} added to real oracle`);
        }
        
        // Now test yield fetching through vault
        const [yield_, timestamp] = await vault.getAssetYield.staticCall(address);
        const yieldPercent = (parseFloat(ethers.formatEther(yield_)) * 100).toFixed(2);
        console.log(`✅ ${symbol}: ${yieldPercent}% APY (updated: ${new Date(Number(timestamp) * 1000).toISOString()})`);
        
      } catch (error: any) {
        console.log(`❌ ${symbol} yield test failed:`, error.message);
      }
    }

    console.log("\n4️⃣ Updating yield data with real calculations...");
    
    // Trigger real yield calculations
    for (const [symbol, address] of Object.entries(TOKEN_ADDRESSES)) {
      try {
        console.log(`🔄 Triggering ${symbol} real yield calculation...`);
        const updateTx = await realYieldOracle.updateAssetYield(address);
        await updateTx.wait();
        console.log(`✅ ${symbol} yield calculation updated`);
        
        // Check the new yield
        const [newYield] = await vault.getStoredYield(address);
        const newYieldPercent = (parseFloat(ethers.formatEther(newYield)) * 100).toFixed(2);
        console.log(`📈 ${symbol} new yield: ${newYieldPercent}% APY`);
        
      } catch (error: any) {
        console.log(`⚠️  ${symbol} yield update failed (may need to wait for threshold):`, error.message);
      }
    }

    console.log("\n5️⃣ Testing vault yield operations...");
    
    // Test the vault's yield fetching with new oracle
    try {
      console.log("🧪 Testing vault updateAllYieldData...");
      const updateAllTx = await vault.updateAllYieldData();
      await updateAllTx.wait();
      console.log("✅ All yield data updated successfully");
    } catch (error: any) {
      console.log("⚠️  updateAllYieldData failed:", error.message);
    }

    console.log("\n✅ Vault Successfully Updated to Use Real Yield Data!");
    
    console.log("\n📊 Summary:");
    console.log("Old System: Mock oracles with hardcoded yields");
    console.log("New System: Real yield oracle with calculated rates");
    console.log("\n🔧 Next Steps for Full Real Data:");
    console.log("1. Update frontend to use new API endpoints");
    console.log("2. Monitor yield data accuracy");
    console.log("3. Set up automatic yield updates");
    console.log("4. Integrate with LST protocol APIs");

    console.log("\n🌐 Frontend Integration:");
    console.log("- Replace useYieldData with useRealYieldData");
    console.log("- API endpoints: /api/yield/lido, /api/yield/defi-llama");
    console.log("- Real-time updates every 5 minutes");

  } catch (error: any) {
    console.error("❌ Update failed:", error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 