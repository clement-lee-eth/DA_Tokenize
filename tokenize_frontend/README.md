# 🎨 Tokenize Frontend - React Application

A professional institutional-grade React application for real estate tokenization with event-driven real-time updates, role-based interfaces, and Schroders-themed design.

## 📋 Overview

This frontend provides a complete user interface for interacting with the tokenization smart contracts:

- **Dashboard** - Property offering, purchase interface, real-time metrics
- **Admin Panel** - Service provider console for investor and token management
- **Wallet Integration** - RainbowKit for seamless wallet connection to local Anvil
- **Real-Time Updates** - Event-driven UI updates without manual refresh

Built with **React 18**, **TypeScript**, **Wagmi v2**, and **Tailwind CSS**.

---

## 🎯 Key Features

### For All Users
- 🔐 **Automatic Role Detection** - Instantly identifies Service Provider / Whitelisted / Non-whitelisted
- 📊 **Live Metrics** - Property details, token price, total raised, tokenization progress
- 💼 **Wallet Overview** - Real-time ETH and MBST balance tracking
- 🎨 **Institutional Design** - Schroders-themed UI with professional aesthetics
- ⚡ **Event-Driven Updates** - No page refresh needed; UI updates on blockchain events

### For Investors (Whitelisted)
- 🛒 **Token Purchase** - Input MBST amount, see ETH required, instant confirmation
- 📈 **Balance Tracking** - Live MBST balance updates after purchases
- 🚫 **Limit Enforcement** - Frontend validates against 10% holding limit before transaction
- 💬 **Smart Error Messages** - Decoded contract reverts with friendly explanations

### For Service Providers
- ✅ **Whitelist Management** - Add investors to allowlist with loading states
- ❌ **Blacklist Management** - Remove investors (enforces zero balance requirement)
- 💰 **Token Clawback** - Recover tokens from investors with balance lookup
- 👥 **Investor Oversight** - View all whitelisted investors and current token holders
- 📊 **Compliance Pool** - Track tokens held by ComplianceManager after clawbacks

---

## 🏗️ Architecture

### Pages

**`DashboardPage.tsx`** (`/`)
- Property offering card with Marina Bay Sands image
- Tokenization progress bar (sold vs. available)
- Purchase interface (MBST input → ETH output)
- Service provider view: Whitelisted investors + Token holders + Compliance pool
- Investor view: Purchase panel with real-time limit checking

**`AdminPage.tsx`** (`/admin`)
- Whitelist Management: Authorize Investor A and B
- Blacklist Management: Revoke authorization (zero balance required)
- Token Clawback: Recover tokens with address + amount form
- Token Holders: Real-time list of investors and balances

### Hooks

**Core Hooks:**

```typescript
// Role detection (SERVICE_PROVIDER / WHITELISTED / NON_WHITELISTED / DISCONNECTED)
useRole()

// Whitelist/blacklist operations with event-driven updates
useWhitelist()

// Token purchases with simulation and error decoding
usePurchase()

// Admin token clawback
useClawback()

// Real-time token holder tracking
useTokenHolders()

// Live wallet balance (ETH + MBST + Manager pool)
useWalletBalance()

// Property metadata, total supply, total raised
useTokenMetadata()

// Whitelisted investors list
useWhitelistedInvestors()

// Max holding limit and current balance
useMaxHolding()
```

### Components

**Layout:**
- `Header.tsx` - Navigation with role-based tabs
- `RoleBanner.tsx` - Full-width wallet address and role display
- `WalletInfo.tsx` - ETH and MBST balance cards

**Dashboard:**
- `AssetHero.tsx` - Property image, title, tags, and key metrics
- `ProgressBar.tsx` - Visual tokenization progress

**Shared:**
- `Card.tsx` - Reusable card container
- `RoleBadge.tsx` - Color-coded role indicator
- `Address.tsx` - Truncated address with copy button
- `Stat.tsx` - Metric display component
- `ToastProvider.tsx` - Bottom-right toast notifications

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- npm or yarn
- Running Anvil instance (see backend README)
- Deployed smart contracts (see backend README)

### Installation

```bash
cd tokenize_frontend
npm install
```

### Configuration

1. **Copy contract ABIs:**
```bash
node scripts/copy-abis.mjs ../tokenize_backend/out ./src/abis
```

2. **Extract deployed addresses:**
```bash
node scripts/extract-addresses.mjs \
  ../tokenize_backend/broadcast/Deploy.s.sol/31337/run-latest.json \
  > tmp.addresses.json
```

3. **Create `.env.local`:**
```bash
echo "VITE_RPC_URL=http://localhost:8545" > .env.local
echo "VITE_TOKEN_ADDRESS=<RealEstateToken_address>" >> .env.local
echo "VITE_MANAGER_ADDRESS=<ComplianceManager_address>" >> .env.local
```

Example `.env.local`:
```
VITE_RPC_URL=http://localhost:8545
VITE_TOKEN_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
VITE_MANAGER_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
```

### Run Development Server

```bash
npm run dev
```

Open http://localhost:5173

---

## 🎭 User Flows

### Flow 1: Service Provider - Whitelist Management

1. **Connect wallet** with Account 0 (Service Provider)
2. **Role badge** shows "Service Provider"
3. Navigate to **Admin Panel** (`/admin`)
4. **Whitelist Management** section shows Investor A and B
5. Click **"Whitelist"** on Investor A:
   - Loading spinner: "Whitelisting…"
   - Toast: "Whitelist investor initiated..." → "Confirming whitelist transaction..."
   - Success toast: "Investor whitelisted successfully!"
   - Button changes to "✓ Authorized"
   - **Blacklist Management** section now shows Investor A
