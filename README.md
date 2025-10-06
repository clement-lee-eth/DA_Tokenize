# DA_Tokenize - Real Estate Tokenization Platform POC

A MVP fractional tokenized real estate platform. This POC showcases a platform enabling fractional ownership of a single commercial property

![TypeScript](https://img.shields.io/badge/TypeScript-79.5%25-blue)
![Solidity](https://img.shields.io/badge/Solidity-17.4%25-orange)
![License](https://img.shields.io/badge/license-MIT-green)

---

## 🎥 Video Demo

https://www.loom.com/share/2e400b70ae834f759ed55ddf3ee76be2?sid=51e313e4-4a3e-447a-9787-e1306109b6f0

---

## 📋 Overview

**DA_Tokenize** demonstrates an end-to-end tokenization flow for fractional real estate ownership, featuring:

- **Smart Contract Layer**: ERC-20 token with compliance validation, role-based permissions, and investor whitelisting
- **Frontend Application**: Professional React dashboard with wallet connectivity, and event-driven real-time updates
- **Demo-Ready**: Complete flows for service providers and investors with proper loading states and transaction feedback

### Key Features

- 🔐 **Role-Based Access Control**: Service providers, whitelisted investors, and non-whitelisted users
- 💰 **Compliant Token Sales**: 10% holding limit enforcement, whitelist requirements, hard cap management
- 🎯 **Admin Operations**: Whitelist/blacklist management, token clawback, investor oversight
- 📊 **Real-Time Updates**: Event-driven UI updates via contract events (no manual refresh)
- 🎨 **Institutional Design**: Interface with proper UX and modern toast notifications
- ⚡ **Instant Feedback**: Multi-stage loading states with spinners and transaction confirmation toasts

---

## 🏗️ Architecture

### Backend (`tokenize_backend/`)

**Smart Contracts** (Solidity + Foundry):

1. **`RealEstateToken.sol`** - ERC-20 token with:
   - Property information storage (name, location, valuation)
   - Purchase function with ETH → token conversion (0.001 ETH per token)
   - Hard cap enforcement (1M tokens)
   - Compliance validation on all transfers
   - Admin clawback functionality
   - Service provider role management

2. **`ComplianceManager.sol`** - Compliance & whitelist management:
   - Investor whitelist/blacklist functions
   - 10% maximum holding limit (100,000 tokens per investor)
   - Transfer validation with revert reasons
   - Service provider role gating

**Tech Stack:**
- Solidity ^0.8.20
- Foundry (Forge, Anvil)
- OpenZeppelin Contracts (AccessControl, ERC20, ReentrancyGuard)

### Frontend (`tokenize_frontend/`)

**React Application** (TypeScript + Vite + Wagmi):

**Pages:**
- **Dashboard** (`/`) - Property offering, purchase interface, real-time metrics
- **Admin Panel** (`/admin`) - Service provider console for investor management

**Key Hooks:**
- `useRole` - Detects wallet role (Service Provider / Whitelisted / Non-whitelisted)
- `useWhitelist` - Manages investor whitelist/blacklist with event-driven updates
- `usePurchase` - Token purchase with simulation, error decoding, and event confirmation
- `useClawback` - Admin token recovery with instant UI updates
- `useTokenHolders` - Real-time holder balances via Transfer events
- `useWalletBalance` - Live ETH and MBST balance tracking

**Tech Stack:**
- React 18 + TypeScript
- Vite (build tool)
- Wagmi v2 + viem (Ethereum interactions)
- RainbowKit (wallet connection)
- Tailwind CSS (frontend styling)
- react-hot-toast (notifications)

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- Foundry ([installation guide](https://book.getfoundry.sh/getting-started/installation))
- MetaMask or compatible Web3 wallet (eg. Coinbase Wallet)

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/clement-lee-eth/DA_Tokenize.git
cd DA_Tokenize
```

2. **Install backend dependencies:**
```bash
cd tokenize_backend
forge install
```

3. **Install frontend dependencies:**
```bash
cd ../tokenize_frontend
npm install
```

### Running the Application

#### 1. Start Local Blockchain (Anvil)

```bash
cd tokenize_backend
anvil
```

This starts a local Ethereum node on `http://localhost:8545` with pre-funded test accounts.

#### 2. Deploy Smart Contracts

In a new terminal:

```bash
cd tokenize_backend
export SERVICE_PROVIDER_PK=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --broadcast
```

Note the deployed contract addresses from the output.

#### 3. Configure Frontend Environment

```bash
cd ../tokenize_frontend

# Copy contract ABIs
node scripts/copy-abis.mjs ../tokenize_backend/out ./src/abis

# Extract deployed addresses
node scripts/extract-addresses.mjs ../tokenize_backend/broadcast/Deploy.s.sol/31337/run-latest.json > tmp.addresses.json

# Create .env.local
echo "VITE_RPC_URL=http://localhost:8545" > .env.local
echo "VITE_TOKEN_ADDRESS=<RealEstateToken_address>" >> .env.local
echo "VITE_MANAGER_ADDRESS=<ComplianceManager_address>" >> .env.local
```

#### 4. Start Frontend

```bash
npm run dev
```

Open http://localhost:5173 in your browser.

#### 5. Connect Wallet

Add Localhost network to your wallet:
- **Network Name**: Localhost
- **RPC URL**: http://localhost:8545
- **Chain ID**: 31337
- **Currency Symbol**: ETH

Import Anvil test accounts (private keys from Anvil output):
- **Account 0** (Service Provider): `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
- **Account 1** (Investor A): `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`
- **Account 2** (Investor B): `0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a`

---

## 📂 Project Structure

```
DA_Tokenize/
├── tokenize_backend/
│   ├── src/
│   │   ├── RealEstateToken.sol      # ERC-20 token with compliance
│   │   └── ComplianceManager.sol     # Whitelist & rules engine
│   ├── script/
│   │   └── Deploy.s.sol              # Deployment script with role setup
│   ├── test/                         # Contract tests
│   └── foundry.toml                  # Foundry configuration
│
└── tokenize_frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── DashboardPage.tsx     # Main offering dashboard
    │   │   └── AdminPage.tsx         # Service provider console
    │   ├── components/
    │   │   ├── dashboard/            # Property hero, metrics
    │   │   ├── layout/               # Header, wallet info, role banner
    │   │   └── shared/               # Card, toast, badge components
    │   ├── hooks/
    │   │   ├── useRole.ts            # Role detection
    │   │   ├── useWhitelist.ts       # Whitelist/blacklist operations
    │   │   ├── usePurchase.ts        # Token purchases
    │   │   ├── useClawback.ts        # Admin token recovery
    │   │   ├── useTokenHolders.ts    # Real-time holder tracking
    │   │   └── useWalletBalance.ts   # Live balance updates
    │   ├── config/
    │   │   ├── contracts.ts          # Contract addresses & ABIs
    │   │   └── env.ts                # Environment validation
    │   └── abis/                     # Contract ABIs
    ├── package.json
    └── vite.config.ts
```

## 🤝 Contributing

This is a demonstration project for institutional tokenization.


---

## 👤 Author

**Clement Lee**
- GitHub: [@clement-lee-eth](https://github.com/clement-lee-eth)

---

**Built with ❤️ for institutional real estate tokenization**

