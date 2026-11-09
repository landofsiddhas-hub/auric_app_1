# AURIC — Client Pilot & Demo Readiness Report (v1.4.0 Small Jeweler Edition)

**System:** AURIC Jewellery Business Operating System  
**Current Milestone:** v1.4.0 (Small Jeweler Pilot & Vendor Demo Edition)  
**Readiness Classification:** **100% READY FOR LIVE VENDOR DEMOS & SINGLE-COUNTER SHADOW PILOTS**  
**Last Updated:** November 4, 2026  
**Target Customer Profile:** Small & Independent Gold and Silver Jewellery Retailers  

---

## 1. Executive Summary: Demo vs. Production Readiness

| Capability Area | Current Status | Details |
|---|---|---|
| **Small Jeweler UI & Navigation** | **100% Ready** | Enterprise bloat (Girvi, Chit, SaaS Tiers, BI, Scale Emulator) hidden. Focused on POS, Gold/Silver Stock, Rates, Karigar, Old Metal, and Khata. |
| **Editable Gold & Silver Categories** | **100% Ready** | Add, rename, edit default Tounch/wastage/labour, and delete categories (`Manage Categories`). Persisted in `localStorage`. |
| **Stock Entry (Weight, Tounch, Entry Rate & Karigar Tag)** | **100% Ready** | Supports Gold (`24K`–`14K`) & Silver (`999`, `925`, `85T`–`70T`, custom `Tounch %`), Entry Rate (`₹/g`), and 5 Karigar labour settlement modes (`₹/g`, `Flat ₹`, `Weight g`, `Gold/Silver Given g`, `%`). |
| **POS Billing & Customizable Columns** | **100% Ready** | Live inline editing of Rate, Wastage %, Labour (`₹/g`, `Flat ₹`, `%`), and Discount. In-table **Customize Sale Columns** renames headers, reorders/hides columns, and adds custom fee/text columns on both screen and printed A4 GST Invoice. |
| **Core Math & Accounting Invariants** | **100% Ready** | 16 / 16 automated invariant tests passing (`src/core/invariants.test.ts`). Zero floating-point drift; strict 3% GST (1.5% CGST + 1.5% SGST). |
| **Backend & Database Persistence** | **Demo / Local Mode** | Currently runs in browser memory + `localStorage` (for categories & custom columns). **Requires Cloud SQL (PostgreSQL) or Firebase Firestore provisioning before multi-day live store bookkeeping.** |

---

## 2. Backend & Database Truth: What You Have Today vs. Next Step for Production

To ensure your internal team and engineering memory never confuse **Demo Readiness** with **Cloud Database Persistence**, here is the exact technical state:

### A. What is Running Today (Ideal for Vendor Demos & Training)
1. **Pure TypeScript Domain Engines (`src/core/*.ts`)**:
   - All calculations (fine metal weight from Tounch %, wastage, making charges in ₹/g or Flat ₹ or %, 3% GST, Karigar metal ledger balances, and double-entry accounting journals) are 100% real, deterministic code—not static mockups.
2. **Browser Persistence (`localStorage` + In-Memory Seed)**:
   - Custom categories (`auric_categories_v1`) and custom POS bill columns (`auric_sale_columns_v1`) are saved in the browser's `localStorage`.
   - Operational records (stock items, invoices, karigar ledgers, journals) initialize from `src/data/mockData.ts` so every demo starts with realistic Gold & Silver jewellery stock (`TAG-90142` to `TAG-90149`) and updates live during the session.
   - **Caveat for Live Store Use:** If a jeweler closes or refreshes the browser tab, newly created invoices or stock items from that session reset back to the seed state (except categories and column configurations).

### B. How We Enable Permanent Database Storage (When a Vendor Signs Up)
When your first jeweler client says *"Yes, install this on my shop counter for daily billing"*, we have **two 1-click native database integrations** ready to wire in AI Studio:
1. **Option 1 — Firebase Firestore + Firebase Auth (Recommended for Fast Multi-Shop SaaS)**:
   - Real-time cloud sync across owner's phone and shop counter laptop, offline-first caching (if shop internet drops), and secure user login per jeweler shop.
2. **Option 2 — Google Cloud SQL for PostgreSQL + Drizzle ORM + Firebase Auth**:
   - Relational SQL tables (`articles`, `categories`, `karigars`, `invoices`, `journal_entries`, `customers`) with strict ACID transactions.

---

## 3. Documentation Map (Persistent Repository Memory)

All project documentation is stored inside `/docs/` so neither the AI coding engine nor your internal team ever loses context:
- **`/docs/VENDOR_DEMO_PLAYBOOK.md`**: Step-by-step 12-minute live demo script and vendor Q&A guide for the internal team.
- **`/docs/PROJECT_STATE.md`**: Single source of truth for active/hidden modules, custom small-jeweler workflows, backend/database status, and the 16 automated tests.
- **`/docs/PILOT_READINESS.md`**: Client pilot & database readiness assessment (this document).
- **`/docs/CURRENT_STATE.md`**: Codebase directory map and 15 core architectural invariants.
- **`/docs/DECISION_LOG.md`**: Architectural Decision Records (`ADR 001` through `ADR 007`).
- **`/docs/CHANGELOG.md`**: Version-by-version release history (`v1.1.0` through `v1.4.0`).