6. Repeat for Investor B
7. **Dashboard** shows both investors in "Whitelisted Investors" section

### Flow 2: Non-Whitelisted Investor

1. **Connect wallet** with Account 3+ (Non-whitelisted)
2. **Role badge** shows "Non-whitelisted"
3. **Dashboard** purchase panel shows:
   - Red disabled button: "Not Whitelisted - Cannot Purchase"
4. No purchase functionality available

### Flow 3: Investor A - Token Purchase

1. **Connect wallet** with Account 1 (Investor A)
2. **Role badge** shows "Whitelisted Investor"
3. **Wallet Overview** shows: 0 MBST
4. **Attempt 120,000 MBST purchase:**
   - Enter "120,000" in Amount to Purchase
   - ETH required: 120 ETH
   - Click "Purchase 120,000 Tokens"
   - Error toast: "Exceeds maximum holding limit (max 100,000 MBST)"
5. **Purchase 10,000 MBST:**
   - Enter "10,000"
   - ETH required: 10 ETH (automatically calculated)
   - Click "Purchase 10,000 Tokens"
   - Button shows: "Submitting…" → "Confirming…"
   - Success toast: "Purchase confirmed!"
   - **Wallet Overview** updates instantly: 10,000 MBST
   - **Total Raised** updates: +10 ETH
   - **Progress bar** advances
   - No page refresh needed!

### Flow 4: Investor B - Token Purchase

1. **Connect wallet** with Account 2 (Investor B)
2. **Role badge** shows "Whitelisted Investor"
3. **Purchase 20,000 MBST:**
   - Enter "20,000"
   - ETH required: 20 ETH
   - Click purchase
   - Loading → Success toast
   - **Wallet Overview**: 20,000 MBST
4. **Service Provider Dashboard** automatically shows:
   - **Token Holders**: Investor A (10,000 MBST), Investor B (20,000 MBST)

### Flow 5: Service Provider - Clawback & Blacklist

1. **Connect wallet** with Account 0 (Service Provider)
2. **Dashboard** → "Token Holders" shows both investors
3. Navigate to **Admin Panel**
4. **Blacklist Management** shows both whitelisted investors
5. **Try to blacklist Investor B:**
   - Button disabled (has 20,000 MBST balance)
   - Note: "Balance must be 0 before blacklisting"
   - If clicked: Toast "Cannot blacklist investor with non-zero balance"
6. **Token Clawback:**
   - Paste Investor B address: `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC`
   - "Current Balance" shows: 20,000 MBST (auto-populated)
   - Enter amount: `20000`
   - Click "Execute Clawback"
   - Toast: "Clawback initiated..." → "Confirming clawback transaction..." → "Clawback completed"
   - **Token Holders** updates instantly: Investor B removed
   - **Compliance Manager Pool** shows: 20,000 MBST
7. **Blacklist Investor B:**
   - Button now enabled (balance = 0)
   - Click "Blacklist"
   - Loading → Success: "Investor blacklisted successfully!"
   - Investor B removed from Blacklist Management
   - **Dashboard** shows only Investor A in "Whitelisted Investors"

---


## 📂 Project Structure

```
src/
├── pages/
│   ├── DashboardPage.tsx          # Main offering dashboard
│   └── AdminPage.tsx              # Service provider console
│
├── components/
│   ├── dashboard/
│   │   └── AssetHero.tsx          # Property card with image and metrics
│   ├── layout/
│   │   ├── Header.tsx             # Navigation with role-based tabs
│   │   ├── RoleBanner.tsx         # Full-width wallet/role display
│   │   └── WalletInfo.tsx         # Balance overview card
│   └── shared/
│       ├── Card.tsx               # Reusable card container
│       ├── RoleBadge.tsx          # Color-coded role indicator
│       ├── Address.tsx            # Truncated address with copy
│       ├── ProgressBar.tsx        # Animated progress bar
│       ├── Stat.tsx               # Metric display
│       ├── Table.tsx              # Data table
│       └── ToastProvider.tsx      # Toast notification system
│
├── hooks/
│   ├── useRole.ts                 # Detect wallet role from contracts
│   ├── useWhitelist.ts            # Whitelist/blacklist with events
│   ├── usePurchase.ts             # Token purchases with simulation
│   ├── useClawback.ts             # Admin token recovery
│   ├── useTokenHolders.ts         # Real-time holder tracking
│   ├── useWalletBalance.ts        # Live balance updates
│   ├── useToken.ts                # Property metadata and totals
│   ├── useWhitelistedInvestors.ts # Whitelisted investors list
│   └── useCompliance.ts           # Max holding calculations
│
├── config/
│   ├── env.ts                     # Environment variable validation
│   └── contracts.ts               # Contract addresses and ABI loaders
│
├── abis/
│   ├── RealEstateToken.json       # Token contract ABI
│   └── ComplianceManager.json     # Compliance contract ABI
│
├── assets/
│   ├── marina_bay_sands.jpg       # Property hero image
│   └── eth_logo.png               # Ethereum logo
│
└── app/
    └── providers/
        └── WalletProvider.tsx     # Wagmi + RainbowKit setup
```

## 📖 Additional Resources

- [Wagmi Documentation](https://wagmi.sh/)
- [RainbowKit Documentation](https://www.rainbowkit.com/)
- [viem Documentation](https://viem.sh/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Main Project README](../README.md)
- [Backend README](../tokenize_backend/README.md)

---

**Built with ❤️ for institutional real estate tokenization**

