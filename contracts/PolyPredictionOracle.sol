// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {FunctionsClient} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/FunctionsClient.sol";
import {FunctionsRequest} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/libraries/FunctionsRequest.sol";

/**
 * @title PolyPredictionOracle
 * @notice Chainlink Functions consumer that fetches market probabilities from Polymarket
 * @dev Returns probability that asset X out-yields asset Y (scaled by 1e18)
 */
contract PolyPredictionOracle is FunctionsClient {
    using FunctionsRequest for FunctionsRequest.Request;

    // State variables
    bytes32 public s_lastRequestId;
    bytes public s_lastResponse;
    bytes public s_lastError;
    uint256 public latestProbability; // Stored as 1e18 scaled value (0-1e18)
    uint256 public lastUpdated;
    
    // Chainlink Functions configuration
    bytes32 private donID;
    uint64 private subscriptionId;
    uint32 private gasLimit;
    string private tokenId;
    
    // Events
    event Response(
        bytes32 indexed requestId,
        uint256 probability,
        bytes response,
        bytes err
    );
    event ProbabilityUpdated(uint256 newProbability, uint256 timestamp);
    event RequestSent(bytes32 indexed requestId, string tokenId);
    
    // Errors
    error UnexpectedRequestID(bytes32 requestId);
    error EmptyResponse();
    error OnlyOwner();
    
    // Access control
    address public owner;
    
    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }

    // JavaScript source code for Chainlink Functions (CORRECTED API format)
    string private source = 
        "const tokenId = args[0];"
        ""
        "// Get both BUY and SELL prices using POST /prices endpoint"
        "const apiResponse = await Functions.makeHttpRequest({"
        "  url: 'https://clob.polymarket.com/prices',"
        "  method: 'POST',"
        "  headers: {"
        "    'Content-Type': 'application/json'"
        "  },"
        "  data: {"
        "    params: ["
        "      { token_id: tokenId, side: 'BUY' },"
        "      { token_id: tokenId, side: 'SELL' }"
        "    ]"
        "  }"
        "});"
        ""
        "if (apiResponse.error) {"
        "  throw Error('API request failed: ' + apiResponse.error);"
        "}"
        ""
        "const { data } = apiResponse;"
        "if (!data || !data[tokenId]) {"
        "  throw Error('Invalid response: missing token data');"
        "}"
        ""
        "const buyPrice = parseFloat(data[tokenId].BUY || 0);"
        "const sellPrice = parseFloat(data[tokenId].SELL || 0);"
        ""
        "if (buyPrice === 0 || sellPrice === 0) {"
        "  throw Error('Invalid price data: zero prices');"
        "}"
        ""
        "const midpoint = (buyPrice + sellPrice) / 2;"
        "const scaledProbability = Math.floor(midpoint * 1e18);"
        "return Functions.encodeUint256(scaledProbability);";

    /**
     * @notice Initialize the contract with the Chainlink Functions router
     * @param router The Functions router contract address
     */
    constructor(address router) FunctionsClient(router) {
        owner = msg.sender;
        
        // Sepolia testnet configuration
        donID = 0x66756e2d657468657265756d2d7365706f6c69612d3100000000000000000000;
        gasLimit = 300000;
        tokenId = "71321045679252212594626385532706912750332728571942532289631379312455583992563"; // Default token ID
    }

    /**
     * @notice Set the Functions subscription configuration
     * @param _subscriptionId The subscription ID for Chainlink Functions
     * @param _donID The DON ID for the network
     * @param _gasLimit Gas limit for the Functions request
     */
    function setFunctionsConfig(
        uint64 _subscriptionId,
        bytes32 _donID,
        uint32 _gasLimit
    ) external onlyOwner {
        subscriptionId = _subscriptionId;
        donID = _donID;
        gasLimit = _gasLimit;
    }

    /**
     * @notice Set the Polymarket token ID to query
     * @param _tokenId The token ID string
     */
    function setTokenId(string calldata _tokenId) external onlyOwner {
        tokenId = _tokenId;
    }

    /**
     * @notice Send a request to fetch market probability from Polymarket
     * @return requestId The ID of the request
     */
    function requestProbability() external returns (bytes32 requestId) {
        // Build the Functions request
        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(source);
        
        // Set the token ID as argument
        string[] memory args = new string[](1);
        args[0] = tokenId;
        req.setArgs(args);

        // Send the request and store the request ID
        s_lastRequestId = _sendRequest(
            req.encodeCBOR(),
            subscriptionId,
            gasLimit,
            donID
        );

        emit RequestSent(s_lastRequestId, tokenId);
        return s_lastRequestId;
    }

    /**
     * @notice Callback function for fulfilling a request
     * @param requestId The ID of the request to fulfill
     * @param response The HTTP response data
     * @param err Any errors from the Functions request
     */
    function fulfillRequest(
        bytes32 requestId,
        bytes memory response,
        bytes memory err
    ) internal override {
        if (s_lastRequestId != requestId) {
            revert UnexpectedRequestID(requestId);
        }

        // Update the contract's state variables with the response and any errors
        s_lastResponse = response;
        s_lastError = err;

        if (response.length == 0) {
            emit Response(requestId, 0, response, err);
            return;
        }

        // Decode the response to get the probability
        uint256 newProbability = abi.decode(response, (uint256));
        
        // Update state
        latestProbability = newProbability;
        lastUpdated = block.timestamp;

        // Emit events
        emit Response(requestId, newProbability, response, err);
        emit ProbabilityUpdated(newProbability, block.timestamp);
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
     * @notice Emergency function to manually set probability (owner only)
     * @param _probability The probability to set (scaled by 1e18)
     */
    function emergencySetProbability(uint256 _probability) external onlyOwner {
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
} 