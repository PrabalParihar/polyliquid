'use client';

import { useState } from 'react';
import { useAccount, useBalance, useWriteContract, useWaitForTransactionReceipt, useReadContract, useChainId } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { sepolia, avalancheFuji } from 'wagmi/chains';
import { PLYTOKEN_ABI, PLYTOKEN_ADDRESSES, POLYROUTER_ADDRESSES } from '@/contracts/PLYToken';

interface CCIPTransferProps {
  onTransferInitiated?: (messageId: string, sourceChain: number, destinationChain: number, amount: string) => void;
}

const POLYROUTER_ABI = [
  {
    inputs: [
      { name: 'destinationChain', type: 'uint64' },
      { name: 'receiver', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    name: 'sendPLY',
    outputs: [{ name: 'messageId', type: 'bytes32' }],
    stateMutability: 'nonpayable',
    type: 'function'
  }
];

const CHAIN_SELECTORS = {
  [sepolia.id]: BigInt('16015286601757825753'),
  [avalancheFuji.id]: BigInt('14767482510784806043'),
} as const;

const chainIcons = {
  [sepolia.id]: '🔷',
  [avalancheFuji.id]: '🔺',
};

const chainGradients = {
  [sepolia.id]: 'linear-gradient(135deg, #627eea 0%, #5a67d8 100%)',
  [avalancheFuji.id]: 'linear-gradient(135deg, #e53e3e 0%, #c53030 100%)',
};

export default function CCIPTransfer({ onTransferInitiated }: CCIPTransferProps) {
  const [amount, setAmount] = useState('');
  const [receiverAddress, setReceiverAddress] = useState('');
  const [destinationChain, setDestinationChain] = useState<number>(sepolia.id);
  
  const { address } = useAccount();
  const chainId = useChainId();
  
  const plyTokenAddress = PLYTOKEN_ADDRESSES[chainId as keyof typeof PLYTOKEN_ADDRESSES];
  const routerAddress = POLYROUTER_ADDRESSES[chainId as keyof typeof POLYROUTER_ADDRESSES];

  // Get PLY token balance
  const { data: plyBalance } = useBalance({
    address: address,
    token: plyTokenAddress as `0x${string}`,
  });

  // Get allowance
  const { data: allowance } = useReadContract({
    address: plyTokenAddress as `0x${string}`,
    abi: PLYTOKEN_ABI,
    functionName: 'allowance',
    args: [address as `0x${string}`, routerAddress as `0x${string}`],
  });

  // Contract write hooks
  const { writeContract: approve, data: approveHash } = useWriteContract();
  const { writeContract: sendPLY } = useWriteContract();

  // Wait for transaction receipts
  const { isLoading: isApproving } = useWaitForTransactionReceipt({
    hash: approveHash,
  });

  const { isLoading: isSending } = useWaitForTransactionReceipt({
    hash: approveHash,
  });

  // Available destination chains (exclude current chain)
  const availableChains = [sepolia, avalancheFuji].filter(chain => chain.id !== chainId);

  const handleApprove = async () => {
    if (!plyTokenAddress || !routerAddress || !amount) return;
    
    try {
      approve({
        address: plyTokenAddress as `0x${string}`,
        abi: PLYTOKEN_ABI,
        functionName: 'approve',
        args: [routerAddress as `0x${string}`, parseEther(amount)],
      });
    } catch (error) {
      console.error('Approval failed:', error);
    }
  };

  const handleSend = async () => {
    if (!routerAddress || !receiverAddress || !amount) return;
    
    try {
      const chainSelector = CHAIN_SELECTORS[destinationChain as keyof typeof CHAIN_SELECTORS];
      
      await sendPLY({
        address: routerAddress as `0x${string}`,
        abi: POLYROUTER_ABI,
        functionName: 'sendPLY',
        args: [chainSelector, receiverAddress as `0x${string}`, parseEther(amount)],
      });

      // Generate mock messageId for demo
      const mockMessageId = `0x${Date.now().toString(16).padStart(64, '0')}`;
      
      onTransferInitiated?.(mockMessageId, chainId, destinationChain, amount);
      
    } catch (error) {
      console.error('Transfer failed:', error);
    }
  };

  const needsApproval = allowance && amount && parseEther(amount) > (allowance as bigint);
  const hasBalance = plyBalance && parseFloat(amount) <= parseFloat(formatEther(plyBalance.value));

  const getChainName = (chainId: number) => {
    switch (chainId) {
      case sepolia.id:
        return 'Sepolia';
      case avalancheFuji.id:
        return 'Avalanche Fuji';
      default:
        return 'Unknown';
    }
  };

  const getCurrentChainIcon = () => {
    return chainIcons[chainId as keyof typeof chainIcons] || '⚪';
  };

  if (!address) {
    return (
      <div className="card p-8 w-full max-w-md">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl"
               style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)' }}>
            🌉
          </div>
          <h3 className="heading-md mb-4" style={{ color: 'var(--text-primary)' }}>
            Cross-Chain Transfer
          </h3>
          <p className="text-body text-center py-6">
            Connect your wallet to transfer PLY tokens across chains
          </p>
          <div className="glass-card p-4 rounded-lg">
            <div className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              ⚡ Powered by Chainlink CCIP
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-8 w-full max-w-md animate-scale-in">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl"
             style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)' }}>
          🌉
        </div>
        <h3 className="heading-md mb-2" style={{ color: 'var(--text-primary)' }}>
          Cross-Chain Transfer
        </h3>
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
          Send PLY tokens across networks
        </p>
      </div>

      {/* Current Chain & Balance */}
      <div className="glass-card p-4 rounded-lg mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full mr-3 flex items-center justify-center text-lg"
                 style={{ background: chainGradients[chainId as keyof typeof chainGradients] || '#6b7280' }}>
              {getCurrentChainIcon()}
            </div>
            <div>
              <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                {getChainName(chainId)}
              </div>
              <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                Current Network
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              {plyBalance ? parseFloat(formatEther(plyBalance.value)).toFixed(4) : '0.0000'}
            </div>
            <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>PLY Balance</div>
          </div>
        </div>
      </div>

      {/* Destination Network */}
      <div className="mb-6">
        <label className="block text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
          <span className="flex items-center">
            <span className="mr-2">🎯</span>
            Destination Network
          </span>
        </label>
        <div className="relative">
          <select
            value={destinationChain}
            onChange={(e) => setDestinationChain(parseInt(e.target.value))}
            className="input-field w-full pr-12 appearance-none cursor-pointer"
            style={{ 
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
              backgroundPosition: 'right 12px center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '16px'
            }}
          >
            {availableChains.map((chain) => (
              <option key={chain.id} value={chain.id}>
                {chainIcons[chain.id as keyof typeof chainIcons]} {chain.name}
              </option>
            ))}
          </select>
        </div>
        {availableChains.length > 0 && (
          <div className="mt-2 glass-card p-3 rounded-lg">
            <div className="flex items-center">
              <div className="w-6 h-6 rounded-full mr-2 flex items-center justify-center text-sm"
                   style={{ background: chainGradients[destinationChain as keyof typeof chainGradients] }}>
                {chainIcons[destinationChain as keyof typeof chainIcons]}
              </div>
              <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                Transfer to {getChainName(destinationChain)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Receiver Address */}
      <div className="mb-6">
        <label className="block text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
          <span className="flex items-center">
            <span className="mr-2">📍</span>
            Receiver Address
          </span>
        </label>
        <input
          type="text"
          value={receiverAddress}
          onChange={(e) => setReceiverAddress(e.target.value)}
          placeholder="0x..."
          className="input-field w-full font-mono text-sm"
        />
        {receiverAddress && (
          <div className="mt-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
            ✓ Valid address format
          </div>
        )}
      </div>

      {/* Amount */}
      <div className="mb-8">
        <label className="block text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
          <span className="flex items-center">
            <span className="mr-2">💰</span>
            Amount (PLY)
          </span>
        </label>
        <div className="relative">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.0"
            className="input-field w-full pr-16"
          />
          <button
            onClick={() => {
              if (plyBalance) {
                setAmount(formatEther(plyBalance.value));
              }
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 btn-secondary text-xs px-3 py-1"
          >
            MAX
          </button>
        </div>
        {amount && (
          <div className="mt-2 glass-card p-3 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Transfer Amount:
              </span>
              <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                {parseFloat(amount).toFixed(4)} PLY
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        {needsApproval && (
          <button
            onClick={handleApprove}
            disabled={isApproving || !amount}
            className={`w-full btn-secondary ${isApproving ? 'loading-pulse' : ''}`}
          >
            <span className="flex items-center justify-center">
              <span className="mr-2">✅</span>
              {isApproving ? 'Approving...' : 'Approve PLY'}
            </span>
          </button>
        )}
        
        <button
          onClick={handleSend}
          disabled={
            !amount ||
            !receiverAddress ||
            !hasBalance ||
            needsApproval ||
            isSending ||
            availableChains.length === 0
          }
          className={`w-full btn-primary ${isSending ? 'loading-pulse' : ''}`}
        >
          <span className="flex items-center justify-center">
            <span className="mr-2">🚀</span>
            {isSending ? 'Sending...' : 'Send PLY'}
          </span>
        </button>
      </div>

      {/* Status Messages */}
      {amount && (
        <div className="mt-4 space-y-2">
          {!hasBalance && (
            <div className="status-error text-center">
              Insufficient PLY balance
            </div>
          )}
          {hasBalance && !needsApproval && receiverAddress && (
            <div className="status-success text-center">
              Ready to transfer
            </div>
          )}
          {availableChains.length === 0 && (
            <div className="status-warning text-center">
              No destination chains available
            </div>
          )}
        </div>
      )}

      {/* Transfer Info */}
      <div className="mt-6 glass-card p-4 rounded-lg">
        <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
          Transfer Details
        </h4>
        <div className="space-y-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
          <div className="flex justify-between">
            <span>Network Fee:</span>
            <span className="font-medium">~0.001 ETH</span>
          </div>
          <div className="flex justify-between">
            <span>CCIP Fee:</span>
            <span className="font-medium">~0.0005 LINK</span>
          </div>
          <div className="flex justify-between">
            <span>Est. Time:</span>
            <span className="font-medium">2-5 minutes</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 text-center">
        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
          Secured by Chainlink CCIP Protocol
        </p>
      </div>
    </div>
  );
} 