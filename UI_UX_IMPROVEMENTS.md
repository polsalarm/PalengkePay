# PalengkePay UI/UX Improvement Plan

## Phase 1 — High Impact (Landing + Dashboards)
> Biggest visible impact for demos. Do these first.

### Landing Page
- [ ] Hero: bigger typography, animated tagline, vendor illustration or market photo
- [ ] Feature cards: bigger colored icons, more breathing room
- [ ] Add stats row ("X vendors registered, X transactions processed")
- [ ] CTA buttons: more contrast between primary and secondary
- [ ] "How it works" steps: visual flow diagram instead of text list
- [ ] Trust section: better integration with light theme above it

### CustomerHome Dashboard
- [ ] Balance hero: add sparkline/mini chart or last-7-days summary
- [ ] Quick action buttons: full-width pill cards with big icons
- [ ] Recent transactions: date grouping (Today / Yesterday / This Week)
- [ ] Amount color coding (green incoming, red outgoing)
- [ ] Add real-time pulse dot on balance
- [ ] "View all" link → make more prominent

### VendorHome Dashboard
- [ ] Balance hero: week/month toggle summary
- [ ] Quick actions (Show QR / Utang): bigger cards, icon affordance
- [ ] Recent payments: date grouping, customer name resolution
- [ ] Add earnings trend indicator (up/down vs yesterday)
- [ ] Empty state: guide vendor to share QR code

---

## Phase 2 — Medium Impact (Lists + Key Flows)

### All List Pages (CustomerHistory, VendorTransactions, CustomerUtang, VendorUtang)
- [ ] Date grouping on all transaction lists
- [ ] Empty states: illustrations + action CTA buttons
- [ ] Subtle row hover animations
- [ ] Summary stats at top (total spent/earned, count)

### Market Directory
- [ ] Bigger emoji treatment on vendor cards
- [ ] Section occupancy indicator (Section A: 8/20)
- [ ] Sort options (alphabetical, most active)

### VendorQR Page
- [ ] Download/share button (PNG export)
- [ ] Bigger vendor name display — this is a screen people show

### UtangCard Component
- [ ] Progress bar label: "2 of 3 paid"
- [ ] Overdue: pulsing border + warning banner
- [ ] Show next due date prominently

### CustomerScan / Payment Flow
- [ ] QR scanner viewfinder animation (corner brackets)
- [ ] Confirmation step before payment submits
- [ ] Success screen: next actions (pay again / view receipt / home)

### Onboarding
- [ ] Slide animation between steps
- [ ] Big celebration on final step (confetti or animation)
- [ ] Progress bar with step labels

---

## Phase 3 — Polish (Micro-interactions + Consistency)

### Micro-interactions
- [ ] Button press: `active:scale-95` on all buttons
- [ ] Page transitions: slide-in from right on nav
- [ ] Skeleton loaders on every list/loading state
- [ ] Toast: bounce on slide-in

### Color System Standardization
- [ ] teal = primary action
- [ ] green = success / incoming
- [ ] amber = warning / overdue
- [ ] red = danger / error
- [ ] slate = neutral / secondary

### Layout Fixes
- [ ] Desktop sidebar: collapse button
- [ ] Mobile bottom nav labels: increase from `text-[10px]`
- [ ] Scroll-to-top button on long pages
- [ ] Breadcrumb or page title in desktop header

### Component Polish
- [ ] WalletButton: show which wallet is connected
- [ ] TxStatusTracker: show transaction fee
- [ ] PaymentForm: character count on memo field, peso/XLM display
- [ ] BalanceDisplay: refresh button + last-updated timestamp
- [ ] QRGenerator: download as PNG button
- [ ] Toast: limit queue to 3 max, add action button support

---

## Status

| Phase | Status |
|-------|--------|
| Phase 1 — Landing + Dashboards | 🔄 In Progress |
| Phase 2 — Lists + Key Flows | ⬜ Not Started |
| Phase 3 — Polish | ⬜ Not Started |
