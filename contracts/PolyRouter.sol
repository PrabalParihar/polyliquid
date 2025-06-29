// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PolyRouter
 * @dev Cross-chain router for PLY token transfers using lock-and-mint pattern
 * Simplified implementation that can be extended with full CCIP integration
 * Locks PLY on source chain, signals for minting on destination chain
 */
contract PolyRouter is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Custom errors for gas efficient reverts
    error DestinationChainNotSupported(uint64 destinationChainSelector);
    error InsufficientBalance(uint256 available, uint256 required);
    error InvalidReceiver();
    error InvalidAmount();
    error MessageNotFound(bytes32 messageId);

    // Events
    event TokensLocked(
        bytes32 indexed messageId,
        uint64 indexed destinationChain,
        address indexed sender,
        address receiver,
        uint256 amount,
        uint256 timestamp
    );

    event TokensMinted(
        bytes32 indexed messageId,
        uint64 indexed sourceChain,
        address indexed receiver,
        uint256 amount,
        uint256 timestamp
    );

    event CrossChainMessageSent(
        bytes32 indexed messageId,
        uint64 indexed destinationChain,
        address sender,
        address receiver,
        uint256 amount
    );

    event FailedMessageRetried(
        bytes32 indexed messageId,
        address indexed receiver,
        uint256 amount
    );

    // PLY token contract
    IERC20 public immutable plyToken;

    // Supported chain selectors
    uint64 public constant SEPOLIA_CHAIN_SELECTOR = 16015286601757825753;
    uint64 public constant FUJI_CHAIN_SELECTOR = 14767482510784806043;

    // Cross-chain message tracking
    struct CrossChainMessage {
        uint64 sourceChain;
        uint64 destinationChain;
        address sender;
        address receiver;
        uint256 amount;
        uint256 timestamp;
        bool processed;
    }

    mapping(bytes32 => CrossChainMessage) public messages;
    mapping(uint64 => bool) public supportedChains;
    mapping(uint64 => address) public chainRouters; // Router addresses on other chains
    
    // Failed message recovery
    mapping(bytes32 => bool) public failedMessages;

    // Locked tokens for cross-chain transfers
    uint256 public totalLockedTokens;

    modifier onlySupportedChain(uint64 chainSelector) {
        if (!supportedChains[chainSelector]) {
            revert DestinationChainNotSupported(chainSelector);
        }
        _;
    }

    modifier validReceiver(address receiver) {
        if (receiver == address(0)) revert InvalidReceiver();
        _;
    }

    modifier validAmount(uint256 amount) {
        if (amount == 0) revert InvalidAmount();
        _;
    }

    constructor(address _plyToken, address _owner) Ownable(_owner) {
        plyToken = IERC20(_plyToken);
        
        // Initialize supported chains
        supportedChains[SEPOLIA_CHAIN_SELECTOR] = true;
        supportedChains[FUJI_CHAIN_SELECTOR] = true;
    }

    /**
     * @notice Send PLY tokens to another chain
     * @dev Locks tokens and creates a cross-chain message
     * @param destinationChain The target chain selector
     * @param receiver The recipient address on destination chain
     * @param amount The amount of PLY tokens to transfer
     * @return messageId The unique identifier for this cross-chain transfer
     */
    function sendPLY(
        uint64 destinationChain,
        address receiver,
        uint256 amount
    )
        external
        nonReentrant
        onlySupportedChain(destinationChain)
        validReceiver(receiver)
        validAmount(amount)
        returns (bytes32 messageId)
    {
        // Check user has sufficient PLY balance
        uint256 userBalance = plyToken.balanceOf(msg.sender);
        if (userBalance < amount) {
            revert InsufficientBalance(userBalance, amount);
        }

        // Generate unique message ID
        messageId = keccak256(
            abi.encodePacked(
                block.chainid,
                destinationChain,
                msg.sender,
                receiver,
                amount,
                block.timestamp,
                block.number
            )
        );

        // Lock PLY tokens from sender
        plyToken.safeTransferFrom(msg.sender, address(this), amount);
        totalLockedTokens += amount;

        // Store cross-chain message
        messages[messageId] = CrossChainMessage({
            sourceChain: uint64(block.chainid),
            destinationChain: destinationChain,
            sender: msg.sender,
            receiver: receiver,
            amount: amount,
            timestamp: block.timestamp,
            processed: false
        });

        // Emit events
        emit TokensLocked(
            messageId,
            destinationChain,
            msg.sender,
            receiver,
            amount,
            block.timestamp
        );

        emit CrossChainMessageSent(
            messageId,
            destinationChain,
            msg.sender,
            receiver,
            amount
        );

        return messageId;
    }

    /**
     * @notice Process an incoming cross-chain message (simulated)
     * @dev In production, this would be called by CCIP infrastructure
     * @param messageId The cross-chain message identifier
     * @param sourceChain The source chain selector
     * @param receiver The recipient address
     * @param amount The amount to mint/release
     */
    function processIncomingMessage(
        bytes32 messageId,
        uint64 sourceChain,
        address receiver,
        uint256 amount
    )
        external
        onlyOwner
        onlySupportedChain(sourceChain)
        validReceiver(receiver)
        validAmount(amount)
    {
        // Verify message hasn't been processed
        require(!messages[messageId].processed, "Message already processed");

        // For lock-and-mint: release tokens from contract balance
        // In production, this would mint new tokens or release from reserves
        require(plyToken.balanceOf(address(this)) >= amount, "Insufficient contract balance");

        // Transfer tokens to receiver
        plyToken.safeTransfer(receiver, amount);

        // Mark message as processed
        messages[messageId].processed = true;

        // If this was a locked message, reduce locked count
        if (messages[messageId].amount > 0) {
            totalLockedTokens -= amount;
        }

        emit TokensMinted(
            messageId,
            sourceChain,
            receiver,
            amount,
            block.timestamp
        );
    }

    /**
     * @notice Retry a failed cross-chain message
     * @dev Owner can manually process failed messages
     * @param messageId The failed message identifier
     * @param newReceiver Alternative receiver address
     */
    function retryFailedMessage(
        bytes32 messageId,
        address newReceiver
    )
        external
        onlyOwner
        validReceiver(newReceiver)
    {
        require(failedMessages[messageId], "Message not failed");
        
        CrossChainMessage storage message = messages[messageId];
        require(!message.processed, "Message already processed");

        // Release tokens to new receiver
        plyToken.safeTransfer(newReceiver, message.amount);
        
        // Mark as processed
        message.processed = true;
        failedMessages[messageId] = false;
        
        if (message.amount > 0) {
            totalLockedTokens -= message.amount;
        }

        emit FailedMessageRetried(messageId, newReceiver, message.amount);
    }

    /**
     * @notice Mark a message as failed for manual recovery
     * @dev Only owner can mark messages as failed
     * @param messageId The message to mark as failed
     */
    function markMessageFailed(bytes32 messageId) external onlyOwner {
        require(messages[messageId].timestamp > 0, "Message does not exist");
        require(!messages[messageId].processed, "Message already processed");
        
        failedMessages[messageId] = true;
    }

    /**
     * @notice Set router address for a specific chain
     * @dev Used for coordinating cross-chain operations
     * @param chainSelector The chain selector
     * @param routerAddress The router contract address on that chain
     */
    function setChainRouter(
        uint64 chainSelector,
        address routerAddress
    ) external onlyOwner {
        chainRouters[chainSelector] = routerAddress;
    }

    /**
     * @notice Enable or disable a chain for cross-chain transfers
     * @param chainSelector The chain selector
     * @param enabled Whether the chain is supported
     */
    function setSupportedChain(
        uint64 chainSelector,
        bool enabled
    ) external onlyOwner {
        supportedChains[chainSelector] = enabled;
    }

    /**
     * @notice Emergency withdrawal of PLY tokens (only owner)
     * @param amount Amount to withdraw
     * @param recipient Address to send tokens to
     */
    function emergencyWithdraw(
        uint256 amount,
        address recipient
    ) external onlyOwner validReceiver(recipient) {
        require(amount <= plyToken.balanceOf(address(this)), "Insufficient balance");
        plyToken.safeTransfer(recipient, amount);
    }

    /**
     * @notice Fund the contract with PLY tokens for minting operations
     * @param amount Amount of PLY tokens to fund
     */
    function fundContract(uint256 amount) external validAmount(amount) {
        plyToken.safeTransferFrom(msg.sender, address(this), amount);
    }

    /**
     * @notice Get message details
     * @param messageId The message identifier
     * @return The cross-chain message struct
     */
    function getMessage(bytes32 messageId) external view returns (CrossChainMessage memory) {
        return messages[messageId];
    }

    /**
     * @notice Check if a chain is supported
     * @param chainSelector The chain selector to check
     * @return Whether the chain is supported
     */
    function isChainSupported(uint64 chainSelector) external view returns (bool) {
        return supportedChains[chainSelector];
    }

    /**
     * @notice Get contract PLY balance available for operations
     * @return Available PLY balance minus locked tokens
     */
    function getAvailableBalance() external view returns (uint256) {
        uint256 totalBalance = plyToken.balanceOf(address(this));
        return totalBalance > totalLockedTokens ? totalBalance - totalLockedTokens : 0;
    }

    /**
     * @notice Get total locked tokens amount
     * @return Total amount of locked PLY tokens
     */
    function getLockedTokens() external view returns (uint256) {
        return totalLockedTokens;
    }
} 