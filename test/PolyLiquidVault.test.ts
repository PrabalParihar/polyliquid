import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { PolyLiquidVault, MockStETH, MockRETH, MockSAVAX, MockYieldOracle, MockPredictionOracle } from "../typechain-types";

describe("PolyLiquidVault", function () {
  let vault: PolyLiquidVault;
  let stETH: MockStETH;
  let rETH: MockRETH;
  let sAVAX: MockSAVAX;
  let stETHOracle: MockYieldOracle;
  let rETHOracle: MockYieldOracle;
  let sAVAXOracle: MockYieldOracle;
  let predictionOracle: MockPredictionOracle;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  const INITIAL_MAX_DEPOSIT = ethers.parseEther("1000"); // 1000 tokens max per asset
  const DEPOSIT_AMOUNT = ethers.parseEther("100"); // 100 tokens
  const LARGE_DEPOSIT = ethers.parseEther("500"); // 500 tokens

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy mock LST tokens
    const MockStETHFactory = await ethers.getContractFactory("MockStETH");
    stETH = await MockStETHFactory.deploy();

    const MockRETHFactory = await ethers.getContractFactory("MockRETH");
    rETH = await MockRETHFactory.deploy();

    const MockSAVAXFactory = await ethers.getContractFactory("MockSAVAX");
    sAVAX = await MockSAVAXFactory.deploy();

    // Deploy mock yield oracles
    const MockYieldOracleFactory = await ethers.getContractFactory("MockYieldOracle");
    stETHOracle = await MockYieldOracleFactory.deploy();
    rETHOracle = await MockYieldOracleFactory.deploy();
    sAVAXOracle = await MockYieldOracleFactory.deploy();

    // Deploy mock prediction oracle
    const MockPredictionOracleFactory = await ethers.getContractFactory("MockPredictionOracle");
    predictionOracle = await MockPredictionOracleFactory.deploy();

    // Deploy PolyLiquidVault
    const PolyLiquidVaultFactory = await ethers.getContractFactory("PolyLiquidVault");
    vault = await PolyLiquidVaultFactory.deploy(
      await stETH.getAddress(),
      await rETH.getAddress(),
      await sAVAX.getAddress(),
      INITIAL_MAX_DEPOSIT,
      INITIAL_MAX_DEPOSIT,
      INITIAL_MAX_DEPOSIT,
      await predictionOracle.getAddress()
    );

    // Set up yield oracles manually since we're using hardhat network
    await vault.connect(owner).setYieldOracle(await stETH.getAddress(), await stETHOracle.getAddress());
    await vault.connect(owner).setYieldOracle(await rETH.getAddress(), await rETHOracle.getAddress());
    await vault.connect(owner).setYieldOracle(await sAVAX.getAddress(), await sAVAXOracle.getAddress());

    // Set initial yield prices
    await stETHOracle.setPrice(await stETH.getAddress(), ethers.parseEther("0.04")); // 4%
    await rETHOracle.setPrice(await rETH.getAddress(), ethers.parseEther("0.05")); // 5%
    await sAVAXOracle.setPrice(await sAVAX.getAddress(), ethers.parseEther("0.06")); // 6%

    // Mint tokens to users for testing
    await stETH.mint(user1.address, ethers.parseEther("10000"));
    await rETH.mint(user1.address, ethers.parseEther("10000"));
    await sAVAX.mint(user1.address, ethers.parseEther("10000"));

    await stETH.mint(user2.address, ethers.parseEther("10000"));
    await rETH.mint(user2.address, ethers.parseEther("10000"));
    await sAVAX.mint(user2.address, ethers.parseEther("10000"));

    // Approve vault to spend tokens
    await stETH.connect(user1).approve(await vault.getAddress(), ethers.MaxUint256);
    await rETH.connect(user1).approve(await vault.getAddress(), ethers.MaxUint256);
    await sAVAX.connect(user1).approve(await vault.getAddress(), ethers.MaxUint256);

    await stETH.connect(user2).approve(await vault.getAddress(), ethers.MaxUint256);
    await rETH.connect(user2).approve(await vault.getAddress(), ethers.MaxUint256);
    await sAVAX.connect(user2).approve(await vault.getAddress(), ethers.MaxUint256);
  });

  describe("Deployment", function () {
    it("Should set the correct vault name and symbol", async function () {
      expect(await vault.name()).to.equal("PolyLiquid");
      expect(await vault.symbol()).to.equal("PLY");
    });

    it("Should set the correct LST token addresses", async function () {
      expect(await vault.stETH()).to.equal(await stETH.getAddress());
      expect(await vault.rETH()).to.equal(await rETH.getAddress());
      expect(await vault.sAVAX()).to.equal(await sAVAX.getAddress());
    });

    it("Should set the correct max deposits", async function () {
      expect(await vault.maxDeposit(await stETH.getAddress())).to.equal(INITIAL_MAX_DEPOSIT);
      expect(await vault.maxDeposit(await rETH.getAddress())).to.equal(INITIAL_MAX_DEPOSIT);
      expect(await vault.maxDeposit(await sAVAX.getAddress())).to.equal(INITIAL_MAX_DEPOSIT);
    });

    it("Should emit VaultInit event", async function () {
      const PolyLiquidVaultFactory = await ethers.getContractFactory("PolyLiquidVault");
      const MockPredictionOracleFactory = await ethers.getContractFactory("MockPredictionOracle");
      const testPredictionOracle = await MockPredictionOracleFactory.deploy();
      
      const newVault = await PolyLiquidVaultFactory.deploy(
        await stETH.getAddress(),
        await rETH.getAddress(),
        await sAVAX.getAddress(),
        INITIAL_MAX_DEPOSIT,
        INITIAL_MAX_DEPOSIT,
        INITIAL_MAX_DEPOSIT,
        await testPredictionOracle.getAddress()
      );

      // Wait for deployment and check the transaction
      const receipt = await newVault.deploymentTransaction()?.wait();
      
      // Check if VaultInit event was emitted in the deployment transaction
      const vaultInitEvent = receipt?.logs.find((log: any) => {
        try {
          const parsed = newVault.interface.parseLog(log);
          return parsed?.name === "VaultInit";
        } catch {
          return false;
        }
      });

      expect(vaultInitEvent).to.not.be.undefined;
    });

    it("Should return correct supported assets", async function () {
      const supportedAssets = await vault.getSupportedAssets();
      expect(supportedAssets).to.have.length(3);
      expect(supportedAssets[0]).to.equal(await stETH.getAddress());
      expect(supportedAssets[1]).to.equal(await rETH.getAddress());
      expect(supportedAssets[2]).to.equal(await sAVAX.getAddress());
    });
  });

  describe("Deposits", function () {
    it("Should allow deposit of stETH", async function () {
      const stETHAddress = await stETH.getAddress();
      
      await expect(
        vault.connect(user1).deposit(stETHAddress, DEPOSIT_AMOUNT, user1.address)
      )
        .to.emit(vault, "Deposit")
        .withArgs(user1.address, user1.address, stETHAddress, DEPOSIT_AMOUNT, DEPOSIT_AMOUNT);

      expect(await vault.balanceOf(user1.address)).to.equal(DEPOSIT_AMOUNT);
      expect(await vault.totalAssetsPerAsset(stETHAddress)).to.equal(DEPOSIT_AMOUNT);
      expect(await stETH.balanceOf(await vault.getAddress())).to.equal(DEPOSIT_AMOUNT);
    });

    it("Should allow deposit of rETH", async function () {
      const rETHAddress = await rETH.getAddress();
      
      await vault.connect(user1).deposit(rETHAddress, DEPOSIT_AMOUNT, user1.address);

      expect(await vault.balanceOf(user1.address)).to.equal(DEPOSIT_AMOUNT);
      expect(await vault.totalAssetsPerAsset(rETHAddress)).to.equal(DEPOSIT_AMOUNT);
      expect(await rETH.balanceOf(await vault.getAddress())).to.equal(DEPOSIT_AMOUNT);
    });

    it("Should allow deposit of sAVAX", async function () {
      const sAVAXAddress = await sAVAX.getAddress();
      
      await vault.connect(user1).deposit(sAVAXAddress, DEPOSIT_AMOUNT, user1.address);

      expect(await vault.balanceOf(user1.address)).to.equal(DEPOSIT_AMOUNT);
      expect(await vault.totalAssetsPerAsset(sAVAXAddress)).to.equal(DEPOSIT_AMOUNT);
      expect(await sAVAX.balanceOf(await vault.getAddress())).to.equal(DEPOSIT_AMOUNT);
    });

    it("Should calculate total assets correctly across multiple tokens", async function () {
      const stETHAddress = await stETH.getAddress();
      const rETHAddress = await rETH.getAddress();
      const sAVAXAddress = await sAVAX.getAddress();

      await vault.connect(user1).deposit(stETHAddress, DEPOSIT_AMOUNT, user1.address);
      await vault.connect(user1).deposit(rETHAddress, DEPOSIT_AMOUNT, user1.address);
      await vault.connect(user1).deposit(sAVAXAddress, DEPOSIT_AMOUNT, user1.address);

      expect(await vault.totalAssets()).to.equal(DEPOSIT_AMOUNT * 3n);
      expect(await vault.balanceOf(user1.address)).to.equal(DEPOSIT_AMOUNT * 3n);
    });

    it("Should revert on unsupported asset", async function () {
      const randomToken = await (await ethers.getContractFactory("MockStETH")).deploy();
      
      await expect(
        vault.connect(user1).deposit(await randomToken.getAddress(), DEPOSIT_AMOUNT, user1.address)
      ).to.be.revertedWith("Unsupported asset");
    });

    it("Should revert when exceeding max deposit", async function () {
      const stETHAddress = await stETH.getAddress();
      const oversizedDeposit = INITIAL_MAX_DEPOSIT + 1n;
      
      await expect(
        vault.connect(user1).deposit(stETHAddress, oversizedDeposit, user1.address)
      ).to.be.revertedWith("Exceeds max deposit");
    });

    it("Should revert on zero deposit", async function () {
      const stETHAddress = await stETH.getAddress();
      
      await expect(
        vault.connect(user1).deposit(stETHAddress, 0, user1.address)
      ).to.be.revertedWith("Cannot deposit zero");
    });

    it("Should handle deposits to different receivers", async function () {
      const stETHAddress = await stETH.getAddress();
      
      await vault.connect(user1).deposit(stETHAddress, DEPOSIT_AMOUNT, user2.address);

      expect(await vault.balanceOf(user1.address)).to.equal(0);
      expect(await vault.balanceOf(user2.address)).to.equal(DEPOSIT_AMOUNT);
    });
  });

  describe("Withdrawals", function () {
    beforeEach(async function () {
      // Setup initial deposits
      const stETHAddress = await stETH.getAddress();
      const rETHAddress = await rETH.getAddress();
      
      await vault.connect(user1).deposit(stETHAddress, DEPOSIT_AMOUNT, user1.address);
      await vault.connect(user1).deposit(rETHAddress, DEPOSIT_AMOUNT, user1.address);
    });

    it("Should allow withdrawal of stETH", async function () {
      const stETHAddress = await stETH.getAddress();
      const withdrawAmount = ethers.parseEther("50");
      
      const initialBalance = await stETH.balanceOf(user1.address);
      
      await expect(
        vault.connect(user1).withdraw(stETHAddress, withdrawAmount, user1.address, user1.address)
      )
        .to.emit(vault, "Withdraw")
        .withArgs(user1.address, user1.address, user1.address, stETHAddress, withdrawAmount, withdrawAmount);

      expect(await vault.balanceOf(user1.address)).to.equal(DEPOSIT_AMOUNT * 2n - withdrawAmount);
      expect(await vault.totalAssetsPerAsset(stETHAddress)).to.equal(DEPOSIT_AMOUNT - withdrawAmount);
      expect(await stETH.balanceOf(user1.address)).to.equal(initialBalance + withdrawAmount);
    });

    it("Should allow withdrawal of rETH", async function () {
      const rETHAddress = await rETH.getAddress();
      const withdrawAmount = ethers.parseEther("30");
      
      const initialBalance = await rETH.balanceOf(user1.address);
      
      await vault.connect(user1).withdraw(rETHAddress, withdrawAmount, user1.address, user1.address);

      expect(await vault.balanceOf(user1.address)).to.equal(DEPOSIT_AMOUNT * 2n - withdrawAmount);
      expect(await vault.totalAssetsPerAsset(rETHAddress)).to.equal(DEPOSIT_AMOUNT - withdrawAmount);
      expect(await rETH.balanceOf(user1.address)).to.equal(initialBalance + withdrawAmount);
    });

    it("Should revert when withdrawing more than available", async function () {
      const stETHAddress = await stETH.getAddress();
      const oversizedWithdraw = DEPOSIT_AMOUNT + 1n;
      
      await expect(
        vault.connect(user1).withdraw(stETHAddress, oversizedWithdraw, user1.address, user1.address)
      ).to.be.revertedWith("Insufficient assets");
    });

    it("Should revert when user has insufficient shares", async function () {
      const stETHAddress = await stETH.getAddress();
      const oversizedWithdraw = DEPOSIT_AMOUNT * 3n; // More than user's total shares
      
      await expect(
        vault.connect(user1).withdraw(stETHAddress, oversizedWithdraw, user1.address, user1.address)
      ).to.be.revertedWith("Insufficient assets"); // This will be caught by our assets check first
    });

    it("Should handle withdrawal allowances", async function () {
      const stETHAddress = await stETH.getAddress();
      const withdrawAmount = ethers.parseEther("25");
      
      // User1 approves user2 to withdraw on their behalf
      await vault.connect(user1).approve(user2.address, withdrawAmount);
      
      await vault.connect(user2).withdraw(stETHAddress, withdrawAmount, user2.address, user1.address);

      expect(await vault.balanceOf(user1.address)).to.equal(DEPOSIT_AMOUNT * 2n - withdrawAmount);
      expect(await stETH.balanceOf(user2.address)).to.be.gt(0);
    });

    it("Should revert on zero withdrawal", async function () {
      const stETHAddress = await stETH.getAddress();
      
      await expect(
        vault.connect(user1).withdraw(stETHAddress, 0, user1.address, user1.address)
      ).to.be.revertedWith("Cannot withdraw zero");
    });
  });

  describe("Preview Functions", function () {
    it("Should preview deposit correctly", async function () {
      const stETHAddress = await stETH.getAddress();
      const previewShares = await vault.previewDeposit(stETHAddress, DEPOSIT_AMOUNT);
      
      expect(previewShares).to.equal(DEPOSIT_AMOUNT); // 1:1 ratio
    });

    it("Should preview withdraw correctly", async function () {
      const stETHAddress = await stETH.getAddress();
      const previewShares = await vault.previewWithdraw(stETHAddress, DEPOSIT_AMOUNT);
      
      expect(previewShares).to.equal(DEPOSIT_AMOUNT); // 1:1 ratio
    });

    it("Should revert preview functions with unsupported asset", async function () {
      const randomToken = await (await ethers.getContractFactory("MockStETH")).deploy();
      
      await expect(
        vault.previewDeposit(await randomToken.getAddress(), DEPOSIT_AMOUNT)
      ).to.be.revertedWith("Unsupported asset");

      await expect(
        vault.previewWithdraw(await randomToken.getAddress(), DEPOSIT_AMOUNT)
      ).to.be.revertedWith("Unsupported asset");
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to update max deposit", async function () {
      const stETHAddress = await stETH.getAddress();
      const newMaxDeposit = ethers.parseEther("2000");
      
      await vault.connect(owner).setMaxDeposit(stETHAddress, newMaxDeposit);
      
      expect(await vault.maxDeposit(stETHAddress)).to.equal(newMaxDeposit);
    });

    it("Should revert when non-owner tries to update max deposit", async function () {
      const stETHAddress = await stETH.getAddress();
      const newMaxDeposit = ethers.parseEther("2000");
      
      await expect(
        vault.connect(user1).setMaxDeposit(stETHAddress, newMaxDeposit)
      ).to.be.revertedWithCustomError(vault, "OwnableUnauthorizedAccount");
    });

    it("Should revert when setting max deposit for unsupported asset", async function () {
      const randomToken = await (await ethers.getContractFactory("MockStETH")).deploy();
      const newMaxDeposit = ethers.parseEther("2000");
      
      await expect(
        vault.connect(owner).setMaxDeposit(await randomToken.getAddress(), newMaxDeposit)
      ).to.be.revertedWith("Unsupported asset");
    });
  });

  describe("Complex Scenarios", function () {
    it("Should handle multiple users depositing different assets", async function () {
      const stETHAddress = await stETH.getAddress();
      const rETHAddress = await rETH.getAddress();
      const sAVAXAddress = await sAVAX.getAddress();

      // User1 deposits stETH
      await vault.connect(user1).deposit(stETHAddress, DEPOSIT_AMOUNT, user1.address);
      
      // User2 deposits rETH and sAVAX
      await vault.connect(user2).deposit(rETHAddress, LARGE_DEPOSIT, user2.address);
      await vault.connect(user2).deposit(sAVAXAddress, DEPOSIT_AMOUNT, user2.address);

      expect(await vault.totalAssets()).to.equal(DEPOSIT_AMOUNT + LARGE_DEPOSIT + DEPOSIT_AMOUNT);
      expect(await vault.balanceOf(user1.address)).to.equal(DEPOSIT_AMOUNT);
      expect(await vault.balanceOf(user2.address)).to.equal(LARGE_DEPOSIT + DEPOSIT_AMOUNT);
    });

    it("Should handle deposits reaching max limits", async function () {
      const stETHAddress = await stETH.getAddress();
      
      // Deposit up to the limit
      await vault.connect(user1).deposit(stETHAddress, INITIAL_MAX_DEPOSIT, user1.address);
      
      // Next deposit should fail
      await expect(
        vault.connect(user2).deposit(stETHAddress, 1, user2.address)
      ).to.be.revertedWith("Exceeds max deposit");
    });

    it("Should properly track assets after multiple operations", async function () {
      const stETHAddress = await stETH.getAddress();
      const rETHAddress = await rETH.getAddress();

      // Multiple deposits and withdrawals
      await vault.connect(user1).deposit(stETHAddress, DEPOSIT_AMOUNT, user1.address);
      await vault.connect(user1).deposit(rETHAddress, DEPOSIT_AMOUNT, user1.address);
      
      const partialWithdraw = ethers.parseEther("30");
      await vault.connect(user1).withdraw(stETHAddress, partialWithdraw, user1.address, user1.address);

      expect(await vault.totalAssetsPerAsset(stETHAddress)).to.equal(DEPOSIT_AMOUNT - partialWithdraw);
      expect(await vault.totalAssetsPerAsset(rETHAddress)).to.equal(DEPOSIT_AMOUNT);
      expect(await vault.totalAssets()).to.equal(DEPOSIT_AMOUNT * 2n - partialWithdraw);
    });
  });

  describe("Yield Oracle Integration", function () {
    it("Should fetch asset yield from oracle", async function () {
      const stETHAddress = await stETH.getAddress();
      
      const [yieldValue, timestamp] = await vault.getAssetYield.staticCall(stETHAddress);
      
      expect(yieldValue).to.equal(ethers.parseEther("0.04")); // 4% as set in oracle
      expect(timestamp).to.be.gt(0);
    });

    it("Should emit YieldUpdated event when fetching yield", async function () {
      const stETHAddress = await stETH.getAddress();
      
      await expect(vault.getAssetYield(stETHAddress))
        .to.emit(vault, "YieldUpdated");
    });

    it("Should store yield data correctly", async function () {
      const stETHAddress = await stETH.getAddress();
      
      await vault.getAssetYield(stETHAddress);
      
      const [storedYield, storedTimestamp] = await vault.getStoredYield(stETHAddress);
      expect(storedYield).to.equal(ethers.parseEther("0.04"));
      expect(storedTimestamp).to.be.gt(0);
    });

    it("Should allow owner to set yield oracle", async function () {
      const stETHAddress = await stETH.getAddress();
      const newOracle = await (await ethers.getContractFactory("MockYieldOracle")).deploy();
      await newOracle.setPrice(stETHAddress, ethers.parseEther("0.07"));
      
      await vault.connect(owner).setYieldOracle(stETHAddress, await newOracle.getAddress());
      
      const [yieldValue] = await vault.getAssetYield.staticCall(stETHAddress);
      expect(yieldValue).to.equal(ethers.parseEther("0.07"));
    });

    it("Should revert when non-owner tries to set oracle", async function () {
      const stETHAddress = await stETH.getAddress();
      const newOracle = await (await ethers.getContractFactory("MockYieldOracle")).deploy();
      
      await expect(
        vault.connect(user1).setYieldOracle(stETHAddress, await newOracle.getAddress())
      ).to.be.revertedWithCustomError(vault, "OwnableUnauthorizedAccount");
    });

    it("Should revert when oracle is not configured", async function () {
      // Create new vault without oracles set
      const MockPredictionOracleFactory = await ethers.getContractFactory("MockPredictionOracle");
      const testPredictionOracle = await MockPredictionOracleFactory.deploy();
      
      const newVault = await (await ethers.getContractFactory("PolyLiquidVault")).deploy(
        await stETH.getAddress(),
        await rETH.getAddress(),
        await sAVAX.getAddress(),
        INITIAL_MAX_DEPOSIT,
        INITIAL_MAX_DEPOSIT,
        INITIAL_MAX_DEPOSIT,
        await testPredictionOracle.getAddress()
      );
      
      await expect(
        newVault.getAssetYield(await stETH.getAddress())
      ).to.be.revertedWith("Oracle not configured");
    });
  });

  describe("Rebalancing Logic", function () {
    beforeEach(async function () {
      // Fetch yields to populate the latestYield mapping
      await vault.getAssetYield(await stETH.getAddress()); // 4%
      await vault.getAssetYield(await rETH.getAddress());  // 5%
      await vault.getAssetYield(await sAVAX.getAddress()); // 6%
    });

    it("Should not emit RebalanceSignal when yields are within threshold", async function () {
      // Current yields: stETH=4%, rETH=5%, sAVAX=6%
      // Max delta is 2% which is < 15% threshold
      
      await expect(vault.rebalanceIfNeeded()).to.not.emit(vault, "RebalanceSignal");
    });

    it("Should emit RebalanceSignal when yield delta exceeds threshold", async function () {
      const sAVAXAddress = await sAVAX.getAddress();
      const stETHAddress = await stETH.getAddress();
      
      // Set prediction oracle probability above threshold (>60%)
      await predictionOracle.setProbability(ethers.parseEther("0.8")); // 80%
      
      // Set sAVAX yield to 25% to create a 21% delta with stETH (4%)
      await sAVAXOracle.setPrice(sAVAXAddress, ethers.parseEther("0.25"));
      await vault.getAssetYield(sAVAXAddress); // Update stored yield
      
      await expect(vault.rebalanceIfNeeded())
        .to.emit(vault, "RebalanceSignal")
        .withArgs(
          stETHAddress,          // fromAsset (lower yield)
          sAVAXAddress,          // toAsset (higher yield)
          ethers.parseEther("0.04"), // fromYield
          ethers.parseEther("0.25"), // toYield
          ethers.parseEther("0.21")  // yieldDelta
        );
    });

    it("Should emit multiple RebalanceSignal events for different asset pairs", async function () {
      const stETHAddress = await stETH.getAddress();
      const rETHAddress = await rETH.getAddress();
      const sAVAXAddress = await sAVAX.getAddress();
      
      // Set prediction oracle probability above threshold (>60%)
      await predictionOracle.setProbability(ethers.parseEther("0.75")); // 75%
      
      // Set extreme yields to trigger multiple rebalancing signals
      await stETHOracle.setPrice(stETHAddress, ethers.parseEther("0.02")); // 2%
      await sAVAXOracle.setPrice(sAVAXAddress, ethers.parseEther("0.30")); // 30%
      
      await vault.getAssetYield(stETHAddress);
      await vault.getAssetYield(sAVAXAddress);
      
      const tx = vault.rebalanceIfNeeded();
      
      // Should emit for stETH -> sAVAX (28% delta)
      await expect(tx)
        .to.emit(vault, "RebalanceSignal")
        .withArgs(
          stETHAddress,
          sAVAXAddress,
          ethers.parseEther("0.02"),
          ethers.parseEther("0.30"),
          ethers.parseEther("0.28")
        );
        
      // Should emit for rETH -> sAVAX (25% delta)
      await expect(tx)
        .to.emit(vault, "RebalanceSignal")
        .withArgs(
          rETHAddress,
          sAVAXAddress,
          ethers.parseEther("0.05"),
          ethers.parseEther("0.30"),
          ethers.parseEther("0.25")
        );
    });

    it("Should handle rebalancing with yield scenarios", async function () {
      // Test different yield scenarios
      await stETHOracle.setYieldScenario(await stETH.getAddress(), 0); // 3% low yield
      await rETHOracle.setYieldScenario(await rETH.getAddress(), 1);  // 5% medium yield
      await sAVAXOracle.setYieldScenario(await sAVAX.getAddress(), 2); // 8% high yield
      
      await vault.getAssetYield(await stETH.getAddress());
      await vault.getAssetYield(await rETH.getAddress());
      await vault.getAssetYield(await sAVAX.getAddress());
      
      // 5% delta between stETH and sAVAX should not trigger rebalancing
      await expect(vault.rebalanceIfNeeded()).to.not.emit(vault, "RebalanceSignal");
    });

    it("Should integrate yield monitoring with vault operations", async function () {
      const stETHAddress = await stETH.getAddress();
      const rETHAddress = await rETH.getAddress();
      
      // Perform deposits
      await vault.connect(user1).deposit(stETHAddress, DEPOSIT_AMOUNT, user1.address);
      await vault.connect(user1).deposit(rETHAddress, DEPOSIT_AMOUNT, user1.address);
      
      // Fetch yields
      await vault.getAssetYield(stETHAddress);
      await vault.getAssetYield(rETHAddress);
      
      // Check that yields are stored
      const [stETHYield] = await vault.getStoredYield(stETHAddress);
      const [rETHYield] = await vault.getStoredYield(rETHAddress);
      
      expect(stETHYield).to.equal(ethers.parseEther("0.04"));
      expect(rETHYield).to.equal(ethers.parseEther("0.05"));
      
      // Check rebalancing doesn't trigger
      await expect(vault.rebalanceIfNeeded()).to.not.emit(vault, "RebalanceSignal");
    });
  });
}); 