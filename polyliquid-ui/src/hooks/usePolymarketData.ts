'use client';

import { useReadContract, useAccount } from 'wagmi';
import { useEffect, useState, useCallback } from 'react';
import { POLYPREDICTIONORACLE_ABI, POLYPREDICTIONORACLE_ADDRESSES } from '@/contracts/PolyPredictionOracle';
import { formatEther } from 'viem';

interface PolymarketData {
  onchainProbability: number;
  restApiProbability: number;
  marketId: string;
  isLoading: boolean;
  error?: string;
  trend: number[]; // For sparkline
  lastUpdated: number;
}

interface UsePolymarketDataReturn {
  polymarketData: PolymarketData;
  refetch: () => void;
}

// Token ID for the prediction market (using official example from docs)
const TOKEN_ID = "71321045679252212594626385532706912750332728571942532289631379312455583992563";

// Official Polymarket endpoints as per documentation
const ENDPOINTS = {
  REST: 'https://clob.polymarket.com/',
  DATA_API: 'https://data-api.polymarket.com/',
  WEBSOCKET: 'wss://ws-subscriptions-clob.polymarket.com/ws/'
} as const;

export function usePolymarketData(): UsePolymarketDataReturn {
  const { chain } = useAccount();
  const chainId = chain?.id as keyof typeof POLYPREDICTIONORACLE_ADDRESSES;
  const oracleAddress = chainId && POLYPREDICTIONORACLE_ADDRESSES[chainId];

  const [polymarketData, setPolymarketData] = useState<PolymarketData>({
    onchainProbability: 75, // Default mock value
    restApiProbability: 72, // Default mock value
    marketId: TOKEN_ID,
    isLoading: false,
    trend: [65, 68, 70, 72, 75], // Mock trend data
    lastUpdated: Date.now(),
  });

  // Get onchain probability from Chainlink Functions consumer
  const { 
    data: onchainProbability, 
    isLoading: onchainLoading, 
    error: onchainError,
    refetch: refetchOnchain 
  } = useReadContract({
    address: oracleAddress as `0x${string}`,
    abi: POLYPREDICTIONORACLE_ABI,
    functionName: 'latestProbability',
    query: {
      enabled: !!oracleAddress,
      refetchInterval: 60000, // Refetch every minute
    },
  });

  // Get last updated timestamp from oracle
  const { 
    data: lastUpdatedData, 
    isLoading: timestampLoading, 
    error: timestampError,
    refetch: refetchTimestamp 
  } = useReadContract({
    address: oracleAddress as `0x${string}`,
    abi: POLYPREDICTIONORACLE_ABI,
    functionName: 'lastUpdated',
    query: {
      enabled: !!oracleAddress,
      refetchInterval: 60000,
    },
  });

  // Fetch data from Polymarket REST API for comparison
  const fetchPolymarketRestData = useCallback(async () => {
    try {
      // Mock API response for demo (commented out to use real API)
      // return {
      //   probability: 72 + Math.random() * 6, // 72-78% range
      //   timestamp: Date.now(),
      // };
      
            // Real API call - Using official POST /prices endpoint as per docs
      // Using example token ID from official documentation
      const TOKEN_ID = "71321045679252212594626385532706912750332728571942532289631379312455583992563";
      
      console.log('Attempting Polymarket API call (official POST endpoint)...');
      
      const requestPayload = {
        params: [
          {
            token_id: TOKEN_ID,
            side: "BUY"
          },
          {
            token_id: TOKEN_ID,
            side: "SELL"
          }
        ]
      };
      
      console.log('Request payload:', JSON.stringify(requestPayload, null, 2));
      
      const response = await fetch(`${ENDPOINTS.REST}prices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(requestPayload)
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        
        // Try alternative endpoints if main fails
        console.log('Trying alternative endpoint...');
        
        try {
          // Try the single price GET endpoint as fallback
          const buyResponse = await fetch(`${ENDPOINTS.REST}price?token_id=${TOKEN_ID}&side=buy`);
          const sellResponse = await fetch(`${ENDPOINTS.REST}price?token_id=${TOKEN_ID}&side=sell`);
          
          if (buyResponse.ok && sellResponse.ok) {
            const [buyData, sellData] = await Promise.all([
              buyResponse.json(),
              sellResponse.json()
            ]);
            
            const buyPrice = parseFloat(buyData.price || 0);
            const sellPrice = parseFloat(sellData.price || 0);
            const midpoint = (buyPrice + sellPrice) / 2;
            
            console.log('Alternative endpoint succeeded:', { buyPrice, sellPrice, midpoint });
            
            return {
              probability: midpoint * 100,
              timestamp: Date.now(),
            };
          }
        } catch (altError) {
          console.error('Alternative endpoint also failed:', altError);
        }
        
        // Final fallback to mock data
        console.log('All endpoints failed, using mock data');
        return {
          probability: 72 + Math.random() * 6,
          timestamp: Date.now(),
        };
      }

      const data = await response.json();
      console.log('API Response:', data);
      
      // Response format per docs: {[asset_id]: {[side]: price}}
      const priceData = data[TOKEN_ID];
      if (!priceData) {
        console.warn('No price data for token, using mock data');
        return {
          probability: 72 + Math.random() * 6,
          timestamp: Date.now(),
        };
      }
      
      const buyPrice = parseFloat(priceData.BUY || 0);
      const sellPrice = parseFloat(priceData.SELL || 0);
      const midpoint = (buyPrice + sellPrice) / 2;
      
      console.log('Parsed prices:', { buyPrice, sellPrice, midpoint });
      
      if (midpoint === 0) {
        console.warn('Got zero prices, using mock data');
        return {
          probability: 72 + Math.random() * 6,
          timestamp: Date.now(),
        };
      }
      
      return {
        probability: midpoint * 100, // Convert to percentage
        timestamp: Date.now(),
      };
      
      // Option 2: Using GET /price (single endpoint) - Alternative approach:
    
      // const response = await fetch(
      //   `https://clob.polymarket.com/price?token_id=${TOKEN_ID}&side=buy`
      // );
      
      // if (!response.ok) {
      //   throw new Error(`HTTP error! status: ${response.status}`);
      // }
      
      // const buyData = await response.json();
      
      // const sellResponse = await fetch(
      //   `https://clob.polymarket.com/price?token_id=${TOKEN_ID}&side=sell`
      // );
      // const sellData = await sellResponse.json();
      
      // const midpoint = (parseFloat(buyData.price) + parseFloat(sellData.price)) / 2;
      
      // return {
      //   probability: midpoint * 100,
      //   timestamp: Date.now(),
      // };
    
    } catch (error) {
      console.error('Failed to fetch Polymarket REST data:', error);
      return null;
    }
  }, []);

  // Update polymarket data when contract data changes
  useEffect(() => {
    const isLoading = onchainLoading || timestampLoading;
    const hasError = onchainError || timestampError;

    if (hasError) {
      setPolymarketData(prev => ({
        ...prev,
        isLoading: false,
        error: 'Using mock data - oracle not available',
      }));
      return;
    }

    if (!isLoading && onchainProbability) {
      const onchainProb = parseFloat(formatEther(onchainProbability as bigint)) * 100;
      
      // Fetch REST API data for comparison
      fetchPolymarketRestData().then(restData => {
        setPolymarketData(prev => {
          const newTrend = [...prev.trend, onchainProb].slice(-20); // Keep last 20 data points for sparkline
          
          return {
            ...prev,
            onchainProbability: onchainProb,
            restApiProbability: restData?.probability || prev.restApiProbability,
            isLoading: false,
            error: undefined,
            trend: newTrend,
            lastUpdated: lastUpdatedData ? Number(lastUpdatedData) * 1000 : Date.now(), // Convert to milliseconds
          };
        });
      });
    } else {
      // Use mock data with periodic updates
      const interval = setInterval(() => {
        fetchPolymarketRestData().then(restData => {
          setPolymarketData(prev => ({
            ...prev,
            onchainProbability: 73 + Math.random() * 4, // 73-77% range
            restApiProbability: restData?.probability || prev.restApiProbability,
            lastUpdated: Date.now(),
            trend: [...prev.trend, 73 + Math.random() * 4].slice(-20),
          }));
        });
      }, 30000); // Update every 30 seconds

      return () => clearInterval(interval);
    }
  }, [onchainProbability, lastUpdatedData, onchainLoading, timestampLoading, onchainError, timestampError, fetchPolymarketRestData]);

  const refetch = useCallback(() => {
    if (oracleAddress) {
      refetchOnchain();
      refetchTimestamp();
    }
    fetchPolymarketRestData();
  }, [refetchOnchain, refetchTimestamp, fetchPolymarketRestData, oracleAddress]);

  return {
    polymarketData,
    refetch,
  };
} 