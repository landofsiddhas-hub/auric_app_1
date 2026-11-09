# Streamlined Small-Jeweler Edition: Editable Categories, Gold & Silver Stock Intake with Artisan Labour, and Customizable Sales Billing

This plan transforms AURIC into a fast, practical operating system tailored for small and independent gold and silver jewellery retailers. It removes enterprise clutter (`Girvi` and `Swarna Nidhi`) and introduces full category management, dedicated silver and gold stock entry with Tounch (purity), historical rate at intake, complete artisan/labour settlement tracking (in ₹, weight, metal given, or %), and a fully customizable Sales Page where every column can be renamed, toggled, reordered, or added.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following product decisions incorporate your requirements and answers from our planning discussion:

- **Confirmed Decision 1 — Clean, Focused Workspace for Small Jewelers**: Advanced enterprise modules (`Girvi Gold Loans` and `Swarna Nidhi Savings`) will be completely hidden from the navigation bar so staff only see daily essentials: **POS Sale Bill**, **Gold & Silver Stock (with Categories)**, **Metal Rates**, **Old Gold/Silver Exchange**, **Karigar & Labour Ledger**, **Customer Khata**, **Repairs**, and **Daily Accounts**.
- **Confirmed Decision 2 — Comprehensive Labour & Tounch Entry at Stock Intake**: When adding any Gold or Silver ornament to stock, you will be able to record the **Labour / Karigar Name**, **Tounch / Purity** (24K, 22K, 18K, 14K, Silver 999, Silver 925, or custom Tounch %), **Rate at Time of Entry**, **Wastage**, and **Artisan Labour Settlement** in **Rupees (₹)**, **Weight (g)**, **Gold/Silver Metal Given (g)**, or **Percentage (%)**, alongside default selling labour and wastage.
- **Confirmed Decision 3 — In-Table Customizable & Renameable Sales Columns**: The Sales / Billing table will include a **"Customize Columns"** control allowing jewelers to rename any column header (e.g., renaming *"Purity"* to *"Tounch"* or *"Making"* to *"Majuri / Labour"*), show/hide columns, change column order, and add custom columns—reflecting both on screen and on printed bills.

---

## 1. Overview & Core Concept

- **What It Does**: Provides small jewellery showrooms with an intuitive, everyday stock-and-sale workflow covering both **Gold and Silver jewellery**. Jewelers can organize and edit their own item categories, log incoming stock with exact Tounch, rate at the time of purchase/making, and artisan labour settlements, and generate customer bills on a customizable sales table.
- **Target Audience / Persona**: Independent showroom owners, family-run gold and silver shops, and counter staff who need fast stock entry and flexible billing using local trade terminology (*Tounch*, *Majuri / Labour*, *Wastage / Vadd*, *Fine Weight*).
- **Key Value**: Eliminates unused enterprise complexity while giving shop owners complete control over their item categories, silver and gold stock costing, artisan metal/cash labour tracking, and sale bill column names.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Editable Category Manager (Gold & Silver Jewels)**:
   - Accessible directly inside the **Stock & Inventory** workspace via a **"Manage Categories"** drawer/modal and quick inline category bar.
   - Jewelers can create, rename, edit, or delete categories across **Gold**, **Silver**, or **Both** (e.g., *Chains*, *Rings*, *Mangalsutra*, *Silver Payal (Anklets)*, *Silver Bichhiya*, *Silver Pooja Utensils*, *Silver Coins & Idols*).
   - Each category can store default presets (Default Metal, Default Tounch/Purity, Default Selling Wastage %, and Default Labour Charge) to speed up stock entry.

