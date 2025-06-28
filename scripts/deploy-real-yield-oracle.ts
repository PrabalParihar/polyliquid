import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  console.log("🔮 Deploying Real Yield Oracle");
  console.log("Network:", network.name, "Chain ID:", network.chainId.toString());
  console.log("Deployer:", deployer.address);

  // Contract addresses based on network
  let TOKEN_ADDRESSES: { [key: string]: string } = {};
  let CHAINLINK_FEEDS: { [key: string]: string } = {};
  
  if (network.chainId === 11155111n) { // Sepolia
    TOKEN_ADDRESSES = {
      stETH: '0x0aF203033beb6f48Cd1abbC74B07bE21111F41Bc',
      rETH: '0x53f23483B7B3B0dce2Cee15D72E45f362Cdf053E',
      sAVAX: '0x515958d0e0f2a7B8da4B4D39F8C42d22f2ce0B03',
    };
    CHAINLINK_FEEDS = {
      ETH_USD: '0x694AA1769357215DE4FAC081bf1f309aDC325306',
      // Note: Using ETH/USD for stETH and rETH pricing
      // sAVAX would use a different feed in production
    };
  } else if (network.chainId === 43113n) { // Fuji
    TOKEN_ADDRESSES = {
      stETH: '0x7185D90BCD120dE7d091DF6EA8bd26e912571b61',
      rETH: '0x0aF203033beb6f48Cd1abbC74B07bE21111F41Bc',
      sAVAX: '0x53f23483B7B3B0dce2Cee15D72E45f362Cdf053E',
    };
    CHAINLINK_FEEDS = {
      AVAX_USD: '0x86d67c3D38D2bCeE722E601025C25a575021c6EA',
      // Using AVAX/USD for sAVAX calculations
    };
  } else {
    console.log("❌ Unsupported network");
    return;
  }

  try {
    // Deploy Real Yield Oracle
    console.log("\n1️⃣ Deploying RealYieldOracle...");
    const RealYieldOracle = await ethers.getContractFactory("RealYieldOracle");
    const realYieldOracle = await RealYieldOracle.deploy(
      `Real LST Yield Oracle - ${network.name}`
    );
    await realYieldOracle.waitForDeployment();
    
    const oracleAddress = await realYieldOracle.getAddress();
    console.log("✅ RealYieldOracle deployed to:", oracleAddress);

    // Configure assets with real yield parameters
    console.log("\n2️⃣ Configuring LST assets...");
    
    // Configure stETH
    console.log("📈 Setting up stETH yield source...");
    await realYieldOracle.addAsset(
      TOKEN_ADDRESSES.stETH,
      "stETH",
      network.chainId === 11155111n ? CHAINLINK_FEEDS.ETH_USD : ethers.ZeroAddress,
      ethers.parseEther("0.045") // 4.5% initial yield
    );
    console.log("✅ stETH configured");

    // Configure rETH
    console.log("📈 Setting up rETH yield source...");
    await realYieldOracle.addAsset(
      TOKEN_ADDRESSES.rETH,
      "rETH",
      network.chainId === 11155111n ? CHAINLINK_FEEDS.ETH_USD : ethers.ZeroAddress,
      ethers.parseEther("0.048") // 4.8% initial yield
    );
    console.log("✅ rETH configured");

    // Configure sAVAX
    console.log("📈 Setting up sAVAX yield source...");
    await realYieldOracle.addAsset(
      TOKEN_ADDRESSES.sAVAX,
      "sAVAX",
      network.chainId === 43113n ? CHAINLINK_FEEDS.AVAX_USD : ethers.ZeroAddress,
      ethers.parseEther("0.072") // 7.2% initial yield
    );
    console.log("✅ sAVAX configured");

    // Test yield fetching
    console.log("\n3️⃣ Testing yield data...");
    
    for (const [symbol, address] of Object.entries(TOKEN_ADDRESSES)) {
      try {
        const [yield_, timestamp] = await realYieldOracle.getAssetYield(address);
        console.log(`${symbol}: ${ethers.formatEther(yield_)} (${(parseFloat(ethers.formatEther(yield_)) * 100).toFixed(2)}% APY)`);
      } catch (error: any) {
        console.log(`${symbol}: ❌ Error fetching yield:`, error.message);
      }
    }

    // Update yields with real calculations
    console.log("\n4️⃣ Updating with real yield calculations...");
    
    try {
      for (const [symbol, address] of Object.entries(TOKEN_ADDRESSES)) {
        console.log(`🔄 Updating ${symbol} yield...`);
        const updateTx = await realYieldOracle.updateAssetYield(address);
        await updateTx.wait();
        console.log(`✅ ${symbol} yield updated`);
      }
    } catch (error: any) {
      console.log("⚠️  Initial yield update failed (expected for new oracle):", error.message);
    }

    console.log("\n✅ Real Yield Oracle Deployment Complete!");
    
    console.log("\n📋 Contract Addresses:");
    console.log("RealYieldOracle:", oracleAddress);
    console.log("\n📊 Asset Configuration:");
    Object.entries(TOKEN_ADDRESSES).forEach(([symbol, address]) => {
      console.log(`${symbol}: ${address}`);
    });

    console.log("\n🔧 Next Steps:");
    console.log("1. Update PolyLiquidVault to use this oracle");
    console.log("2. Set manual yield rates if needed");
    console.log("3. Monitor yield data accuracy");
    console.log("4. Integrate with real LST protocol APIs");

    console.log("\n📝 Integration Code:");
    console.log("// Update vault yield oracle");
    console.log(`vault.setYieldOracle("${TOKEN_ADDRESSES.stETH}", "${oracleAddress}");`);
    console.log(`vault.setYieldOracle("${TOKEN_ADDRESSES.rETH}", "${oracleAddress}");`);
    console.log(`vault.setYieldOracle("${TOKEN_ADDRESSES.sAVAX}", "${oracleAddress}");`);

    console.log("\n🔗 Real Data Integration Options:");
    console.log("1. **Lido API**: https://stake.lido.fi/api/sma-steth-apr");
    console.log("2. **Rocket Pool**: On-chain rETH exchange rate tracking");
    console.log("3. **Avalanche**: Validator staking rewards via P-Chain");
    console.log("4. **DeFiLlama**: https://api.llama.fi/yields");
    console.log("5. **Chainlink Functions**: Custom API integration");

  } catch (error: any) {
    console.error("❌ Deployment failed:", error.message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 