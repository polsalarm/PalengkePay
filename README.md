# PalengkePay

Stellar-powered micropayment PWA for Philippine wet market vendors. Vendors get a QR code, customers scan and pay on-chain. No bank account required.

**Stack:** React 18 + Vite + TypeScript + Tailwind CSS · Soroban smart contracts (Rust) · Stellar Testnet

---

## Contracts

| Contract | Purpose |
|----------|---------|
| `VendorRegistry` | Vendor registration, apply/approve flow, profiles |
| `PalengkePayment` | QR-based payments with fee support |
| `UTangEscrow` | BNPL installment payments (utang system) |

Deployed on Stellar Testnet. See [`docs/contract-deployment.md`](docs/contract-deployment.md) for full deployment guide.

---

## Local Setup

### Prerequisites

- Node.js 20+
- Rust + `wasm32v1-none` target
- [stellar-cli](https://github.com/stellar/stellar-cli) 25.2+
- [Freighter wallet](https://www.freighter.app/) browser extension

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local   # fill in contract IDs
npm run dev
```

Open `http://localhost:5173`

### Contracts

```bash
cd contracts
cargo test --workspace        # run all tests (20 tests)
stellar contract build        # build WASM for deployment
```

---

## Environment Variables

Create `frontend/.env.local`:

```env
VITE_STELLAR_NETWORK=testnet
VITE_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
VITE_VENDOR_REGISTRY_CONTRACT_ID=C...
VITE_PALENGKE_PAYMENT_CONTRACT_ID=C...
VITE_UTANG_ESCROW_CONTRACT_ID=C...
```

---

## App Flow

### Vendor
1. Go to `/vendor/apply` → submit stall info on-chain
2. Admin approves at `/admin/market`
3. Vendor accesses dashboard, generates QR code for payments
4. Can offer BNPL (utang) installments to customers

### Customer
1. Scan vendor QR code at `/customer/scan`
2. Enter amount → sign with Stellar wallet → payment settles in seconds
3. View payment history at `/customer/history`
4. Manage utang installments at `/customer/utang`

### Admin (palengkepay wallet)
- `/admin/market` — review pending applications, approve/reject
- `/admin/register` — direct vendor registration

---

## Deployment

See [`docs/contract-deployment.md`](docs/contract-deployment.md) for step-by-step Stellar Testnet deployment with screenshot checkpoints.

**Note:** Stellar Testnet resets periodically (~3 months). Redeploy contracts and update `.env.local` when that happens.
