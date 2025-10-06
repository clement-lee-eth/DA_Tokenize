
## Backend Summary

This backend implements a local-only fractional real estate tokenization MVP:

- `RealEstateToken.sol`: ERC-20 token representing property shares with a hard cap of 1,000,000 tokens and a fixed price of 0.001 ETH per token. Purchases are made via `purchaseTokens()` and respect both the total cap and a 10% per-investor limit.

- `ComplianceManager.sol`: Central allowlist and compliance rules. Enforces that only whitelisted addresses can receive tokens and no holder exceeds 10% of the hard cap. Also supports service-provider clawback and blacklist (only when balance is zero).

High-level flows supported:
- Project creation and tokenization (deploy, set property info)
- Allowlist management (whitelist/blacklist)
- Investor purchases with ETH→tokens at a fixed price
- Compliance-gated transfers (whitelist + 10% limit)
- Service provider clawback

## Architecture

- Roles: The service provider holds `SERVICE_PROVIDER_ROLE` on both contracts.
- Wiring: `RealEstateToken` references `ComplianceManager`. The manager also stores the token address for balance checks during blacklist.
- Events and Reverts: Clear events (`PropertyInfoSet`, `TokensPurchased`, `TokensClawedBack`, `InvestorWhitelisted`, `InvestorBlacklisted`, `TransferValidated`) and revert reasons (`NotWhitelisted`, `ExceedsMaxHolding`, `CapExceeded`, `BlacklistRequiresZeroBalance`).

### ComplianceManager.sol

Responsibilities:
- Maintain allowlist via `whitelistInvestor(address)` and `blacklistInvestor(address)`.
- Enforce compliance on transfers via `validateTransfer(from,to,amount,recipientBalance)`:
  - Recipient must be whitelisted
  - Recipient post-transfer balance must be ≤ 10% of hard cap
- Compute max holding with `getMaxHolding()` as 10% of 1,000,000 tokens (18 decimals).
- Block blacklist unless the target has zero balance. Emits `InvestorWhitelisted`/`InvestorBlacklisted`.

Key behaviors:
- `validateTransfer` returns `(bool ok, string reason)`. The token contract reverts with this `reason` string when not ok.
- `notifyClawbackReceived(from, amount)` is called by the token on clawback to emit an event. This is for analytics/visibility and doesn’t mutate balances (token transfer already happened at the token layer).

### RealEstateToken.sol

Token economics:
- Hard cap: 1,000,000 tokens (18 decimals)
- Price: 0.001 ETH per token (1e15 wei)
- Property metadata via `setPropertyInfo(name, location, totalValue, tokenPriceWei)` and `getPropertyInfo()`.

Purchases (`purchaseTokens()`):
- Caller must be whitelisted.
- Token amount computed using floor division by price.
- Enforces per-investor 10% limit strictly.
- Honors remaining hard cap: mints up to the remaining supply and refunds unused ETH.
- Emits `TokensPurchased(buyer, amount, ethPaid)` and updates `totalRaised`.

Transfers and compliance:
- Overrides internal `_update(from,to,value)` to consult `ComplianceManager.validateTransfer` for all user transfers.
- Skips validation only for mint, burn, and clawback-to-manager (admin action).
- On non-compliant transfer attempts, reverts with the exact reason string returned by the manager.

Admin utilities:
- `clawbackTokens(from, amount)`: forces a transfer from any account to the manager. Emits `TokensClawedBack` and notifies the manager.
- `mint`/`burn`: testing helpers gated by `SERVICE_PROVIDER_ROLE`.
- `withdraw`: withdraw ETH raised to the service provider.

## Usage

### Build

```shell
$ forge build
```

### Test

```shell
$ forge test
```

### Format

```shell
$ forge fmt
```

### Gas Snapshots

```shell
$ forge snapshot
```

### Anvil

```shell
$ anvil
```

### Local Deploy (Anvil + Script)

1. Start Anvil in a terminal:

```shell
anvil --block-time 1
```

2. Export the service provider private key from an Anvil account (example uses the first account):

```shell
export SERVICE_PROVIDER_PK=0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
```

3. Run the deploy script:

```shell
forge script script/Deploy.s.sol:Deploy \
  --rpc-url http://localhost:8545 \
  --broadcast -vvvv
```

The script deploys `ComplianceManager` and `RealEstateToken`, wires them, and sets initial property info. It prints both contract addresses.

### End-to-end Demo (Anvil + Cast)

Prereqs: export env and addresses after deploy

```shell
export RPC_URL=http://localhost:8545
export SERVICE_PROVIDER_ADDR=<anvil_account_0_address>
export SERVICE_PROVIDER_PK=<anvil_account_0_private_key>
export INVESTOR_A_ADDR=<anvil_account_1_address>
export INVESTOR_A_PK=<anvil_account_1_private_key>
export INVESTOR_B_ADDR=<anvil_account_2_address>
export INVESTOR_B_PK=<anvil_account_2_private_key>
export INVESTOR_C_ADDR=<anvil_account_3_address>
export INVESTOR_C_PK=<anvil_account_3_private_key>
export MANAGER=<ComplianceManager_address_from_deploy>
export MBST=<RealEstateToken_address_from_deploy>
```

