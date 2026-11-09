# AURIC Multi-Stage Implementation & Migration Plan

This plan outlines the sequential rollout stages from initial repository audit to enterprise commercial release.

---

## Stage 0: Repository Audit & Baseline Verification (Completed)
- Inspect existing codebase and dependencies.
- Produce `PROJECT_AUDIT.md`, `CURRENT_STATE.md`, `FEATURE_MATRIX.md`, `TECHNICAL_DEBT.md`, and `MIGRATION_PLAN.md`.
- Configure strict typography, dark-mode CSS variables, and layout infrastructure.

## Stage 1: Core Domain Engine & Financial Invariants
- Establish fixed-precision decimal arithmetic (`src/core/math.ts`).
- Implement jewellery master data types, fineness ratios, and pricing calculation engine (`src/core/pricingEngine.ts`).
- Implement double-entry precious metal ledger and financial accounting engine (`src/core/metalLedger.ts`, `src/core/accountingEngine.ts`).
- Run deterministic automated tests via Node's test runner (`src/core/invariants.test.ts`).

## Stage 2: Retail Showroom Operations & POS Terminal
- High-efficiency Counter POS with barcode / SKU lookup, customer profile, and live rate snapshot.
- Split payments (Cash, UPI, Card, NetBanking, Advance).
- Old gold exchange counter intake with purity assay, dust deduction, and bill credit.
- Dual invoice printing: 80mm Counter Thermal Slip and GST Tax Invoice (A4).

## Stage 3: Inventory, BIS HUID & Metal Rates
- Physical article registry with Tag ID, 6-digit alphanumeric BIS HUID, weights (gross, stone, net, fine).
- Live metal rate board with branch overrides and rate change audit history.
- Stock movements, branch transfers, and quarantine / repair status transitions.

## Stage 4: Customer CRM, Repairs & Workshop Orders
- Bailment custody tracking for customer repairs (preventing inventory balance contamination).
- Karigar assignment, metal issue, recovery, and job-work tracking.
- Customer account statements and loyalty records.

## Stage 5: Double-Entry Financial Control & India Compliance
- General ledger, trial balance, P&L, day closing cash reconciliation.
- GST outward/inward tax summary (HSN 7113, 3% GST).
- Period locking to prevent retroactive document tampering.

## Stage 6: Migration Engine & Hardware Integration
- Opening stock CSV/Excel importer with duplicate detection and preview simulation.
- Digital weighing scale interface emulator with tare/stable weight detection.
- Multi-branch and tenant administrative switcher.
