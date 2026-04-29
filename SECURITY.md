# Security

## Checklist

| Area | Status | Detail |
|------|--------|--------|
| Contract admin auth | ✅ | Soroban `require_auth()` on all admin ops |
| Input sanitization | ✅ | `src/lib/sanitize.ts` — strips HTML, validates XLM amounts, 28-char memo limit |
| CSP headers | ✅ | `vercel.json` — strict Content-Security-Policy, X-Frame-Options: DENY |
| Private keys in frontend | ✅ | Zero — all signing via wallet extensions (Freighter / LOBSTR) |
| Secrets in repo | ✅ | `SPONSOR_SECRET` is server-only Vercel env var, never in `.env.local` |
| Fee bump auth | ✅ | Sponsor key only on server, never exposed to client |
| Memo length enforcement | ✅ | 28-char slice before tx build + sanitizeMemo() |
| XSS prevention | ✅ | No dangerouslySetInnerHTML; all user strings sanitized |
| Error monitoring | ✅ | Sentry — captures unhandled errors, failed Soroban calls |

## Reporting a Vulnerability

Open a **private** GitHub Security Advisory or email directly. Do not open a public issue for security bugs.

## Scope

- Smart contracts: `contracts/vendor-registry`, `contracts/palengke-payment`, `contracts/utang-escrow`
- Frontend PWA: `frontend/src`
- Fee bump API: `frontend/api/fee-bump.ts`
- Out of scope: Stellar testnet infrastructure, third-party wallet apps (Freighter, LOBSTR)
