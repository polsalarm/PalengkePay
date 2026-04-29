# Contributing to PalengkePay

## Good First Issues

| Issue | Area | Difficulty |
|-------|------|------------|
| Add PHP/XLM conversion rate display | Frontend | Easy |
| Add vendor search/filter in Market Directory | Frontend | Easy |
| Add print-ready QR layout (A5 sticker) | Frontend | Medium |
| Add partial installment payment (pay N installments at once) | Frontend + Contract | Hard |
| Add recurring utang due-date reminders | Frontend | Medium |

## Setup

```bash
git clone https://github.com/polsalarm/PalengkePay.git
cd PalengkePay/frontend
npm install
cp .env.example .env.local   # fill in contract IDs
npm run dev
```

## Guidelines

- Follow existing code style (TypeScript strict, Tailwind CSS, React hooks)
- One PR per feature — keep diffs small
- Write a clear PR description: what + why
- Test on mobile (375px) and desktop before submitting

## PR Template

```
## What
Brief description of the change.

## Why
Motivation / issue it solves.

## Test
Steps to test manually.
```

## Contract Changes

Contracts are in `contracts/` (Rust + soroban-sdk). Run tests before submitting:

```bash
cd contracts
cargo test --workspace
```
