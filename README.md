# AURIC — Jewellery Business Operating System

Enterprise-Grade Multi-Tenant SaaS Platform for Jewellery Retail Showrooms, Multi-Branch Chains, Wholesalers, and Manufacturers.

---

## 1. Overview

**AURIC** is a commercial operating system designed specifically for the precious jewellery and bullion trade. It features high-precision decimal arithmetic, double-entry financial and precious metal accounting, BIS Hallmarking 6-digit HUID tracking, rapid POS counter billing, split payments, old gold exchange valuation, customer repair bailment custody, and GST compliance under HSN 7113.

---

## 2. Key Capabilities Implemented

- **Executive Owner Cockpit**: Real-time sales, collections, cash-in-till, gross and fine 24K gold stock holding, silver bullion, customer receivables, and karigar balances.
- **Retail Counter POS**: High-speed scanning terminal with article lookup, customer selection, live rate snapshot freezing, making charges, wastage calculation, split payments (Cash, UPI, Card, Advance), and dual invoice printing (80mm Thermal Cash Receipt & A4 GST Tax Invoice).
- **Inventory & BIS HUID Registry**: Unique physical piece tracking with 6-digit alphanumeric BIS hallmarking HUIDs, gross/stone/net/fine-metal weights, and barcode tag generation with barbell tag preview.
- **Live Metal Rates Manager**: Gold (24K, 22K 916, 18K 750, 14K 585), Silver (999, 925), and Platinum (950) with branch overrides, auto-derivation, and audit trail. Past invoices preserve their rate snapshot permanently.
- **Old Gold & Silver Exchange Terminal**: Counter intake with touchstone/assay tested purity, dust/wax deduction, net pure valuation, and trade-in purchase credit applied directly at POS checkout.
- **Repairs & Workshop Custody**: Strict bailment custody segregation. Customer-owned jewellery is tracked independently and excluded from merchant stock valuation.
- **Karigar Artisan & Wholesale Operations**: Artisan metal balances, gold alloy issue/return vouchers, loss tolerance calculation, and wholesale weight-based Bhaav-Cut orders.
- **Double-Entry Accounting & India GST Compliance**: Balanced general journal entries (`Sum(Debits) === Sum(Credits)`), Trial Balance, GSTR-1 outward tax summary (HSN 7113 @ 3% GST: 1.5% CGST + 1.5% SGST), and daily store close with financial period locking.
- **Data Migration & Hardware Scales**: CSV opening stock importer with validation preview and digital precision scale hardware adapter emulator (RS-232 / USB HID tare & stable weight detection).

---

## 3. Technology Stack

- **Frontend**: React 19, TypeScript, Vite 8, Tailwind CSS v4, Lucide Icons
- **Math & Domain Logic**: Fixed-precision decimal arithmetic (`src/core/math.ts`)
- **Accounting & Metal Ledgers**: Pure double-entry engines (`src/core/metalLedger.ts`, `src/core/accountingEngine.ts`)
- **Automated Verification**: Node built-in test runner (`node:test`, `node:assert/strict`) via `npx --yes tsx --test`

---

## 4. Running the Tests & Dev Server

```bash
# Run automated invariant test suite
npx --yes tsx --test src/core/invariants.test.ts

# Run TypeScript linter
npm run lint

# Start development server
npm run dev
```

---

## 5. Master Invariants Verification

All 16 critical transaction and small-jeweler workflow invariants specified in the Master Architecture Specification are implemented and guarded by automated tests (`16/16 passing`).

---

## 6. Persistent Project Memory & Internal Team Documentation

To ensure project context is never lost across sessions and the internal sales/onboarding team has an authoritative guide:
- **`docs/VENDOR_DEMO_PLAYBOOK.md`**: Complete 12-minute live vendor demo script, step-by-step instructions, and vendor Q&A guide.
- **`docs/PROJECT_STATE.md`**: Persistent single-source-of-truth project memory (active vs. hidden modules, small-jeweler workflows, and exact backend/database status).
- **`docs/PILOT_READINESS.md`**: Client pilot readiness & backend/database architecture breakdown.
- **`docs/DECISION_LOG.md`** & **`docs/CHANGELOG.md`**: Architectural Decision Records (`ADR 001`–`ADR 007`) and version changelog (`v1.1.0`–`v1.4.0`).

