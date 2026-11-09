# AURIC Changelog

## [1.4.0] - 2026-11-04 (Small Jeweler Pilot & Vendor Demo Edition)
### Added
- **Editable Gold & Silver Category Manager (`Manage Categories`)**:
  - Add, inline rename, edit defaults (`metalType`, `defaultPurity`, `defaultTounchPercent`, `defaultWastagePercent`, `defaultMakingChargeType`, `defaultMakingChargeRate`), and delete categories (`localStorage` persisted under `auric_categories_v1`).
  - Added dedicated Silver jewel categories (*Silver Payal (Anklets)*, *Silver Bichhiya (Toe Rings)*, *Silver Pooja & Utensils*, *925 Sterling Silver Jewels*, *Coins & Bars*) alongside Gold categories.
- **Enhanced Gold & Silver Stock Entry with Tounch %, Rate at Entry & Karigar Settlement**:
  - Dedicated `+ Add Silver Jewel` and `+ Add Gold / Silver Stock` workflows supporting Gold (`24K`, `22K`, `20K`, `18K`, `14K`) and Silver (`999`, `925`, `85T`, `80T`, `75T`, `70T`) purities plus custom **Tounch (%)** (`0.1%`–`100%`) and **Rate at Time of Entry (₹/g)**.
  - Built-in **Artisan / Karigar Labour Record** at stock entry (`labourDetails`) supporting 5 real-world Indian jeweler settlement modes: `RUPEES_PER_GRAM` (`₹/g`), `RUPEES_FLAT` (`Flat ₹`), `WEIGHT_GRAMS` (`Weight in g`), `METAL_GIVEN` (`Gold / Silver Given in g`), and `PERCENTAGE` (`%`), plus `labourWastagePercent`.
  - Automatic Karigar ledger sync when stock is added with a Karigar tag.
- **Customizable POS Sale Page & Invoice Columns**:
  - In-table **Customize Sale Columns** (`Edit / Rename Columns`) panel on the POS page to rename any column header (e.g., *Purity / Tounch* -> *Tounch*, *Labour Charge* -> *Majuri*), reorder columns, toggle visibility, or add custom fee (`FEE_INR`) / note (`TEXT`) columns (`localStorage` persisted under `auric_sale_columns_v1`).
  - Live inline editing of `Rate (₹/g)`, `Wastage %`, `Labour Charge` (`₹/g`, `Flat ₹`, `%`), and `Discount (₹)` directly in the POS cart table.
  - Dynamic column rendering on the printable A4 GST Tax Invoice.
- **Streamlined Small-Jeweler Navigation & Demo Playbook**:
  - Hid enterprise-only modules (`GIRVI`, `SAVINGS`, `AI_REPORTING`, `MIGRATION`, `SUBSCRIPTIONS`) from the sidebar navigation for a clean small-retailer workspace.
  - Added `docs/VENDOR_DEMO_PLAYBOOK.md` and updated `docs/PROJECT_STATE.md` and `docs/PILOT_READINESS.md`.
- **Expanded Automated Test Suite**:
  - Added unit tests for Silver Tounch (`80T`) proportionate pricing, Karigar metal-given settlement, and live POS inline overrides + custom fee columns (**16/16 unit tests passing**).

## [1.3.0] - 2026-11-01
### Added
- **Jewellery Manufacturing & Job Card Studio (Stage 8)**:
  - Karat alloy mixture formulation engine for 22K (916), 18K (750), 14K (585), and 24K (999) casting batches (`calculateKaratAlloyMixture`).
  - Interactive 8-stage workshop production pipeline: CAD 3D Design -> Wax Tree -> Vacuum Casting -> Filing & Assembly -> Stone Setting -> Polishing & Finishing -> BIS Hallmarking (HUID) -> Final QC Pass.
  - Bill of Materials (BOM) tracker for precious metal grains, Italian master alloy, diamonds, and gemstones.
  - Workshop scrap and Ghat process loss audit tool (`reconcileManufacturingOrder`) verifying within 1.2% legal threshold.
  - 1-click showroom stock receipt generating tagged articles with unique BIS HUID and posting balanced completion journals (`createManufacturingCompletionJournal`).
  - Printable official workshop job card (वर्कशॉप जॉब शीट) with 7-stage quality sign-off table.
- **AURIC Intelligence & Enterprise BI Reporting Center (Stage 10)**:
  - Deterministic natural-language query assistant (`answerNaturalLanguageQuery`) with verifiable grounded database values and zero AI hallucinations.
  - Executive BI metric computation (`computeExecutiveBIMetrics`) spanning fine gold equivalents, customer receivables, active Girvi loan book, Swarna Nidhi liabilities, and Karigar custody.
  - Multi-tab operational report suite: Itemized Retail Sales Ledger, Showroom Inventory Aging & Dead Stock Audit, Artisan Karigar Metal Balances & Ghat Audit, and GSTR-1 Outward Supplies Tax Summary (HSN 7113 @ 3% GST).
  - 1-click CSV export and print-ready reporting views.
