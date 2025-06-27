import abi from './PolyLiquidVault.abi.json';

export const POLYLIQUIDVAULT_ABI = abi;

// Contract addresses for different networks
export const POLYLIQUIDVAULT_ADDRESSES = {
  // Sepolia testnet
  11155111: '0x918DD2C599C24e04069c6f32547Bb987d0Bd8B48', // ✅ Deployed on Sepolia
  // Fuji testnet  
  43113: '0x53FD504CE2752AdacDD5F85223Cc45F4E22a2d8d', // ✅ NEW - Deployed on Fuji
} as const;

export type SupportedChainId = keyof typeof POLYLIQUIDVAULT_ADDRESSES; 