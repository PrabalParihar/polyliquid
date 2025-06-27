'use client';

import { useReadContract, useAccount } from 'wagmi';
import { useEffect, useState } from 'react';
import { POLYLIQUIDVAULT_ABI, POLYLIQUIDVAULT_ADDRESSES } from '@/contracts/PolyLiquidVault';
import { MOCK_TOKENS, TokenSymbol } from '@/contracts/MockLST';
import { formatEther } from 'viem';

interface YieldData {
  symbol: TokenSymbol;
  apr: number;
  timestamp: number;
  isLoading: boolean;
  error?: string;
}

interface UseYieldDataReturn {
  yieldData: YieldData[];
  isLoading: boolean;
  error?: string;
  refetch: () => void;
}

export function useYieldData(): UseYieldDataReturn {
  const { chain } = useAccount();
  const chainId = chain?.id as keyof typeof POLYLIQUIDVAULT_ADDRESSES;
  const vaultAddress = chainId && POLYLIQUIDVAULT_ADDRESSES[chainId];

  const [yieldData, setYieldData] = useState<YieldData[]>([
    { symbol: 'stETH', apr: 4.5, timestamp: Date.now(), isLoading: false },
    { symbol: 'rETH', apr: 4.8, timestamp: Date.now(), isLoading: false },
    { symbol: 'sAVAX', apr: 7.2, timestamp: Date.now(), isLoading: false },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();

  // Get stETH yield data
  const { 
    data: stETHYield, 
    isLoading: stETHLoading, 
    error: stETHError,
    refetch: refetchStETH 
  } = useReadContract({
    address: vaultAddress as `0x${string}`,
    abi: POLYLIQUIDVAULT_ABI,
    functionName: 'getAssetYield',
    args: chainId && MOCK_TOKENS[chainId] ? [MOCK_TOKENS[chainId].stETH as `0x${string}`] : undefined,
    query: {
      enabled: !!vaultAddress && !!chainId,
      refetchInterval: 30000, // Refetch every 30 seconds for live data
    },
  });

  // Get rETH yield data
  const { 
    data: rETHYield, 
    isLoading: rETHLoading, 
    error: rETHError,
    refetch: refetchRETH 
  } = useReadContract({
    address: vaultAddress as `0x${string}`,
    abi: POLYLIQUIDVAULT_ABI,
    functionName: 'getAssetYield',
    args: chainId && MOCK_TOKENS[chainId] ? [MOCK_TOKENS[chainId].rETH as `0x${string}`] : undefined,
    query: {
      enabled: !!vaultAddress && !!chainId,
      refetchInterval: 30000,
    },
  });

  // Get sAVAX yield data
  const { 
    data: sAVAXYield, 
    isLoading: sAVAXLoading, 
    error: sAVAXError,
    refetch: refetchSAVAX 
  } = useReadContract({
    address: vaultAddress as `0x${string}`,
    abi: POLYLIQUIDVAULT_ABI,
    functionName: 'getAssetYield',
    args: chainId && MOCK_TOKENS[chainId] ? [MOCK_TOKENS[chainId].sAVAX as `0x${string}`] : undefined,
    query: {
      enabled: !!vaultAddress && !!chainId,
      refetchInterval: 30000,
    },
  });

  useEffect(() => {
    const allLoading = stETHLoading || rETHLoading || sAVAXLoading;
    const anyError = stETHError || rETHError || sAVAXError;

    setIsLoading(allLoading);
    
    if (anyError) {
      setError('Using mock data - vault not available');
      // Continue with mock data
      const interval = setInterval(() => {
        setYieldData([
          { symbol: 'stETH', apr: 4.3 + Math.random() * 0.4, timestamp: Date.now(), isLoading: false },
          { symbol: 'rETH', apr: 4.6 + Math.random() * 0.4, timestamp: Date.now(), isLoading: false },
          { symbol: 'sAVAX', apr: 7.0 + Math.random() * 0.4, timestamp: Date.now(), isLoading: false },
        ]);
      }, 30000);
      
      return () => clearInterval(interval);
    }

    if (!allLoading) {
      const newYieldData: YieldData[] = [
        {
          symbol: 'stETH',
          apr: stETHYield && Array.isArray(stETHYield) ? parseFloat(formatEther(stETHYield[0] as bigint)) * 100 : 4.5,
          timestamp: stETHYield && Array.isArray(stETHYield) ? Number(stETHYield[1]) : Date.now(),
          isLoading: false,
        },
        {
          symbol: 'rETH',
          apr: rETHYield && Array.isArray(rETHYield) ? parseFloat(formatEther(rETHYield[0] as bigint)) * 100 : 4.8,
          timestamp: rETHYield && Array.isArray(rETHYield) ? Number(rETHYield[1]) : Date.now(),
          isLoading: false,
        },
        {
          symbol: 'sAVAX',
          apr: sAVAXYield && Array.isArray(sAVAXYield) ? parseFloat(formatEther(sAVAXYield[0] as bigint)) * 100 : 7.2,
          timestamp: sAVAXYield && Array.isArray(sAVAXYield) ? Number(sAVAXYield[1]) : Date.now(),
          isLoading: false,
        },
      ];

      setYieldData(newYieldData);
      setError(undefined);
    }
  }, [stETHYield, rETHYield, sAVAXYield, stETHLoading, rETHLoading, sAVAXLoading, stETHError, rETHError, sAVAXError]);

  const refetch = () => {
    if (vaultAddress) {
      refetchStETH();
      refetchRETH();
      refetchSAVAX();
    }
  };

  return {
    yieldData,
    isLoading,
    error,
    refetch,
  };
} 