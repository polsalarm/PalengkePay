# PalengkePay — Claude Code Prompts

Copy-paste these into Claude Code terminal one phase at a time. Always wait for a phase to be complete and tested before moving to the next.

---

## Setup (do this yourself first)

```bash
mkdir palengkepay
cd palengkepay
git init
mkdir -p docs
# Copy the two spec files into docs/
# architecture.md → docs/architecture.md
# design-system.md → docs/design-system.md
```

---

## Phase 1: Foundation

```
Read these two files carefully before doing anything:
- docs/architecture.md (full architecture plan)
- docs/design-system.md (UI/UX specifications)

We're building PalengkePay — a Stellar micropayment platform for Philippine wet markets. Start Phase 1: Foundation.

Build the frontend foundation:

1. Initialize a React + Vite project in /frontend with TypeScript and Tailwind CSS. Set up vite-plugin-pwa for PWA support with a proper manifest.json (app name: "PalengkePay", theme color: #0F766E, display: standalone). Add Inter font from Google Fonts. Install react-router-dom v7 for client-side routing.

2. Create the route definitions in src/App.tsx using react-router-dom. Define all routes from the architecture doc (/, /connect, /vendor/*, /customer/*, /admin/*, /onboard). Wrap everything in a Layout component with sticky top bar and bottom navigation.

3. Build the WalletProvider context component in src/components/WalletProvider.tsx using StellarWalletsKit. Support these wallets: Freighter, Lobstr, xBull, Albedo, WalletConnect. The provider should expose: address, balance, isConnected, connect(), disconnect(), and signTransaction(). Use Stellar Testnet.

4. Build the WalletButton component — shows "Connect Wallet" when disconnected (teal button), shows a pill with green dot + truncated address + XLM balance when connected. Tap to expand with full address + copy button + disconnect option.

5. Build the BalanceDisplay component — large centered balance with skeleton loader while fetching. Fetches from Horizon testnet API.

6. Build a basic SendXLM page at /test-send with a form: recipient address input, amount input, memo input, and a "Send" button. Include full TxStatusTracker component showing all 5 states (building → signing → submitting → confirmed → failed) with the exact UI described in the design system.

7. Handle all wallet error states from the architecture doc: wallet not found, user rejected, wrong network, insufficient balance, transaction timeout.

8. Set up the Layout component in src/components/Layout.tsx with sticky top bar (WalletButton) and bottom navigation tabs as specified in the design system. Use lucide-react icons.

9. Initialize Firebase in src/lib/firebase.ts with Firestore. Use environment variables for Firebase config (VITE_FIREBASE_API_KEY etc).

10. Create the /connect page and /onboard page with the 4-step onboarding wizard from the design system.

Follow the exact component names, file paths, hook names, color values, and layout specs from both docs. Mobile-first — design for 375px base width, max-w-md mx-auto on desktop.
```

---

## Phase 2: Core Product

```
Read docs/architecture.md and docs/design-system.md again for reference.

Build Phase 2: Core Product. We already have wallet integration, balance display, and send XLM from Phase 1.

Smart contracts (Rust/Soroban):

1. Create the PalengkePayment contract in contracts/palengke-payment/src/lib.rs. Follow the exact contract spec from the architecture doc — storage, structs, functions, events. Include the inter-contract call to VendorRegistry.increment_stats() inside the pay() function.

2. Create the VendorRegistry contract in contracts/vendor-registry/src/lib.rs. Follow the exact spec — register_vendor, deactivate_vendor, increment_stats, get_vendor.

3. Write unit tests for both contracts in their respective test.rs files. Test happy paths and edge cases: double payment, paying non-registered vendor, registering duplicate vendor.

4. Add a deploy script or instructions in the contracts README for deploying to Stellar Testnet via stellar-cli.

Frontend:

5. Build the vendor registration flow at /admin/register (src/pages/admin/AdminRegister.tsx) — form with vendor name, stall number, product type, wallet address. On submit: call VendorRegistry.register_vendor() on-chain (admin wallet signs the tx) AND save vendor doc to Firestore (use wallet address as document ID, per the Firestore structure in the architecture doc). No API routes — everything is client-side.

6. Build QRGenerator component — renders a QR code from the vendor's wallet address using qrcode.react. Build the /vendor/qr page (src/pages/vendor/VendorQR.tsx) as a full-screen QR display optimized for showing to customers (high contrast, vendor name below, "Scan to pay me" text).

7. Build QRScanner component using html5-qrcode — camera viewfinder with scan frame. On successful scan, extract the vendor wallet address and navigate to the payment form. Include "Enter address manually" fallback button.

8. Build the customer scan-to-pay flow: /customer/scan (QR scanner) → PaymentForm (amount + memo + Pay Now button) → TxStatusTracker → confirmation with tx hash link to Stellar Expert. The PaymentForm should show vendor name and stall info fetched from Firestore.

9. After successful on-chain payment, save transaction metadata to Firestore (transactions collection with tx hash as document ID, per the Firestore structure in the architecture doc).

10. Build the vendor dashboard at /vendor/home (src/pages/vendor/VendorHome.tsx) — today's earnings (sum of today's transactions), transaction count, recent payments list with customer address, amount, memo, and relative time. Follow the VendorDashboard wireframe in the design system.

11. Build the customer dashboard at /customer/home (src/pages/customer/CustomerHome.tsx) — balance display, prominent "Scan to Pay" button, and recent payment history.

12. Implement Horizon event streaming (SSE) in the vendor dashboard — when a new payment arrives, show a toast notification and refresh the transaction list without page reload. Follow the event streaming code from the architecture doc.

13. Add loading states (skeleton loaders) and empty states for all lists and data displays per the design system specs.

Use the generated TypeScript bindings from stellar-cli for contract calls. Follow all component names, routes, and Firestore structure from the architecture doc exactly.
```

