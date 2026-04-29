# Black Belt Checklist

## ✅ Done

| Item | Detail |
|------|--------|
| Advanced Feature — Fee Sponsorship | `api/fee-bump.ts` + gasless payment flow |
| Gasless badge in UI | "Gasless — fees sponsored" shown below Pay Now button |
| Metrics Dashboard | `/admin/metrics` — vendors, volume, tx count, top 5 |
| Data Indexing | Cursor-based Horizon indexer, localStorage cache |
| Monitoring — Sentry | Init in `main.tsx`, disabled if no DSN |
| Monitoring — Health endpoint | `api/health.ts` checks Horizon + Soroban RPC |
| Security — CSP headers | `vercel.json` — CSP, X-Frame-Options DENY |
| Security — Input sanitization | `src/lib/sanitize.ts` |
| Security — SECURITY.md | Full checklist documented |
| Documentation — CONTRIBUTING.md | Setup guide, 5 good-first issues, PR template |
| Documentation — README updated | Gasless + metrics callout, Tech Stack updated |
| Community — 3 GitHub issues opened | [#1](https://github.com/polsalarm/PalengkePay/issues/1) · [#2](https://github.com/polsalarm/PalengkePay/issues/2) · [#3](https://github.com/polsalarm/PalengkePay/issues/3) |
| Friendbot faucet button | `/connect` page — funds wallet with 10,000 testnet XLM |
| Production-ready app | Deployed on Vercel |

---

## ❌ Not Done

| Item | What to Do |
|------|------------|
| 15+ commits pushed | Run commits 1–15 from ROADMAP.md — say "commit now" |
| 30+ verified active users | Share [palengke-pay.vercel.app](https://palengke-pay.vercel.app) — Discord, Filipino dev groups, classmates |
| 1 external PR merged | Someone picks up issue #1, #2, or #3 and submits PR |
| VITE_SENTRY_DSN set | Sign up at sentry.io → grab DSN → add to Vercel env vars |
| SPONSOR_SECRET set | Fund a testnet wallet → add secret to Vercel env vars (never commit) |
