## Foundry

**Foundry is a blazing fast, portable and modular toolkit for Ethereum application development written in Rust.**

Foundry consists of:

- **Forge**: Ethereum testing framework (like Truffle, Hardhat and DappTools).
- **Cast**: Swiss army knife for interacting with EVM smart contracts, sending transactions and getting chain data.
- **Anvil**: Local Ethereum node, akin to Ganache, Hardhat Network.
- **Chisel**: Fast, utilitarian, and verbose solidity REPL.

## Documentation

https://book.getfoundry.sh/

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
export RET=<RealEstateToken_address_from_deploy>
```

#### Flow 1 — Project Creation & Tokenization
```bash
cast call $RET "getPropertyInfo()(string,string,uint256,uint256)" --rpc-url $RPC_URL
cast call $RET "isOversubscribed()(bool)" --rpc-url $RPC_URL
cast call $RET "totalSupply()(uint256)" --rpc-url $RPC_URL
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
cast send $RET "purchaseTokens()" --value 1000000000000000000 \
  --rpc-url $RPC_URL --private-key $INVESTOR_C_PK

# A: 120 ETH fails (over 10%)
cast send $RET "purchaseTokens()" --value 120000000000000000000 \
  --rpc-url $RPC_URL --private-key $INVESTOR_A_PK

# A: 10 ETH succeeds (10,000 tokens)
cast send $RET "purchaseTokens()" --value 10000000000000000000 \
  --rpc-url $RPC_URL --private-key $INVESTOR_A_PK
cast call $RET "balanceOf(address)(uint256)" $INVESTOR_A_ADDR --rpc-url $RPC_URL
cast call $RET "getTotalRaised()(uint256)" --rpc-url $RPC_URL

# B: 20 ETH succeeds (20,000 tokens)
cast send $RET "purchaseTokens()" --value 20000000000000000000 \
  --rpc-url $RPC_URL --private-key $INVESTOR_B_PK
cast call $RET "balanceOf(address)(uint256)" $INVESTOR_B_ADDR --rpc-url $RPC_URL
```

#### Flow 4 — Compliance Transfers
```bash
# A -> B (1,000 tokens) succeeds
cast send $RET "transfer(address,uint256)" $INVESTOR_B_ADDR 1000000000000000000000 \
  --rpc-url $RPC_URL --private-key $INVESTOR_A_PK

# A -> C (1,000 tokens) reverts (NotWhitelisted)
cast send $RET "transfer(address,uint256)" $INVESTOR_C_ADDR 1000000000000000000000 \
  --rpc-url $RPC_URL --private-key $INVESTOR_A_PK

# Bring B to 100,000 (optional)
cast send $RET "purchaseTokens()" --value 80000000000000000000 \
  --rpc-url $RPC_URL --private-key $INVESTOR_B_PK

# A -> B (1 wei) reverts (ExceedsMaxHolding)
cast send $RET "transfer(address,uint256)" $INVESTOR_B_ADDR 1 \
  --rpc-url $RPC_URL --private-key $INVESTOR_A_PK
```

#### Flow 5 — Clawback & Blacklist (Service Provider)
```bash
# Blacklist before clawback reverts (balance > 0)
cast send $MANAGER "blacklistInvestor(address)" $INVESTOR_B_ADDR \
  --rpc-url $RPC_URL --private-key $SERVICE_PROVIDER_PK

# Clawback 20,000 from B to manager
cast send $RET "clawbackTokens(address,uint256)" $INVESTOR_B_ADDR 20000000000000000000000 \
  --rpc-url $RPC_URL --private-key $SERVICE_PROVIDER_PK
cast call $RET "balanceOf(address)(uint256)" $INVESTOR_B_ADDR --rpc-url $RPC_URL
cast call $RET "balanceOf(address)(uint256)" $MANAGER --rpc-url $RPC_URL

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
