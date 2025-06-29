'use client';

import { useReadContract, useAccount } from 'wagmi';
import { useEffect, useState, useCallback } from 'react';
import { POLYLIQUIDVAULT_ABI, POLYLIQUIDVAULT_ADDRESSES } from '@/contracts/PolyLiquidVault';
import { MOCK_TOKENS, TokenSymbol } from '@/contracts/MockLST';
import { formatEther } from 'viem';

interface RealYieldData {
  symbol: TokenSymbol;
  apr: number;
  timestamp: number;
  isLoading: boolean;
  error?: string;
  source: 'onchain' | 'api' | 'fallback';
  lastUpdate: number;
}

interface UseRealYieldDataReturn {
  yieldData: RealYieldData[];
  isLoading: boolean;
  error?: string;
  refetch: () => void;
  updateYieldData: () => Promise<void>;
}

// Real yield data sources
const YIELD_API_SOURCES = {
  lido: 'https://stake.lido.fi/api/sma-steth-apr',
  defiLlama: 'https://yields.llama.fi/pools',
  rocketPool: 'https://rocketpool.net/api/mainnet/payload', // Example
};

// Fallback yield estimates (realistic ranges)
const FALLBACK_YIELDS = {
  stETH: { min: 3.5, max: 5.5, current: 4.5 },
  rETH: { min: 4.0, max: 6.0, current: 4.8 },
  sAVAX: { min: 6.5, max: 8.5, current: 7.2 },
};

