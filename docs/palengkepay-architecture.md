# PalengkePay — Architecture & Build Plan

## What is PalengkePay?

PalengkePay is a Stellar-powered micropayment platform for Philippine wet and dry markets. Vendors get a QR code, customers scan and pay, transactions settle in seconds on-chain. Every transaction builds the vendor's verifiable financial identity — something the banking system never gave them.

---

## Core Problem

Palengke vendors process hundreds of transactions daily in cash. They can't accept digital payments because existing fintech infrastructure wasn't built for them — merchant accounts require documentation they don't have, card fees destroy their margins, and the banking system treats them as invisible. PalengkePay gives them a zero-barrier entry point into digital payments and, over time, a financial identity they can actually use.

---

## System Overview

```
┌──────────────────────────────────────────────────────────┐
│                  FRONTEND (React + Vite PWA)                │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐       │
│  │ Customer  │  │  Vendor  │  │   Admin/Market    │       │
│  │   View    │  │   View   │  │   Manager View    │       │
│  └────┬─────┘  └────┬─────┘  └────────┬──────────┘       │
│       │              │                 │                  │
│       └──────────────┴─────────────────┘                  │
│                      │                                    │
│            StellarWalletsKit                              │
│      (Freighter / Lobstr / xBull / Albedo / WalletConnect)│
└──────────┬───────────────────────┬────────────────────────┘
           │                       │
  ┌────────▼────────┐    ┌────────▼────────┐
  │  Soroban Smart   │    │    Firebase     │
  │  Contracts       │    │   (Firestore)   │
  │                  │    │                 │
  │ • PalengkePayment│    │ • Vendor profiles│
  │ • UTangEscrow    │    │ • Market registry│
  │ • VendorRegistry │    │ • Tx metadata    │
  │                  │    │ • Feedback data  │
  └────────┬────────┘    └─────────────────┘
           │
  ┌────────▼────────┐
  │  Stellar Testnet │
  │  (Horizon API)   │
  └─────────────────┘
```

**No backend server.** Frontend is a pure client-side SPA. It talks directly to Soroban contracts via StellarWalletsKit, queries Horizon for balances and events, and uses Firebase client SDK for off-chain data. Admin-only operations are gated client-side via wallet address checks — no server routes needed.

---

## Hosting & Cost

| Service           | What it does                         | Plan       | Cost  |
|-------------------|--------------------------------------|------------|-------|
| Static Host       | Vite SPA (Vercel / Netlify / GH Pages)| Free tier | $0    |
| Firebase          | Firestore DB + Auth                  | Spark plan | $0    |
| Stellar Testnet   | Smart contracts + XLM transactions   | Testnet    | $0    |
| GitHub            | Repo + Actions CI/CD                 | Free tier  | $0    |
| **Total**         |                                      |            | **$0**|

Firebase Spark plan limits: 1GB Firestore storage, 50K reads/day, 20K writes/day, 10GB hosting, unlimited Auth users. More than enough for MVP.

---

## On-Chain vs Off-Chain Boundary

### On-chain (Soroban contracts)
- Payment settlement (XLM transfer)
- BNPL/Utang installment escrow logic
- Vendor registration (wallet address → vendor ID mapping)
- Transaction events (payment_completed, installment_due, installment_paid)
- Dispute state (if BNPL installment missed)

### Off-chain (Firebase Firestore)
- Vendor profile data (name, stall number, market, phone)
- Market registry (which palengke, how many vendors)
- Transaction metadata (item description, notes)
- User onboarding data (Google Form responses)

### Client-side only
- QR code generation (qrcode.react — no server needed)
- QR scanning (html5-qrcode — camera access)
- Horizon event streaming (SSE directly from browser)
- Balance fetching (Horizon API)

**Rule of thumb:** Money logic goes on-chain. Profile data goes in Firestore. Everything else stays client-side.

---

## Smart Contracts

### Contract 1: PalengkePayment

Core payment contract. Handles direct QR payments and emits events for the frontend to track.

