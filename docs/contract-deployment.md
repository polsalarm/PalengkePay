# Contract Deployment Guide — Stellar Testnet

## Overview

3 contracts → 3 contract IDs. Each deployed separately. Each gets a unique `C...` address.

| Contract | WASM file | Env var |
|----------|-----------|---------|
| VendorRegistry | `vendor_registry.wasm` | `VITE_VENDOR_REGISTRY_CONTRACT_ID` |
| PalengkePayment | `palengke_payment.wasm` | `VITE_PALENGKE_PAYMENT_CONTRACT_ID` |
| UTangEscrow | `utang_escrow.wasm` | `VITE_UTANG_ESCROW_CONTRACT_ID` |

After all 3 are deployed and `.env.local` is updated → vendor registration, profiles, and utang all work.

---

## Prerequisites

### 1. Check stellar-cli installed
```bash
stellar --version
```
If not installed:
```bash
cargo install stellar-cli --features opt
```
Or download from: https://github.com/stellar/stellar-cli/releases

### 2. Check Rust wasm target installed
```bash
rustup target list --installed | grep wasm32
```
If missing:
```bash
rustup target add wasm32-unknown-unknown
```

---

## Step 1 — Create Identity

Creates a keypair named `palengkepay` stored in stellar-cli's keystore.

```bash
stellar keys generate palengkepay --network testnet
```

View the public address:
```bash
stellar keys address palengkepay
```

**→ PAUSE HERE: screenshot the public address (G...)**

---

## Step 2 — Fund with Testnet XLM

```bash
stellar keys fund palengkepay --network testnet
```

This hits Friendbot — gives ~10,000 XLM testnet. Free, instant.

**→ PAUSE HERE: screenshot the funded balance on Stellar Expert**
URL: `https://stellar.expert/explorer/testnet/account/<YOUR_G_ADDRESS>`

---

## Step 3 — Build All Contracts

```bash
cd contracts
stellar contract build
```

Outputs 3 WASM files into `target/wasm32-unknown-unknown/release/`:
- `vendor_registry.wasm`
- `palengke_payment.wasm`
- `utang_escrow.wasm`

---

## Step 4 — Get Native XLM Token Address

PalengkePayment and UTangEscrow need the native XLM Stellar Asset Contract address:

```bash
stellar contract id asset --asset native --network testnet
```

Copy the `C...` address — you'll use it in Steps 6 and 9.

---

## Step 5 — Deploy VendorRegistry

```bash
stellar contract deploy \
  --wasm contracts/target/wasm32-unknown-unknown/release/vendor_registry.wasm \
  --source palengkepay \
  --network testnet
```

Prints contract ID → **copy it** (looks like `CAABC...XYZ`).

**→ PAUSE HERE: screenshot the contract ID**

### Initialize VendorRegistry

```bash
stellar contract invoke \
  --id <VENDOR_REGISTRY_CONTRACT_ID> \
  --source palengkepay \
  --network testnet \
  -- initialize \
  --admin $(stellar keys address palengkepay)
```

---

## Step 6 — Deploy PalengkePayment

```bash
stellar contract deploy \
  --wasm contracts/target/wasm32-unknown-unknown/release/palengke_payment.wasm \
  --source palengkepay \
  --network testnet
```

Copy contract ID.

**→ PAUSE HERE: screenshot the contract ID**

### Initialize PalengkePayment

```bash
stellar contract invoke \
  --id <PALENGKE_PAYMENT_CONTRACT_ID> \
  --source palengkepay \
  --network testnet \
  -- initialize \
  --admin $(stellar keys address palengkepay) \
  --fee_bps 0 \
  --native_token <NATIVE_XLM_ADDRESS_FROM_STEP_4>
```

---

## Step 7 — Deploy UTangEscrow

```bash
stellar contract deploy \
  --wasm contracts/target/wasm32-unknown-unknown/release/utang_escrow.wasm \
  --source palengkepay \
  --network testnet
```

Copy contract ID.

**→ PAUSE HERE: screenshot the contract ID**

### Initialize UTangEscrow

```bash
stellar contract invoke \
  --id <UTANG_ESCROW_CONTRACT_ID> \
  --source palengkepay \
  --network testnet \
  -- initialize \
  --admin $(stellar keys address palengkepay) \
  --native_token <NATIVE_XLM_ADDRESS_FROM_STEP_4>
```

---

## Step 8 — Update .env.local

Open `frontend/.env.local` and add/update:

```env
VITE_VENDOR_REGISTRY_CONTRACT_ID=<from Step 5>
VITE_PALENGKE_PAYMENT_CONTRACT_ID=<from Step 6>
VITE_UTANG_ESCROW_CONTRACT_ID=<from Step 7>
VITE_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
```

---

## Step 9 — Test Deployment

Verify each contract responds:

```bash
# Check VendorRegistry
stellar contract invoke \
  --id <VENDOR_REGISTRY_CONTRACT_ID> \
  --source palengkepay \
  --network testnet \
  -- vendor_count

# Check PalengkePayment
stellar contract invoke \
  --id <PALENGKE_PAYMENT_CONTRACT_ID> \
  --source palengkepay \
  --network testnet \
  -- payment_count

# Check UTangEscrow
stellar contract invoke \
  --id <UTANG_ESCROW_CONTRACT_ID> \
  --source palengkepay \
  --network testnet \
  -- utang_count
```

All should return `0`.

**→ PAUSE HERE: screenshot all 3 returning 0**

---

## Step 10 — Restart Dev Server

```bash
cd frontend
npm run dev
```

Open `/admin/register` → should now show the registration form (not the "contract not deployed" banner).

**→ PAUSE HERE: screenshot the working admin register page**

---

## Contract Addresses (fill in after deployment)

| Contract | Address |
|----------|---------|
| VendorRegistry | `C...` |
| PalengkePayment | `C...` |
| UTangEscrow | `C...` |
| palengkepay admin wallet | `G...` |
| Native XLM SAC | `C...` |

---

## Notes

- Identity `palengkepay` = admin wallet. Keep it — needed to register vendors and mark defaults.
- Contracts on Stellar Testnet reset periodically (~3 months). Re-deploy when that happens.
- Contracts are currently 0.3% fee (`fee_bps 0` = free). Change to 30 for 0.3% platform fee.
- Verify contracts on Stellar Expert: `https://stellar.expert/explorer/testnet/contract/<ID>`
