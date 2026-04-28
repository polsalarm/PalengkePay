# Level Checklist — PalengkePay MVP

## Learning Objectives

- [x] **Full MVP feature development** — QR payments, BNPL/utang, vendor management, admin dashboard, PWA — all live on Stellar Testnet
- [x] **User acquisition and onboarding** — 6 verified testnet users (3 customers, 3 vendors); 4-step guided onboarding flow with wallet connect + Friendbot funding built in
- [x] **Collecting and implementing user feedback** — Google Form deployed; responses exported to Excel; feedback directly drove UI redesign (Phase 1 + Phase 2 redesigns committed)
- [x] **Architecture documentation** — contracts README, deployment guide, root README with full tech stack, contract test tables, and environment variable reference

---

## Required Deliverables

### Google Form
- [x] Collects: name, email, wallet address, product feedback (star rating)
- [x] Form live and shared with beta users

### Excel / Spreadsheet
- [x] Responses exported and accessible
- [x] Link in README: [User Feedback Responses →](https://docs.google.com/spreadsheets/d/1g0AYRCwqc1-zcxy2q5UnIGHtllJHsXSaUvTCD7POI-g/edit?usp=sharing)

### README Requirements
- [x] **Live demo link** — https://palengke-pay.vercel.app
- [ ] **Demo video link** — record and attach full MVP walkthrough
- [x] **5+ verified wallet addresses** — 6 wallets listed with Stellar Expert links
- [x] **User feedback documentation** — Google Sheet linked in README

### Improvement Plan
- [x] Next-phase improvements outlined in README based on collected feedback, with git commit links

---

## Feature Completion

### Payments
- [x] QR code generation (vendor)
- [x] QR code scanning (customer camera)
- [x] QR image upload (customer gallery)
- [x] Payment with memo
- [x] Transaction history

### BNPL / Utang
- [x] Vendor creates utang offer via QR flow
- [x] Vendor creates utang via manual entry
- [x] Fee payment before QR generation
- [x] Download QR as PNG
- [x] Customer scans / uploads utang QR
- [x] Customer accepts installment agreement
- [x] Installment payment with progress tracking
- [x] Overdue flagging

### Vendor
- [x] Self-service apply flow
- [x] Profile page (name, stall, product type, phone)
- [x] Transaction list with stats
- [x] QR display page

### Admin
- [x] Approve / reject pending applications
- [x] Deactivate active vendor
- [x] Direct vendor registration
- [x] Phone number visible on vendor cards

### Onboarding
- [x] Connect wallet page (5 wallet options)
- [x] 4-step onboard: Get wallet → Connect → Fund → Choose role
- [x] Freighter sign-in popup on every connect
- [x] Friendbot auto-fund with address pre-filled
- [x] Role selection navigates to correct dashboard

### PWA
- [x] Installable on Android and iOS
- [x] Offline shell
- [x] Branded icons and manifest