```
Storage:
  - payment_count: u64
  - platform_fee_bps: u32 (basis points, e.g. 30 = 0.3%)
  - admin: Address
  - payments: Map<u64, Payment>

Payment struct:
  - id: u64
  - customer: Address
  - vendor: Address
  - amount: i128
  - timestamp: u64
  - memo: String (item description hash)
  - status: Completed

Functions:
  - initialize(admin, fee_bps)
  - pay(customer, vendor, amount, memo) → payment_id
  - get_payment(payment_id) → Payment
  - get_vendor_payments(vendor, limit, offset) → Vec<Payment>

Events:
  - PaymentCompleted { payment_id, customer, vendor, amount, timestamp }
```

### Contract 2: UTangEscrow

Handles buy-now-pay-later installments between customer and vendor.

```
Storage:
  - utang_count: u64
  - utangs: Map<u64, Utang>

Utang struct:
  - id: u64
  - customer: Address
  - vendor: Address
  - total_amount: i128
  - installment_amount: i128
  - installments_total: u32 (e.g. 3)
  - installments_paid: u32
  - next_due: u64 (timestamp)
  - interval_seconds: u64 (e.g. 604800 = 7 days)
  - status: Active | Completed | Defaulted

Functions:
  - create_utang(customer, vendor, total, installments, interval) → utang_id
  - pay_installment(customer, utang_id)
  - mark_default(admin, utang_id) — only if overdue > grace period
  - get_utang(utang_id) → Utang
  - get_customer_utangs(customer) → Vec<Utang>
  - get_vendor_utangs(vendor) → Vec<Utang>

Events:
  - UtangCreated { utang_id, customer, vendor, total, installments }
  - InstallmentPaid { utang_id, installment_number, remaining }
  - UtangCompleted { utang_id }
  - UtangDefaulted { utang_id, missed_installments }
```

### Contract 3: VendorRegistry

Maps wallet addresses to vendor IDs. Enables on-chain identity lookup.

```
Storage:
  - vendor_count: u64
  - vendors: Map<Address, VendorRecord>
  - admin: Address

VendorRecord struct:
  - id: u64
  - wallet: Address
  - market_id: String (off-chain reference)
  - registered_at: u64
  - total_transactions: u64
  - total_volume: i128
  - is_active: bool

Functions:
  - register_vendor(admin, wallet, market_id) → vendor_id
  - deactivate_vendor(admin, wallet)
  - increment_stats(vendor, amount) — called internally by PalengkePayment
  - get_vendor(wallet) → VendorRecord

Events:
  - VendorRegistered { vendor_id, wallet, market_id }
  - VendorDeactivated { vendor_id }
```

**Inter-contract call:** PalengkePayment.pay() calls VendorRegistry.increment_stats() on every successful payment. This builds the on-chain transaction history that becomes the vendor's financial identity.

---

## Tech Stack

### Frontend
- **React 18** (TypeScript, SPA)
- **Vite 6** (dev server, build tooling, HMR)
- **React Router v7** (client-side routing)
- **Tailwind CSS** (utility-first, mobile responsive)
- **vite-plugin-pwa** (installable on mobile, offline shell)
- **StellarWalletsKit** (multi-wallet: Freighter, Lobstr, xBull, Albedo, WalletConnect)
- **@stellar/stellar-sdk** (tx building, Horizon queries)
- **qrcode.react** (QR generation — client-side, no server needed)
- **html5-qrcode** (camera scanner for customer payments)

### Smart Contracts
- **Soroban SDK** (Rust)
- **stellar-cli** (build, deploy, generate TS bindings)
- **soroban-test** (unit testing)
- **Stellar Testnet** (deployment target)

### Off-chain Data
- **Firebase Firestore** (NoSQL document DB — vendor profiles, market data, tx metadata)
- **Firebase Auth** (optional — for admin panel access control)

### Blockchain Queries
- **Horizon API** (balance fetching, transaction monitoring, event streaming via SSE)
- **Soroban RPC** (contract invocation, simulation, state reads)

