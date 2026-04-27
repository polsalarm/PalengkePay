# PalengkePay — Smart Contracts

Two Soroban contracts on Stellar Testnet.

## Contracts

| Contract | Description |
|----------|-------------|
| `palengke-payment` | Core XLM payment settlement |
| `vendor-registry` | On-chain vendor identity + stats |

## Prerequisites

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Add wasm32 target
rustup target add wasm32-unknown-unknown

# Install Stellar CLI
cargo install --locked stellar-cli --features opt
```

## Build

```bash
cd contracts/palengke-payment
cargo build --release --target wasm32-unknown-unknown

cd contracts/vendor-registry
cargo build --release --target wasm32-unknown-unknown
```

## Test

```bash
cd contracts/palengke-payment && cargo test
cd contracts/vendor-registry && cargo test
```

## Deploy to Testnet

```bash
# Fund a testnet account (do this once)
stellar keys generate admin --network testnet
stellar keys fund admin --network testnet

# Deploy VendorRegistry first
stellar contract deploy \
  --wasm contracts/vendor-registry/target/wasm32-unknown-unknown/release/vendor_registry.wasm \
  --source admin \
  --network testnet

# Initialize VendorRegistry (replace CONTRACT_ID with output above)
stellar contract invoke \
  --id <VENDOR_REGISTRY_CONTRACT_ID> \
  --source admin \
  --network testnet \
  -- initialize \
  --admin $(stellar keys address admin)

# Deploy PalengkePayment
stellar contract deploy \
  --wasm contracts/palengke-payment/target/wasm32-unknown-unknown/release/palengke_payment.wasm \
  --source admin \
  --network testnet

# Initialize PalengkePayment
stellar contract invoke \
  --id <PALENGKE_PAYMENT_CONTRACT_ID> \
  --source admin \
  --network testnet \
  -- initialize \
  --admin $(stellar keys address admin) \
  --fee_bps 30 \
  --vendor_registry <VENDOR_REGISTRY_CONTRACT_ID>
```

## After Deploy

Add contract IDs to `frontend/.env.local`:

```env
VITE_VENDOR_REGISTRY_CONTRACT_ID=<VENDOR_REGISTRY_CONTRACT_ID>
VITE_PALENGKE_PAYMENT_CONTRACT_ID=<PALENGKE_PAYMENT_CONTRACT_ID>
VITE_ADMIN_WALLET=<admin G... address>
```

## Generate TypeScript Bindings (optional)

```bash
stellar contract bindings typescript \
  --network testnet \
  --id <PALENGKE_PAYMENT_CONTRACT_ID> \
  --output-dir frontend/src/lib/bindings/palengke-payment

stellar contract bindings typescript \
  --network testnet \
  --id <VENDOR_REGISTRY_CONTRACT_ID> \
  --output-dir frontend/src/lib/bindings/vendor-registry
```
