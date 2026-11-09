# AURIC Architecture Decision Records (ADRs)

## ADR 001: Fixed-Precision Decimal Arithmetic for Money and Precious Metals
- **Status:** Accepted
- **Context:** Standard IEEE 754 floating-point arithmetic introduces rounding inaccuracies that violate financial and weight invariants (e.g. `0.1 + 0.2 != 0.3`). In precious jewellery, a milligram difference in 24K gold represents monetary variance, and tax calculations must round strictly to minor units (paise).
- **Decision:** Implement dedicated decimal math helper functions (`roundDecimals`, `toPaise`, `fromPaise`, `toFineMetalGrams`) maintaining 3 decimal places (milligrams, 0.001g) for precious metals and 2 decimal places for INR currency.
- **Consequences:** All core calculations are deterministic, reproducible, and verifiable in unit tests.

## ADR 002: Double-Entry Precious Metal Accounting (Dual-Dimension Balancing)
- **Status:** Accepted
- **Context:** Jewellers trade in physical metal as well as fiat money. A sale can be settled in fiat currency, old gold, or bullion credit. Wholesalers and karigars operate on metal weight accounts ("Bhaav Cut" / metal balance).
- **Decision:** Model precious metals with an independent double-entry ledger where transactions record Gross Weight, Fineness, and Fine-Metal Equivalent (24K fine grams). Every receipt must equal an issue, stock addition, or scrap recovery.
- **Consequences:** Physical stock, customer custody, scrap, and karigar balances are mathematically reconciled without unexplained weight discrepancies.

## ADR 003: Immutable Historical Rate Snapshots on Invoices
- **Status:** Accepted
- **Context:** Daily market rates fluctuate continuously. If an invoice calculated metal value from a mutable rate table, changing today's rate would silently corrupt yesterday's audited sales.
- **Decision:** Every sales quotation, invoice line, and old-gold voucher freezes the exact applicable metal rate snapshot at the timestamp of creation.
- **Consequences:** Past invoices are permanent, legally auditable, and invariant under future price changes.

## ADR 004: Strict Custody Segregation for Customer Repairs & Custom Orders
- **Status:** Accepted
- **Context:** Customers deposit personal jewellery for resizing, stone setting, or polishing. If treated as inventory, merchant asset valuation is artificially inflated, and items risk accidental resale.
- **Decision:** Segregate customer articles into a dedicated Bailment Custody domain model with unique custody receipts, non-inventory status flags, and karigar job-card assignments.
- **Consequences:** Merchant inventory valuation remains accurate and customer property is legally protected.

## ADR 005: Controlled Pilot Architecture & Hardware Bridging Boundaries
- **Status:** Accepted
- **Context:** Delivering AURIC for a real-world client pilot in an Indian jewellery showroom requires balancing rapid functional evaluation with physical environment constraints (RS-232 COM port scales, Zebra thermal transfer barcode printers, multi-counter sync).
- **Decision:** Authorize a Controlled Client Pilot architecture where core domain calculations, POS billing, Girvi loans, Swarna Nidhi schemes, double-entry accounting, and workshop workflows run in a high-fidelity client workstation environment with digital scale simulation, native browser A4/80mm printing, and raw ZPL II code export.
- **Consequences:** The client can immediately trial the business operating system and conduct shadow operations without waiting for complex on-site serial driver installations, while clearly defining the boundaries required for multi-counter full production.

## ADR 006: Deterministic Domain-Grounded BI and Manufacturing Ghat Loss Audit
- **Status:** Accepted
- **Context:** Executive reporting and AI-assisted queries in jewellery operations must never hallucinate financial numbers or metal weights. Additionally, manufacturing job cards require strict tracking of Karat alloy mix ratios and process scrap (Ghat) loss.
- **Decision:**
  1. Build the AURIC Intelligence query engine with strict factual grounding against in-memory ledger arrays, executing direct aggregation queries without unverified generative claims.
  2. Implement an automated Karat alloy recipe calculator and 1.2% Ghat loss tolerance threshold in `src/core/manufacturingEngine.ts`.
- **Consequences:** Showroom owners and workshop supervisors receive 100% auditable facts with zero hallucinated figures.

## ADR 007: Small-Jeweler Focused Workspace, Tounch & Karigar Stock Entry, and Customizable POS Columns
- **Status:** Accepted (v1.4.0)
- **Context:** Initial target customers are small and independent Gold & Silver jewellery retailers who primarily add stock with weight, purity/tounch (including 70%–85% Tounch silver payal/utensils), wastage, rate at entry, and Karigar labour settlement, and then bill customers on a customizable sale screen. Enterprise modules like Girvi Gold Loans and Swarna Nidhi Chit Schemes add unnecessary visual clutter at this stage.
- **Decision:**
  1. Hide `GIRVI`, `SAVINGS`, `AI_REPORTING`, `MIGRATION`, and `SUBSCRIPTIONS` from the active sidebar navigation while preserving their domain engines in code for future upgrades.
  2. Support editable Gold & Silver categories (`JewelleryCategory`), custom `tounchPercent`, `rateAtEntryPerGram`, and 5 Karigar labour settlement modes (`RUPEES_PER_GRAM`, `RUPEES_FLAT`, `WEIGHT_GRAMS`, `METAL_GIVEN`, `PERCENTAGE`) directly at stock entry.
  3. Drive the POS sale table and A4 Tax Invoice from a user-customizable `SaleColumnConfig[]` schema persisted in `localStorage`, paired with live inline overrides (`CartItemOverride`) for rate, wastage %, and making/labour charges.
- **Consequences:** Small jewelers get an intuitive daily stock-and-billing flow tailored to Indian retail terminology (*Tounch*, *Majuri*, *Ghadai*, *Karigar Metal Given*), while persistent markdown docs (`docs/PROJECT_STATE.md`, `docs/VENDOR_DEMO_PLAYBOOK.md`) keep team and AI memory permanently synchronized.