2. **Adding Stock with Tounch, Rate at Entry & Labour Details**:
   - Selecting **"+ Add Gold / Silver Stock"** opens a structured, single-view intake form:
     - **Category & Metal Selection**: Choose Gold or Silver and pick from editable categories (or create a new category on the fly).
     - **Purity / Tounch Selector**: Quick-select chips (`24K (99.9%)`, `22K (91.6%)`, `20K (83.3%)`, `18K (75.0%)`, `14K (58.5%)`, `Silver 999`, `Silver 925`, `Silver 80% Tounch`, `Silver 70% Tounch`) plus a direct **Custom Tounch %** input.
     - **Weights & Rate at Time of Entry**: Enter Gross Weight, Stone/Meena Weight, auto-calculated Net Weight & Fine Weight, and the **Metal Rate at Time of Entry (₹/g)** (pre-filled with today's live rate, editable to lock historical acquisition rate).
     - **Labour / Karigar & Wastage Section (At Stock Entry)**:
       - **Labour / Karigar Name**: Search/select an existing artisan or type a new Labour Name directly.
       - **Inward Labour Given / Cost**: Choose how the artisan was compensated:
         - **In Rupees (₹)**: Flat ₹ amount or ₹ per gram.
         - **In Weight (Grams)**: Labour weight in grams.
         - **Gold / Silver Given to Labour**: Record pure or alloy Gold/Silver weight (g) handed over to the artisan.
         - **In Percentage (%)**: Percentage of metal weight/value.
       - **Wastage & Default Selling Labour**: Record artisan wastage (%) as well as the default **Selling Wastage (%)** and **Selling Labour Charge** (`₹/g`, `Flat ₹`, or `%`) to apply automatically when the item is sold.

3. **Customizable Sales & Billing Page**:
   - **Live Editable Labour & Wastage in Cart**: When an item is scanned or selected for sale, its category, purity/tounch, weight, wastage %, and labour charge populate in the sale table. The salesperson can adjust the **Selling Labour** (`₹/g`, `Flat ₹`, or `%`), **Wastage %**, or **Applied Metal Rate** right inside the row, and the line total recalculates immediately.
   - **"Customize Sale Columns" Button**: Clicking **"Customize Columns"** above the sale table opens an interactive column configurator where the user can:
     - **Rename any column** (e.g., change *"Purity"* → *"Tounch"*, *"Making Charges"* → *"Labour / Majuri"*, *"Wastage"* → *"Vadd (%)"*).
     - **Show or Hide columns** via checkboxes (e.g., hide HUID or Stone Weight if not needed for simple silver bills).
     - **Reorder columns** with one-click Move Up / Move Down controls.
     - **Add Custom Bill Columns** (e.g., adding a custom *"Polish / Box Charge"* or *"Remarks"* column that can be filled per item during billing).
   - **Printed Bill Alignment**: Both the **A4 Invoice** and **80mm Thermal Receipt** dynamically use the jeweler's custom column names and visible column configuration.

### Visual Identity & Theme

- **Aesthetic Direction**: Utilitarian luxury ledger—crisp, high-contrast tabular precision built for fast counter operations under bright showroom lighting.
- **Color Palette & Mood**:
  - **60% Neutral Canvas**: Clean alabaster/slate background (`bg-slate-50` in light mode, `bg-slate-950` in dark mode).
  - **30% Structural Surfaces**: Crisp white/deep-slate workspace panels (`bg-white dark:bg-slate-900`) with 1px hairline borders (`border-slate-200 dark:border-slate-800`).
  - **10% Accent Budget**: Warm bullion gold (`amber-600`) for primary actions and Gold items, paired with cool sterling slate (`slate-600` / `sky-600`) for Silver items.
- **Typography & Hierarchy**:
  - **Display & Section Headings**: Geometric sans (`Plus Jakarta Sans` / system geometric sans), bold weight, tight tracking.
  - **Numeric & Weight Columns**: Strict monospace tabular numerals (`font-mono tabular-nums`) so gram weights (`0.001g`), Tounch percentages, and Rupee amounts align vertically across every table row.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Removing Enterprise Bloat (`Girvi` & `Swarna Nidhi`) from Navigation**
  - *Chosen Approach*: Remove Girvi Gold Loans, Swarna Nidhi Savings, SaaS Subscription Quotas, and Enterprise BI tabs from the main navigation bar, elevating **POS Billing**, **Gold & Silver Stock**, **Categories**, and **Karigar Labour** to top priority.
  - *Why*: Small jewelers want fast access to Stock Entry and Billing without wading through 18 enterprise menus.
  - *Alternatives Considered*: Keeping them in a sub-menu, which still adds visual clutter. (Confirmed with user to hide completely).

- **Decision 2: Capturing Both Artisan Inward Labour (Metal/Cash/%) and Retail Selling Labour at Stock Entry**
  - *Chosen Approach*: Store structured `ArtisanLabourRecord` metadata on each stock article (Labour Name, compensation mode: ₹, Weight, Gold/Silver Metal Given, or %, plus acquisition metal rate at time of entry) alongside the retail `makingChargeType`, `makingChargeValue`, and `wastagePercent`.
  - *Why*: Small jewelers track what they gave the karigar (cash or gold/silver metal + wastage) at the exact moment they weigh and tag a new ornament, and they also want default selling labour & wastage ready when a customer buys it.

- **Decision 3: Persistent Column Schema for the Sales Table**
  - *Chosen Approach*: Drive the POS Cart Table and Invoice Print templates from a dynamic `SaleColumnConfig[]` state persisted in `localStorage`.
  - *Why*: Ensures that when a shop owner renames columns (e.g., to *"Tounch"*, *"Vadd"*, *"Majuri"*) or hides unused columns, their layout stays saved across sessions and prints identically on customer bills.

---

## 4. Technical Architecture & Data Strategy

### Architecture & Component Diagram

```
┌────────────────────────────────────────────────────────────────────────────┐
│                   AURIC Small-Jeweler Application Shell                    │
│        (Focused Navigation: Dashboard · Sale POS · Stock & Categories ·    │
│          Metal Rates · Old Gold/Silver · Karigar & Labour · Accounts)      │
└───────────────┬───────────────────────────────────────────┬────────────────┘
                │                                           │
                ▼                                           ▼
┌───────────────────────────────────────┐   ┌────────────────────────────────┐
│   Stock & Category Workspace          │   │   Customizable Retail POS      │
│  ┌─────────────────────────────────┐  │   │  ┌──────────────────────────┐  │
│  │ Editable Category Manager       │  │   │  │ Column Customizer Modal  │  │
│  │ • Add / Rename / Delete         │  │   │  │ • Rename Column Headers  │  │
│  │ • Gold, Silver, or Both         │  │   │  │ • Toggle Visibility      │  │
│  │ • Default Tounch & Wastage %    │  │   │  │ • Reorder & Custom Cols  │  │
│  └───────────────┬─────────────────┘  │   │  └────────────┬─────────────┘  │
│                  ▼                    │   │               ▼                │
│  ┌─────────────────────────────────┐  │   │  ┌──────────────────────────┐  │
│  │ Gold & Silver Stock Intake Form │  │   │  │ Dynamic Sale Bill Table  │  │
│  │ • Weight, Tounch % & Purity     │  │   │  │ • Inline Edit: Labour ₹, │  │
│  │ • Rate at Time of Stock Entry   │  │   │  │   Wastage %, Rate, Custom│  │
│  │ • Labour Name & Settlement:     │  │   │  │ • Live GST & Total Math  │  │
│  │   (₹ / Wt / Gold-Silver Given/%)│  │   │  │ • A4 & Thermal Printout  │  │
│  └─────────────────────────────────┘  │   │  └──────────────────────────┘  │
└───────────────────────────────────────┘   └────────────────────────────────┘
```

### Data Model & State Enhancements

1. **`JewelleryCategory` Entity**:
   - `id`: Unique identifier.
   - `name`: Editable category name (e.g., `"Chains"`, `"Rings"`, `"Silver Payal"`, `"Silver Utensils"`, `"Mangalsutra"`).
   - `metalType`: `'GOLD' | 'SILVER' | 'BOTH'`.
   - `defaultPurity`: Default purity code (e.g., `"22K"`, `"925"`, `"80T"`).
   - `defaultTounch`: Default tounch percentage (e.g., `91.6`, `92.5`, `80.0`).
   - `defaultWastagePercent`: Default wastage % for items in this category.
   - `defaultMakingCharge`: Default selling labour value.

2. **Extended `Article` Stock Model (Tounch, Historical Rate & Labour Record)**:
   - `tounchPercent`: Numeric tounch/purity percentage (e.g., `91.6`, `75.0`, `92.5`, `82.0`).
   - `rateAtEntryPerGram`: Metal rate (₹/g) locked at the time the stock was added.
   - `labourDetails`:
     - `labourName`: Name of the karigar/artisan who made the item.
     - `labourCostType`: `'RUPEES_FLAT' | 'RUPEES_PER_GRAM' | 'WEIGHT_GRAMS' | 'METAL_GIVEN' | 'PERCENTAGE'`.
     - `labourCostValue`: Numeric amount in ₹, grams, or %.
     - `metalGivenType`: `'NONE' | 'GOLD' | 'SILVER'`.
     - `metalGivenWeightGrams`: Weight of Gold or Silver given to the artisan (g).
     - `labourWastagePercent`: Wastage % agreed with the artisan.

3. **`SaleColumnConfig` & Line-Item Overrides in POS**:
   - Array of column definitions: `{ id, key, label, visible, order, isCustom, customType: 'TEXT' | 'NUMBER' }`.
   - Each cart row supports live overrides for `makingChargeType`, `makingChargeValue`, `wastagePercent`, `rateOverridePerGram`, and `customColumnValues` (`Record<string, string | number>`), recalculating `PricingBreakdown` deterministically via fixed-precision paise arithmetic.
