# Polyliquid - Multi-Chain Smart Contract Project

A Hardhat TypeScript project configured for deploying smart contracts across multiple networks including Ethereum Sepolia, Avalanche Fuji, and Base Sepolia testnets.

## 🚀 Quick Start

### Prerequisites

- Node.js >= 16.0.0
- npm or yarn

### Installation

1. Clone the repository and install dependencies:
```bash
npm install
```

2. Copy the environment example file and configure your variables:
```bash
cp .env.example .env
```

3. Edit `.env` with your actual values:
   - Add your private key (without 0x prefix)
   - Add API keys for contract verification (optional)
   - Update RPC URLs if needed

### Environment Variables

Create a `.env` file with the following variables:

```env
# Private Key for deploying contracts (without 0x prefix)
PRIVATE_KEY=your_private_key_here

# RPC URLs for different networks
SEPOLIA_RPC_URL=https://1rpc.io/sepolia
FUJI_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org

# API Keys for contract verification
ETHERSCAN_API_KEY=your_etherscan_api_key_here
SNOWTRACE_API_KEY=your_snowtrace_api_key_here
BASESCAN_API_KEY=your_basescan_api_key_here
```

## 🌐 Supported Networks

| Network | Chain ID | RPC URL | Explorer |
|---------|----------|---------|----------|
| Ethereum Sepolia | 11155111 | https://1rpc.io/sepolia | https://sepolia.etherscan.io/ |
| Avalanche Fuji | 43113 | https://api.avax-test.network/ext/bc/C/rpc | https://subnets-test.avax.network/c-chain |
| Base Sepolia | 84532 | https://sepolia.base.org | https://sepolia.basescan.org/ |

## 📜 Available Scripts

### Compilation and Testing
```bash
npm run compile    # Compile smart contracts
npm run test       # Run tests
npm run clean      # Clean artifacts
```

### Deployment
```bash
npm run deploy:sepolia      # Deploy to Ethereum Sepolia
npm run deploy:fuji         # Deploy to Avalanche Fuji
npm run deploy:base-sepolia # Deploy to Base Sepolia
```

### Verification
```bash
npm run verify:sepolia      # Verify on Etherscan
npm run verify:fuji         # Verify on Snowtrace
npm run verify:base-sepolia # Verify on BaseScan
```

### Other Commands
```bash
npm run node       # Start local Hardhat network
npm run size       # Check contract sizes
```

## 🔧 Project Structure

```
polyliquid/
├── contracts/          # Smart contracts
├── scripts/           # Deployment scripts
├── test/              # Test files
├── ignition/          # Hardhat Ignition modules
├── hardhat.config.ts  # Hardhat configuration
├── tsconfig.json      # TypeScript configuration
└── .env.example       # Environment variables template
```

## 💡 Usage Examples

### Deploy a Contract
```bash
# Deploy to Avalanche Fuji testnet
npm run deploy:fuji

# Deploy to Ethereum Sepolia
npm run deploy:sepolia
```

### Verify a Contract
```bash
# After deployment, verify the contract
npx hardhat verify --network fuji CONTRACT_ADDRESS "Constructor Arg 1" "Constructor Arg 2"
```

### Interact with Networks
```bash
# Check account balance on Fuji
npx hardhat run scripts/check-balance.ts --network fuji

# Run a custom script on Base Sepolia
npx hardhat run scripts/your-script.ts --network baseSepolia
```

## 🔗 Useful Links

- [Avalanche Fuji Testnet Documentation](https://build.avax.network/docs/quick-start/networks/fuji-testnet)
- [ChainList - Network Configurations](https://chainlist.org/chain/43113)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Avalanche Fuji Faucet](https://faucet.avax.network/)

## 📝 Notes

- All networks are configured with fallback RPC URLs for reliability
- Private keys are loaded from environment variables for security
- The project includes TypeScript support for better development experience
- Contract verification is pre-configured for all supported networks

## 🛡️ Security

- Never commit your `.env` file or private keys to version control
- Use test networks for development and testing
- Consider using hardware wallets for mainnet deployments
