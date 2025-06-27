import { useState, useEffect } from 'react';

/**
 * Hook to prevent hydration mismatches for client-only content
 * Returns true only after the component has mounted on the client
 */
export function useClientOnly() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient;
}

/**
 * Hook for time-sensitive content that should only render on client
 * Provides both client-only flag and current timestamp
 */
export function useClientTime() {
  const [isClient, setIsClient] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    setIsClient(true);
    setCurrentTime(Date.now());
    
    // Optional: Update time periodically if needed
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return { isClient, currentTime };
} 