### DevOps
- **GitHub Actions** (CI/CD — lint, test, deploy)
- **Static hosting** (Vercel / Netlify / GitHub Pages — free tier)
- **Vitest** (frontend unit tests)
- **Playwright** (e2e tests)

---

## Firestore Data Structure

```
── markets (collection)
   └── {marketId} (document)
       ├── name: "Pamilihang Bayan ng Marikina"
       ├── location: "J.P. Rizal St, Marikina"
       ├── vendorCount: 47
       └── createdAt: timestamp

── vendors (collection, document ID = wallet address)
   └── {G...walletAddress} (document)
       ├── name: "Aling Nena"
       ├── marketId: "marikina-public-market"
       ├── stallNumber: "B-14"
       ├── productType: "fish"
       ├── phone: "+639171234567"
       ├── isActive: true
       └── createdAt: timestamp

── transactions (collection)
   └── {txHash} (document, ID = Stellar tx hash)
       ├── onChainPaymentId: 42
       ├── customerWallet: "G...abc"
       ├── vendorWallet: "G...xyz"
       ├── amountXlm: 15.5
       ├── memo: "2kg tilapia"
       ├── status: "completed"
       └── createdAt: timestamp

── utangRecords (collection)
   └── {utangId} (document)
       ├── onChainUtangId: 7
       ├── customerWallet: "G...abc"
       ├── vendorWallet: "G...xyz"
       ├── totalAmount: 150
       ├── installmentsTotal: 3
       ├── installmentsPaid: 1
       ├── nextDueDate: timestamp
       ├── status: "active"
       └── createdAt: timestamp

── feedback (collection)
   └── {responseId} (document)
       ├── name: "Juan Dela Cruz"
       ├── email: "juan@email.com"
       ├── walletAddress: "G...abc"
       ├── role: "vendor"
       ├── rating: 4
       ├── feedbackText: "Easy to use pero kelangan ng Filipino translation"
       └── createdAt: timestamp
```

**Why wallet address as vendor document ID:** It's unique per vendor and it's the primary key you'll always query by — from the contract event, from the QR code, from the dashboard. No extra lookup needed.

---

## Page Structure

```
/                         → Landing page (what is PalengkePay, download PWA)
/connect                  → Wallet connect (StellarWalletsKit modal)
/dashboard                → Role router (redirects to vendor or customer view)

/vendor
  /vendor/home            → Balance, today's earnings, recent transactions
  /vendor/qr              → Display vendor QR code (full screen for customers to scan)
  /vendor/transactions    → Transaction history with filters
  /vendor/utang           → Active BNPL agreements, installment tracker
  /vendor/profile         → Edit stall info, product type

/customer
  /customer/home          → Balance, scan-to-pay button
  /customer/scan          → Camera QR scanner → payment form
  /customer/history       → Past payments
  /customer/utang         → Active installment plans, upcoming due dates

/admin
  /admin/market           → Market overview, vendor list, aggregate stats
  /admin/register         → Register new vendor (admin-only)

/onboard                  → Guided setup flow (install wallet → fund testnet → first scan)
```

---

## User Flows

### Flow 1: Vendor onboarding
1. Market admin opens /admin/register
2. Enters vendor details (name, stall, product type, wallet address)
3. Frontend calls VendorRegistry.register_vendor() on-chain (admin wallet signs)
4. Vendor doc created in Firestore with wallet address as ID
5. QR code auto-generated client-side from wallet address
6. Vendor installs PWA, connects wallet, sees their QR and dashboard

### Flow 2: Customer pays vendor
1. Customer opens app → taps "Scan to Pay"
2. Camera opens via html5-qrcode → scans vendor QR
3. QR decodes to vendor wallet address → payment form pre-fills
4. Customer enters amount + optional memo ("2kg bangus")
5. StellarWalletsKit signs the transaction
6. PalengkePayment.pay() executes on-chain
7. VendorRegistry.increment_stats() called inter-contract
8. Tx metadata saved to Firestore after on-chain confirmation
9. Both parties see confirmation with tx hash link to Stellar Expert
10. Vendor dashboard updates via Horizon SSE event stream

