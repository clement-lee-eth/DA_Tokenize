# 🏢 DA_Tokenize - Real Estate Tokenization Platform

A complete institutional-grade real estate tokenization platform with role-based access control, compliance management, and real-time blockchain interactions. Built with Solidity smart contracts and a modern React frontend.

![TypeScript](https://img.shields.io/badge/TypeScript-79.5%25-blue)
![Solidity](https://img.shields.io/badge/Solidity-17.4%25-orange)
![License](https://img.shields.io/badge/license-MIT-green)

## 📋 Overview

**DA_Tokenize** demonstrates an end-to-end tokenization flow for fractional real estate ownership, featuring:

- **Smart Contract Layer**: ERC-20 token with compliance validation, role-based permissions, and investor whitelisting
- **Frontend Application**: Professional React dashboard with Schroders-themed UI, wallet connectivity, and event-driven real-time updates
- **Demo-Ready**: Complete flows for service providers and investors with proper loading states and transaction feedback

### Key Features

- 🔐 **Role-Based Access Control**: Service providers, whitelisted investors, and non-whitelisted users
- 💰 **Compliant Token Sales**: 10% holding limit enforcement, whitelist requirements, hard cap management
- 🎯 **Admin Operations**: Whitelist/blacklist management, token clawback, investor oversight
- 📊 **Real-Time Updates**: Event-driven UI updates via contract events (no manual refresh)
- 🎨 **Institutional Design**: Schroders-themed interface with professional UX and modern toast notifications
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
- Tailwind CSS (Schroders-themed styling)
- react-hot-toast (notifications)

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- Foundry ([installation guide](https://book.getfoundry.sh/getting-started/installation))
- MetaMask or compatible Web3 wallet

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

## 🎭 Demo Flows

### Flow 1: Service Provider - Whitelist Management

**As Service Provider:**

1. Switch to service provider account (Account 0) in wallet
2. Connect to frontend → Role badge shows "Service Provider"
3. Navigate to **Admin Panel** (`/admin`)
4. View **Whitelist Management** section → shows "No whitelisted investors"
5. Click **"Whitelist"** on Investor A
   - Loading spinner appears
   - Toast: "Whitelist investor initiated..." → "Confirming whitelist transaction..."
   - After confirmation: "Investor whitelisted successfully!"
   - Investor A status changes to "✓ Authorized"
6. Click **"Whitelist"** on Investor B
   - Same loading flow
   - Both investors now appear in **Blacklist Management** section
7. **Dashboard** → Both investors visible in "Whitelisted Investors" section

### Flow 2: Non-Whitelisted Investor

**As Non-Whitelisted Investor:**

1. Switch to a non-whitelisted account (Account 3+) in wallet
2. Connect to frontend → Role badge shows "Non-whitelisted"
3. **Dashboard** → Purchase interface shows:
   - Button: "Not Whitelisted - Cannot Purchase" (disabled, red)
   - No purchase functionality available

### Flow 3: Whitelisted Investor A - Token Purchase

**As Whitelisted Investor A:**

1. Switch to Investor A account (Account 1) in wallet
2. Connect → Role badge shows "Whitelisted Investor"
3. **Wallet Overview** shows: 0 MBST balance
4. **Try to purchase 120,000 MBST:**
   - Enter "120,000" in Amount to Purchase
   - Click "Purchase 120,000 Tokens"
   - Error toast: "Exceeds maximum holding limit (max 100,000 MBST)"
   - Transaction blocked by smart contract
5. **Purchase 10,000 MBST:**
   - Enter "10,000" in Amount to Purchase
   - ETH required automatically calculated (10 ETH)
   - Click "Purchase 10,000 Tokens"
   - Loading: "Submitting…" → "Confirming…"
   - Success toast: "Purchase confirmed!"
   - **Wallet Overview** updates instantly: 10,000 MBST
   - **Dashboard metrics** update: Total Raised +10 ETH, Progress bar advances
   - No page refresh needed!

### Flow 4: Whitelisted Investor B - Token Purchase

**As Whitelisted Investor B:**

1. Switch to Investor B account (Account 2)
2. **Purchase 20,000 MBST:**
   - Enter "20,000"
   - ETH required: 20 ETH
   - Click purchase → Loading flow → Success
   - **Wallet Overview**: 20,000 MBST
   - **Service Provider Dashboard** → Token Holders shows:
     - Investor A: 10,000 MBST
     - Investor B: 20,000 MBST

### Flow 5: Service Provider - Blacklist & Clawback

**As Service Provider:**

1. Switch back to service provider account
2. **Dashboard** → "Token Holders" shows both investors with balances
3. Navigate to **Admin Panel**
4. **Blacklist Management** → Shows Investor A and Investor B
5. **Try to blacklist Investor B:**
   - Button disabled with note: "Balance must be 0 before blacklisting"
   - If clicked: Toast error "Cannot blacklist investor with non-zero balance"
6. **Token Clawback:**
   - Enter Investor B address: `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`
   - "Current Balance" shows: 20,000 MBST (real-time)
   - Enter amount: 20000
   - Click "Execute Clawback"
   - Loading: "Clawback initiated..." → "Confirming clawback transaction..."
   - Success: "Clawback completed"
   - **Token Holders** updates instantly: Investor B removed (0 balance)
   - **Compliance Manager Pool** shows: 20,000 MBST
7. **Blacklist Investor B (now with 0 balance):**
   - Button now enabled
   - Click "Blacklist"
   - Loading → Success: "Investor blacklisted successfully!"
   - Investor B removed from Blacklist Management
   - **Dashboard** → "Whitelisted Investors" shows only Investor A

---

## 🎥 Video Demo

[📹 Watch the full demo on Loom](#)

_Link will be added after recording_

---

## 🔑 Key Technical Highlights

### Event-Driven Real-Time Updates

All UI updates happen instantly without page refresh:

- **`TokensPurchased`** event → Updates total raised, supply, progress bar, buyer balance, token holders
- **`TokensClawedBack`** event → Updates token holders, manager pool, investor balances
- **`InvestorWhitelisted`** event → Updates whitelist status, blacklist management section
- **`InvestorBlacklisted`** event → Updates whitelist status, removes from management sections

### Smart Contract Error Handling

The frontend simulates transactions before sending to decode custom errors:

- **`ExceedsMaxHolding`** → "Exceeds maximum holding limit (max 100,000 MBST)"
- **`NotWhitelisted`** → "Wallet is not whitelisted"
- **`BlacklistRequiresZeroBalance`** → "Cannot blacklist investor with non-zero balance"
- **`CapExceeded`** → "Sale hard cap reached"

### Loading State Management

Multi-stage transaction feedback:

1. **Initiated** → "Transaction initiated..." (loading toast)
2. **Confirming** → "Confirming transaction..." (spinner on button)
3. **Success** → "Transaction successful!" (success toast + UI updates)

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

---

## 🛠️ Technology Stack

### Backend
- **Solidity** - Smart contract development
- **Foundry** - Testing, deployment, and local blockchain
- **OpenZeppelin** - Battle-tested contract libraries

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Fast build tool
- **Wagmi v2** - Ethereum React hooks
- **viem** - Lightweight Ethereum library
- **RainbowKit** - Wallet connection UI
- **Tailwind CSS** - Utility-first styling
- **react-hot-toast** - Toast notifications


---

## 🧪 Testing

### Backend Tests

```bash
cd tokenize_backend
forge test -vvv
```

### Frontend Development

```bash
cd tokenize_frontend
npm run dev
```

### Manual Testing Flow

Follow the **Demo Flows** section above for a complete end-to-end test covering all functionality.

---

## 🔧 Configuration

### Environment Variables

**Backend** (`.env`):
```bash
RPC_URL=http://localhost:8545
SERVICE_PROVIDER_PK=<anvil_account_0_private_key>
INVESTOR_A_PK=<anvil_account_1_private_key>
INVESTOR_B_PK=<anvil_account_2_private_key>
MANAGER=<deployed_ComplianceManager_address>
RET=<deployed_RealEstateToken_address>
```

**Frontend** (`.env.local`):
```bash
VITE_RPC_URL=http://localhost:8545
VITE_TOKEN_ADDRESS=<RealEstateToken_address>
VITE_MANAGER_ADDRESS=<ComplianceManager_address>
```

---

## 🎯 Core Functionality

### Smart Contract Functions

**RealEstateToken:**
- `purchaseTokens()` - Buy tokens with ETH (payable)
- `clawbackTokens(address, amount)` - Admin token recovery
- `getPropertyInfo()` - Retrieve property metadata
- `getTotalRaised()` - Total ETH raised from sales
- `balanceOf(address)` - Token balance for address

**ComplianceManager:**
- `whitelistInvestor(address)` - Add investor to allowlist
- `blacklistInvestor(address)` - Remove investor (requires zero balance)
- `isWhitelisted(address)` - Check whitelist status
- `getMaxHolding()` - Get maximum holding limit (100,000 tokens)
- `validateTransfer(from, to, amount, recipientBalance)` - Enforce compliance rules


---

## 🤝 Contributing

This is a demonstration project for institutional tokenization.


---

## 📄 License

MIT License - see LICENSE file for details

---

## 👤 Author

**Clement Lee**
- GitHub: [@clement-lee-eth](https://github.com/clement-lee-eth)

---

**Built with ❤️ for institutional real estate tokenization**