- **Expanded Invariant Test Suite**:
  - Tested Karat alloy mixing recipes (22K and 18K) and Ghat process loss audit within vs exceeding tolerance.
  - Tested balanced double-entry manufacturing completion journal posting (Dr Gold Stock, Dr Ghat Loss, Cr WIP Inventory, Cr Karigar Payable).
  - Tested grounded AI query engine factual derivations (14/14 unit tests passing with 0 failures).

## [1.2.0] - 2026-11-01
### Added
- **Girvi (Gold Loan / Pawn Broking) Desk**:
  - Regulatory RBI 75% LTV cap enforcement and simple monthly interest accruals (`Principal * Rate% * Days / 30`).
  - Segregated safe custody vault packet management (`PKT-SAFE-*`) under Section 148 Indian Contract Act Bailment (non-merchant stock).
  - Printable official Girvi Pawn Certificate (गिरवी पावती) with itemized ornament assay, gross/net/fine weights, and legal sign-off.
  - Double-entry loan disbursal and interest/principal servicing journal engine (`createGirviDisbursalJournal`, `createGirviPaymentJournal`).
- **Swarna Nidhi (11+1) Gold Savings Scheme & Chit Passbook**:
  - Dual scheme modes: Value-Based and Weight Accumulator (daily spot rate gold gram locking).
  - 11-month customer contribution schedule with 12th month showroom loyalty bonus contribution.
  - Interactive passbook tracking with monthly installment receipts, status badges, and maturity redemption vouchers for POS checkout.
  - Double-entry customer deposit liability journals (`createChitPaymentJournal`).
- **Customer 360 CRM & Relationship Khata**:
  - Unified client dossier with PAN KYC verification (Rule 114B $\ge ₹2,00,000$ compliance), lifetime purchase value, advance balance, and receivables.
  - Cross-module engagement tabs: historical sales invoices with reprint, repair custody status, active Girvi loans, and savings schemes.
  - Meta-verified WhatsApp Business notification simulator with live message bubbles for e-invoices, repair pick-up alerts, chit due notices, and loan reminders.
- **Jewellery Barcode Tag & Barbell Label Studio**:
  - WYSIWYG foldover barbell tag preview (50mm $\times$ 12mm butterfly tag, dumbbell tag, and box label).
  - Dynamic encoding of making charges into secret keyword ciphers (e.g., `BHARATGOLD` cipher matrix).
  - Raw Zebra ZPL II command stream generator with 1-click clipboard export for Zebra ZD220, Citizen, and TSC thermal transfer barcode printers.
- **Expanded Invariant Test Suite**:
  - Tested Girvi pledge valuation, 75% LTV ceiling, interest calculation, and balanced loan disbursal/servicing journals.
  - Tested Swarna Nidhi 11-month installment progression, 12th month bonus entitlement, and deposit liability balance (11 unit tests passing with 0 failures).

## [1.1.0] - 2026-11-01

### Added
- **Supplier Purchasing & Goods Inward Terminal**:
  - Profiles for bullion dealers, casting manufacturers, and diamond merchants.
  - Purchase bill calculation with gross weight, net weight, fineness, fine-metal equivalent, and 3% input GST credit.
  - Automatic inventory inwarding with unique tag ID generation and optional BIS HUID stamping.
  - Balanced double-entry purchase journal posting (`Dr Gold Stock, Dr Input CGST, Dr Input SGST; Cr Supplier Payable`).
- **Customer Sales Returns & Credit Note Terminal**:
  - Enforcement of Invariant 8 (return must reference an eligible original posted invoice) and Invariant 9 (prevention of duplicate refunds).
  - Configurable restock actions: Restocked as AVAILABLE in showroom stock, or quarantined for melt scrap.
  - Balanced credit note reversal journal posting (`Dr Sales Returns, Dr Output CGST Reversal, Dr Output SGST Reversal; Cr Store Credit Voucher`).
- **Multi-Tenant SaaS Subscriptions & Quota Management**:
  - Plan definitions for Retail Starter, Showroom Pro, Multi-Branch Chain, and Manufacturing & Enterprise.
  - Live tenant quota monitoring for branch counts, tracked articles, and staff seats.
  - Monthly vs Annual billing toggle.
- **Expanded Invariant Test Suite**:
  - Scenario 1: Supplier purchase goods inward mass conservation & balanced journal check.
  - Scenario 6: Sales return credit note original invoice verification and tax reversal balance.
  - Invariant 11: Cross-tenant isolation verification preventing cross-tenant leakage.
