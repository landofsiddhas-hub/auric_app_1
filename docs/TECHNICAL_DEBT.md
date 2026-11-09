# AURIC Technical Debt Register

**Review Date:** 2026-11-01  
**Target:** Continuous Zero-Debt Architecture  

---

## 1. Identified Risks & Debt Tracking

| Debt Item | Category | Severity | Description | Remediation Plan |
| :--- | :--- | :--- | :--- | :--- |
| **Floating-Point Drift** | Accounting / Metal | **CRITICAL** | Standard JavaScript `0.1 + 0.2 = 0.30000000000000004` causes penny & milligram discrepancy. | Enforce `src/core/math.ts` with fixed decimal scaling (`toPaise`, `toMilliGrams`). |
| **Dual Custody Leakage** | Inventory Invariant | **HIGH** | Customer-owned repair articles accidentally counted in showroom inventory balance sheet. | Explicit segregation of `Article` (company stock) vs `RepairOrder.customerArticle` (bailment custody). |
| **Historical Rate Mutation** | Pricing Engine | **HIGH** | Modifying today's 22K gold rate retroactively alters yesterday's settled invoices. | Store full frozen `RateSnapshot` and `PricingCalculationBreakdown` in every invoice line. |
| **Cross-Tenant Leakage** | SaaS Security | **CRITICAL** | Shared state inadvertently exposing tenant A's stock or margins to tenant B. | Scope every domain query and state slice with strict tenant context. |
| **Hardware Driver Silos** | Device Integration | **MEDIUM** | Hardcoding a specific weighing scale or thermal printer model. | Provide adapter layer with standard RS-232/HID format and fallback manual override. |
