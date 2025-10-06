# 🏢 Tokenize Backend - Smart Contracts

A Solidity-based real estate tokenization system with compliance enforcement, role-based access control, and investor management.

## 📋 Overview

This backend implements two core smart contracts for fractional real estate tokenization:

- **`RealEstateToken.sol`** - ERC-20 token representing property shares
- **`ComplianceManager.sol`** - Whitelist management and compliance rules engine

## 🎯 Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                  RealEstateToken.sol                    │
│  ┌──────────────────────────────────────────────────┐   │
│  │ Property: Marina Bay Sands                        │   │
│  │ Price: 0.001 ETH/token                           │   │
│  │ Hard Cap: 1M tokens                              │   │
│  └──────────────────────────────────────────────────┘   │
│                          │                              │
│                          │ validates with               │
│                          ▼                              │
│  ┌──────────────────────────────────────────────────┐   │
│  │            ComplianceManager.sol                  │   │
│  │  • Whitelist management                          │   │
│  │  • 10% holding limit enforcement                  │   │
│  │  • Blacklist (requires zero balance)             │   │
│  │  • Service provider role gating                  │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

Built with **Foundry** for fast testing and deployment on local Anvil networks.

---

## 🔧 Smart Contracts

### RealEstateToken.sol

An ERC-20 token with built-in compliance and property metadata.

**Key Parameters:**
- Token Name: `MBS Token`
- Symbol: `MBST`
- Hard Cap: `1,000,000 tokens` (with 18 decimals)
- Token Price: `0.001 ETH per token` (fixed)
- Property: Marina Bay Sands, Singapore ($10M valuation)

**Core Functions:**

```solidity
// Purchase tokens with ETH (payable, respects cap and limits)
function purchaseTokens() external payable

// Admin token recovery to ComplianceManager
function clawbackTokens(address from, uint256 amount) external onlyServiceProvider

// Retrieve property details
function getPropertyInfo() external view returns (
    string name,
    string location, 
    uint256 totalValue,
    uint256 tokenPriceWei
)

// Check total ETH raised from token sales
function getTotalRaised() external view returns (uint256)

// Check if offering is sold out
function isOversubscribed() external view returns (bool)
```

**How It Works:**

1. **Purchase Flow:**
   - Investor sends ETH to `purchaseTokens()`
   - Contract calculates tokens: `desiredTokens = (msg.value / 0.001 ether) * 1e18`
   - Checks whitelist status and 10% holding limit
   - Mints tokens (up to remaining cap) and refunds excess ETH
   - Emits `TokensPurchased` event

2. **Transfer Validation:**
   - All transfers call `ComplianceManager.validateTransfer()`
   - Enforces whitelist requirement and 10% limit
   - Skips validation for mints, burns, and clawbacks
   - Reverts with clear error messages

3. **Clawback Mechanism:**
   - Service provider can force transfer tokens to ComplianceManager
   - Bypasses compliance checks (admin action)
   - Used for regulatory enforcement or investor exit

### ComplianceManager.sol

Manages investor allowlist and enforces compliance rules.

**Key Parameters:**
- Max Holding: `10% of hard cap` (100,000 tokens)
- Role: `SERVICE_PROVIDER_ROLE` for admin functions

**Core Functions:**

```solidity
// Add investor to whitelist
function whitelistInvestor(address investor) external onlyRole(SERVICE_PROVIDER_ROLE)

// Remove investor from whitelist (requires zero balance)
function blacklistInvestor(address investor) external onlyRole(SERVICE_PROVIDER_ROLE)

// Check if address is whitelisted
function isWhitelisted(address) external view returns (bool)

// Get maximum holding limit
function getMaxHolding() public view returns (uint256)

// Validate if transfer is compliant (called by token)
function validateTransfer(
    address from,
    address to,
    uint256 amount,
    uint256 recipientCurrentBalance
) external view returns (bool isValid, string memory reason)
```

**How It Works:**

