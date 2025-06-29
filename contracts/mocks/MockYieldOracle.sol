// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

/**
 * @title MockYieldOracle
 * @dev Mock yield oracle for testing PolyLiquidVault yield functionality
 * Simulates Chainlink Data Streams behavior for staking yields
 */
contract MockYieldOracle is AggregatorV3Interface {
    uint8 public constant override decimals = 18;
    string public constant override description = "Mock Yield Oracle";
    uint256 public constant override version = 1;
    
    mapping(address => int256) private yields;
    int256 private currentYield; // Single yield value for this oracle instance
    uint256 private _updatedAt;
    uint80 private _roundId;

    constructor() {
        _updatedAt = block.timestamp;
        _roundId = 1;
        currentYield = 0.05e18; // Default 5% yield
    }

    /**
     * @dev Set the yield for a specific asset (for testing) - also sets current yield
     * @param asset The asset address
     * @param newYield New yield value (1e18 = 100%)
     */
    function setPrice(address asset, uint256 newYield) external {
        yields[asset] = int256(newYield);
        currentYield = int256(newYield); // Also set as current yield for latestRoundData
        _updatedAt = block.timestamp;
        _roundId++;
    }

    /**
     * @dev Update the yield value for an asset (for testing)
     * @param asset The asset address
     * @param newYield New yield value
     */
    function updateYield(address asset, int256 newYield) external {
        yields[asset] = newYield;
        currentYield = newYield; // Also set as current yield
        _updatedAt = block.timestamp;
        _roundId++;
    }

    /**
     * @dev Set the current yield directly (for testing)
     * @param newYield New yield value
     */
    function setYield(int256 newYield) external {
        currentYield = newYield;
        _updatedAt = block.timestamp;
        _roundId++;
    }

    /**
     * @dev Get the yield for a specific asset
     * @param asset The asset address
     * @return The current yield for the asset
     */
    function getYield(address asset) external view returns (int256) {
        return yields[asset];
    }

    /**
     * @dev Get the latest round data (uses current yield)
     * @return roundId The round ID
     * @return answer The yield in basis points (1e18 = 100%)
     * @return startedAt When the round started
     * @return updatedAt When the round was updated
     * @return answeredInRound The round ID in which the answer was computed
     */
    function latestRoundData()
        external
        view
        override
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        return (
            _roundId,
            currentYield, // Use current yield
            _updatedAt,
            _updatedAt,
            _roundId
        );
    }

    /**
     * @dev Get the latest round data for a specific asset
     * @param asset The asset address
     * @return roundId The round ID
     * @return answer The yield for the asset
     * @return startedAt When the round started
     * @return updatedAt When the round was updated
     * @return answeredInRound The round ID in which the answer was computed
     */
    function latestRoundDataForAsset(address asset)
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        return (
            _roundId,
            yields[asset],
            _updatedAt,
            _updatedAt,
            _roundId
        );
    }

    /**
     * @dev Get data from a specific round
     * @param _roundId The round ID to get data for
     * @return roundId The round ID
     * @return answer The yield in basis points
     * @return startedAt When the round started
     * @return updatedAt When the round was updated
     * @return answeredInRound The round ID in which the answer was computed
     */
    function getRoundData(uint80 _roundId)
        external
        view
        override
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        require(_roundId <= _roundId, "Round not found");
        return (
            _roundId,
            yields[address(0)], // Default yield
            _updatedAt,
            _updatedAt,
            _roundId
        );
    }

    /**
     * @dev Simulate different yield scenarios for testing
     * @param asset The asset address
     * @param scenario Yield scenario: 0=low, 1=medium, 2=high
     */
    function setYieldScenario(address asset, uint256 scenario) external {
        if (scenario == 0) {
            yields[asset] = 0.03e18; // 3% APY
        } else if (scenario == 1) {
            yields[asset] = 0.05e18; // 5% APY
        } else if (scenario == 2) {
            yields[asset] = 0.08e18; // 8% APY
        } else {
            revert("Invalid scenario");
        }
        _updatedAt = block.timestamp;
        _roundId++;
    }

    /**
     * @dev Get current yield for an asset
     * @param asset The asset address
     * @return Current yield value for the asset
     */
    function getCurrentYield(address asset) external view returns (int256) {
        return yields[asset];
    }
} 