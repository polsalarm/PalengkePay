# PalengkePay — Black Belt Roadmap

## Requirements Checklist

- [ ] 30+ verified active users
- [x] Metrics dashboard live
- [x] Security checklist completed
- [x] Monitoring active
- [x] Data indexing implemented
- [x] Full documentation
- [x] 1 community contribution (3 good-first issues created: #1 #2 #3)
- [x] 1 advanced feature implemented — Fee Sponsorship (gasless)
- [ ] 15+ meaningful commits
- [x] Production-ready application

---

## Build Status

| Feature | Status | Committed |
|---------|--------|-----------|
| Fee Sponsorship (gasless) | ✅ Built | ⏳ Pending |
| Gasless badge in PaymentForm | ✅ Built | ⏳ Pending |
| Metrics Dashboard | ✅ Built | ⏳ Pending |
| Data Indexing | ✅ Built | ⏳ Pending |
| Monitoring (Sentry + health) | ✅ Built | ⏳ Pending |
| Security (CSP + sanitizer) | ✅ Built | ⏳ Pending |
| Full Documentation | ✅ Built | ⏳ Pending |
| README — gasless + metrics callout | ✅ Built | ⏳ Pending |
| Friendbot faucet button | ✅ Built | ⏳ Pending |
| CONTRIBUTING.md | ✅ Built | ⏳ Pending |
| GitHub good-first issues | ✅ Created (#1 #2 #3) | ✅ Live |

---

## Advanced Feature

- [x] **Fee Sponsorship** — Gasless transactions via fee bump ⭐

---

## Feature Breakdown

### 1. Fee Sponsorship — Gasless Transactions ✅ BUILT
**Why:** Vendors/customers pay zero fees. Removes #1 adoption blocker.

- [x] `frontend/api/fee-bump.ts` — Vercel fn wraps inner tx with FeeBumpTransaction
- [x] `submitWithFeeBump()` in `frontend/src/lib/stellar.ts`
- [x] `frontend/src/lib/contracts.ts` — routes payments through fee-bump
- [x] `frontend/src/lib/hooks/usePayment.ts` — uses fee-bump
- [x] `frontend/vercel.json` — rewrite excludes `/api/*`
- [x] `frontend/.env.example` — documents `VITE_FEE_BUMP_URL`
- [x] "Gasless" badge below Pay Now button in PaymentForm

> ⚠️ **BEFORE DEPLOYING:** Add `SPONSOR_SECRET=<funded_testnet_secret>` to Vercel dashboard → Environment Variables. Never commit this key.

### 2. Metrics Dashboard ✅ BUILT
- [x] `frontend/src/pages/admin/AdminMetrics.tsx` — full metrics page
- [x] `frontend/src/lib/hooks/useMetrics.ts` — aggregates Soroban data
- [x] Live stats: active vendors, tx count, total XLM volume, avg tx size
- [x] Product category breakdown bars
- [x] Top 5 vendors by volume with progress bars
- [x] Route `/admin/metrics` added to App.tsx
- [x] "Metrics" button added to AdminMarket header

### 3. Data Indexing ✅ BUILT
- [x] `frontend/src/lib/indexer.ts` — cursor-based Horizon indexer with localStorage cache
- [x] `useVendorTransactions` — shows cache instantly, syncs in background
- [x] `useCustomerTransactions` — same pattern

### 4. Monitoring ✅ BUILT
- [x] `@sentry/react` installed, init in `frontend/src/main.tsx`
- [x] `VITE_SENTRY_DSN` env var — disabled if not set
- [x] `frontend/api/health.ts` — checks Horizon + Soroban RPC liveness

> ⚠️ **TODO:** Set `VITE_SENTRY_DSN` on Vercel dashboard — sign up at sentry.io for free DSN

### 5. Security ✅ BUILT
- [x] CSP + X-Frame-Options + security headers in `frontend/vercel.json`
- [x] `frontend/src/lib/sanitize.ts` — sanitizeText, sanitizeMemo, isValidXlmAmount, isValidStellarAddress
- [x] `SECURITY.md` — full checklist documented

### 6. Documentation ✅ BUILT
- [x] `CONTRIBUTING.md` — good-first-issues, PR template, setup guide
- [x] `SECURITY.md` — security checklist
- [x] README — gasless + metrics callout sections added

### 7. Community Contribution ✅ LIVE
- [x] GitHub issue #1: [Add PHP/XLM live conversion rate display](https://github.com/polsalarm/PalengkePay/issues/1)
- [x] GitHub issue #2: [Add vendor search and filter in Market Directory](https://github.com/polsalarm/PalengkePay/issues/2)
- [x] GitHub issue #3: [Add print-ready QR code layout (A5 sticker)](https://github.com/polsalarm/PalengkePay/issues/3)
- [ ] Get 1 PR merged from external contributor

### 8. User Acquisition (30+ verified)
- [x] Friendbot faucet button on `/connect` page
- [ ] Share onboard link — Stellar Discord `#showcase`
- [ ] Share in Filipino dev communities
- [ ] Add each verified wallet to README table

---

## Commit Plan (15+)

| # | Commit | Status |
|---|--------|--------|
| 1 | `feat(api): add fee-bump sponsorship edge function` | ⏳ |
| 2 | `feat(stellar): add buildFeeBumpXdr and gasless payment support` | ⏳ |
| 3 | `feat(payment): route payments through fee-bump server` | ⏳ |
| 4 | `feat(ui): add gasless badge to PaymentForm` | ⏳ |
| 5 | `feat(connect): add Friendbot testnet faucet button` | ⏳ |
| 6 | `feat(metrics): add AdminMetrics page with live Horizon stats` | ⏳ |
| 7 | `feat(metrics): add useMetrics hook aggregating Soroban data` | ⏳ |
| 8 | `feat(indexer): add cursor-based Horizon payment indexer` | ⏳ |
| 9 | `feat(indexer): integrate indexer into vendor and customer tx views` | ⏳ |
| 10 | `feat(monitoring): add Sentry error tracking` | ⏳ |
| 11 | `feat(api): add /health endpoint for Horizon + RPC liveness` | ⏳ |
| 12 | `feat(security): add CSP headers in vercel.json` | ⏳ |
| 13 | `feat(security): add input sanitization util` | ⏳ |
| 14 | `docs: add CONTRIBUTING, SECURITY, and good-first issues` | ⏳ |
| 15 | `docs: update README with gasless and metrics callout` | ⏳ |