1. **Whitelist Management:**
   - Service provider adds investors via `whitelistInvestor()`
   - Maintains array of whitelisted addresses
   - Emits `InvestorWhitelisted` event

2. **Blacklist Protection:**
   - Can only blacklist if investor has zero token balance
   - Reverts with `BlacklistRequiresZeroBalance` if balance > 0
   - Requires clawback first if investor holds tokens
   - Emits `InvestorBlacklisted` event

3. **Compliance Validation:**
   - Called on every token transfer
   - Checks: recipient whitelisted + balance after transfer ≤ max holding
   - Returns `(false, "NotWhitelisted")` or `(false, "ExceedsMaxHolding")` on failure

---

## 🚀 Deploy Script

### Deploy.s.sol

Automated deployment script that:

1. Deploys `ComplianceManager` with temporary token address
2. Deploys `RealEstateToken` pointing to the manager
3. Wires manager with actual token address via `setTokenAddress()`
4. Sets property information (Marina Bay Sands, Singapore, $10M)
5. Grants `SERVICE_PROVIDER_ROLE` to deployer
6. Outputs contract addresses for frontend integration

---

## 🧪 Quick Testing with Cast

### Setup

1. **Start Anvil:**
```bash
anvil
```

2. **Deploy contracts:**
```bash
export SERVICE_PROVIDER_PK=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --broadcast
```

3. **Export addresses** (use output from deploy):
```bash
export RPC_URL=http://localhost:8545
export MANAGER=<ComplianceManager_address>
export TOKEN=<RealEstateToken_address>

# Anvil test accounts
export SP_ADDR=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
export SP_PK=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

export INV_A_ADDR=0x70997970C51812dc3A010C7d01b50e0d17dc79C8
export INV_A_PK=0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d

export INV_B_ADDR=0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
export INV_B_PK=0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a

export INV_C_ADDR=0x90F79bf6EB2c4f870365E785982E1f101E93b906
export INV_C_PK=0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6
```

### Test Flow 1: Property Information

```bash
# Check property details
cast call $TOKEN "getPropertyInfo()(string,string,uint256,uint256)" --rpc-url $RPC_URL
# Returns: ("Marina Bay Sands", "Singapore, SG", 10000000, 1000000000000000)

# Check total supply
cast call $TOKEN "totalSupply()(uint256)" --rpc-url $RPC_URL
# Returns: 0x0 (initially)

# Check max holding limit
cast call $MANAGER "getMaxHolding()(uint256)" --rpc-url $RPC_URL
# Returns: 0x152d02c7e14af6800000 (100,000 tokens in wei)
```

### Test Flow 2: Whitelist Management

```bash
# Whitelist Investor A
cast send $MANAGER "whitelistInvestor(address)" $INV_A_ADDR \
  --rpc-url $RPC_URL --private-key $SP_PK

# Whitelist Investor B
cast send $MANAGER "whitelistInvestor(address)" $INV_B_ADDR \
  --rpc-url $RPC_URL --private-key $SP_PK

# Verify whitelist status
cast call $MANAGER "isWhitelisted(address)(bool)" $INV_A_ADDR --rpc-url $RPC_URL
# Returns: true

cast call $MANAGER "isWhitelisted(address)(bool)" $INV_C_ADDR --rpc-url $RPC_URL
# Returns: false (not whitelisted)
```

### Test Flow 3: Token Purchases