### Flow 3: BNPL / Utang
1. Customer and vendor agree on installment terms in person
2. Vendor opens /vendor/utang → "New Utang" form
3. Enters: total amount, number of installments, interval (weekly/biweekly)
4. UTangEscrow.create_utang() records the agreement on-chain
5. Utang record mirrored in Firestore for dashboard display
6. Customer sees upcoming installment on /customer/utang
7. On due date, customer taps "Pay Installment" → signs tx
8. UTangEscrow.pay_installment() records payment on-chain
9. After final installment: UtangCompleted event → status updated
10. If overdue past grace period: admin can mark_default() on-chain

---

## Wallet Integration (StellarWalletsKit)

### Supported wallets
| Wallet        | Platform     | Priority  | Why                                |
|---------------|-------------|-----------|-------------------------------------|
| Freighter     | Desktop/Ext | Primary   | Most used by PH Web3 community     |
| Lobstr        | Mobile      | Primary   | Popular with casual users, mobile-first |
| xBull         | Desktop/Ext | Secondary | Good Soroban support               |
| Albedo        | Web-based   | Secondary | No extension install needed         |
| WalletConnect | Mobile      | Fallback  | Deep links to mobile wallets        |

### Error handling matrix
| Error                    | Detection                        | User message                              |
|--------------------------|----------------------------------|-------------------------------------------|
| No wallet installed      | kit.isAvailable() → false        | "Install Freighter to get started" + link |
| User rejected signing    | WalletUserRejectError            | "Transaction cancelled — no funds sent"   |
| Wrong network            | Network mismatch check           | "Please switch to Stellar Testnet"        |
| Insufficient XLM balance | Pre-check via Horizon balance    | "You need X more XLM" + faucet link       |
| Transaction timeout      | Horizon submission timeout       | "Transaction timed out — tap to retry"    |
| Contract call failed     | Soroban simulate error           | "Something went wrong — please try again" |

### Connection flow
```
1. User taps "Connect Wallet"
2. StellarWalletsKit.openModal() → wallet picker appears
3. User selects wallet → kit.setWallet(selectedId)
4. kit.getAddress() → returns G... address
5. Fetch balance via Horizon server.accounts().accountId(address)
6. Store address + balance in React context
7. Display wallet pill (truncated address + balance)
8. Disconnect: clear context, kit.disconnect()
```

---

## Transaction Status Tracking

```
States:
  BUILDING    → Tx being constructed client-side
  SIGNING     → Waiting for wallet signature
  SUBMITTING  → Sent to Horizon, awaiting inclusion
  CONFIRMED   → Included in ledger, tx hash available
  FAILED      → Rejected by network (show error reason)

UI:
  BUILDING    → spinner + "Preparing transaction..."
  SIGNING     → wallet icon + "Confirm in your wallet"
  SUBMITTING  → pulse animation + "Processing..."
  CONFIRMED   → green check + tx hash link to Stellar Expert
  FAILED      → red X + error message + retry button
```

---

## Event Streaming (Real-time updates)

```javascript
// Subscribe to vendor's payment events via Horizon SSE
const es = server
  .effects()
  .forAccount(vendorAddress)
  .cursor('now')
  .stream({
    onmessage: (effect) => {
      if (effect.type === 'account_credited') {
        // New payment received — update dashboard
        refreshVendorBalance();
        showPaymentToast(effect.amount);
      }
    }
  });
```

Runs client-side in the vendor's browser. No backend needed — Horizon provides the SSE endpoint directly.

---

## Testing Strategy

### Contract tests (Rust)
- Unit tests for every contract function
- Edge cases: double payment, pay non-registered vendor, installment overpay
- State transition tests: utang active → completed, active → defaulted

