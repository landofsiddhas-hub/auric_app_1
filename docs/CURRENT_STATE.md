# AURIC — Current Architecture & Codebase State

**Version:** 1.3.0  
**Date:** November 2026  
**Architecture:** Modular Monolith with authoritative domain engines, invariant testing, and reactive UI  

---

## 1. Directory Structure

```
/
├── docs/
│   ├── PROJECT_AUDIT.md        # Stage 0 audit findings
│   ├── CURRENT_STATE.md        # Architecture overview and state
│   ├── FEATURE_MATRIX.md       # Detailed capability classification
│   ├── PILOT_READINESS.md      # Comprehensive Client Pilot Assessment
│   ├── TECHNICAL_DEBT.md       # Tracked engineering debt and resolution
│   ├── MIGRATION_PLAN.md       # Incremental stage roadmap
│   ├── PROJECT_STATE.md        # Persistent project memory and tasks
│   └── DECISION_LOG.md         # Architectural Decision Records (ADRs)
├── public/
│   └── assets/                 # Brand assets and sample tags
├── src/
│   ├── core/                   # Authoritative pure business logic & invariants
│   │   ├── types.ts            # Enterprise domain models & enums
│   │   ├── math.ts             # Fixed-precision decimal arithmetic
│   │   ├── pricingEngine.ts    # Deterministic jewellery pricing & GST engine
│   │   ├── metalLedger.ts      # Double-entry precious metal ledger
│   │   ├── accountingEngine.ts # Double-entry financial journal engine
│   │   ├── girviEngine.ts      # Girvi pawn broking & 75% LTV engine
│   │   ├── savingsEngine.ts    # Swarna Nidhi 11+1 chit fund engine
│   │   ├── manufacturingEngine.ts # Karat alloy recipes & Ghat audit engine
│   │   ├── analyticsEngine.ts  # Grounded BI fact engine & GSTR-1 summaries
│   │   └── invariants.test.ts  # Node.js automated invariant verification suite
│   ├── components/             # Reusable UI components (Counter, Cards, Tabs, Badges)
│   ├── modules/                # Domain feature modules
│   │   ├── pos/                # Retail POS counter & split payment terminal
│   │   ├── inventory/          # Article catalog, HUID registry, Barcode generator
│   │   ├── metalRates/         # Live metal rate manager & historical audit
│   │   ├── oldGold/            # Old metal exchange intake & assay valuation
│   │   ├── girvi/              # Girvi gold loan desk, Pawati print & packet custody
│   │   ├── savings/            # Swarna Nidhi (11+1) gold scheme & passbooks
│   │   ├── crm/                # Customer 360, PAN KYC Rule 114B, Khata & WhatsApp
│   │   ├── hardware/           # Barbell tag designer, cipher pricing & Zebra ZPL II
│   │   ├── manufacturing/      # Workshop Job Card Studio, BOM & Ghat audit
│   │   ├── analytics/          # AURIC Intelligence & BI Reporting Center
│   │   ├── purchases/          # Supplier bullion intake & inward GST
│   │   ├── returns/            # Sales returns, credit notes & restock
│   │   ├── repairs/            # Custody tracking for customer-owned jewellery
│   │   ├── wholesale/          # Weight-based orders & Karigar management
│   │   ├── accounting/         # Balance sheet, P&L, GST reports & Day Close
│   │   ├── dashboard/          # Real-time Executive Owner cockpit
│   │   ├── subscriptions/      # SaaS subscription tier & quota controls
│   │   └── settings/           # Multi-tenant, branch, and role configuration
│   ├── data/                   # Authoritative initial state & seed data
│   ├── App.tsx                 # Root application shell & routing
│   ├── index.css               # Tailwind CSS v4 styling & themes
│   └── main.tsx                # Client application bootstrap
├── index.html
├── metadata.json
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 2. Invariants Architecture

The platform enforces the 15 Critical Invariants outlined in the AURIC Master Specification:

1. **Article Exclusivity**: An article with state `AVAILABLE` transitions to `SOLD` or `RESERVED` atomically; double-billing the same physical piece is blocked.
2. **Double-Entry Balance**: Every financial posting strictly enforces `Sum(Debits) === Sum(Credits)`.
3. **Atomic Stock & Journal Postings**: A sale cannot update inventory without emitting its corresponding financial journal.
4. **Idempotent Payments**: Payment processing rejects repeated transaction references or replay payloads.
5. **Historical Rate Snapshot**: Invoices preserve the exact gold/silver rate snapshot at the second of billing, unaffected by future rate revisions.
6. **Custody Separation**: Customer repairs and custom order metal retain customer ownership and are excluded from business stock valuation.
7. **Mass Conservation**: Branch transfers conserve gross weight and fine metal mass across dispatch, in-transit, and receipt.
8. **Valid Returns**: Sales returns require linkage to the original posted invoice and cannot exceed purchased quantity.
9. **Zero Floating Point Arithmetic**: All monetary calculations operate with integer paise or fixed decimal scaling.
10. **Period Close Lockdown**: Books marked closed cannot be altered without an explicit audit-logged reopening authorization.
11. **Tenant Isolation**: All operations validate tenant and branch scope.
12. **Metal Ledger Traceability**: Every scrap, melt, or assay variance requires a mandatory reason code and authorizer.
