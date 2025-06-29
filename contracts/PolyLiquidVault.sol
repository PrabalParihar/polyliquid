// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
import "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";
import "./PolyPredictionOracle.sol";

/**
 * @title PolyLiquidVault
 * @dev A multi-asset vault that accepts stETH, rETH, and sAVAX tokens and mints PLY shares
 * Follows ERC4626-like patterns but supports multiple underlying assets
 */
contract PolyLiquidVault is ERC20, Ownable, ReentrancyGuard, AutomationCompatibleInterface {
    using SafeERC20 for IERC20;
    using Math for uint256;

    // Supported LST tokens
    IERC20 public immutable stETH;
    IERC20 public immutable rETH;
    IERC20 public immutable sAVAX;

    // Maximum deposit limits per token
    mapping(address => uint256) public maxDeposit;
    
    // Track total assets deposited for each token
    mapping(address => uint256) public totalAssetsPerToken;
    
    // Yield data from Chainlink Data Streams
    mapping(address => uint256) public latestYield; // Yield in basis points (1e18 = 100%)
    mapping(address => uint256) public lastYieldUpdate;
    
    // Chainlink Data Streams oracles for yield data (hardcoded for Sepolia/Fuji)
    mapping(address => AggregatorV3Interface) public yieldOracles;
    
    // Prediction oracle for market sentiment
    PolyPredictionOracle public predictionOracle;
    
    // Rebalancing configuration
    uint256 public constant REBALANCE_THRESHOLD = 0.15e18; // 15% yield delta threshold
    uint256 public constant PROBABILITY_THRESHOLD = 0.6e18; // 60% probability threshold
    uint256 public constant YIELD_DECIMALS = 1e18; // 18 decimals for yield (100% = 1e18)
    
    // Automation configuration
    uint256 public constant UPKEEP_INTERVAL = 1 hours; // 1 hour interval for automation
    uint256 public lastUpkeepTimestamp;
    uint256 public totalRewardsHarvested;

    // Events
    event VaultInit(
        address indexed stETH,
        address indexed rETH,
        address indexed sAVAX,
        uint256 stETHMaxDeposit,
        uint256 rETHMaxDeposit,
        uint256 sAVAXMaxDeposit
    );

    event Deposit(
        address indexed caller,
        address indexed owner,
        address indexed asset,
        uint256 assets,
        uint256 shares
    );

    event Withdraw(
        address indexed caller,
        address indexed receiver,
        address indexed owner,
        address asset,
        uint256 assets,
        uint256 shares
    );

    event YieldUpdated(
        address indexed asset,
        uint256 newYield,
        uint256 timestamp
    );

    event RebalanceSignal(
        address indexed fromAsset,
        address indexed toAsset,
        uint256 fromYield,
        uint256 toYield,
        uint256 yieldDelta
    );

    event UpkeepPerformed(
        uint256 timestamp,
        uint256 rewardsHarvested,
        bool rebalanceNeeded
    );

    event RewardsHarvested(
        address indexed asset,
        uint256 amount,
        uint256 timestamp
    );

    /**
     * @dev Constructor initializes the vault with supported LST tokens and max deposits
     * @param _stETH Address of stETH token
     * @param _rETH Address of rETH token  
     * @param _sAVAX Address of sAVAX token
     * @param _stETHMaxDeposit Maximum deposit limit for stETH
     * @param _rETHMaxDeposit Maximum deposit limit for rETH
     * @param _sAVAXMaxDeposit Maximum deposit limit for sAVAX
     * @param _predictionOracle Address of the PolyPredictionOracle
     */
    constructor(
        address _stETH,
        address _rETH,
        address _sAVAX,
        uint256 _stETHMaxDeposit,
        uint256 _rETHMaxDeposit,
        uint256 _sAVAXMaxDeposit,
        address _predictionOracle
    ) ERC20("PolyLiquid", "PLY") Ownable(msg.sender) {
        require(_stETH != address(0), "Invalid stETH address");
        require(_rETH != address(0), "Invalid rETH address");
        require(_sAVAX != address(0), "Invalid sAVAX address");
        require(_predictionOracle != address(0), "Invalid prediction oracle address");

        stETH = IERC20(_stETH);
        rETH = IERC20(_rETH);
        sAVAX = IERC20(_sAVAX);
        predictionOracle = PolyPredictionOracle(_predictionOracle);

        maxDeposit[_stETH] = _stETHMaxDeposit;
        maxDeposit[_rETH] = _rETHMaxDeposit;
        maxDeposit[_sAVAX] = _sAVAXMaxDeposit;

        // Initialize yield oracles (hardcoded for Sepolia/Fuji testnets)
        _initializeYieldOracles(_stETH, _rETH, _sAVAX);

        emit VaultInit(
            _stETH,
            _rETH,
            _sAVAX,
            _stETHMaxDeposit,
            _rETHMaxDeposit,
            _sAVAXMaxDeposit
        );
    }

    /**
     * @dev Deposit assets into the vault and mint shares
     * @param asset Address of the asset to deposit (must be stETH, rETH, or sAVAX)
     * @param assets Amount of assets to deposit
     * @param receiver Address to receive the minted shares
     * @return shares Amount of shares minted
     */
    function deposit(
        address asset,
        uint256 assets,
        address receiver
    ) external nonReentrant returns (uint256 shares) {
        require(receiver != address(0), "Invalid receiver");
        require(assets > 0, "Cannot deposit zero");
        require(_isSupportedAsset(asset), "Unsupported asset");
        require(
            totalAssetsPerToken[asset] + assets <= maxDeposit[asset],
            "Exceeds max deposit"
        );

        // Calculate shares to mint (1:1 ratio for simplicity)
        shares = assets;

        // Update internal accounting
        totalAssetsPerToken[asset] += assets;

        // Transfer assets from user
        IERC20(asset).safeTransferFrom(msg.sender, address(this), assets);

        // Mint shares to receiver
        _mint(receiver, shares);

        emit Deposit(msg.sender, receiver, asset, assets, shares);
    }

    /**
     * @dev Withdraw assets from the vault by burning shares
     * @param asset Address of the asset to withdraw
     * @param assets Amount of assets to withdraw
     * @param receiver Address to receive the assets
     * @param owner Address that owns the shares (for allowance check)
     * @return shares Amount of shares burned
     */
    function withdraw(
        address asset,
        uint256 assets,
        address receiver,
        address owner
    ) external nonReentrant returns (uint256 shares) {
        require(receiver != address(0), "Invalid receiver");
        require(assets > 0, "Cannot withdraw zero");
        require(_isSupportedAsset(asset), "Unsupported asset");
        require(totalAssetsPerToken[asset] >= assets, "Insufficient assets");

        // Calculate shares needed (1:1 ratio for simplicity)
        shares = assets;

        // Check allowance if not owner
        if (msg.sender != owner) {
            uint256 allowed = allowance(owner, msg.sender);
            require(allowed >= shares, "Insufficient allowance");
            if (allowed != type(uint256).max) {
                _approve(owner, msg.sender, allowed - shares);
            }
        }

        // Update internal accounting
        totalAssetsPerToken[asset] -= assets;

        // Burn shares from owner
        _burn(owner, shares);

        // Transfer assets to receiver
        IERC20(asset).safeTransfer(receiver, assets);

        emit Withdraw(msg.sender, receiver, owner, asset, assets, shares);
    }

    /**
     * @dev Preview how many shares would be minted for a deposit
     * @param asset Address of the asset
     * @param assets Amount of assets to deposit
     * @return shares Amount of shares that would be minted
     */
    function previewDeposit(address asset, uint256 assets) external view returns (uint256 shares) {
        require(_isSupportedAsset(asset), "Unsupported asset");
        return assets; // 1:1 ratio for simplicity
    }

    /**
     * @dev Preview how many shares would be needed for a withdrawal
     * @param asset Address of the asset
     * @param assets Amount of assets to withdraw
     * @return shares Amount of shares that would be burned
     */
    function previewWithdraw(address asset, uint256 assets) external view returns (uint256 shares) {
        require(_isSupportedAsset(asset), "Unsupported asset");
        return assets; // 1:1 ratio for simplicity
    }

    /**
     * @dev Get total assets across all supported tokens
     * @return total Combined total of all assets in the vault
     */
    function totalAssets() external view returns (uint256 total) {
        total = totalAssetsPerToken[address(stETH)] +
                totalAssetsPerToken[address(rETH)] +
                totalAssetsPerToken[address(sAVAX)];
    }

    /**
     * @dev Get total assets for a specific token
     * @param asset Address of the asset
     * @return assets Total amount of the specific asset in the vault
     */
    function totalAssetsPerAsset(address asset) external view returns (uint256 assets) {
        require(_isSupportedAsset(asset), "Unsupported asset");
        return totalAssetsPerToken[asset];
    }

    /**
     * @dev Update maximum deposit limit for a token (only owner)
     * @param asset Address of the asset
     * @param newMaxDeposit New maximum deposit limit
     */
    function setMaxDeposit(address asset, uint256 newMaxDeposit) external onlyOwner {
        require(_isSupportedAsset(asset), "Unsupported asset");
        maxDeposit[asset] = newMaxDeposit;
    }

    /**
     * @dev Check if an asset is supported by the vault
     * @param asset Address to check
     * @return supported True if the asset is supported
     */
    function _isSupportedAsset(address asset) internal view returns (bool supported) {
        return asset == address(stETH) || asset == address(rETH) || asset == address(sAVAX);
    }

    /**
     * @dev Get the list of supported assets
     * @return assets Array of supported asset addresses
     */
    function getSupportedAssets() external view returns (address[] memory assets) {
        assets = new address[](3);
        assets[0] = address(stETH);
        assets[1] = address(rETH);
        assets[2] = address(sAVAX);
    }

    /**
     * @dev Get asset yield from Chainlink Data Streams oracle
     * @param asset Address of the asset to get yield for
     * @return yield Current annual yield in basis points (1e18 = 100%)
     * @return timestamp When the yield was last updated
     */
    function getAssetYield(address asset) external nonReentrant returns (uint256 yield, uint256 timestamp) {
        require(_isSupportedAsset(asset), "Unsupported asset");
        
        AggregatorV3Interface oracle = yieldOracles[asset];
        require(address(oracle) != address(0), "Oracle not configured");

        try oracle.latestRoundData() returns (
            uint80 roundId,
            int256 price,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        ) {
            require(price > 0, "Invalid yield data");
            require(updatedAt > 0, "Invalid timestamp");
            
            // Convert price to yield (assuming oracle returns yield in basis points)
            yield = uint256(price);
            timestamp = updatedAt;
            
            // Update stored yield data
            latestYield[asset] = yield;
            lastYieldUpdate[asset] = timestamp;
            
            emit YieldUpdated(asset, yield, timestamp);
            
        } catch {
            // Fallback to stored data if oracle call fails
            yield = latestYield[asset];
            timestamp = lastYieldUpdate[asset];
            require(timestamp > 0, "No yield data available");
        }
    }

    /**
     * @dev Check if rebalancing is needed based on yield differences and market probability
     * Emits RebalanceSignal if yield delta > 15% AND market probability > 60%
     */
    function rebalanceIfNeeded() external {
        address[] memory assets = this.getSupportedAssets();
        
        // Update yield data from oracles first
        this.updateAllYieldData();
        
        // Get market probability from prediction oracle
        uint256 marketProbability = predictionOracle.getLatestProbability();
        
        // Only proceed if market probability exceeds threshold
        if (marketProbability < PROBABILITY_THRESHOLD) {
            return; // Market sentiment not favorable for rebalancing
        }
        
        // Compare yields between all asset pairs
        for (uint i = 0; i < assets.length; i++) {
            for (uint j = i + 1; j < assets.length; j++) {
                address assetA = assets[i];
                address assetB = assets[j];
                
                uint256 yieldA = latestYield[assetA];
                uint256 yieldB = latestYield[assetB];
                
                // Skip if either yield is not set
                if (yieldA == 0 || yieldB == 0) continue;
                
                // Calculate yield delta
                uint256 yieldDelta;
                address fromAsset;
                address toAsset;
                
                if (yieldA > yieldB) {
                    yieldDelta = yieldA - yieldB;
                    fromAsset = assetB; // Move from lower yield
                    toAsset = assetA;   // Move to higher yield
                } else {
                    yieldDelta = yieldB - yieldA;
                    fromAsset = assetA; // Move from lower yield
                    toAsset = assetB;   // Move to higher yield
                }
                
                // Emit signal if both yield and probability thresholds exceeded
                if (yieldDelta > REBALANCE_THRESHOLD) {
                    emit RebalanceSignal(
                        fromAsset,
                        toAsset,
                        latestYield[fromAsset],
                        latestYield[toAsset],
                        yieldDelta
                    );
                }
            }
        }
    }

    /**
     * @dev Update yield oracle address for an asset (only owner)
     * @param asset Address of the asset
     * @param oracle Address of the new yield oracle
     */
    function setYieldOracle(address asset, address oracle) external onlyOwner {
        require(_isSupportedAsset(asset), "Unsupported asset");
        yieldOracles[asset] = AggregatorV3Interface(oracle);
    }

    /**
     * @dev Update prediction oracle address (only owner)
     * @param _predictionOracle Address of the new prediction oracle
     */
    function setPredictionOracle(address _predictionOracle) external onlyOwner {
        require(_predictionOracle != address(0), "Invalid prediction oracle address");
        predictionOracle = PolyPredictionOracle(_predictionOracle);
    }

    /**
     * @dev Get current market probability from prediction oracle
     * @return probability Current probability (scaled by 1e18)
     */
    function getMarketProbability() external view returns (uint256 probability) {
        return predictionOracle.getLatestProbability();
    }

    /**
     * @dev Check if market conditions are favorable for rebalancing
     * @return favorable True if probability > 60%
     */
    function isMarketFavorableForRebalancing() external view returns (bool favorable) {
        uint256 probability = predictionOracle.getLatestProbability();
        return probability >= PROBABILITY_THRESHOLD;
    }

    /**
     * @dev Request new probability data from prediction oracle (anyone can call)
     * @return requestId The Chainlink Functions request ID
     */
    function requestProbabilityUpdate() external returns (bytes32 requestId) {
        return predictionOracle.requestProbability();
    }

    /**
     * @dev Get stored yield data for an asset
     * @param asset Address of the asset
     * @return yield Last stored yield
     * @return timestamp When it was last updated
     */
    function getStoredYield(address asset) external view returns (uint256 yield, uint256 timestamp) {
        require(_isSupportedAsset(asset), "Unsupported asset");
        return (latestYield[asset], lastYieldUpdate[asset]);
    }

    /**
     * @dev Update yield data for all supported assets from oracles
     * This should be called before rebalancing to ensure fresh yield data
     */
    function updateAllYieldData() external {
        address[] memory assets = this.getSupportedAssets();
        
        for (uint i = 0; i < assets.length; i++) {
            address asset = assets[i];
            AggregatorV3Interface oracle = yieldOracles[asset];
            
            if (address(oracle) != address(0)) {
                try oracle.latestRoundData() returns (
                    uint80,
                    int256 price,
                    uint256,
                    uint256 updatedAt,
                    uint80
                ) {
                    if (price > 0 && updatedAt > 0) {
                        latestYield[asset] = uint256(price);
                        lastYieldUpdate[asset] = updatedAt;
                        emit YieldUpdated(asset, uint256(price), updatedAt);
                    }
                } catch {
                    // Skip failed oracle calls
                }
            }
        }
    }

    /**
     * @dev Initialize yield oracles with hardcoded addresses for Sepolia/Fuji
     * @param _stETH stETH token address
     * @param _rETH rETH token address  
     * @param _sAVAX sAVAX token address
     */
    function _initializeYieldOracles(address _stETH, address _rETH, address _sAVAX) private {
        // Note: These are placeholder addresses for demonstration
        // In production, use actual Chainlink Data Streams oracle addresses
        
        // Sepolia testnet oracle addresses (placeholders)
        if (block.chainid == 11155111) { // Sepolia
            yieldOracles[_stETH] = AggregatorV3Interface(0x694AA1769357215DE4FAC081bf1f309aDC325306); // ETH/USD placeholder
            yieldOracles[_rETH] = AggregatorV3Interface(0x694AA1769357215DE4FAC081bf1f309aDC325306);  // Using same for demo
            yieldOracles[_sAVAX] = AggregatorV3Interface(0x694AA1769357215DE4FAC081bf1f309aDC325306); // Using same for demo
        }
        // Fuji testnet oracle addresses (placeholders)
        else if (block.chainid == 43113) { // Fuji
            yieldOracles[_stETH] = AggregatorV3Interface(0x86d67c3D38D2bCeE722E601025C25a575021c6EA); // AVAX/USD placeholder
            yieldOracles[_rETH] = AggregatorV3Interface(0x86d67c3D38D2bCeE722E601025C25a575021c6EA);  // Using same for demo
            yieldOracles[_sAVAX] = AggregatorV3Interface(0x86d67c3D38D2bCeE722E601025C25a575021c6EA); // Using same for demo
        }
        // For other networks, oracles remain unset (can be set via setYieldOracle)
    }

    /**
     * @dev Chainlink Automation checkUpkeep function
     * Called by Chainlink Automation to determine if upkeep is needed
     * Based on time interval (1 hour) as per requirements
     * @return upkeepNeeded Boolean indicating if performUpkeep should be called
     * @return performData Encoded data passed to performUpkeep (empty for time-based)
     */
    function checkUpkeep(bytes calldata /* checkData */) 
        external 
        view 
        override 
        returns (bool upkeepNeeded, bytes memory performData) 
    {
        // Check if enough time has passed since last upkeep
        upkeepNeeded = (block.timestamp - lastUpkeepTimestamp) >= UPKEEP_INTERVAL;
        
        // For time-based upkeep, we don't need to pass any data
        performData = "";
    }

    /**
     * @dev Chainlink Automation performUpkeep function
     * Called by Chainlink Automation when checkUpkeep returns true
     * Performs: (a) harvest LST rewards, (b) calls rebalanceIfNeeded
     */
    function performUpkeep(bytes calldata /* performData */) external override {
        // Verify that enough time has passed (protection against manual calls)
        require((block.timestamp - lastUpkeepTimestamp) >= UPKEEP_INTERVAL, "Upkeep not needed");
        
        // Update timestamp first to prevent reentrancy
        lastUpkeepTimestamp = block.timestamp;
        
        // (a) Harvest LST rewards
        uint256 totalHarvested = _harvestRewards();
        
        // (b) Check and signal rebalancing if needed
        // Store current yield data for comparison
        bool rebalanceNeeded = _checkAndSignalRebalance();
        
        // Update total rewards harvested
        totalRewardsHarvested += totalHarvested;
        
        // Emit upkeep event
        emit UpkeepPerformed(block.timestamp, totalHarvested, rebalanceNeeded);
    }

    /**
     * @dev Harvest rewards from LST tokens
     * This is a simplified implementation - in production would interact with actual reward mechanisms
     * @return totalHarvested Total amount of rewards harvested across all assets
     */
    function _harvestRewards() internal returns (uint256 totalHarvested) {
        address[] memory assets = this.getSupportedAssets();
        
        for (uint i = 0; i < assets.length; i++) {
            address asset = assets[i];
            uint256 assetBalance = totalAssetsPerToken[asset];
            
            if (assetBalance > 0) {
                // Simplified reward calculation: 0.01% per hour (annualized ~87.6%)
                // In production, this would call actual reward harvesting functions
                uint256 rewardAmount = (assetBalance * 1) / 10000; // 0.01%
                
                // Simulate reward harvesting by minting additional tokens to vault
                // In production, this would be actual reward token transfers
                if (rewardAmount > 0) {
                    totalHarvested += rewardAmount;
                    emit RewardsHarvested(asset, rewardAmount, block.timestamp);
                }
            }
        }
    }

    /**
     * @dev Check yields and signal rebalancing if needed with market probability consideration
     * @return rebalanceNeeded True if any rebalancing signals were emitted
     */
    function _checkAndSignalRebalance() internal returns (bool rebalanceNeeded) {
        address[] memory assets = this.getSupportedAssets();
        uint256 signalCount = 0;
        
        // Update yield data from oracles first
        this.updateAllYieldData();
        
        // Get market probability from prediction oracle
        uint256 marketProbability = predictionOracle.getLatestProbability();
        
        // Only proceed if market probability exceeds threshold
        if (marketProbability < PROBABILITY_THRESHOLD) {
            return false; // Market sentiment not favorable for rebalancing
        }
        
        // Compare yields between all asset pairs
        for (uint i = 0; i < assets.length; i++) {
            for (uint j = i + 1; j < assets.length; j++) {
                address assetA = assets[i];
                address assetB = assets[j];
                
                uint256 yieldA = latestYield[assetA];
                uint256 yieldB = latestYield[assetB];
                
                // Skip if either yield is not set
                if (yieldA == 0 || yieldB == 0) continue;
                
                // Calculate yield delta
                uint256 yieldDelta;
                address fromAsset;
                address toAsset;
                
                if (yieldA > yieldB) {
                    yieldDelta = yieldA - yieldB;
                    fromAsset = assetB;
                    toAsset = assetA;
                } else {
                    yieldDelta = yieldB - yieldA;
                    fromAsset = assetA;
                    toAsset = assetB;
                }
                
                // Emit signal if both yield and probability thresholds exceeded
                if (yieldDelta > REBALANCE_THRESHOLD) {
                    emit RebalanceSignal(
                        fromAsset,
                        toAsset,
                        latestYield[fromAsset],
                        latestYield[toAsset],
                        yieldDelta
                    );
                    signalCount++;
                }
            }
        }
        
        rebalanceNeeded = signalCount > 0;
    }

    /**
     * @dev Manual upkeep trigger for testing/emergency use (only owner)
     */
    function manualUpkeep() external onlyOwner {
        uint256 totalHarvested = _harvestRewards();
        bool rebalanceNeeded = _checkAndSignalRebalance();
        
        totalRewardsHarvested += totalHarvested;
        lastUpkeepTimestamp = block.timestamp;
        
        emit UpkeepPerformed(block.timestamp, totalHarvested, rebalanceNeeded);
    }

    /**
     * @dev Get upkeep status information
     * @return timeUntilNext Time in seconds until next upkeep is due
     * @return upkeepDue Whether upkeep is currently due
     * @return lastPerformed Timestamp of last upkeep
     * @return totalHarvested Total rewards harvested to date
     */
    function getUpkeepStatus() external view returns (
        uint256 timeUntilNext,
        bool upkeepDue,
        uint256 lastPerformed,
        uint256 totalHarvested
    ) {
        uint256 timeSinceLastUpkeep = block.timestamp - lastUpkeepTimestamp;
        
        if (timeSinceLastUpkeep >= UPKEEP_INTERVAL) {
            timeUntilNext = 0;
            upkeepDue = true;
        } else {
            timeUntilNext = UPKEEP_INTERVAL - timeSinceLastUpkeep;
            upkeepDue = false;
        }
        
        lastPerformed = lastUpkeepTimestamp;
        totalHarvested = totalRewardsHarvested;
    }
} 