### Frontend tests (Vitest)
- Wallet connection/disconnection flow
- Balance display formatting
- QR code generation with correct address
- Payment form validation (amount > 0, vendor exists)
- Transaction status state machine

### E2E tests (Playwright)
- Full payment flow: connect → scan → pay → confirmation
- Vendor onboarding: register → QR generated → dashboard loads
- BNPL flow: create utang → pay installments → completion

---

## Build Phases

### Phase 1: Foundation (Week 1)
**Goal:** Wallet works, money moves, contract is deployed.

- [ ] Vite + React project setup with Tailwind + vite-plugin-pwa config
- [ ] StellarWalletsKit integration (connect, disconnect, all wallets)
- [ ] Fetch and display XLM balance from Horizon
- [ ] Send basic XLM transaction with full status tracking UI
- [ ] Error handling for all wallet edge cases
- [ ] PalengkePayment contract written in Rust
- [ ] VendorRegistry contract written in Rust
- [ ] Contract unit tests passing
- [ ] Deploy both contracts to Stellar Testnet
- [ ] Verify on Stellar Expert
- [ ] Generate TypeScript bindings via stellar-cli
- [ ] Firebase project setup (Firestore + Auth initialized)

### Phase 2: Core Product (Week 2)
**Goal:** Vendors can receive payments, customers can scan and pay.

- [ ] Vendor registration flow (admin registers on-chain + Firestore)
- [ ] QR code generation client-side (qrcode.react)
- [ ] Vendor QR display page (full screen, scannable)
- [ ] Customer scan-to-pay flow (camera → amount → sign → confirm)
- [ ] PalengkePayment.pay() called from frontend
- [ ] Inter-contract call: VendorRegistry.increment_stats()
- [ ] Tx metadata saved to Firestore after on-chain confirmation
- [ ] Vendor dashboard: today's earnings, transaction list
- [ ] Customer dashboard: payment history
- [ ] Horizon event streaming for real-time vendor updates
- [ ] Loading states and progress indicators on all async actions

### Phase 3: BNPL + Polish (Week 3)
**Goal:** Utang system works. UX is tight. Tests pass.

- [ ] UTangEscrow contract written + tested + deployed
- [ ] Create utang flow (vendor initiates, terms set)
- [ ] Pay installment flow (customer pays on schedule)
- [ ] Utang status tracking (active / completed / defaulted)
- [ ] Vendor utang dashboard (who owes what, next due dates)
- [ ] Customer utang view (upcoming payments, history)
- [ ] Mobile responsive pass (all views work on 375px width)
- [ ] Vitest unit tests for critical frontend logic
- [ ] E2E tests for payment and BNPL flows
- [ ] Basic caching (React Query or SWR for balance/tx data)

### Phase 4: Onboarding + Docs (Week 4)
**Goal:** Users onboarded. Feedback collected. README complete.

- [ ] Guided onboarding flow (install wallet → testnet faucet → first payment)
- [ ] Google Form: name, email, wallet address, role, rating, feedback
- [ ] Export form responses to Excel
- [ ] Onboard 15-25 users (vendors + customers)
- [ ] README with: project overview, architecture diagram, setup instructions
- [ ] Link exported Excel in README
- [ ] Improvement plan section in README based on feedback (with git commit links)
- [ ] CI/CD pipeline (GitHub Actions: lint → test → deploy on push)
- [ ] Final deploy: frontend on static host (Vercel / Netlify / GitHub Pages, free tier)

---

## Future Phases (Post-MVP)

These are documented but NOT built in the current cycle. They exist in the README as the evolution roadmap.

### Phase 5: Analytics + Credit Scoring
- Vendor analytics dashboard (weekly trends, top customers, peak hours)
- Transaction volume scoring algorithm
- Reliability score based on utang completion rate
- Vendor tier system (bronze/silver/gold based on volume + reliability)

### Phase 6: Micro-lending
- Vendor working capital loans (based on on-chain transaction history)
- Lending pool where XLM holders can fund vendor micro-loans
- Automated repayment via percentage of daily transactions
- Default handling with on-chain credit impact

