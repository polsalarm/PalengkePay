# PalengkePay — Design System & UI Spec

## Design Philosophy

Mobile-first, Filipino-friendly, zero-confusion. The target user is a 45-year-old palengke vendor who uses Facebook and GCash but has never touched crypto. Every screen should be self-explanatory. If a screen needs a tutorial, the screen is wrong.

---

## Brand

### Colors
```
Primary:       #0F766E (teal-700) — trust, money, go
Primary light: #14B8A6 (teal-500) — hover states, accents
Primary dark:  #0D9488 (teal-600) — active states

Success:       #16A34A (green-600) — confirmed, completed
Warning:       #D97706 (amber-600) — pending, due soon
Danger:        #DC2626 (red-600) — failed, overdue, error

Background:    #F8FAFC (slate-50) — main bg
Surface:       #FFFFFF — cards, modals
Border:        #E2E8F0 (slate-200) — card borders
Text primary:  #0F172A (slate-900)
Text secondary:#64748B (slate-500)
Text muted:    #94A3B8 (slate-400)

Dark mode: NOT needed for MVP. Palengke vendors use their phones in daylight.
```

### Typography
```
Font:          Inter (Google Fonts) — clean, highly readable on mobile
Headings:      font-semibold
Body:          font-normal, text-sm (14px) as base
Small:         text-xs (12px) for labels, timestamps
Large display: text-2xl (24px) for balance amounts
```

### Border radius
```
Cards:         rounded-xl (12px)
Buttons:       rounded-lg (8px)
Inputs:        rounded-lg (8px)
Badges/pills:  rounded-full
```

### Shadows
```
Cards:         shadow-sm
Modals:        shadow-lg
Buttons:       shadow-none (flat design, rely on color contrast)
```

---

## Layout Rules

### Mobile-first viewport
- Base design at 375px width (iPhone SE / budget Android)
- Max content width: 448px (mx-auto on larger screens)
- Padding: px-4 (16px) on all pages
- Bottom nav bar: fixed, 64px height, safe-area-inset-bottom padding

### Page structure
```
┌─────────────────────────┐
│  Top bar (wallet pill)   │  ← 56px, sticky
├─────────────────────────┤
│                         │
│  Page content           │  ← scrollable, pb-20 to clear bottom nav
│                         │
│                         │
├─────────────────────────┤
│  Bottom nav (4 tabs)    │  ← 64px, fixed bottom
└─────────────────────────┘
```

### Bottom navigation tabs

**Vendor view:**
| Icon | Label | Route |
|------|-------|-------|
| Home icon | Home | /vendor/home |
| QR icon | My QR | /vendor/qr |
| List icon | History | /vendor/transactions |
| User icon | Profile | /vendor/profile |

**Customer view:**
| Icon | Label | Route |
|------|-------|-------|
| Home icon | Home | /customer/home |
| Scan icon | Pay | /customer/scan |
| List icon | History | /customer/history |
| User icon | Profile | /customer/profile |

Use lucide-react icons: Home, QrCode, ScanLine, List, User

---

## Component Specs

### WalletButton (top bar)
```
Not connected:
┌──────────────────────────┐
│  [🔗 Connect Wallet]     │  ← teal button, rounded-lg, full width on /connect page
└──────────────────────────┘

Connected:
┌──────────────────────────────────────────┐
│  [● G...x4F2]              [12.5 XLM]   │  ← pill with green dot, truncated address
└──────────────────────────────────────────┘
- Tap to see full address + disconnect option
- Green dot = connected indicator
- Truncate address: first 4 + last 4 characters
```

### BalanceDisplay
```
┌──────────────────────────┐
│        12.50 XLM         │  ← text-2xl font-bold, centered
│     Available balance     │  ← text-xs text-slate-400
└──────────────────────────┘
- Prominent, large number
- Pulls from Horizon API
- Show skeleton loader while fetching
```

