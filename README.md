# PalengkePay

Stellar-powered micropayment PWA for Philippine wet market vendors. No bank account required.

---

## Problem

Philippine wet market vendors operate almost entirely in cash. This creates real friction:

- **No payment history** — disputes over what was paid, when, and how much
- **Manual utang tracking** — credit ("utang") managed on paper or memory, prone to loss and fraud
- **No digital trail** — vendors can't prove income for loans or government support
- **Exclusion from financial systems** — no bank account means no digital payments, no receipts, no records

Customers face matching problems: no receipt for purchases, no structured repayment for credit, no visibility into what they owe.

---

## Solution

PalengkePay puts a Stellar wallet in every vendor's pocket and a QR code on every stall. Payments settle on-chain in seconds. Credit agreements are recorded as smart contracts — tamper-proof, visible to both parties, and repaid installment by installment.

- Vendor generates a QR code → customer scans and pays
- Vendor offers installment credit (utang) → QR-based or manual → customer accepts on their phone
- Every transaction is on-chain: immutable, auditable, no middleman

---

## Core Features

### Payments
- **QR-based payments** — vendor displays QR, customer scans and pays XLM in seconds
- **Vendor identity in QR** — name and stall info embedded in the QR code so customers see who they're paying before signing
- **Memo field** — customer logs what they bought (e.g. "2kg tilapia") visible in transaction history
- **Real-time notifications** — vendor gets a browser push notification on payment received, including the memo/item detail

### BNPL / Utang (Credit)
- **QR offer flow** — vendor fills in items, amount, installments, interval → pays a service fee → QR generated → customer scans to accept (no wallet address typing needed)
- **Manual entry** — vendor types or scans customer wallet address directly
- **On-chain items description** — what the customer is buying on credit is stored in the smart contract
- **Customer acceptance** — customer scans vendor's utang QR, reviews all terms, signs and submits the agreement from their own wallet
- **Installment tracking** — progress bar per agreement, due dates, overdue flagging
- **Vendor name resolution** — customer's utang list shows the vendor's name, not a wallet address

### Vendor Management
- **Self-service apply flow** — vendor submits stall info on-chain, no admin needed upfront
- **Admin approve/reject** — admin wallet reviews pending applications and approves or rejects on-chain
- **Admin deactivate** — admin can deactivate an active vendor from the dashboard
- **Vendor profile** — name, stall number, product type, transaction count, volume

### Admin Dashboard
- Pending applications tab with approve/reject inline
- Registered vendors tab with deactivate button
- Stats clickable as tab switchers
- Direct vendor registration (bypass apply flow)

### PWA
- Installable on mobile and desktop
- Offline-capable shell
- Branded icons and manifest

---

## Contracts

| Contract | Contract ID | Purpose |
|----------|-------------|---------|
| `VendorRegistry` | `CA5QQ2SE4XTBX3K4XNHLNAL36GIJOJ3KXYDS2VLAYZC4Q5FAYMDWZUJH` | Vendor registration, apply/approve/reject/deactivate, profiles |
| `PalengkePayment` | `CCVHL724CBAKIBEM2BMWUV35FXXV2TESWC3ZK3UQVLUEGCQ7LNN6ZUNF` | QR-based payments with fee support and stat tracking |
| `UTangEscrow` | `CD2VU3FLA473TCD67TBYXTQROWLJUUWVNPK56CMWBS6GW3N3ZO4JM5BG` | BNPL installment agreements — create, pay, complete, default |

All deployed on Stellar Testnet. See [`docs/contract-deployment.md`](docs/contract-deployment.md) for deployment guide.

> **Note:** Stellar Testnet resets periodically (~quarterly). Contract IDs above are from the last deployment (April 2026). After a reset, redeploy via `docs/contract-deployment.md` and update `.env.local` and this table.

---

## App Flow

### Vendor
1. Go to `/vendor/apply` → submit stall info on-chain
2. Admin approves at `/admin/market`
3. Vendor dashboard → generate QR for payments
4. Vendor Utang tab → create installment agreements via QR or manual entry

### Customer
1. Scan vendor QR at `/customer/scan` → enter amount + memo → pay
2. View history at `/customer/history`
3. My Utang tab → scan vendor's utang QR → accept installment plan → pay installments

### Admin
- `/admin/market` — review pending applications, approve/reject, deactivate vendors
- `/admin/register` — direct vendor registration

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
cargo test --workspace        # run all tests
stellar contract build        # build WASM for deployment
```

---

## Environment Variables

Create `frontend/.env.local`:

```env
VITE_STELLAR_NETWORK=testnet
VITE_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
VITE_VENDOR_REGISTRY_CONTRACT_ID=CA5QQ2SE4XTBX3K4XNHLNAL36GIJOJ3KXYDS2VLAYZC4Q5FAYMDWZUJH
VITE_PALENGKE_PAYMENT_CONTRACT_ID=CCVHL724CBAKIBEM2BMWUV35FXXV2TESWC3ZK3UQVLUEGCQ7LNN6ZUNF
VITE_UTANG_ESCROW_CONTRACT_ID=CD2VU3FLA473TCD67TBYXTQROWLJUUWVNPK56CMWBS6GW3N3ZO4JM5BG
VITE_UTANG_FEE_XLM=1
```

`VITE_UTANG_FEE_XLM` — XLM fee charged to vendors per utang QR creation (default: `1`).

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19 + Vite 8 + TypeScript + Tailwind CSS v4 |
| Wallet | `@creit.tech/stellar-wallets-kit` (Freighter, LOBSTR, xBull, Albedo) |
| Blockchain | Stellar Testnet + Soroban smart contracts (Rust, soroban-sdk 22.x) |
| QR | `qrcode.react` (generate) + `html5-qrcode` (scan) |
| PWA | `vite-plugin-pwa` + Workbox |

---

## Deployment

See [`docs/contract-deployment.md`](docs/contract-deployment.md) for step-by-step Stellar Testnet deployment.

**Note:** Stellar Testnet resets periodically (~3 months). Redeploy contracts and update `.env.local` when that happens.
