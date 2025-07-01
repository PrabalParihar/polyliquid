# 🧪 PolyLiquid

**One token. Every chain. All the yield.**  
PolyLiquid bundles **stETH + rETH + sAVAX** into a single ERC-4626 vault token (PLY), auto-rebalances with Chainlink oracles, and glides across chains through Chainlink CCIP.

<p align="center">
  <img src="https://github.com/user-attachments/assets/9384c724-d1a4-45f4-a786-7714ca426ba9" width="720">
  <br/><em>All your LSTs, one dashboard.</em>
</p>

---

## ❗️ Problem

| Pain-point | Details |
|------------|---------|
| **Fragmented liquid-staking tokens** | Users juggle multiple LSTs, each with its own discount/premium and UI. |
| **Risky cross-chain moves** | Traditional bridges remain the #1 hack vector and require clunky wrap → bridge → unwrap flows. |
| **Manual yield management** | APRs shift minute-to-minute; harvesting and re-staking by hand wastes gas and leaves yield on the table. |
| **Opaque collateral** | Holders rarely know if their LSTs are 100 % backed at any given block. |

---

## ✅ Solution

| How PolyLiquid fixes it | What we use |
|-------------------------|-------------|
| **Single basket token (PLY)** holding stETH, rETH, sAVAX | ERC-4626 vault |
| **Always-on auto-compounding** toward the best APR | Chainlink **Data Streams** + **Automation** |
| **One-click, audited bridging** | Chainlink **CCIP** router |
| **Live collateral checks** | Chainlink **Proof-of-Reserves** |
| **Hedging & no-loss lottery** for extra yield and fun | Polymarket + Chainlink **VRF** |

<p align="center">
  <img src="https://github.com/user-attachments/assets/3d929f39-2a1d-4e45-ad35-38864df05f5b" width="720">
  <br/><em>Architecture: Vault ↔ Data Streams ↔ Automation ↔ CCIP ↔ Polymarket.</em>
</p>

---

## ⭐ Key Features

| 💡 | Feature |
|----|---------|
| **Unified staking basket** | Deposit once; hold PLY instead of three separate LSTs. |
| **Real-time yield chasing** | Re-weights every hour to whichever LST outperforms. |
| **Secure cross-chain mobility** | Seamless Fuji ⇄ Sepolia ⇄ Base transfers with CCIP. |
| **Proof-backed assurance** | Live “100 %-backed” badge on every network. |
| **Interactive yield games** | Free lottery tickets funded by weekly vault yield. |

---

## 🖥 Screenshots

| Dashboard | Deposit Flow | CCIP Modal |
|-----------|--------------|------------|
| <img src="https://github.com/user-attachments/assets/ab4cacb8-5057-40c7-a405-aa44b6b66a1a" width="320"> | <img src="https://github.com/user-attachments/assets/edf3f2a6-545e-46c2-b8e7-25ef3c5c8837" width="320"> | <img src="https://github.com/user-attachments/assets/bc86500c-648a-431e-a5f3-00cdf0db5fbd" width="320"> |

---

## 🚀 Quick Start

### Prerequisites
```bash
Node >= 16   # 🟢 test on v18
npm > 8      # or yarn / pnpm

1 — Clone & Install

git clone https://github.com/your-org/polyliquid.git
cd polyliquid
npm install

2 — Configure .env

PRIVATE_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SEPOLIA_RPC_URL=https://1rpc.io/sepolia
FUJI_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
ETHERSCAN_API_KEY=
SNOWTRACE_API_KEY=
BASESCAN_API_KEY=
AUTOMATION_UPKEEP_ID=
VRF_SUBSCRIPTION_ID=
FUNCTIONS_SUB_ID=

3 — Compile • Test • Deploy

npm run compile
npm run test
npm run deploy:fuji          # or :sepolia / :base-sepolia


⸻

🌐 Networks

Chain	Chain ID	Deployed PLY
Avalanche Fuji	43113	0x…
Ethereum Sepolia	11155111	0x…
Base Sepolia	84532	0x…


⸻

📁 Directory Layout

polyliquid/
├── contracts/           # Vault, Router, Lottery, Oracles
├── scripts/             # Deploy & helper scripts
├── test/                # Hardhat + chai tests
├── ignition/            # Hardhat Ignition modules
├── app/                 # Next.js + wagmi dashboard
└── hardhat.config.ts


⸻

🛠 Common Scripts

npm run deploy:fuji          # Deploy to Fuji
npm run verify:fuji          # Verify on Snowtrace
npm run node                 # Local Hardhat node
npm run size                 # Contract byte-size checker


⸻

🤝 Contributing

Pull requests welcome—please add tests and run npm run lint before submitting.

📜 License

MIT © 2025 PolyLiquid contributors




## 🛡️ Security

- Never commit your `.env` file or private keys to version control
- Use test networks for development and testing
- Consider using hardware wallets for mainnet deployments