### PaymentForm (customer scan result)
```
┌──────────────────────────┐
│  Paying: Aling Nena       │  ← vendor name from Firestore
│  Stall B-14, Fish         │  ← stall + product type
│                           │
│  ┌──────────────────────┐ │
│  │  Amount (XLM)        │ │  ← large input, number keyboard
│  │  _______________     │ │
│  └──────────────────────┘ │
│  ┌──────────────────────┐ │
│  │  What did you buy?   │ │  ← optional memo, text input
│  │  _______________     │ │
│  └──────────────────────┘ │
│                           │
│  [Pay Now]                │  ← teal button, full width, rounded-lg
└──────────────────────────┘
```

### TxStatusTracker (after payment submitted)
```
Building:
┌──────────────────────────┐
│  ◌ Preparing transaction  │  ← spinner, text-slate-500
└──────────────────────────┘

Signing:
┌──────────────────────────┐
│  🔐 Confirm in wallet    │  ← wallet icon, pulse animation
└──────────────────────────┘

Submitting:
┌──────────────────────────┐
│  ◉ Processing...         │  ← pulse dot, text-amber-600
└──────────────────────────┘

Confirmed:
┌──────────────────────────┐
│  ✓ Payment sent!         │  ← green check, text-green-600
│  12.50 XLM → Aling Nena  │
│  View on Stellar Expert → │  ← link to tx hash
└──────────────────────────┘

Failed:
┌──────────────────────────┐
│  ✗ Transaction failed     │  ← red X, text-red-600
│  Insufficient balance     │  ← error reason
│  [Try Again]              │  ← retry button
└──────────────────────────┘
```

### QRGenerator (vendor QR display page)
```
┌──────────────────────────┐
│                           │
│     ┌────────────────┐    │
│     │                │    │
│     │   [QR CODE]    │    │  ← large, centered, white bg, rounded-xl border
│     │   300x300px    │    │
│     │                │    │
│     └────────────────┘    │
│                           │
│     Aling Nena            │  ← vendor name, text-lg font-semibold
│     Stall B-14 · Fish     │  ← stall info, text-sm text-slate-500
│                           │
│     Scan to pay me        │  ← helper text, text-xs text-slate-400
│                           │
└──────────────────────────┘
- This page should be designed for the vendor to show their phone screen to the customer
- Large QR, minimal clutter
- Works in bright sunlight (high contrast, white background for QR)
```

### QRScanner (customer scan page)
```
┌──────────────────────────┐
│                           │
│  ┌────────────────────┐   │
│  │                    │   │
│  │   Camera viewfinder│   │  ← html5-qrcode, rounded-xl
│  │   with scan frame  │   │
│  │                    │   │
│  └────────────────────┘   │
│                           │
│  Point your camera at     │
│  the vendor's QR code     │  ← helper text
│                           │
│  [Enter address manually] │  ← text button fallback
└──────────────────────────┘
- On successful scan → transition to PaymentForm
- Flash/torch toggle button in corner
```

### VendorDashboard (home)
```
┌──────────────────────────┐
│  Good morning, Nena 👋    │  ← greeting + time-based
│                           │
│  ┌──────────────────────┐ │
│  │   Today's earnings    │ │
│  │   45.00 XLM          │ │  ← large, bold, teal
│  │   8 transactions      │ │  ← text-sm text-slate-500
│  └──────────────────────┘ │
│                           │
│  Recent payments          │
│  ┌──────────────────────┐ │
│  │ G...abc  +5.50 XLM   │ │  ← each row: customer, amount, time
│  │ 2kg tilapia · 2m ago │ │
│  ├──────────────────────┤ │
│  │ G...def  +12.00 XLM  │ │
│  │ 1kg bangus · 15m ago │ │
│  └──────────────────────┘ │
│                           │
│  Active utang (2)         │
│  ┌──────────────────────┐ │
│  │ Juan — ₱150 total    │ │
│  │ 1/3 paid · next: May 5│ │
│  └──────────────────────┘ │
└──────────────────────────┘
```