### Phase 7: Supplier Financing + Inventory
- Vendor-to-supplier payment rails
- Purchase order tracking on-chain
- Inventory management tied to payment data
- Supplier credit terms based on vendor score

### Phase 8: Multi-currency + Scale
- PHP-pegged stablecoin integration (Stellar anchored asset)
- Peso display with live XLM/PHP rate
- OFW remittance → direct vendor payment (cross-border)
- Multi-market rollout (market admin dashboard for chains)
- SMS fallback for low-connectivity environments
- Offline transaction queue with sync-on-reconnect

---

## Repo Structure

```
palengkepay/
├── contracts/
│   ├── palengke-payment/
│   │   ├── src/lib.rs
│   │   └── src/test.rs
│   ├── utang-escrow/
│   │   ├── src/lib.rs
│   │   └── src/test.rs
│   └── vendor-registry/
│       ├── src/lib.rs
│       └── src/test.rs
├── frontend/
│   ├── index.html                     (Vite entry point)
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── package.json
│   ├── tsconfig.json
│   ├── public/
│   │   ├── manifest.json              (PWA manifest)
│   │   └── sw.js                      (service worker — auto-generated by vite-plugin-pwa)
│   └── src/
│       ├── main.tsx                    (React root + router mount)
│       ├── App.tsx                     (route definitions + layout shell)
│       ├── index.css                   (Tailwind base + custom tokens)
│       ├── pages/
│       │   ├── Landing.tsx
│       │   ├── Connect.tsx
│       │   ├── Onboard.tsx
│       │   ├── vendor/
│       │   │   ├── VendorHome.tsx
│       │   │   ├── VendorQR.tsx
│       │   │   ├── VendorTransactions.tsx
│       │   │   ├── VendorUtang.tsx
│       │   │   └── VendorProfile.tsx
│       │   ├── customer/
│       │   │   ├── CustomerHome.tsx
│       │   │   ├── CustomerScan.tsx
│       │   │   ├── CustomerHistory.tsx
│       │   │   └── CustomerUtang.tsx
│       │   └── admin/
│       │       ├── AdminMarket.tsx
│       │       └── AdminRegister.tsx
│       ├── components/
│       │   ├── WalletProvider.tsx      (StellarWalletsKit context)
│       │   ├── WalletButton.tsx        (connect/disconnect pill)
│       │   ├── Layout.tsx             (sticky top bar + bottom nav shell)
│       │   ├── QRGenerator.tsx
│       │   ├── QRScanner.tsx
│       │   ├── PaymentForm.tsx
│       │   ├── TxStatusTracker.tsx
│       │   ├── BalanceDisplay.tsx
│       │   ├── UtangCard.tsx
│       │   └── VendorCard.tsx
│       └── lib/
│           ├── stellar.ts             (sdk helpers, tx builder)
│           ├── contracts.ts           (generated Soroban bindings)
│           ├── firebase.ts            (Firebase client init + helpers)
│           └── hooks/
│               ├── useWallet.ts
│               ├── useBalance.ts
│               ├── usePayment.ts
│               └── useUtang.ts
├── docs/
│   ├── architecture.md                (this file)
│   ├── contract-spec.md
│   ├── user-feedback.xlsx
│   └── improvement-plan.md
├── .github/
│   └── workflows/
│       └── ci.yml
└── README.md
```

---

## Deployment Checklist

- [ ] Contracts deployed to Stellar Testnet
- [ ] Contract addresses documented in README
- [ ] Contracts verifiable on Stellar Expert
- [ ] Frontend deployed on static host (public URL, free tier)
- [ ] Firebase project provisioned (Firestore rules configured)
- [ ] PWA installable on mobile Chrome
- [ ] Google Form live and collecting responses
- [ ] Excel export attached to README
- [ ] All CI/CD checks passing on GitHub Actions
- [ ] README complete with setup instructions, architecture, and improvement plan
