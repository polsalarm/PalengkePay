# Firebase Setup Guide

## 1. Firestore Rules

Go to [console.firebase.google.com](https://console.firebase.google.com) → `palengkepay` → Firestore Database → **Rules** tab.

Replace everything with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /vendors/{walletAddress} {
      allow read: if true;
      allow write: if true;
    }

    match /transactions/{txHash} {
      allow read: if true;
      allow write: if true;
    }

    match /markets/{marketId} {
      allow read: if true;
      allow write: if false;
    }

    match /utangRecords/{utangId} {
      allow read: if true;
      allow write: if true;
    }

    match /feedback/{responseId} {
      allow read: if false;
      allow write: if true;
    }
  }
}
```

Click **Publish**.

---

## 2. Composite Indexes

Firestore → **Indexes** tab → **Composite** → **Add index**.

### Index 1 — Vendor transaction queries
| Field | Order |
|-------|-------|
| `vendorWallet` | Ascending |
| `createdAt` | Descending |

Collection: `transactions` → Click **Create**.

### Index 2 — Customer transaction queries
| Field | Order |
|-------|-------|
| `customerWallet` | Ascending |
| `createdAt` | Descending |

Collection: `transactions` → Click **Create**.

> Indexes take ~2 minutes to build. Status changes from "Building" to "Enabled".

---

## 3. Deploy via Firebase CLI (alternative)

```bash
# Install CLI
npm install -g firebase-tools

# Login
firebase login

# Init (select Firestore, use existing project "palengkepay")
firebase init firestore

# Deploy rules + indexes in one command
firebase deploy --only firestore
```

---

## 4. Verify

Once indexes are **Enabled**:
- Open app → connect wallet → go to `/vendor/home`
- No Firestore errors in browser console
- Transaction list loads (empty is fine)