### UtangCard
```
┌──────────────────────────┐
│  Juan Dela Cruz           │  ← customer name or wallet
│  Total: 150 XLM          │
│                           │
│  ██████░░░░ 2/3 paid     │  ← progress bar, teal fill
│                           │
│  Next due: May 5, 2026   │  ← amber if due within 3 days
│  Status: Active           │  ← green badge
└──────────────────────────┘

Status badges:
  Active    → bg-green-100 text-green-700, rounded-full
  Completed → bg-slate-100 text-slate-600
  Defaulted → bg-red-100 text-red-700
```

### OnboardingFlow (/onboard)
```
Step-by-step wizard, 4 steps, progress dots at top:

Step 1: "Install a Wallet"
  → Show Freighter + Lobstr logos
  → Direct download links
  → "I already have one" skip button

Step 2: "Connect Your Wallet"
  → Trigger StellarWalletsKit modal
  → Show success state when connected

Step 3: "Get Free Test XLM"
  → Explain this is testnet (play money)
  → Button that links to friendbot.stellar.org/?addr={address}
  → Auto-check balance after 5 seconds

Step 4: "You're Ready!"
  → Show balance
  → "Go to Dashboard" button
  → Confetti animation (optional but fun)
```

---

## Loading & Empty States

### Skeleton loaders
- Use animate-pulse with bg-slate-200 rounded blocks
- Match the shape of the content being loaded
- Balance: one wide rectangle
- Transaction list: 3 stacked card-shaped rectangles
- QR code: square skeleton

### Empty states
```
No transactions yet:
┌──────────────────────────┐
│                           │
│     📋                    │  ← large emoji or lucide icon
│     No payments yet       │  ← text-lg font-medium
│     Your transactions     │
│     will appear here      │  ← text-sm text-slate-400
│                           │
└──────────────────────────┘
```

### Error states
- Red banner at top of page for connection errors
- Inline red text under form fields for validation
- Toast notifications for transient errors (auto-dismiss after 4s)

---

## Toast Notifications

Position: top center, below top bar
Style: rounded-lg, shadow-lg, px-4 py-3, max-w-sm

```
Success: bg-green-50 border border-green-200 text-green-800
  "Payment received! +5.50 XLM"

Error:   bg-red-50 border border-red-200 text-red-800
  "Transaction failed — please try again"

Info:    bg-blue-50 border border-blue-200 text-blue-800
  "Wallet connected successfully"
```

Auto-dismiss after 4 seconds. Swipe to dismiss on mobile.

---

## Responsive Breakpoints

```
Mobile (default):  375px — full mobile layout, bottom nav
Tablet (md):       768px — same layout, slightly more breathing room
Desktop (lg):      1024px — centered card layout (max-w-md mx-auto), no bottom nav → side nav or top nav

For the MVP, focus 90% of effort on mobile. Desktop should work but doesn't need to be pixel-perfect.
```

---

## Accessibility

- All interactive elements: min 44x44px touch target
- Color contrast: WCAG AA minimum (the teal-700 on white passes)
- Focus rings: ring-2 ring-teal-500 ring-offset-2
- Labels on all inputs (not just placeholder text)
- Loading states announced to screen readers (aria-live="polite")

---

## Icon Set

Use lucide-react throughout. Key icons:
```
Wallet:       Wallet
Connect:      Link
Disconnect:   Unlink
QR Code:      QrCode
Scan:         ScanLine
Send:         Send
Check:        Check, CheckCircle
Error:        XCircle
Warning:      AlertTriangle
Home:         Home
History:      List
Profile:      User
Settings:     Settings
Copy:         Copy
External:     ExternalLink
Loading:      Loader2 (with animate-spin)
```

---

## Animation Guidelines

- Page transitions: none (keep it fast, mobile-first)
- Button press: active:scale-95 transition-transform
- Card hover (desktop): hover:shadow-md transition-shadow
- Loading spinner: Loader2 with animate-spin
- Pulse: animate-pulse for skeleton loaders and "submitting" state
- Toast: slide in from top, fade out
- Progress bar: transition-all duration-500 for utang progress fill
