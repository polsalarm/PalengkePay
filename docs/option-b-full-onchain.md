# Option B: Drop Firebase — Full On-Chain Stack

## Decision

Drop Firebase entirely. All persistent state lives on Stellar:
- Vendor profiles → VendorRegistry contract (add name/stall/phone/product_type fields)
- Transaction history → Horizon payments API
- Utang records → UTangEscrow contract (already fully on-chain)
- Markets → hardcoded constants (no DB needed at MVP scale)
- Feedback → Phase 4 concern, out of scope

**Result:** Zero external dependencies beyond Stellar Testnet. No API keys, no Firestore rules, no Firebase billing limits.

---

## Data Source Migration

| Data | Was | Now |
|------|-----|-----|
| Vendor profile (name, stall, phone) | Firestore `vendors/{wallet}` | `VendorRegistry.get_vendor(wallet)` via Soroban RPC |
| Transaction history | Firestore `transactions/` | Horizon `payments().forAccount()` |
| Utang records | Firestore `utangRecords/` | `UTangEscrow.get_*_utangs()` via Soroban RPC |
| Role check (vendor vs customer) | Firestore `vendors/{wallet}` existence | `VendorRegistry.get_vendor()` → ok = vendor |
| Market list | Firestore `markets/` | Hardcoded in frontend constants |

---

## Contract Changes: VendorRegistry

### VendorRecord — new fields

```rust
pub struct VendorRecord {
    pub id: u64,
    pub wallet: Address,
    pub market_id: String,
    pub name: String,          // NEW
    pub stall_number: String,  // NEW
    pub phone: String,         // NEW
    pub product_type: String,  // NEW
    pub registered_at: u64,
    pub total_transactions: u64,
    pub total_volume: i128,
    pub is_active: bool,
}
```

### New / changed functions

```rust
// Updated: takes name/stall/phone/product_type
register_vendor(admin, wallet, market_id, name, stall_number, phone, product_type) → u64

// New: vendor edits own profile
update_profile(vendor, name, stall_number, phone, product_type)
```

---

## Frontend Changes

### Removed
- `src/lib/firebase.ts` — deleted
- `firebase` npm package — removed from package.json
- `firebase/` folder — deleted
- `firebase.json`, `.firebaserc` — deleted
- All `setDoc` / `addDoc` / `onSnapshot` / `getDoc` calls

### Rewritten hooks

| Hook | Old | New |
|------|-----|-----|
| `useVendor` | `getDoc(db, 'vendors', wallet)` | `simulateViewCall(REGISTRY_ID, 'get_vendor', [wallet])` |
| `useTransactions` | Firestore `onSnapshot` | Horizon `payments().forAccount()` + 30s poll |
| `useUtang` reads | Firestore `onSnapshot` | Soroban RPC `get_*_utangs()` + refetch after write |
| `useUtang` create | `addDoc(db, 'utangRecords', ...)` | `invokeContract(ESCROW_ID, 'create_utang', ...)` |
| `useUtang` pay | XLM transfer + Firestore update | `invokeContract(ESCROW_ID, 'pay_installment', ...)` |
| `usePayment` | XLM transfer + Firestore save | XLM transfer only (tx on-chain, readable via Horizon) |

### Updated pages
- `Dashboard.tsx` — role check via Soroban RPC instead of Firestore
- `AdminRegister.tsx` — calls `VendorRegistry.register_vendor()` on-chain
- `VendorProfile.tsx` — shows on-chain profile, calls `update_profile()` on-chain
- `VendorTransactions.tsx` — wired to Horizon payment history
- `CustomerHistory.tsx` — wired to Horizon payment history

---

## New stellar.ts helpers

```typescript
getRpcServer()                          // Soroban RPC server instance
simulateViewCall(contractId, fn, args)  // read-only contract query, no signing
prepareContractTx(signer, contractId, fn, args) // simulate + assemble → XDR string
submitSorobanTx(signedXdr)              // send + poll until confirmed, returns hash
```

---

## Environment Variables

### Removed
```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

### Added
```
VITE_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
VITE_VENDOR_REGISTRY_CONTRACT_ID=   # set after deployment
VITE_UTANG_ESCROW_CONTRACT_ID=      # set after deployment
VITE_PALENGKE_PAYMENT_CONTRACT_ID=  # set after deployment
```

---

## Graceful Degradation (pre-deployment)

Contracts not deployed yet → contract IDs not in .env:

| Feature | State |
|---------|-------|
| Send XLM payment | ✅ Works (direct Horizon transfer) |
| View balance | ✅ Works (Horizon) |
| View tx history | ✅ Works (Horizon payments API) |
| Register vendor | ⚠️ Shows "Deploy contracts first" |
| View vendor profile | ⚠️ Shows wallet address only |
| Create utang | ⚠️ Shows "Deploy contracts first" |
| Pay utang installment | ⚠️ Shows "Deploy contracts first" |

---

## Implementation Steps (completed)

1. Update `VendorRegistry` contract + tests — add profile fields, `update_profile()`
2. `cargo test --workspace` — all 19 tests pass
3. Add Soroban RPC helpers to `stellar.ts`
4. Rewrite `useVendor.ts` — Soroban RPC
5. Rewrite `useTransactions.ts` — Horizon payments API
6. Rewrite `useUtang.ts` — Soroban RPC reads + on-chain writes
7. Strip Firebase from `usePayment.ts`, `contracts.ts`
8. Update `Dashboard.tsx` — on-chain role check
9. Update `AdminRegister.tsx` — on-chain registration
10. Update `VendorProfile.tsx`, `VendorTransactions.tsx`, `CustomerHistory.tsx`
11. Delete `firebase.ts`, remove `firebase` package, delete config files
12. `npm run build` — zero TS errors
13. Commit + push
