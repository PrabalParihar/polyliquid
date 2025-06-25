// Simple ERC20 ABI for PLYToken
export const PLYTOKEN_ABI = [
  {
    "inputs": [],
    "name": "name",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol", 
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "spender", "type": "address"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "approve",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "owner", "type": "address"},
      {"internalType": "address", "name": "spender", "type": "address"}
    ],
    "name": "allowance",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "address", "name": "to", "type": "address"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "transfer",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

// PLY Token addresses for different networks
export const PLYTOKEN_ADDRESSES = {
  // Sepolia testnet
  11155111: '0x7185D90BCD120dE7d091DF6EA8bd26e912571b61', // ✅ NEW - Deployed on Sepolia
  // Fuji testnet
  43113: '0x54Ec69d90d7dbf75Ea51C61c8e7DC81fACbe7Fb7', // ✅ NEW - Deployed on Fuji
} as const;

// PolyRouter addresses for CCIP cross-chain functionality
export const POLYROUTER_ADDRESSES = {
  // Sepolia testnet
  11155111: '0x44AB25180aA8d41E0b584d9E34C35a5990254A81', // ✅ NEW - Deployed on Sepolia
  // Fuji testnet
  43113: '0x918DD2C599C24e04069c6f32547Bb987d0Bd8B48', // ✅ NEW - Deployed on Fuji
} as const;

export type SupportedChainId = keyof typeof PLYTOKEN_ADDRESSES; 