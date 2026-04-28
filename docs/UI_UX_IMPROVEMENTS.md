# PalengkePay UI/UX Improvement Plan

## Phase 1 — High Impact (Landing + Dashboards)
> Biggest visible impact for demos. Do these first.

### Landing Page
- [x] Hero: bigger typography, animated tagline, vendor illustration or market photo
- [x] Feature cards: bigger colored icons, more breathing room
- [x] Add stats row ("X vendors registered, X transactions processed")
- [x] CTA buttons: more contrast between primary and secondary
- [x] "How it works" steps: visual flow diagram instead of text list
- [x] Trust section: better integration with light theme above it

### CustomerHome Dashboard
- [x] Balance hero: add sparkline/mini chart or last-7-days summary
- [x] Quick action buttons: full-width pill cards with big icons
- [x] Recent transactions: date grouping (Today / Yesterday / This Week)
- [x] Amount color coding (green incoming, red outgoing)
- [x] Add real-time pulse dot on balance
- [x] "View all" link → make more prominent

### VendorHome Dashboard
- [x] Balance hero: week/month toggle summary
- [x] Quick actions (Show QR / Utang): bigger cards, icon affordance
- [x] Recent payments: date grouping, customer name resolution
- [x] Add earnings trend indicator (up/down vs yesterday)
- [x] Empty state: guide vendor to share QR code

---

## Phase 2 — Medium Impact (Lists + Key Flows)

### All List Pages (CustomerHistory, VendorTransactions, CustomerUtang, VendorUtang)
- [x] Date grouping on all transaction lists
- [x] Empty states: illustrations + action CTA buttons
- [x] Subtle row hover animations
- [x] Summary stats at top (total spent/earned, count)

### Market Directory
- [x] Bigger emoji treatment on vendor cards
- [x] Sort options (alphabetical, most active)

### VendorQR Page
- [x] Download/share button (PNG export)
- [x] Bigger vendor name display — this is a screen people show

### UtangCard Component
- [x] Progress bar label: "2 of 3 paid"
- [x] Overdue: pulsing border + warning banner
- [x] Show next due date prominently

### CustomerScan / Payment Flow
- [x] QR scanner viewfinder animation (corner brackets)
- [x] Confirmation step before payment submits
- [x] Success screen: next actions (pay again / view receipt / home)

### Onboarding
- [x] Slide animation between steps
- [x] Big celebration on final step (confetti or animation)
- [x] Progress bar with step labels

---

## Phase 3 — Polish (Micro-interactions + Consistency)

### Micro-interactions
- [x] Button press: `active:scale-95` on all buttons
- [x] Page transitions: slide-in from right on nav
- [x] Skeleton loaders on every list/loading state
- [x] Toast: bounce on slide-in

### Color System Standardization
- [x] teal = primary action
- [x] green = success / incoming
- [x] amber = warning / overdue
- [x] red = danger / error
- [x] slate = neutral / secondary

### Layout Fixes
- [x] Desktop sidebar: collapse button
- [x] Mobile bottom nav labels: increase from `text-[10px]`
- [x] Scroll-to-top button on long pages
- [x] Breadcrumb or page title in desktop header

### Component Polish
- [x] WalletButton: show which wallet is connected
- [x] TxStatusTracker: show transaction fee
- [x] PaymentForm: character count on memo field, peso/XLM display
- [x] BalanceDisplay: refresh button + last-updated timestamp
- [x] QRGenerator: download as PNG button
- [x] Toast: limit queue to 3 max, add action button support

---

## Status

| Phase | Status |
|-------|--------|
| Phase 1 — Landing + Dashboards | ✅ Done |
| Phase 2 — Lists + Key Flows | ✅ Done |
| Phase 3 — Polish | ✅ Done |
