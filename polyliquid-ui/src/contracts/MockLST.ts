import abi from './MockLST.abi.json';

export const MOCKLST_ABI = abi;

// Mock LST token addresses for different networks
export const MOCK_TOKENS = {
  // Sepolia testnet
  11155111: {
    stETH: '0x0aF203033beb6f48Cd1abbC74B07bE21111F41Bc', // ✅ NEW - Deployed MockStETH on Sepolia
    rETH: '0x53f23483B7B3B0dce2Cee15D72E45f362Cdf053E',  // ✅ NEW - Deployed MockRETH on Sepolia
    sAVAX: '0x515958d0e0f2a7B8da4B4D39F8C42d22f2ce0B03', // ✅ NEW - Deployed MockSAVAX on Sepolia
  },
  // Fuji testnet
  43113: {
    stETH: '0x7185D90BCD120dE7d091DF6EA8bd26e912571b61', // ✅ NEW - Deployed on Fuji
    rETH: '0x0aF203033beb6f48Cd1abbC74B07bE21111F41Bc',  // ✅ NEW - Deployed on Fuji
    sAVAX: '0x53f23483B7B3B0dce2Cee15D72E45f362Cdf053E', // ✅ NEW - Deployed on Fuji
  },
} as const;

export type TokenSymbol = 'stETH' | 'rETH' | 'sAVAX';
export type SupportedChainId = keyof typeof MOCK_TOKENS; 