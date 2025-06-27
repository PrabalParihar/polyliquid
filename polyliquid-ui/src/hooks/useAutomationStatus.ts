import { useState, useEffect, useCallback } from 'react';
import { useChainId } from 'wagmi';

export interface AutomationStatus {
  lastPerformedBlockNumber: number | null;
  lastPerformedTime: number | null;
  upkeepId: string | null;
  isActive: boolean;
  balance: string | null;
  performedCount: number;
  isLoading: boolean;
  error: string | null;
}

/* 
ALTERNATIVE IMPLEMENTATION FOR REAL DATA:
If you want to fetch real automation data, create a backend API endpoint:

// Backend endpoint (e.g., /api/automation-status)
export async function fetchRealAutomationData(chainId: number, targetContract: string) {
  const endpoint = 'https://api.thegraph.com/subgraphs/name/chainlink/automation-sepolia'; // Example
  if (!endpoint) throw new Error('Unsupported chain');

  const query = `
    query GetUpkeeps($target: String!) {
      upkeeps(where: { target: $target }) {
        id
        registry {
          id
        }
        target
        admin
        balance
        minBalance
        executeGas
        maxValidBlocknumber
        lastPerformBlockNumber
        amountSpent
        paused
        offchainConfig
        performedTransactions(first: 10, orderBy: blockNumber, orderDirection: desc) {
          id
          blockNumber
          blockTimestamp
          transactionHash
        }
      }
    }
  `;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables: { target: targetContract.toLowerCase() },
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data;
}

// Then in your frontend, call your backend:
const response = await fetch('/api/automation-status', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ chainId, targetContract }),
});
*/

// Mock data for demonstration (since we don't have real upkeep IDs)
const mockAutomationData = {
  lastPerformedBlockNumber: 5234567,
  lastPerformedTime: Date.now() - 3600000, // 1 hour ago
  upkeepId: '0x123456789abcdef123456789abcdef123456789abcdef123456789abcdef12',
  isActive: true,
  balance: '10.5',
  performedCount: 24,
  isLoading: false,
  error: null,
};

export function useAutomationStatus(targetContract?: string, useRealData = false) {
  const chainId = useChainId();
  const [status, setStatus] = useState<AutomationStatus>({
    lastPerformedBlockNumber: null,
    lastPerformedTime: null,
    upkeepId: null,
    isActive: false,
    balance: null,
    performedCount: 0,
    isLoading: true,
    error: null,
  });

  const fetchRealAutomationStatus = useCallback(async () => {
    if (!targetContract) return;

    try {
      const response = await fetch('/api/automation-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chainId,
          targetContract,
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      setStatus({
        ...data,
        isLoading: false,
      });

    } catch (error) {
      console.error('Error fetching real automation status:', error);
      setStatus(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch automation status',
      }));
    }
  }, [chainId, targetContract]);

  const fetchMockAutomationStatus = useCallback(async () => {
    // For demo purposes, always use mock data to avoid CORS/network issues
    // In production, replace this with a call to your backend API
    setTimeout(() => {
      setStatus({
        ...mockAutomationData,
        lastPerformedTime: Date.now() - Math.random() * 7200000, // Random time within last 2 hours
        lastPerformedBlockNumber: 5234567 + Math.floor(Math.random() * 1000), // Random recent block
        performedCount: 24 + Math.floor(Math.random() * 10), // Random count 24-34
        error: null,
      });
    }, 1000);
  }, []);

  const fetchAutomationStatus = useCallback(async () => {
    if (!targetContract) {
      setStatus(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      setStatus(prev => ({ ...prev, isLoading: true, error: null }));

      if (useRealData) {
        await fetchRealAutomationStatus();
      } else {
        await fetchMockAutomationStatus();
      }

    } catch (error) {
      console.error('Error fetching automation status:', error);
      
      // Fallback to mock data on error
      setStatus({
        ...mockAutomationData,
        lastPerformedTime: Date.now() - Math.random() * 7200000,
        lastPerformedBlockNumber: 5234567 + Math.floor(Math.random() * 1000),
        error: 'Using demo data - implement backend proxy for real data',
      });
    }
  }, [targetContract, useRealData, fetchRealAutomationStatus, fetchMockAutomationStatus]);

  useEffect(() => {
    fetchAutomationStatus();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchAutomationStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchAutomationStatus]);

  const timeAgo = status.lastPerformedTime ? 
    Math.floor((Date.now() - status.lastPerformedTime) / 1000) : null;

  const formatTimeAgo = (seconds: number | null) => {
    if (!seconds) return 'Never';
    
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const getHealthStatus = () => {
    if (!status.isActive) return 'inactive';
    if (!timeAgo) return 'unknown';
    
    // Healthy if last performed within 2 hours
    if (timeAgo < 7200) return 'healthy';
    // Warning if within 6 hours
    if (timeAgo < 21600) return 'warning';
    // Critical if over 6 hours
    return 'critical';
  };

  return {
    ...status,
    timeAgo,
    formattedTimeAgo: formatTimeAgo(timeAgo),
    healthStatus: getHealthStatus(),
    refresh: fetchAutomationStatus,
  };
} 