---

## Phase 3: BNPL + Polish

```
Read docs/architecture.md and docs/design-system.md again.

Build Phase 3: BNPL (Utang) + Polish.

Smart contract:

1. Create the UTangEscrow contract in contracts/utang-escrow/src/lib.rs. Follow the exact spec: create_utang, pay_installment, mark_default, getters. All events: UtangCreated, InstallmentPaid, UtangCompleted, UtangDefaulted.

2. Write unit tests — happy path (create → pay all installments → completed), partial payment, overpay attempt, mark_default only when overdue, get_customer_utangs and get_vendor_utangs.

3. Deploy to Stellar Testnet.

Frontend:

4. Build the "New Utang" form on /vendor/utang — vendor enters customer wallet, total amount, number of installments (2/3/4 selector), interval (weekly/biweekly dropdown). On submit: call UTangEscrow.create_utang() on-chain + mirror to Firestore utangRecords collection.

5. Build the UtangCard component per the design system — progress bar, next due date (amber if within 3 days), status badge (Active/Completed/Defaulted).

6. Build vendor utang dashboard at /vendor/utang — list of all active utang agreements with UtangCards, showing who owes what and when. Filter tabs: Active / Completed / All.

7. Build customer utang view at /customer/utang — list of my active installment plans, upcoming due dates, "Pay Installment" button that calls UTangEscrow.pay_installment(). Show confirmation after payment.

8. Full mobile responsive pass — test every page at 375px width. Bottom nav must not overlap content (pb-20 on page content). All touch targets minimum 44x44px. QR scanner camera viewfinder must work on mobile Chrome.

9. Write Vitest unit tests for: useWallet hook, useBalance hook, usePayment hook, payment form validation, transaction status state machine, utang progress calculation.

10. Write Playwright e2e tests for: wallet connect/disconnect flow, QR generation displays correct address, payment form submission (mock wallet signing), vendor dashboard shows new transaction.

11. Add React Query or SWR for data fetching — cache balance (30s stale time), cache transaction list (refetch on window focus), cache vendor profile.
```

---

## Phase 4: Onboarding + Docs

```
Read docs/architecture.md.

Build Phase 4: Onboarding + Documentation.

1. Polish the /onboard page (src/pages/Onboard.tsx) — make sure the 4-step wizard works end to end: install wallet (with direct download links for Freighter and Lobstr), connect wallet (triggers StellarWalletsKit modal), get test XLM (link to friendbot with auto-populated address, auto-check balance after 5 seconds), success screen with "Go to Dashboard" button.

2. Set up GitHub Actions CI/CD in .github/workflows/ci.yml:
   - On push to main: lint (eslint), type check (tsc), run Vitest tests, run Playwright tests, build with Vite (vite build), deploy to static host.
   - On push to contracts/*: run soroban test for all contracts.

3. Write the README.md at the repo root with:
   - Project overview (what PalengkePay is, the problem it solves)
   - Architecture diagram (copy the ASCII diagram from architecture.md)
   - Tech stack list
   - Setup instructions (how to clone, install, configure Firebase, run locally with `npm run dev`)
   - Smart contract addresses on testnet
   - Links to contracts on Stellar Expert
   - Screenshots of key flows (we'll add these manually later)
   - Link to the user feedback Excel sheet (docs/user-feedback.xlsx)
   - "Improvement Plan" section with placeholder for feedback-based improvements with git commit links
   - Future roadmap (Phases 5-8 from architecture.md)

4. Create the Google Form structure document in docs/google-form-fields.md listing every field we need: name, email, Stellar wallet address (G...), role (vendor/customer/market admin), product rating (1-5 stars), "What did you like most?", "What was confusing?", "What feature would you add?". We'll create the actual Google Form manually from this spec.

5. Make sure the deployment checklist from architecture.md is complete — all contracts deployed, live URL accessible, Firebase provisioned, PWA installable.
```

---

## Tips for Working with Claude Code

1. **One phase at a time.** Don't skip ahead. Test each phase before moving on.

2. **If something breaks**, tell Claude Code exactly what the error is and which file it's in. Paste the error message.

3. **Don't let it improvise.** If it tries to use different component names, file paths, or colors than what's in the spec docs, correct it: "Follow the spec in docs/design-system.md — the primary color is #0F766E not whatever you used."

4. **After Phase 1**, commit everything to git before starting Phase 2. Same for each phase. This gives you rollback points.

5. **Test on your phone** after Phase 1 by running `npm run dev -- --host` and accessing it via your local IP (e.g. 192.168.1.x:5173). Check that the wallet modal opens, the layout looks right at mobile width, and the bottom nav doesn't overlap anything.

6. **Firebase setup** — you'll need to create the Firebase project manually at console.firebase.google.com, grab the config keys, and put them in .env.local with the `VITE_` prefix (e.g. VITE_FIREBASE_API_KEY). Claude Code can't do this for you.

7. **Contract deployment** — you'll need stellar-cli installed locally and a funded testnet account. Claude Code writes the contracts but you run the deploy commands yourself.

8. **No server-side code.** This is a pure client-side SPA. There are no API routes, no SSR, no getServerSideProps. All contract calls and Firebase operations happen directly from the browser.
