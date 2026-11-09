# AURIC Project State (Persistent Memory — Single Source of Truth)

**Current Version:** 1.5.0 (Small Jeweler Pilot Edition)  
**Last Updated:** November 4, 2026  
**Target Customer Profile:** Small & Independent Gold and Silver Jewellery Retailers (Showrooms, Silver Payal/Utensil Counters, Karigar-Driven Shops)  
**Automated Test Status:** **17 / 17 automated unit tests passing (100% pass rate)** in `src/core/invariants.test.ts`.  
**Build & Runtime Status:** Compiling cleanly (`vite build` + `tsx`) and running on Port 3000.

---

## 1. Active vs. Hidden Modules (Small Jeweler Pilot Configuration)

To keep the workspace clean, fast, and non-overwhelming for small jewelers, the sidebar navigation in `src/App.tsx` is intentionally scoped:

### Active Visible Modules (12 Core Counter & Back-Office Modules)
1. **Owner Cockpit (`DASHBOARD`)**: Live billed sales, Gold Stock (Gross & 24K Fine Equiv), Silver Stock Holding (`999 / 925 / Tunch`), Customer Receivables, Invariant Health, and Karigar Metal summary.
2. **Sale & Billing POS (`POS`)**:
   - Quick-add stock chips + barcode/tag/category search.
   - **Dynamic Customizable Sale Table (`SaleColumnConfig[]`)**: In-table **Customize Sale Columns** (`Edit / Rename Columns`) panel allowing jewelers to **rename any column header** (e.g. *Purity / Tunch* -> *Tunch*, *Labour Cost* -> *Majuri*), **toggle column visibility**, **reorder columns**, or **add custom fee (`FEE_INR`) / note (`TEXT`) columns** (persisted in `localStorage` under `auric_pos_sale_columns_v2`).
   - **Live Inline Editing at Sale**: Inline inputs for **Rate (`₹/g`)**, **Wastage (`%`)**, **Labour Charge (`₹/g`, `Flat ₹`, or `%`)**, **Discount (`₹`)**, and custom fee columns.
   - **Dual Invoice Printing**: 80mm Thermal Receipt + A4 GST Tax Invoice (which dynamically renders the jeweler's customized/renamed columns).
3. **Gold & Silver Stock (`INVENTORY`)**:
   - **Metal Filter Tabs**: `All Stock`, `Gold Jewellery`, `Silver Jewellery`.
   - **Editable Category Manager (`Manage Categories`)**: Add, inline rename, edit defaults (`metal`, `defaultPurity`, `defaultTounchPercent`, `defaultWastagePercent`, `defaultMakingChargeType`, `defaultMakingChargeValue`), or delete categories (persisted in `localStorage` under `auric_categories_v2`).
   - **Enhanced Gold & Silver Stock Entry (`+ Add Gold / Silver Stock`)**:
     - Supports Gold (`24K`, `22K`, `20K`, `18K`, `14K`) and Silver (`999 Fine`, `925 Sterling`, `80% Tunch`, `70% Tunch`) plus custom **Tunch / Tonch (%)** (`0.1%` to `100%`).
     - Records **Gross Weight**, **Stone/Less Weight**, **Net Weight**, **Fine Weight**, **Wastage %**, and **Rate at Time of Entry (`₹/g`)**.
     - **Authentic Sarafa Karigar Hisab (`computeKarigarHisab` & `labourDetails`)**:
       - Separates **1. Metal & Wastage Liability** (`Payable Tunch % = Item Tunch % + Karigar Wastage %` -> `Fine Grams Payable`), **2. Cash Majuri Formula** (`NONE_TOUCH_ONLY` Tunch+Wastage Only ₹0 Cash Majuri, `RUPEES_PER_GRAM`, `RUPEES_FLAT`, `PERCENTAGE`, `WEIGHT_GRAMS`), and **3. Immediate Settlement at Entry** (`Metal Given Now g` at `Given Metal Tunch %` + `Cash Paid Now ₹` -> live `Net Fine Balance Due g` & `Net Cash Majuri Due ₹`).
       - Automatically updates the Karigar's running Fine Gold/Silver balance and Cash Majuri payable in the Unified Party & Khata Ledger.
4. **Daily Metal Rates (`RATES`)**: Live board rates for Gold (`24K`, `22K`, `18K`, `14K`), Silver (`999`, `925`), and Platinum (`950`) with audit trail and proportionate Tunch calculation in `pricingEngine.ts`.
5. **Party & Khata Ledger (`CRM`)**:
   - **Unified Bahi-Khata Master Directory** for **Customers (`CUSTOMER`)**, **Karigars / Artisans (`KARIGAR`)**, and **Bullion Suppliers / Vyapari (`SUPPLIER`)**.
   - Full **Add Party**, **Edit Party**, **Remove / Delete Party**, and **Jama / Naam Settlement** (`Cash ₹`, `Fine Gold 999 g`, `Fine Silver 999 g`).
   - Displays **Triple-Column Balances (`Cash ₹`, `Fine Gold g`, `Fine Silver g`)**, KYC (`Mobile/WhatsApp`, `City`, `PAN`, `GSTIN`), and role-specific history (Customer retail bills/repairs/WhatsApp, Karigar crafted stock items with Tunch+Wastage breakdown, and Supplier bullion purchases).
6. **Karigar & Labour (`WHOLESALE_KARIGAR`)**: Dedicated workshop metal issue & receipt logs and Bhaav-Cut wholesale orders.
7. **Old Gold / Silver (`OLD_GOLD`)**: Touchstone/assay exchange intake, melt dust deduction, and trade-in credit vouchers redeemable at POS.
8. **Supplier Inward (`PURCHASES`)**: Bullion/ornament supplier inward bills with automatic stock tag creation and balanced input GST journals.
9. **Customer Repairs (`REPAIRS`)**: Bailment custody intake (segregated from shop inventory under Invariant 6).
10. **Barcode Tags (`BARCODE_DESIGNER`)**: 50x12mm butterfly barbell tag designer, secret price cipher (`BHARATGOLD`), and raw Zebra ZPL II export.
11. **Sales Returns (`RETURNS`)**: Credit notes linked to original invoices with restock or melt quarantine.
12. **Accounts & GST (`ACCOUNTING`)**: Double-entry General Journal (`Sum(Dr) === Sum(Cr)`), Trial Balance, GSTR-1 summary (HSN 7113 @ 3% GST), and Day Close lock.

### Hidden Enterprise Modules (Code Preserved in `src/modules/`, Hidden from Sidebar Navigation)
- `GIRVI` (Girvi Gold Loan Pawn Broking Desk)
- `SAVINGS` (Swarna Nidhi 11+1 Gold Chit Scheme)
- `MANUFACTURING` (8-Stage Casting & Factory BOM Studio)
- `AI_REPORTING` (Enterprise BI Query Center)
- `MIGRATION` (CSV Bulk Importer & RS-232 Scale Emulator)
- `SUBSCRIPTIONS` (Multi-Tenant SaaS Plan Manager)

---

## 2. Backend & Database Architecture Status (Exact Truth — Zero Hallucination)

| Layer | Current Implementation State | What Persists Right Now | What Is Needed for Multi-Shop / Cloud Production |
|---|---|---|---|
| **Business Logic & Math Engine** | **100% Complete & Tested** (`src/core/*.ts`, 17/17 unit tests passing) | Deterministic integer-paise math, 3-decimal gram precision, double-entry journals, Tunch pricing, Karigar Hisab (`Tunch + Wastage %`), and GST calculation. | Ready as-is; shared between frontend and backend. |
| **Application State & Demo Persistence** | **Client-Side React State + Browser `localStorage`** (`src/App.tsx`, `src/data/mockData.ts`) | All core entities (`auric_articles_v2`, `auric_categories_v2`, `auric_customers_v2`, `auric_karigars_v2`, `auric_suppliers_v2`, `auric_invoices_v2`, `auric_rates_v2`, `auric_pos_sale_columns_v2`) persist in browser `localStorage` across page reloads. | Ideal for zero-latency laptop vendor demos. |
| **Server / API Layer** | **Frontend SPA via Vite (`npm run dev`)** | Serves the React SPA directly on port 3000 without an active cloud database connection yet. | For permanent multi-device production bookkeeping, provision **Cloud SQL (PostgreSQL + Drizzle ORM)** (recommended for strict double-entry ACID transactions and triple-balance ledger joins) or **Firebase Firestore + Auth**. |
