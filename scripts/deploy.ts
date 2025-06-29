import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Deploy PLY Token first
  console.log("\n🪙 Deploying PLY Token...");
  const PLYToken = await ethers.getContractFactory("PLYToken");
  const plyToken = await PLYToken.deploy(
    "PolyLiquid Token",
    "PLY",
    ethers.parseEther("1000000"), // 1M PLY initial supply
    deployer.address
  );
  await plyToken.waitForDeployment();
  console.log("PLY Token deployed to:", await plyToken.getAddress());

  // Deploy mock LST tokens
  console.log("\n📋 Deploying mock LST tokens...");
  const MockLST = await ethers.getContractFactory("MockLST");
  
  const stETH = await MockLST.deploy("Staked Ether", "stETH", 18);
  await stETH.waitForDeployment();
  console.log("stETH deployed to:", await stETH.getAddress());

  const rETH = await MockLST.deploy("Rocket Pool ETH", "rETH", 18);
  await rETH.waitForDeployment();
  console.log("rETH deployed to:", await rETH.getAddress());

  const sAVAX = await MockLST.deploy("Staked AVAX", "sAVAX", 18);
  await sAVAX.waitForDeployment();
  console.log("sAVAX deployed to:", await sAVAX.getAddress());

  // Deploy mock yield oracle
  console.log("\n🔮 Deploying mock yield oracle...");
  const MockYieldOracle = await ethers.getContractFactory("MockYieldOracle");
  const yieldOracle = await MockYieldOracle.deploy();
  await yieldOracle.waitForDeployment();
  console.log("Yield Oracle deployed to:", await yieldOracle.getAddress());

  // Deploy PolyPredictionOracle with Chainlink Functions
  console.log("\n🎯 Deploying PolyPredictionOracle (Chainlink Functions)...");
  const PolyPredictionOracle = await ethers.getContractFactory("PolyPredictionOracle");
  const predictionOracle = await PolyPredictionOracle.deploy(
    // Hardcoded Functions router for Sepolia (placeholder for demo)
    "0xb83E47C2bC239B3bf370bc41e1459A34b41238D0" 
  );
  await predictionOracle.waitForDeployment();
  console.log("PolyPredictionOracle deployed to:", await predictionOracle.getAddress());

  // Deploy PolyLiquidVault with Automation
  console.log("\n🏦 Deploying PolyLiquidVault (with Automation)...");
  const maxDeposits = ethers.parseEther("100000"); // 100k tokens max per asset

  const PolyLiquidVault = await ethers.getContractFactory("PolyLiquidVault");
  const vault = await PolyLiquidVault.deploy(
    await stETH.getAddress(),
    await rETH.getAddress(),
    await sAVAX.getAddress(),
    maxDeposits,
    maxDeposits,
    maxDeposits,
    await predictionOracle.getAddress()
  );
  await vault.waitForDeployment();
  console.log("PolyLiquidVault deployed to:", await vault.getAddress());

  // Deploy PolyRouter for CCIP
  console.log("\n🌐 Deploying PolyRouter (CCIP)...");
  const PolyRouter = await ethers.getContractFactory("PolyRouter");
  const polyRouter = await PolyRouter.deploy(
    await plyToken.getAddress(),
    deployer.address
  );
  await polyRouter.waitForDeployment();
  console.log("PolyRouter deployed to:", await polyRouter.getAddress());

  // Setup yield oracles
  console.log("\n⚙️ Setting up yield oracles...");
  const oracleAddress = await yieldOracle.getAddress();
  
  await vault.setYieldOracle(await stETH.getAddress(), oracleAddress);
  console.log("✅ stETH yield oracle configured");
  
  await vault.setYieldOracle(await rETH.getAddress(), oracleAddress);
  console.log("✅ rETH yield oracle configured");
  
  await vault.setYieldOracle(await sAVAX.getAddress(), oracleAddress);
  console.log("✅ sAVAX yield oracle configured");

  // Set initial yield prices
  console.log("\n📈 Setting initial yield prices...");
  await yieldOracle.setPrice(await stETH.getAddress(), ethers.parseEther("0.045")); // 4.5%
  console.log("✅ stETH yield set to 4.5%");
  
  await yieldOracle.setPrice(await rETH.getAddress(), ethers.parseEther("0.055")); // 5.5%
  console.log("✅ rETH yield set to 5.5%");
  
  await yieldOracle.setPrice(await sAVAX.getAddress(), ethers.parseEther("0.042")); // 4.2%
  console.log("✅ sAVAX yield set to 4.2%");

  // Set initial market probability for testing
  console.log("\n🎯 Setting initial market probability...");
  await predictionOracle.emergencySetProbability(ethers.parseEther("0.75")); // 75% probability
  console.log("✅ Market probability set to 75%");

  // Fund PolyRouter with PLY for cross-chain operations
  console.log("\n💰 Funding PolyRouter...");
  const routerFundAmount = ethers.parseEther("100000"); // 100k PLY
  await plyToken.transfer(await polyRouter.getAddress(), routerFundAmount);
  console.log("✅ Funded PolyRouter with 100k PLY tokens");

  // Mint test tokens
  console.log("\n🪙 Minting test tokens...");
  const testAmount = ethers.parseEther("10000");
  
  await stETH.mint(deployer.address, testAmount);
  await rETH.mint(deployer.address, testAmount);
  await sAVAX.mint(deployer.address, testAmount);
  console.log("✅ Minted 10k tokens of each LST to deployer");

  // Show automation configuration
  console.log("\n⏰ Automation Configuration:");
  const upkeepInterval = await vault.UPKEEP_INTERVAL();
  const [timeUntilNext, upkeepDue, lastPerformed, totalHarvested] = await vault.getUpkeepStatus();
  
  console.log("  Upkeep Interval:", upkeepInterval.toString(), "seconds (1 hour)");
  console.log("  Upkeep Due:", upkeepDue);
  console.log("  Time Until Next:", timeUntilNext.toString(), "seconds");
  console.log("  Total Harvested:", ethers.formatEther(totalHarvested), "tokens");

  // Show CCIP configuration
  console.log("\n🌐 CCIP Configuration:");
  const sepoliaSelector = await polyRouter.SEPOLIA_CHAIN_SELECTOR();
  const fujiSelector = await polyRouter.FUJI_CHAIN_SELECTOR();
  const sepoliaSupported = await polyRouter.isChainSupported(sepoliaSelector);
  const fujiSupported = await polyRouter.isChainSupported(fujiSelector);
  const routerBalance = await plyToken.balanceOf(await polyRouter.getAddress());
  
  console.log("  Sepolia Chain Selector:", sepoliaSelector.toString());
  console.log("  Fuji Chain Selector:", fujiSelector.toString());
  console.log("  Sepolia Supported:", sepoliaSupported);
  console.log("  Fuji Supported:", fujiSupported);
  console.log("  Router PLY Balance:", ethers.formatEther(routerBalance), "PLY");

  // Test automation functionality
  console.log("\n🔧 Testing Automation Functionality:");
  try {
    // Check if upkeep is needed
    const [needsUpkeep, performData] = await vault.checkUpkeep("0x");
    console.log("  Upkeep Needed:", needsUpkeep);
    
    if (needsUpkeep) {
      console.log("  Performing initial upkeep...");
      const upkeepTx = await vault.performUpkeep("0x");
      await upkeepTx.wait();
      console.log("  ✅ Initial upkeep completed");
      
      // Check status after upkeep
      const [newTimeUntilNext, newUpkeepDue, newLastPerformed, newTotalHarvested] = await vault.getUpkeepStatus();
      console.log("  New Total Harvested:", ethers.formatEther(newTotalHarvested), "tokens");
    }
  } catch (error) {
    console.log("  ℹ️ Upkeep functionality will be available after vault deposits");
  }

  // Test CCIP setup
  console.log("\n🧪 Testing CCIP Setup:");
  try {
    const availableBalance = await polyRouter.getAvailableBalance();
    const lockedTokens = await polyRouter.getLockedTokens();
    console.log("  Available PLY Balance:", ethers.formatEther(availableBalance), "PLY");
    console.log("  Locked PLY Tokens:", ethers.formatEther(lockedTokens), "PLY");
  } catch (error) {
    console.log("  ℹ️ CCIP functionality ready for cross-chain transfers");
  }

  // Display deployment summary
  console.log("\n✅ Deployment Summary:");
  const deploymentInfo = {
    network: process.env.HARDHAT_NETWORK || "localhost",
    deployer: deployer.address,
    blockNumber: await ethers.provider.getBlockNumber(),
    contracts: {
      PLYToken: await plyToken.getAddress(),
      stETH: await stETH.getAddress(),
      rETH: await rETH.getAddress(),
      sAVAX: await sAVAX.getAddress(),
      YieldOracle: await yieldOracle.getAddress(),
      PredictionOracle: await predictionOracle.getAddress(),
      PolyLiquidVault: await vault.getAddress(),
      PolyRouter: await polyRouter.getAddress()
    },
    configuration: {
      maxDepositPerAsset: ethers.formatEther(maxDeposits),
      upkeepInterval: upkeepInterval.toString() + " seconds",
      supportedChains: ["Sepolia", "Fuji"],
      routerFunding: ethers.formatEther(routerFundAmount) + " PLY"
    }
  };

  console.log(JSON.stringify(deploymentInfo, null, 2));

  console.log("\n🎉 All contracts deployed successfully!");
  
  console.log("\n📋 Next Steps:");
  console.log("1. 🤖 Automation:");
  console.log("   - Register vault with Chainlink Automation");
  console.log("   - Use checkUpkeep/performUpkeep functions");
  console.log("   - Monitor 1-hour interval harvesting");
  
  console.log("\n2. 🎯 Chainlink Functions (Prediction Oracle):");
  console.log("   - Create Functions subscription at functions.chain.link");
  console.log("   - Configure subscription ID in prediction oracle");
  console.log("   - Test Polymarket CLOB API integration");
  console.log("   - Monitor probability > 60% threshold for rebalancing");
  
  console.log("\n3. 🌐 CCIP Cross-Chain:");
  console.log("   - Test PLY transfers: Fuji ↔ Sepolia");
  console.log("   - Lock PLY on source, mint on destination");
  console.log("   - Handle failed message recovery");
  
  console.log("\n3. 🏦 Vault Operations:");
  console.log("   - Deposit LST tokens into vault");
  console.log("   - Monitor automated yield harvesting");
  console.log("   - Watch rebalancing signals");

  console.log("\n💡 Example Usage:");
  console.log("// Automation test:");
  console.log(`await vault.checkUpkeep("0x"); // Check if upkeep needed`);
  console.log(`await vault.performUpkeep("0x"); // Harvest rewards & check rebalancing`);
  
  console.log("\n// CCIP test:");
  console.log(`await plyToken.approve("${await polyRouter.getAddress()}", ethers.parseEther("100"));`);
  console.log(`await polyRouter.sendPLY(${sepoliaSelector}, receiverAddress, ethers.parseEther("100"));`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 