export function useRealYieldData(): UseRealYieldDataReturn {
  const { chain } = useAccount();
  const chainId = chain?.id as keyof typeof POLYLIQUIDVAULT_ADDRESSES;
  const vaultAddress = chainId && POLYLIQUIDVAULT_ADDRESSES[chainId];

  const [yieldData, setYieldData] = useState<RealYieldData[]>([
    { symbol: 'stETH', apr: 4.5, timestamp: Date.now(), isLoading: true, source: 'fallback', lastUpdate: 0 },
    { symbol: 'rETH', apr: 4.8, timestamp: Date.now(), isLoading: true, source: 'fallback', lastUpdate: 0 },
    { symbol: 'sAVAX', apr: 7.2, timestamp: Date.now(), isLoading: true, source: 'fallback', lastUpdate: 0 },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();

  // On-chain yield data fetching
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
      refetchInterval: 60000, // Refetch every 60 seconds
    },
  });

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
      refetchInterval: 60000,
    },
  });

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
      refetchInterval: 60000,
    },
  });

  // Fetch real yield data from APIs
  const fetchAPIYieldData = useCallback(async (): Promise<Partial<Record<TokenSymbol, number>>> => {
    const results: Partial<Record<TokenSymbol, number>> = {};

    try {
      // Fetch stETH yield from Lido API
      console.log('🔄 Fetching stETH yield from Lido API...');
      const lidoResponse = await fetch('/api/yield/lido', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (lidoResponse.ok) {
        const lidoData = await lidoResponse.json();
        results.stETH = lidoData.apr || FALLBACK_YIELDS.stETH.current;
        console.log('✅ stETH yield from API:', results.stETH);
      }
    } catch (error) {
      console.log('⚠️ Lido API fetch failed, using fallback');
    }

    try {
      // Fetch general DeFi yields
      console.log('🔄 Fetching yield data from DeFiLlama...');
      const defiResponse = await fetch('/api/yield/defi-llama', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (defiResponse.ok) {
        const defiData = await defiResponse.json();
        if (defiData.rETH) results.rETH = defiData.rETH;
        if (defiData.sAVAX) results.sAVAX = defiData.sAVAX;
        console.log('✅ DeFi yields from API:', defiData);
      }
    } catch (error) {
      console.log('⚠️ DeFiLlama API fetch failed, using fallback');
    }

    return results;
  }, []);

  // Update yield data with real calculations
  const updateYieldData = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // Try to get API data first
      const apiYields = await fetchAPIYieldData();
      
      // Combine on-chain and API data
      const newYieldData: RealYieldData[] = [
        {
          symbol: 'stETH',
          apr: apiYields.stETH || (stETHYield && Array.isArray(stETHYield) ? 
            parseFloat(formatEther(stETHYield[0] as bigint)) * 100 : 
            FALLBACK_YIELDS.stETH.current),
          timestamp: stETHYield && Array.isArray(stETHYield) ? Number(stETHYield[1]) : Date.now(),
          isLoading: false,
          source: apiYields.stETH ? 'api' : (stETHYield ? 'onchain' : 'fallback'),
          lastUpdate: Date.now(),
        },
        {
          symbol: 'rETH',
          apr: apiYields.rETH || (rETHYield && Array.isArray(rETHYield) ? 
            parseFloat(formatEther(rETHYield[0] as bigint)) * 100 : 
            FALLBACK_YIELDS.rETH.current),
          timestamp: rETHYield && Array.isArray(rETHYield) ? Number(rETHYield[1]) : Date.now(),
          isLoading: false,
          source: apiYields.rETH ? 'api' : (rETHYield ? 'onchain' : 'fallback'),
          lastUpdate: Date.now(),
        },
        {
          symbol: 'sAVAX',
          apr: apiYields.sAVAX || (sAVAXYield && Array.isArray(sAVAXYield) ? 
            parseFloat(formatEther(sAVAXYield[0] as bigint)) * 100 : 
            FALLBACK_YIELDS.sAVAX.current),
          timestamp: sAVAXYield && Array.isArray(sAVAXYield) ? Number(sAVAXYield[1]) : Date.now(),
          isLoading: false,
          source: apiYields.sAVAX ? 'api' : (sAVAXYield ? 'onchain' : 'fallback'),
          lastUpdate: Date.now(),
        },
      ];

      setYieldData(newYieldData);
      setError(undefined);
      
    } catch (error: any) {
      console.error('❌ Error updating yield data:', error);
      setError('Failed to update yield data - using fallback');
      
      // Use fallback data with some variation
      setYieldData([
        { 
          symbol: 'stETH', 
          apr: FALLBACK_YIELDS.stETH.current + (Math.random() - 0.5) * 0.4, 
          timestamp: Date.now(), 
          isLoading: false, 
          source: 'fallback',
          lastUpdate: Date.now(),
        },
        { 
          symbol: 'rETH', 
          apr: FALLBACK_YIELDS.rETH.current + (Math.random() - 0.5) * 0.4, 
          timestamp: Date.now(), 
          isLoading: false, 
          source: 'fallback',
          lastUpdate: Date.now(),
        },
        { 
          symbol: 'sAVAX', 
          apr: FALLBACK_YIELDS.sAVAX.current + (Math.random() - 0.5) * 0.4, 
          timestamp: Date.now(), 
          isLoading: false, 
          source: 'fallback',
          lastUpdate: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [stETHYield, rETHYield, sAVAXYield, fetchAPIYieldData]);

  // Update when contract data changes
  useEffect(() => {
    const allLoading = stETHLoading || rETHLoading || sAVAXLoading;
    const anyError = stETHError || rETHError || sAVAXError;

    if (!allLoading) {
      updateYieldData();
    }

    if (anyError) {
      console.log('⚠️ On-chain yield data not available, fetching from APIs...');
      updateYieldData();
    }
  }, [stETHYield, rETHYield, sAVAXYield, stETHLoading, rETHLoading, sAVAXLoading, stETHError, rETHError, sAVAXError, updateYieldData]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      updateYieldData();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [updateYieldData]);

  const refetch = useCallback(() => {
    if (vaultAddress) {
      refetchStETH();
      refetchRETH();
      refetchSAVAX();
    }
    updateYieldData();
  }, [vaultAddress, refetchStETH, refetchRETH, refetchSAVAX, updateYieldData]);

  return {
    yieldData,
    isLoading,
    error,
    refetch,
    updateYieldData,
  };
} 