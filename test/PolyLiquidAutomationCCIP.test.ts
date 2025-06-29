import { expect } from "chai";
import { ethers } from "hardhat";
import { Contract, Signer } from "ethers";
import { time } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("PolyLiquid Automation & CCIP Integration", function () {
    let vault: Contract;
    let plyToken: Contract;
    let polyRouter: Contract;
    let mockStETH: Contract;
    let mockRETH: Contract;
    let mockSAVAX: Contract;
    let stETHOracle: Contract;
    let rETHOracle: Contract;
    let sAVAXOracle: Contract;
    let mockPredictionOracle: Contract;
    
    let owner: Signer;
    let user1: Signer;
    let user2: Signer;
    let keeper: Signer;
    
    let ownerAddress: string;
    let user1Address: string;
    let user2Address: string;
    let keeperAddress: string;

    const INITIAL_PLY_SUPPLY = ethers.parseEther("1000000"); // 1M PLY
    const MAX_DEPOSITS = ethers.parseEther("100000");
    const UPKEEP_INTERVAL = 3600; // 1 hour in seconds

    beforeEach(async function () {
        [owner, user1, user2, keeper] = await ethers.getSigners();
        [ownerAddress, user1Address, user2Address, keeperAddress] = await Promise.all([
            owner.getAddress(),
            user1.getAddress(),
            user2.getAddress(),
            keeper.getAddress()
        ]);

        // Deploy PLY Token
        const PLYToken = await ethers.getContractFactory("PLYToken");
        plyToken = await PLYToken.deploy(
            "PolyLiquid Token",
            "PLY",
            INITIAL_PLY_SUPPLY,
            ownerAddress
        );
        await plyToken.waitForDeployment();

        // Deploy mock LST tokens
        const MockLST = await ethers.getContractFactory("MockLST");
        mockStETH = await MockLST.deploy("Staked Ether", "stETH", 18);
        mockRETH = await MockLST.deploy("Rocket Pool ETH", "rETH", 18);
        mockSAVAX = await MockLST.deploy("Staked AVAX", "sAVAX", 18);
        
        await Promise.all([
            mockStETH.waitForDeployment(),
            mockRETH.waitForDeployment(),
            mockSAVAX.waitForDeployment()
        ]);

        // Deploy mock yield oracles (separate instances for each asset)
        const MockYieldOracle = await ethers.getContractFactory("MockYieldOracle");
        stETHOracle = await MockYieldOracle.deploy();
        rETHOracle = await MockYieldOracle.deploy();
        sAVAXOracle = await MockYieldOracle.deploy();
        await Promise.all([
            stETHOracle.waitForDeployment(),
            rETHOracle.waitForDeployment(),
            sAVAXOracle.waitForDeployment()
        ]);

        // Deploy mock prediction oracle
        const MockPredictionOracle = await ethers.getContractFactory("MockPredictionOracle");
        mockPredictionOracle = await MockPredictionOracle.deploy();
        await mockPredictionOracle.waitForDeployment();

        // Deploy PolyLiquidVault with automation functionality
        const PolyLiquidVault = await ethers.getContractFactory("PolyLiquidVault");
        vault = await PolyLiquidVault.deploy(
            await mockStETH.getAddress(),
            await mockRETH.getAddress(),
            await mockSAVAX.getAddress(),
            MAX_DEPOSITS,
            MAX_DEPOSITS,
            MAX_DEPOSITS,
            await mockPredictionOracle.getAddress()
        );
        await vault.waitForDeployment();

        // Deploy PolyRouter for cross-chain functionality
        const PolyRouter = await ethers.getContractFactory("PolyRouter");
        polyRouter = await PolyRouter.deploy(
            await plyToken.getAddress(),
            ownerAddress
        );
        await polyRouter.waitForDeployment();

        // Setup initial tokens and approvals
        await setupInitialState();
    });

    async function setupInitialState() {
        // Mint initial tokens to users
        const initialTokens = ethers.parseEther("1000");
        
        await Promise.all([
            mockStETH.mint(user1Address, initialTokens),
            mockRETH.mint(user1Address, initialTokens),
            mockSAVAX.mint(user1Address, initialTokens),
            mockStETH.mint(user2Address, initialTokens),
            mockRETH.mint(user2Address, initialTokens),
            mockSAVAX.mint(user2Address, initialTokens)
        ]);

        // Setup approvals for vault
        const vaultAddress = await vault.getAddress();
        await Promise.all([
            mockStETH.connect(user1).approve(vaultAddress, ethers.MaxUint256),
            mockRETH.connect(user1).approve(vaultAddress, ethers.MaxUint256),
            mockSAVAX.connect(user1).approve(vaultAddress, ethers.MaxUint256),
            mockStETH.connect(user2).approve(vaultAddress, ethers.MaxUint256),
            mockRETH.connect(user2).approve(vaultAddress, ethers.MaxUint256),
            mockSAVAX.connect(user2).approve(vaultAddress, ethers.MaxUint256)
        ]);

        // Distribute PLY tokens to users for cross-chain testing
        const plyAmount = ethers.parseEther("10000");
        await Promise.all([
            plyToken.transfer(user1Address, plyAmount),
            plyToken.transfer(user2Address, plyAmount)
        ]);

        // Setup PLY approvals for router
        const routerAddress = await polyRouter.getAddress();
        await Promise.all([
            plyToken.connect(user1).approve(routerAddress, ethers.MaxUint256),
            plyToken.connect(user2).approve(routerAddress, ethers.MaxUint256)
        ]);

        // Fund router with PLY for minting operations
        await plyToken.transfer(routerAddress, ethers.parseEther("50000"));

        // Set yield oracles for automation testing (separate instances for each asset)
        await vault.setYieldOracle(await mockStETH.getAddress(), await stETHOracle.getAddress());
        await vault.setYieldOracle(await mockRETH.getAddress(), await rETHOracle.getAddress());
        await vault.setYieldOracle(await mockSAVAX.getAddress(), await sAVAXOracle.getAddress());

        // Set initial yields for each oracle
        await Promise.all([
            stETHOracle.setPrice(await mockStETH.getAddress(), ethers.parseEther("0.05")), // 5%
            rETHOracle.setPrice(await mockRETH.getAddress(), ethers.parseEther("0.06")), // 6%
            sAVAXOracle.setPrice(await mockSAVAX.getAddress(), ethers.parseEther("0.04")) // 4%
        ]);
    }

    describe("Chainlink Automation Integration", function () {
        beforeEach(async function () {
            // Deposit some tokens to create vault state
            await vault.connect(user1).deposit(await mockStETH.getAddress(), ethers.parseEther("10"), user1Address);
            await vault.connect(user1).deposit(await mockRETH.getAddress(), ethers.parseEther("8"), user1Address);
            await vault.connect(user1).deposit(await mockSAVAX.getAddress(), ethers.parseEther("12"), user1Address);
        });

        it("Should properly initialize automation configuration", async function () {
            expect(await vault.UPKEEP_INTERVAL()).to.equal(UPKEEP_INTERVAL);
            expect(await vault.lastUpkeepTimestamp()).to.equal(0);
            expect(await vault.totalRewardsHarvested()).to.equal(0);
        });

        it("Should check upkeep correctly based on time interval", async function () {
            // Initially, no upkeep needed (timestamp is 0, so it should be needed)
            let [upkeepNeeded, performData] = await vault.checkUpkeep("0x");
            expect(upkeepNeeded).to.be.true;
            expect(performData).to.equal("0x");

            // Perform upkeep
            await vault.performUpkeep("0x");

            // Check that upkeep is not needed immediately after
            [upkeepNeeded, performData] = await vault.checkUpkeep("0x");
            expect(upkeepNeeded).to.be.false;

            // Advance time by 1 hour
            await time.increase(UPKEEP_INTERVAL);

            // Now upkeep should be needed
            [upkeepNeeded, performData] = await vault.checkUpkeep("0x");
            expect(upkeepNeeded).to.be.true;
        });

        it("Should perform upkeep: harvest rewards and check rebalancing", async function () {
            const initialRewards = await vault.totalRewardsHarvested();
            
            // Set prediction oracle probability above threshold (>60%)
            await mockPredictionOracle.setProbability(ethers.parseEther("0.8")); // 80%
            
                        // Set different yields to trigger rebalancing signals
            await stETHOracle.setPrice(await mockStETH.getAddress(), ethers.parseEther("0.03")); // 3%
            await rETHOracle.setPrice(await mockRETH.getAddress(), ethers.parseEther("0.20")); // 20% - big difference
            
            // Initialize yield data
            await vault.getAssetYield(await mockStETH.getAddress());
            await vault.getAssetYield(await mockRETH.getAddress());
            
            const tx = await vault.performUpkeep("0x");
            const receipt = await tx.wait();

            // Check that UpkeepPerformed event was emitted
            const upkeepEvent = receipt.logs.find((log: any) => {
                try {
                    const parsed = vault.interface.parseLog(log);
                    return parsed?.name === "UpkeepPerformed";
                } catch {
                    return false;
                }
            });

            expect(upkeepEvent).to.not.be.undefined;
            
            // Parse the event
            const parsedEvent = vault.interface.parseLog(upkeepEvent);
            expect(parsedEvent.args.rebalanceNeeded).to.be.true;

            // Check that rewards were harvested
            const finalRewards = await vault.totalRewardsHarvested();
            expect(finalRewards).to.be.gt(initialRewards);

            // Check that timestamp was updated
            const lastUpkeep = await vault.lastUpkeepTimestamp();
            expect(lastUpkeep).to.be.gt(0);
        });

        it("Should emit RebalanceSignal when yield difference exceeds threshold", async function () {
            // Set prediction oracle probability above threshold (>60%)
            await mockPredictionOracle.setProbability(ethers.parseEther("0.7")); // 70%
            
            // Set significantly different yields
            await stETHOracle.setPrice(await mockStETH.getAddress(), ethers.parseEther("0.05")); // 5%
            await rETHOracle.setPrice(await mockRETH.getAddress(), ethers.parseEther("0.25")); // 25%

            const tx = await vault.performUpkeep("0x");
            
            // Check for RebalanceSignal event
            await expect(tx)
                .to.emit(vault, "RebalanceSignal")
                .withArgs(
                    await mockStETH.getAddress(),
                    await mockRETH.getAddress(),
                    ethers.parseEther("0.05"),
                    ethers.parseEther("0.25"),
                    ethers.parseEther("0.20") // 20% difference
                );
        });

        it("Should reject premature upkeep calls", async function () {
            await vault.performUpkeep("0x");
            
            // Try to perform upkeep again immediately
            await expect(vault.performUpkeep("0x"))
                .to.be.revertedWith("Upkeep not needed");
        });

        it("Should allow manual upkeep by owner", async function () {
            const initialRewards = await vault.totalRewardsHarvested();
            
            await vault.manualUpkeep();
            
            const finalRewards = await vault.totalRewardsHarvested();
            expect(finalRewards).to.be.gt(initialRewards);
        });

        it("Should return correct upkeep status", async function () {
            let [timeUntilNext, upkeepDue, lastPerformed, totalHarvested] = await vault.getUpkeepStatus();
            
            expect(upkeepDue).to.be.true; // Initially due
            expect(lastPerformed).to.equal(0);
            expect(totalHarvested).to.equal(0);

            await vault.performUpkeep("0x");
            
            [timeUntilNext, upkeepDue, lastPerformed, totalHarvested] = await vault.getUpkeepStatus();
            
            expect(upkeepDue).to.be.false;
            expect(timeUntilNext).to.be.closeTo(UPKEEP_INTERVAL, 5); // Within 5 seconds
            expect(lastPerformed).to.be.gt(0);
            expect(totalHarvested).to.be.gt(0);
        });
    });

    describe("Cross-Chain CCIP Integration", function () {
        const SEPOLIA_CHAIN_SELECTOR = 16015286601757825753n;
        const FUJI_CHAIN_SELECTOR = 14767482510784806043n;

        it("Should properly initialize CCIP router", async function () {
            expect(await polyRouter.SEPOLIA_CHAIN_SELECTOR()).to.equal(SEPOLIA_CHAIN_SELECTOR);
            expect(await polyRouter.FUJI_CHAIN_SELECTOR()).to.equal(FUJI_CHAIN_SELECTOR);
            expect(await polyRouter.supportedChains(SEPOLIA_CHAIN_SELECTOR)).to.be.true;
            expect(await polyRouter.supportedChains(FUJI_CHAIN_SELECTOR)).to.be.true;
        });

        it("Should lock PLY tokens and create cross-chain message", async function () {
            const transferAmount = ethers.parseEther("100");
            const initialBalance = await plyToken.balanceOf(user1Address);
            const initialLocked = await polyRouter.totalLockedTokens();

            const tx = await polyRouter.connect(user1).sendPLY(
                SEPOLIA_CHAIN_SELECTOR,
                user2Address,
                transferAmount
            );

            // Check events
            await expect(tx)
                .to.emit(polyRouter, "TokensLocked")
                .and.to.emit(polyRouter, "CrossChainMessageSent");

            // Check balances
            const finalBalance = await plyToken.balanceOf(user1Address);
            const finalLocked = await polyRouter.totalLockedTokens();
            
            expect(finalBalance).to.equal(initialBalance - transferAmount);
            expect(finalLocked).to.equal(initialLocked + transferAmount);

            // Check router balance
            const routerBalance = await plyToken.balanceOf(await polyRouter.getAddress());
            expect(routerBalance).to.be.gte(transferAmount);
        });

        it("Should process incoming cross-chain message and mint tokens", async function () {
            const transferAmount = ethers.parseEther("100");
            
            // First lock tokens
            const lockTx = await polyRouter.connect(user1).sendPLY(
                SEPOLIA_CHAIN_SELECTOR,
                user2Address,
                transferAmount
            );
            const lockReceipt = await lockTx.wait();
            
            // Extract message ID from event
            const lockEvent = lockReceipt.logs.find((log: any) => {
                try {
                    const parsed = polyRouter.interface.parseLog(log);
                    return parsed?.name === "TokensLocked";
                } catch {
                    return false;
                }
            });
            
            const parsedLockEvent = polyRouter.interface.parseLog(lockEvent);
            const messageId = parsedLockEvent.args.messageId;

            // Check initial balance
            const initialBalance = await plyToken.balanceOf(user2Address);

            // Process incoming message (simulating CCIP)
            const tx = await polyRouter.processIncomingMessage(
                messageId,
                FUJI_CHAIN_SELECTOR,
                user2Address,
                transferAmount
            );

            // Check TokensMinted event (don't check exact timestamp due to timing)
            await expect(tx)
                .to.emit(polyRouter, "TokensMinted")
                .withArgs(messageId, FUJI_CHAIN_SELECTOR, user2Address, transferAmount, await time.latest());

            // Check that tokens were transferred to receiver
            const finalBalance = await plyToken.balanceOf(user2Address);
            expect(finalBalance).to.equal(initialBalance + transferAmount);
        });

        it("Should handle message failures and recovery", async function () {
            const transferAmount = ethers.parseEther("100");
            
            // Create a message
            const tx = await polyRouter.connect(user1).sendPLY(
                SEPOLIA_CHAIN_SELECTOR,
                user2Address,
                transferAmount
            );
            const receipt = await tx.wait();
            
            const lockEvent = receipt.logs.find((log: any) => {
                try {
                    const parsed = polyRouter.interface.parseLog(log);
                    return parsed?.name === "TokensLocked";
                } catch {
                    return false;
                }
            });
            
            const messageId = polyRouter.interface.parseLog(lockEvent).args.messageId;

            // Mark message as failed
            await polyRouter.markMessageFailed(messageId);
            expect(await polyRouter.failedMessages(messageId)).to.be.true;

            // Retry failed message
            const initialBalance = await plyToken.balanceOf(user2Address);
            
            await expect(polyRouter.retryFailedMessage(messageId, user2Address))
                .to.emit(polyRouter, "FailedMessageRetried")
                .withArgs(messageId, user2Address, transferAmount);

            // Check that tokens were transferred
            const finalBalance = await plyToken.balanceOf(user2Address);
            expect(finalBalance).to.equal(initialBalance + transferAmount);

            // Check that message is marked as processed
            const message = await polyRouter.getMessage(messageId);
            expect(message.processed).to.be.true;
        });

        it("Should reject unsupported chains", async function () {
            const unsupportedChain = 999999n;
            
            await expect(
                polyRouter.connect(user1).sendPLY(
                    unsupportedChain,
                    user2Address,
                    ethers.parseEther("100")
                )
            ).to.be.revertedWithCustomError(polyRouter, "DestinationChainNotSupported")
             .withArgs(unsupportedChain);
        });

        it("Should allow owner to manage supported chains", async function () {
            const newChain = 123456n;
            
            // Initially not supported
            expect(await polyRouter.isChainSupported(newChain)).to.be.false;
            
            // Enable chain
            await polyRouter.setSupportedChain(newChain, true);
            expect(await polyRouter.isChainSupported(newChain)).to.be.true;
            
            // Disable chain
            await polyRouter.setSupportedChain(newChain, false);
            expect(await polyRouter.isChainSupported(newChain)).to.be.false;
        });

        it("Should handle emergency withdrawals", async function () {
            const withdrawAmount = ethers.parseEther("1000");
            const initialBalance = await plyToken.balanceOf(ownerAddress);
            
            await polyRouter.emergencyWithdraw(withdrawAmount, ownerAddress);
            
            const finalBalance = await plyToken.balanceOf(ownerAddress);
            expect(finalBalance).to.equal(initialBalance + withdrawAmount);
        });
    });

    describe("Prediction Oracle Integration", function () {
        beforeEach(async function () {
            // Deposit some tokens to create vault state
            await vault.connect(user1).deposit(await mockStETH.getAddress(), ethers.parseEther("10"), user1Address);
            await vault.connect(user1).deposit(await mockRETH.getAddress(), ethers.parseEther("8"), user1Address);
            
            // Set initial probability to 50% (below threshold)
            await mockPredictionOracle.setProbability(ethers.parseEther("0.5"));
        });

        it("Should read market probability from prediction oracle", async function () {
            // Check initial probability
            const probability = await vault.getMarketProbability();
            expect(probability).to.equal(ethers.parseEther("0.5"));
            
            // Update probability
            await mockPredictionOracle.setProbability(ethers.parseEther("0.75"));
            
            // Check updated probability
            const newProbability = await vault.getMarketProbability();
            expect(newProbability).to.equal(ethers.parseEther("0.75"));
        });

        it("Should check if market conditions are favorable for rebalancing", async function () {
            // Initially 50% - not favorable (threshold is 60%)
            let favorable = await vault.isMarketFavorableForRebalancing();
            expect(favorable).to.be.false;
            
            // Set to 70% - should be favorable
            await mockPredictionOracle.setProbability(ethers.parseEther("0.7"));
            favorable = await vault.isMarketFavorableForRebalancing();
            expect(favorable).to.be.true;
            
            // Set to exactly 60% - should be favorable
            await mockPredictionOracle.setProbability(ethers.parseEther("0.6"));
            favorable = await vault.isMarketFavorableForRebalancing();
            expect(favorable).to.be.true;
            
            // Set to 59% - not favorable
            await mockPredictionOracle.setProbability(ethers.parseEther("0.59"));
            favorable = await vault.isMarketFavorableForRebalancing();
            expect(favorable).to.be.false;
        });

        it("Should NOT emit rebalancing signals when probability is below threshold", async function () {
            // Set yields with large delta (> 15%)
            await stETHOracle.setPrice(await mockStETH.getAddress(), ethers.parseEther("0.05")); // 5%
            await rETHOracle.setPrice(await mockRETH.getAddress(), ethers.parseEther("0.25")); // 25% - 20% delta
            
            // Set probability below threshold (50% < 60%)
            await mockPredictionOracle.setProbability(ethers.parseEther("0.5"));
            
            // Call rebalanceIfNeeded - should NOT emit signal due to low probability
            const tx = await vault.rebalanceIfNeeded();
            const receipt = await tx.wait();
            
            // Should not have RebalanceSignal event
            const rebalanceEvents = receipt.logs.filter((log: any) => {
                try {
                    const parsed = vault.interface.parseLog(log);
                    return parsed?.name === "RebalanceSignal";
                } catch {
                    return false;
                }
            });
            
            expect(rebalanceEvents).to.have.length(0);
        });

        it("Should emit rebalancing signals when BOTH yield delta and probability thresholds are met", async function () {
            // Set yields with large delta (> 15%)
            await stETHOracle.setPrice(await mockStETH.getAddress(), ethers.parseEther("0.05")); // 5%
            await rETHOracle.setPrice(await mockRETH.getAddress(), ethers.parseEther("0.25")); // 25% - 20% delta
            
            // Set probability above threshold (70% > 60%)
            await mockPredictionOracle.setProbability(ethers.parseEther("0.7"));
            
            // Initialize yield data by calling getAssetYield for both assets first
            await vault.getAssetYield(await mockStETH.getAddress());
            await vault.getAssetYield(await mockRETH.getAddress());
            
            // Call rebalanceIfNeeded - should emit signal
            const tx = await vault.rebalanceIfNeeded();
            
            // Should emit RebalanceSignal event
            await expect(tx)
                .to.emit(vault, "RebalanceSignal");
        });

        it("Should integrate with automation upkeep and respect probability threshold", async function () {
            // Set yields with large delta
            await stETHOracle.setPrice(await mockStETH.getAddress(), ethers.parseEther("0.05")); // 5%
            await rETHOracle.setPrice(await mockRETH.getAddress(), ethers.parseEther("0.25")); // 25%
            
            // Test with low probability - no rebalancing
            await mockPredictionOracle.setProbability(ethers.parseEther("0.4")); // 40% < 60%
            
            const tx1 = await vault.performUpkeep("0x");
            const receipt1 = await tx1.wait();
            
            // Find UpkeepPerformed event
            const upkeepEvent1 = receipt1.logs.find((log: any) => {
                try {
                    const parsed = vault.interface.parseLog(log);
                    return parsed?.name === "UpkeepPerformed";
                } catch {
                    return false;
                }
            });
            
            const parsedUpkeepEvent1 = vault.interface.parseLog(upkeepEvent1);
            expect(parsedUpkeepEvent1.args.rebalanceNeeded).to.be.false;
            
            // Test with high probability - should rebalance
            await mockPredictionOracle.setProbability(ethers.parseEther("0.8")); // 80% > 60%
            
            // Initialize yield data to ensure rebalancing can occur
            await vault.getAssetYield(await mockStETH.getAddress());
            await vault.getAssetYield(await mockRETH.getAddress());
            
            // Advance time for next upkeep
            await time.increase(UPKEEP_INTERVAL);
            
            const tx2 = await vault.performUpkeep("0x");
            const receipt2 = await tx2.wait();
            
            const upkeepEvent2 = receipt2.logs.find((log: any) => {
                try {
                    const parsed = vault.interface.parseLog(log);
                    return parsed?.name === "UpkeepPerformed";
                } catch {
                    return false;
                }
            });
            
            const parsedUpkeepEvent2 = vault.interface.parseLog(upkeepEvent2);
            expect(parsedUpkeepEvent2.args.rebalanceNeeded).to.be.true;
        });

        it("Should allow manual probability updates via vault", async function () {
            // Request probability update through vault
            const tx = await vault.requestProbabilityUpdate();
            
            await expect(tx)
                .to.emit(mockPredictionOracle, "RequestSent");
        });

        it("Should allow owner to update prediction oracle address", async function () {
            const newMockOracle = await ethers.deployContract("MockPredictionOracle");
            await newMockOracle.waitForDeployment();
            
            // Set new oracle
            await vault.setPredictionOracle(await newMockOracle.getAddress());
            
            // Set different probability in new oracle
            await newMockOracle.setProbability(ethers.parseEther("0.9"));
            
            // Check that vault reads from new oracle
            const probability = await vault.getMarketProbability();
            expect(probability).to.equal(ethers.parseEther("0.9"));
        });

        it("Should handle prediction oracle data age and staleness", async function () {
            // Check initial data age
            const initialAge = await mockPredictionOracle.getDataAge();
            expect(initialAge).to.be.gte(0);
            
            // Check if data is stale (using 1 hour as max age)
            const isStale = await mockPredictionOracle.isStale(3600);
            expect(isStale).to.be.false; // Should be fresh
            
            // Advance time and check staleness
            await time.increase(3601); // More than 1 hour
            
            const nowStale = await mockPredictionOracle.isStale(3600);
            expect(nowStale).to.be.true; // Should be stale now
        });
    });

    describe("Integration Tests: Automation + CCIP + Prediction Oracle", function () {
        const SEPOLIA_CHAIN_SELECTOR = 16015286601757825753n;
        const FUJI_CHAIN_SELECTOR = 14767482510784806043n;

        it("Should perform cross-chain transfer during upkeep simulation", async function () {
            const transferAmount = ethers.parseEther("200");
            
            // Deposit to vault to have automation working
            await vault.connect(user1).deposit(await mockStETH.getAddress(), ethers.parseEther("10"), user1Address);
            
            // Perform a cross-chain transfer
            const ccipTx = await polyRouter.connect(user1).sendPLY(
                SEPOLIA_CHAIN_SELECTOR,
                user2Address,
                transferAmount
            );
            
            // Simulate some time passing and perform upkeep
            await time.increase(UPKEEP_INTERVAL);
            
            const upkeepTx = await vault.performUpkeep("0x");
            
            // Both operations should complete successfully
            expect(ccipTx).to.not.be.reverted;
            expect(upkeepTx).to.not.be.reverted;
            
            // Check that locked tokens are recorded
            const lockedTokens = await polyRouter.getLockedTokens();
            expect(lockedTokens).to.equal(transferAmount);
            
            // Check that rewards were harvested
            const totalRewards = await vault.totalRewardsHarvested();
            expect(totalRewards).to.be.gt(0);
        });

        it("Should handle multiple cross-chain transfers and upkeeps", async function () {
            // Setup vault with deposits
            await vault.connect(user1).deposit(await mockStETH.getAddress(), ethers.parseEther("10"), user1Address);
            await vault.connect(user2).deposit(await mockRETH.getAddress(), ethers.parseEther("8"), user2Address);
            
            // Perform multiple cross-chain transfers
            const transfer1 = ethers.parseEther("50");
            const transfer2 = ethers.parseEther("75");
            
            await polyRouter.connect(user1).sendPLY(SEPOLIA_CHAIN_SELECTOR, user2Address, transfer1);
            await polyRouter.connect(user2).sendPLY(FUJI_CHAIN_SELECTOR, user1Address, transfer2);
            
            // Perform multiple upkeeps
            await vault.performUpkeep("0x");
            
            await time.increase(UPKEEP_INTERVAL);
            await vault.performUpkeep("0x");
            
            // Check final states
            const totalLocked = await polyRouter.getLockedTokens();
            const totalRewards = await vault.totalRewardsHarvested();
            
            expect(totalLocked).to.equal(transfer1 + transfer2);
            expect(totalRewards).to.be.gt(0);
        });
    });
}); 