#### Flow 1 — Project Creation & Tokenization
```bash
cast call $MBST "getPropertyInfo()(string,string,uint256,uint256)" --rpc-url $RPC_URL
cast call $MBST "isOversubscribed()(bool)" --rpc-url $RPC_URL
cast call $MBST "totalSupply()(uint256)" --rpc-url $RPC_URL
cast call $MANAGER "getMaxHolding()(uint256)" --rpc-url $RPC_URL
```

#### Flow 2 — Allowlist Management (Service Provider)
```bash
cast send $MANAGER "whitelistInvestor(address)" $INVESTOR_A_ADDR --rpc-url $RPC_URL --private-key $SERVICE_PROVIDER_PK
cast send $MANAGER "whitelistInvestor(address)" $INVESTOR_B_ADDR --rpc-url $RPC_URL --private-key $SERVICE_PROVIDER_PK
cast call $MANAGER "isWhitelisted(address)(bool)" $INVESTOR_A_ADDR --rpc-url $RPC_URL
cast call $MANAGER "isWhitelisted(address)(bool)" $INVESTOR_B_ADDR --rpc-url $RPC_URL
cast call $MANAGER "isWhitelisted(address)(bool)" $INVESTOR_C_ADDR --rpc-url $RPC_URL
```

#### Flow 3 — Investor Purchase
```bash
# Non-whitelisted C reverts
cast send $MBST "purchaseTokens()" --value 1000000000000000000 \
  --rpc-url $RPC_URL --private-key $INVESTOR_C_PK

# A: 120 ETH fails (over 10%)
cast send $MBST "purchaseTokens()" --value 120000000000000000000 \
  --rpc-url $RPC_URL --private-key $INVESTOR_A_PK

# A: 10 ETH succeeds (10,000 tokens)
cast send $MBST "purchaseTokens()" --value 10000000000000000000 \
  --rpc-url $RPC_URL --private-key $INVESTOR_A_PK
cast call $MBST "balanceOf(address)(uint256)" $INVESTOR_A_ADDR --rpc-url $RPC_URL
cast call $MBST "getTotalRaised()(uint256)" --rpc-url $RPC_URL

# B: 20 ETH succeeds (20,000 tokens)
cast send $MBST "purchaseTokens()" --value 20000000000000000000 \
  --rpc-url $RPC_URL --private-key $INVESTOR_B_PK
cast call $MBST "balanceOf(address)(uint256)" $INVESTOR_B_ADDR --rpc-url $RPC_URL
```

#### Flow 4 — Compliance Transfers
```bash
# A -> B (1,000 tokens) succeeds
cast send $MBST "transfer(address,uint256)" $INVESTOR_B_ADDR 1000000000000000000000 \
  --rpc-url $RPC_URL --private-key $INVESTOR_A_PK

# A -> C (1,000 tokens) reverts (NotWhitelisted)
cast send $MBST "transfer(address,uint256)" $INVESTOR_C_ADDR 1000000000000000000000 \
  --rpc-url $RPC_URL --private-key $INVESTOR_A_PK

# Bring B to 100,000 (optional)
cast send $MBST "purchaseTokens()" --value 80000000000000000000 \
  --rpc-url $RPC_URL --private-key $INVESTOR_B_PK

# A -> B (1 wei) reverts (ExceedsMaxHolding)
cast send $MBST "transfer(address,uint256)" $INVESTOR_B_ADDR 1 \
  --rpc-url $RPC_URL --private-key $INVESTOR_A_PK
```

#### Flow 5 — Clawback & Blacklist (Service Provider)
```bash
# Blacklist before clawback reverts (balance > 0)
cast send $MANAGER "blacklistInvestor(address)" $INVESTOR_B_ADDR \
  --rpc-url $RPC_URL --private-key $SERVICE_PROVIDER_PK

# Clawback 20,000 from B to manager
cast send $MBST "clawbackTokens(address,uint256)" $INVESTOR_B_ADDR 20000000000000000000000 \
  --rpc-url $RPC_URL --private-key $SERVICE_PROVIDER_PK
cast call $MBST "balanceOf(address)(uint256)" $INVESTOR_B_ADDR --rpc-url $RPC_URL
cast call $MBST "balanceOf(address)(uint256)" $MANAGER --rpc-url $RPC_URL

# Blacklist B (requires balance == 0; claw back remainder first if needed)
cast send $MANAGER "blacklistInvestor(address)" $INVESTOR_B_ADDR \
  --rpc-url $RPC_URL --private-key $SERVICE_PROVIDER_PK
cast call $MANAGER "isWhitelisted(address)(bool)" $INVESTOR_B_ADDR --rpc-url $RPC_URL
```

### Cast

```shell
$ cast <subcommand>
```

### Help

```shell
$ forge --help
$ anvil --help
$ cast --help
```