```bash
# Non-whitelisted investor C attempts purchase (FAILS)
cast send $TOKEN "purchaseTokens()" --value 1000000000000000000 \
  --rpc-url $RPC_URL --private-key $INV_C_PK
# Error: NotWhitelisted(0x90F7...)

# Investor A attempts 120 ETH (120,000 tokens) - FAILS (exceeds 10% limit)
cast send $TOKEN "purchaseTokens()" --value 120000000000000000000 \
  --rpc-url $RPC_URL --private-key $INV_A_PK
# Error: ExceedsMaxHolding(...)

# Investor A purchases 10 ETH (10,000 tokens) - SUCCESS
cast send $TOKEN "purchaseTokens()" --value 10000000000000000000 \
  --rpc-url $RPC_URL --private-key $INV_A_PK

# Check balance
cast call $TOKEN "balanceOf(address)(uint256)" $INV_A_ADDR --rpc-url $RPC_URL
# Returns: 0x21e19e0c9bab2400000 (10,000 tokens)

# Check total raised
cast call $TOKEN "getTotalRaised()(uint256)" --rpc-url $RPC_URL
# Returns: 0x8ac7230489e80000 (10 ETH)

# Investor B purchases 20 ETH (20,000 tokens) - SUCCESS
cast send $TOKEN "purchaseTokens()" --value 20000000000000000000 \
  --rpc-url $RPC_URL --private-key $INV_B_PK

# Check balance
cast call $TOKEN "balanceOf(address)(uint256)" $INV_B_ADDR --rpc-url $RPC_URL
# Returns: 0x43c33c1937564800000 (20,000 tokens)
```

### Test Flow 4: Clawback & Blacklist

```bash
# Try to blacklist Investor B (has 20,000 tokens) - FAILS
cast send $MANAGER "blacklistInvestor(address)" $INV_B_ADDR \
  --rpc-url $RPC_URL --private-key $SP_PK
# Error: BlacklistRequiresZeroBalance(0x3C44..., 20000000000000000000000)

# Clawback 20,000 tokens from Investor B
cast send $TOKEN "clawbackTokens(address,uint256)" \
  $INV_B_ADDR 20000000000000000000000 \
  --rpc-url $RPC_URL --private-key $SP_PK

# Verify Investor B balance is now 0
cast call $TOKEN "balanceOf(address)(uint256)" $INV_B_ADDR --rpc-url $RPC_URL
# Returns: 0x0

# Verify ComplianceManager received the tokens
cast call $TOKEN "balanceOf(address)(uint256)" $MANAGER --rpc-url $RPC_URL
# Returns: 0x43c33c1937564800000 (20,000 tokens)

# Now blacklist Investor B - SUCCESS
cast send $MANAGER "blacklistInvestor(address)" $INV_B_ADDR \
  --rpc-url $RPC_URL --private-key $SP_PK

# Verify blacklist status
cast call $MANAGER "isWhitelisted(address)(bool)" $INV_B_ADDR --rpc-url $RPC_URL
# Returns: false
```

---

## 📊 Contract Events

### RealEstateToken Events

```solidity
event PropertyInfoSet(string name, string location, uint256 totalValue, uint256 tokenPrice)
event TokensPurchased(address indexed buyer, uint256 amount, uint256 ethPaid)
event TokensClawedBack(address indexed from, uint256 amount, address indexed operator)
event TransferValidated(address indexed from, address indexed to, uint256 amount, bool approved)
```

### ComplianceManager Events

```solidity
event InvestorWhitelisted(address indexed investor)
event InvestorBlacklisted(address indexed investor)
event ClawbackReceived(address indexed from, uint256 amount)
event TransferValidated(address indexed from, address indexed to, uint256 amount, bool approved)
```

---

## 🚨 Custom Errors

### RealEstateToken Errors

```solidity
error CapExceeded(uint256 requested, uint256 available)
error NotWhitelisted(address investor)
error ExceedsMaxHolding(uint256 currentBalance, uint256 maxHolding)
error InvalidComplianceManager()
error InvalidAmount()
error TransferFailed()
```

### ComplianceManager Errors

```solidity
error NotWhitelisted(address investor)
error ExceedsMaxHolding(uint256 currentBalance, uint256 maxHolding)
error BlacklistRequiresZeroBalance(address investor, uint256 balance)
error Unauthorized()
```

---

**For frontend integration, see** [`../tokenize_frontend/`](../tokenize_frontend/)
