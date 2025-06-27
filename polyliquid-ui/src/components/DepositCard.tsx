'use client';

import { useState } from 'react';
import { useAccount, useBalance, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { POLYLIQUIDVAULT_ABI, POLYLIQUIDVAULT_ADDRESSES } from '@/contracts/PolyLiquidVault';
import { MOCKLST_ABI, MOCK_TOKENS, TokenSymbol } from '@/contracts/MockLST';

interface DepositCardProps {
  tokenSymbol: TokenSymbol;
}

const tokenIcons = {
  stETH: '🔥',
  rETH: '🚀',
  sAVAX: '❄️'
};

const tokenGradients = {
  stETH: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
  rETH: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
  sAVAX: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
};

export function DepositCard({ tokenSymbol }: DepositCardProps) {
  const [amount, setAmount] = useState('');
  const [isDepositing, setIsDepositing] = useState(true);
  
  const { address, chain } = useAccount();
  const chainId = chain?.id as keyof typeof MOCK_TOKENS;
  
  const tokenAddress = chainId && MOCK_TOKENS[chainId]?.[tokenSymbol];
  const vaultAddress = chainId && POLYLIQUIDVAULT_ADDRESSES[chainId];

  // Get token balance
  const { data: tokenBalance } = useBalance({
    address: address,
    token: tokenAddress as `0x${string}`,
  });

  // Get vault shares balance
  const { data: vaultBalance } = useBalance({
    address: address,
    token: vaultAddress as `0x${string}`,
  });

  // Get allowance
  const { data: allowance } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: MOCKLST_ABI,
    functionName: 'allowance',
    args: [address as `0x${string}`, vaultAddress as `0x${string}`],
  });

  // Contract write hooks
  const { writeContract: approve, data: approveHash } = useWriteContract();
  const { writeContract: deposit, data: depositHash } = useWriteContract();
  const { writeContract: withdraw, data: withdrawHash } = useWriteContract();

  // Wait for transaction receipts
  const { isLoading: isApproving } = useWaitForTransactionReceipt({
    hash: approveHash,
  });

  const { isLoading: isDepositPending } = useWaitForTransactionReceipt({
    hash: depositHash,
  });

  const { isLoading: isWithdrawPending } = useWaitForTransactionReceipt({
    hash: withdrawHash,
  });

  const handleApprove = async () => {
    if (!tokenAddress || !vaultAddress) return;
    
    try {
      // Approve maximum amount so user only needs to approve once
      const maxAmount = '115792089237316195423570985008687907853269984665640564039457584007913129639935'; // MaxUint256
      approve({
        address: tokenAddress as `0x${string}`,
        abi: MOCKLST_ABI,
        functionName: 'approve',
        args: [vaultAddress as `0x${string}`, BigInt(maxAmount)],
      });
    } catch (error) {
      console.error('Approval failed:', error);
    }
  };

  const handleDeposit = async () => {
    if (!vaultAddress || !tokenAddress || !address || !amount) return;
    
    try {
      deposit({
        address: vaultAddress as `0x${string}`,
        abi: POLYLIQUIDVAULT_ABI,
        functionName: 'deposit',
        args: [tokenAddress as `0x${string}`, parseEther(amount), address],
      });
    } catch (error) {
      console.error('Deposit failed:', error);
    }
  };

  const handleWithdraw = async () => {
    if (!vaultAddress || !tokenAddress || !address || !amount) return;
    
    try {
      withdraw({
        address: vaultAddress as `0x${string}`,
        abi: POLYLIQUIDVAULT_ABI,
        functionName: 'withdraw',
        args: [tokenAddress as `0x${string}`, parseEther(amount), address, address],
      });
    } catch (error) {
      console.error('Withdrawal failed:', error);
    }
  };

  const needsApproval = amount && (!allowance || parseEther(amount) > (allowance as bigint));
  const hasBalance = tokenBalance && parseFloat(amount) <= parseFloat(formatEther(tokenBalance.value));
  const hasVaultBalance = vaultBalance && parseFloat(amount) <= parseFloat(formatEther(vaultBalance.value));

  if (!address) {
    return (
      <div className="card p-8 w-full max-w-md">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl"
               style={{ background: tokenGradients[tokenSymbol] }}>
            {tokenIcons[tokenSymbol]}
          </div>
          <h3 className="heading-md mb-4" style={{ color: 'var(--text-primary)' }}>
            {tokenSymbol} Vault
          </h3>
          <p className="text-body text-center py-6">
            Connect your wallet to start earning yields
          </p>
          <div className="glass-card p-4 rounded-lg">
            <div className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              Current APR: 
              <span className="ml-2 text-lg font-bold bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent">
                4.2%
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!chainId || !tokenAddress || !vaultAddress) {
    return (
      <div className="card p-8 w-full max-w-md">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl"
               style={{ background: tokenGradients[tokenSymbol] }}>
            {tokenIcons[tokenSymbol]}
          </div>
          <h3 className="heading-md mb-4" style={{ color: 'var(--text-primary)' }}>
            {tokenSymbol} Vault
          </h3>
          <div className="status-warning text-center py-6">
            Unsupported network - please switch chains
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-8 w-full max-w-md">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl"
             style={{ background: tokenGradients[tokenSymbol] }}>
          {tokenIcons[tokenSymbol]}
        </div>
        <h3 className="heading-md mb-2" style={{ color: 'var(--text-primary)' }}>
          {tokenSymbol} Vault
        </h3>
        <div className="glass-card p-3 rounded-lg inline-block">
          <div className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            APR: 
            <span className="ml-2 text-lg font-bold bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent">
              4.2%
            </span>
          </div>
        </div>
      </div>
      
      {/* Toggle between Deposit and Withdraw */}
      <div className="flex glass-card rounded-lg p-1 mb-6">
        <button
          onClick={() => setIsDepositing(true)}
          className={`flex-1 py-3 px-4 rounded-md font-medium transition-all duration-200 ${
            isDepositing
              ? 'btn-primary text-white'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Deposit
        </button>
        <button
          onClick={() => setIsDepositing(false)}
          className={`flex-1 py-3 px-4 rounded-md font-medium transition-all duration-200 ${
            !isDepositing
              ? 'btn-primary text-white'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Withdraw
        </button>
      </div>

      {/* Balance Display */}
      <div className="glass-card p-4 rounded-lg mb-6">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              Wallet Balance:
            </span>
            <div className="text-right">
              <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                {tokenBalance ? parseFloat(formatEther(tokenBalance.value)).toFixed(4) : '0.0000'}
              </div>
              <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{tokenSymbol}</div>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              Vault Shares:
            </span>
            <div className="text-right">
              <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                {vaultBalance ? parseFloat(formatEther(vaultBalance.value)).toFixed(4) : '0.0000'}
              </div>
              <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>PLY</div>
            </div>
          </div>
        </div>
      </div>

      {/* Amount Input */}
      <div className="mb-6">
        <label className="block text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
          Amount
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
              if (isDepositing && tokenBalance) {
                setAmount(formatEther(tokenBalance.value));
              } else if (!isDepositing && vaultBalance) {
                setAmount(formatEther(vaultBalance.value));
              }
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 btn-secondary text-xs px-3 py-1"
          >
            MAX
          </button>
        </div>
      </div>

      {/* Action Button */}
      <div className="space-y-3">
        {isDepositing && needsApproval && (
          <button
            onClick={handleApprove}
            disabled={isApproving || !amount}
            className={`w-full btn-secondary ${
              isApproving ? 'loading-pulse' : ''
            }`}
          >
            {isApproving ? 'Approving...' : `Approve ${tokenSymbol}`}
          </button>
        )}
        
        <button
          onClick={isDepositing ? handleDeposit : handleWithdraw}
          disabled={
            !amount ||
            (isDepositing && (!hasBalance || needsApproval)) ||
            (!isDepositing && !hasVaultBalance) ||
            isDepositPending ||
            isWithdrawPending
          }
          className={`w-full btn-primary ${
            (isDepositPending || isWithdrawPending) ? 'loading-pulse' : ''
          }`}
        >
          {isDepositPending || isWithdrawPending
            ? `${isDepositing ? 'Depositing' : 'Withdrawing'}...`
            : isDepositing
            ? 'Deposit'
            : 'Withdraw'
          }
        </button>
      </div>

      {/* Status Messages */}
      {amount && (
        <div className="mt-4 space-y-2">
          {isDepositing && !hasBalance && (
            <div className="status-error text-center">
              Insufficient {tokenSymbol} balance
            </div>
          )}
          {!isDepositing && !hasVaultBalance && (
            <div className="status-error text-center">
              Insufficient vault shares
            </div>
          )}
          {isDepositing && hasBalance && !needsApproval && (
            <div className="status-success text-center">
              Ready to deposit
            </div>
          )}
        </div>
      )}

      {/* Transaction Hashes */}
      {(approveHash || depositHash || withdrawHash) && (
        <div className="mt-4 glass-card p-3 rounded-lg">
          <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            Transaction:
            <a
              href={`https://etherscan.io/tx/${approveHash || depositHash || withdrawHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 text-blue-500 hover:text-blue-700 font-mono break-all"
            >
              {`${(approveHash || depositHash || withdrawHash)?.slice(0, 10)}...`}
            </a>
          </div>
        </div>
      )}
    </div>
  );
} 