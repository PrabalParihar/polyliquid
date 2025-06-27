import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { sepolia, avalancheFuji } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'PolyLiquid',
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  chains: [sepolia, avalancheFuji],
  ssr: true, // If your dApp uses server side rendering (SSR)
});

export const supportedChains = [sepolia, avalancheFuji] as const; 