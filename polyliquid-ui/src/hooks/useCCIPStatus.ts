import { useState, useEffect, useCallback } from 'react';

export type CCIPStatus = 'PENDING' | 'IN_PROGRESS' | 'SUCCESS' | 'FAILED' | 'NOT_FOUND';

export interface CCIPMessage {
  messageId: string;
  sourceChain: string;
  destinationChain: string;
  status: CCIPStatus;
  sourceChainSelector?: string;
  destinationChainSelector?: string;
  timestamp?: number;
}

const CHAIN_SELECTORS = {
  sepolia: '16015286601757825753',
  fuji: '14767482510784806043'
} as const;

const CHAIN_NAMES = {
  '11155111': 'sepolia',
  '43113': 'fuji'
} as const;

// Simulated CCIP status check (replace with actual API call in production)
async function checkCCIPStatus(
  messageId: string, 
  sourceChain: string, // eslint-disable-line @typescript-eslint/no-unused-vars
  destinationChain: string // eslint-disable-line @typescript-eslint/no-unused-vars
): Promise<CCIPStatus> {
  try {
    // Simulate API call to CCIP Explorer
    // In production, this would be: 
    // const response = await fetch(`https://ccip.chain.link/api/message/${messageId}`);
    
    // For demo purposes, simulate status progression
    const now = Date.now();
    const messageAge = (now - parseInt(messageId.slice(-8), 16)) / 1000; // Rough age estimate
    
    if (messageAge < 30) return 'PENDING';
    if (messageAge < 120) return 'IN_PROGRESS';
    if (messageAge < 300) return 'SUCCESS';
    
    return 'SUCCESS'; // Most messages succeed eventually
    
  } catch (error) {
    console.error('Error checking CCIP status:', error);
    return 'FAILED';
  }
}

export function useCCIPStatus(messageId: string | null, sourceChainId?: number, destinationChainId?: number) {
  const [status, setStatus] = useState<CCIPStatus>('NOT_FOUND');
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);

  const sourceChainName = sourceChainId && sourceChainId in CHAIN_NAMES ? CHAIN_NAMES[sourceChainId as unknown as keyof typeof CHAIN_NAMES] : undefined;
  const destinationChainName = destinationChainId && destinationChainId in CHAIN_NAMES ? CHAIN_NAMES[destinationChainId as unknown as keyof typeof CHAIN_NAMES] : undefined;

  const checkStatus = useCallback(async () => {
    if (!messageId || !sourceChainName || !destinationChainName) return;

    try {
      setError(null);
      const newStatus = await checkCCIPStatus(messageId, sourceChainName, destinationChainName);
      setStatus(newStatus);
      setAttempts(prev => prev + 1);

      // Stop polling if we reach final state
      if (newStatus === 'SUCCESS' || newStatus === 'FAILED') {
        setIsPolling(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setStatus('FAILED');
    }
  }, [messageId, sourceChainName, destinationChainName]);

  const startPolling = useCallback(() => {
    if (!messageId) return;
    setIsPolling(true);
    setAttempts(0);
    setStatus('PENDING');
  }, [messageId]);

  const stopPolling = useCallback(() => {
    setIsPolling(false);
  }, []);

  // Start polling when messageId is provided
  useEffect(() => {
    if (messageId && sourceChainName && destinationChainName) {
      startPolling();
    }
  }, [messageId, sourceChainName, destinationChainName, startPolling]);

  // Polling effect
  useEffect(() => {
    if (!isPolling) return;

    const interval = setInterval(checkStatus, 5000); // Poll every 5 seconds
    
    // Check immediately
    checkStatus();

    return () => clearInterval(interval);
  }, [isPolling, checkStatus]);

  // Stop polling after 5 minutes (60 attempts)
  useEffect(() => {
    if (attempts >= 60) {
      setIsPolling(false);
      if (status === 'PENDING' || status === 'IN_PROGRESS') {
        setStatus('FAILED');
        setError('Timeout: Message not confirmed within 5 minutes');
      }
    }
  }, [attempts, status]);

  const message: CCIPMessage | null = messageId ? {
    messageId,
    sourceChain: sourceChainName || 'unknown',
    destinationChain: destinationChainName || 'unknown',
    status,
    sourceChainSelector: sourceChainId && sourceChainId in CHAIN_NAMES ? CHAIN_SELECTORS[CHAIN_NAMES[sourceChainId as unknown as keyof typeof CHAIN_NAMES]] : undefined,
    destinationChainSelector: destinationChainId && destinationChainId in CHAIN_NAMES ? CHAIN_SELECTORS[CHAIN_NAMES[destinationChainId as unknown as keyof typeof CHAIN_NAMES]] : undefined,
    timestamp: Date.now()
  } : null;

  return {
    message,
    status,
    isPolling,
    error,
    attempts,
    startPolling,
    stopPolling,
    checkStatus
  };
} 