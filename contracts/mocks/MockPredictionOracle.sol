// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title MockPredictionOracle
 * @notice Mock prediction oracle for testing vault rebalancing logic
 * @dev Simulates the PolyPredictionOracle interface without Chainlink Functions
 */
contract MockPredictionOracle {
    uint256 public latestProbability; // Stored as 1e18 scaled value (0-1e18)
    uint256 public lastUpdated;
    bytes32 public s_lastRequestId;
    
    // Events
    event ProbabilityUpdated(uint256 newProbability, uint256 timestamp);
    event RequestSent(bytes32 indexed requestId, string tokenId);
    
    // Access control
    address public owner;
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
        latestProbability = 0.5e18; // Start at 50%
        lastUpdated = block.timestamp;
    }

    /**
     * @notice Simulate requesting probability from Polymarket
     * @return requestId Mock request ID
     */
    function requestProbability() external returns (bytes32 requestId) {
        // Generate a pseudo-random request ID
        requestId = keccak256(abi.encodePacked(block.timestamp, msg.sender));
        s_lastRequestId = requestId;
        
        emit RequestSent(requestId, "71321045679252212594626385532706912750332728571942532289631379312455583992563");
        return requestId;
    }

    /**
     * @notice Get the latest probability (scaled by 1e18)
     * @return The latest probability where 1e18 = 100%
     */
    function getLatestProbability() external view returns (uint256) {
        return latestProbability;
    }

    /**
     * @notice Get probability as percentage (0-100)
     * @return Probability as percentage
     */
    function getProbabilityPercent() external view returns (uint256) {
        return (latestProbability * 100) / 1e18;
    }

    /**
     * @notice Check if the probability data is stale
     * @param maxAge Maximum age in seconds
     * @return Whether the data is stale
     */
    function isStale(uint256 maxAge) external view returns (bool) {
        return block.timestamp - lastUpdated > maxAge;
    }

    /**
     * @notice Get the age of the latest probability data
     * @return Age in seconds
     */
    function getDataAge() external view returns (uint256) {
        return block.timestamp - lastUpdated;
    }

    /**
     * @notice Set probability manually for testing (anyone can call for testing)
     * @param _probability The probability to set (scaled by 1e18)
     */
    function emergencySetProbability(uint256 _probability) external {
        require(_probability <= 1e18, "Probability cannot exceed 100%");
        latestProbability = _probability;
        lastUpdated = block.timestamp;
        emit ProbabilityUpdated(_probability, block.timestamp);
    }

    /**
     * @notice Set multiple probability values for testing scenarios
     * @param _probability The probability to set
     */
    function setProbability(uint256 _probability) external {
        require(_probability <= 1e18, "Probability cannot exceed 100%");
        latestProbability = _probability;
        lastUpdated = block.timestamp;
        emit ProbabilityUpdated(_probability, block.timestamp);
    }

    /**
     * @notice Simulate fulfilling a request with new probability data
     * @param _probability New probability value
     */
    function fulfillRequest(uint256 _probability) external {
        require(_probability <= 1e18, "Probability cannot exceed 100%");
        
        latestProbability = _probability;
        lastUpdated = block.timestamp;
        
        emit ProbabilityUpdated(_probability, block.timestamp);
    }

    /**
     * @notice Transfer ownership of the contract
     * @param newOwner The new owner address
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        owner = newOwner;
    }

    /**
     * @notice Get contract owner
     */
    function getOwner() external view returns (address) {
        return owner;
    }
} 