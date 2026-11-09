# AURIC — Internal Team & Vendor Demo Playbook (Small Jeweler Pilot Edition v1.5.0)

**Target Audience:** Founder, Internal Sales/Onboarding Team & Field Demo Engineers  
**Target Customer Profile:** Independent & Small-to-Medium Gold and Silver Jewellery Retailers (Showrooms, Silver Payal/Utensil Counters, Karigar-Driven Shops)  
**Purpose:** Step-by-step live demo script, operational guide, and Q&A reference so any team member can run a flawless 12-minute live vendor demonstration without confusion or hallucination.

---

## Part 1: Pre-Demo Checklist (2 Minutes Before Meeting)

1. **Open the App URL** in Chrome/Edge at 100% zoom (Desktop or Laptop screen recommended: `1366x768` or `1440x900`).
2. **Verify Active Showroom & Role (Top-Right Header):**
   - Branch: `Zaveri Bazaar Flagship (Mumbai, Maharashtra)`
   - Role: `Role: Business Owner` (gives full access to Rates, Stock, POS, Party & Khata Ledger, Karigar, and Accounts).
3. **Why the Sidebar is Clean & Focused:**
   - Enterprise-heavy modules (*Girvi Gold Loans*, *Swarna Nidhi 11+1 Chit*, *Tenant Subscriptions*, *BI Queries*, and *Scale Hardware Emulators*) are **intentionally hidden** in v1.5.0 so small jewelers only see their daily essentials:
     - **Owner Cockpit**
     - **Sale & Billing POS**
     - **Gold & Silver Stock**
     - **Daily Metal Rates**
     - **Party & Khata Ledger** *(Unified Customer, Karigar & Supplier Bahi-Khata)*
     - **Karigar & Labour**
     - **Old Gold / Silver**
     - **Supplier Inward**, **Customer Repairs**, **Barcode Tags**, **Sales Returns**, **Accounts & GST**

---

## Part 2: The 12-Minute Step-by-Step Vendor Demo Script

### Step 1: The Owner Cockpit & Daily Metal Rates (2 Minutes)
1. **Start on `Owner Cockpit`**:
   - Point out the top-bar live rates (`Gold 24K`, `Gold 22K`, `Silver 999`).
   - Show the **4 Executive Cards**:
     - *Today's Billed Sales*
     - *Gold Stock (Gross)* + *Fine 24K Equivalent*
     - *Silver Stock Holding (999 / 925 / Tunch)*
     - *Customer Receivables & Cash in Store Till*
2. **Click `Daily Metal Rates` in the left sidebar**:
   - Explain: *"Every morning, you enter your shop's Gold 24K, 22K, 18K, 14K and Silver 999 / 925 board rates here. Past bills are permanently locked at the rate when they were billed, so changing today's rate never changes yesterday's invoices."*

---

### Step 2: Managing Gold & Silver Categories (2 Minutes)
1. **Click `Gold & Silver Stock` in the left sidebar**.
2. **Click `Manage Categories` at the top-right**:
   - Show the vendor that categories are **not hardcoded**.
   - Point out dedicated **Gold** and **Silver** categories already configured:
     - *Chains, Rings, Necklaces, Bangles & Kada, Earrings & Jhumkas, Bridal Sets*
     - *Silver Payal (Anklets), Silver Bichhiya (Toe Rings), Silver Pooja & Utensils, 925 Sterling Silver Jewels, Coins & Bars*
   - **Live Action**:
     - Add a sample category (e.g., `Silver Waist Belt (Kamarbandh)`, Metal: `Silver Only`, Default Purity: `80% Tunch`, Default Tunch: `80%`, Default Wastage: `4%`, Default Labour: `₹18/g`) and click **+ Add Category**.
     - Show that you can also **rename** any existing category inline or change its default wastage/labour.
   - Close the category drawer.

---

### Step 3: Adding Stock with Weight, Tunch (Tonch / Purity), Wastage, Entry Rate & Authentic Karigar Hisab (4 Minutes)
*(This is the most important part for small jewelers — show this slowly!)*

1. **Click `+ Add Gold / Silver Stock`**:
   - **Section 1 (Metal, Category & Item Identity)**:
     - Toggle between **Gold Jewellery** and **Silver Jewellery**.
     - Pick Category (e.g., `Silver Payal` or `Chains`). Notice how default Purity, Tunch %, Wastage %, and Selling Labour automatically pre-fill from the category!
     - Enter Item Name (e.g., `Heavy Jodhpuri Silver Payal Pair` or `22K Gold Fancy Mala`).
   - **Section 2 (Purity / Tunch (Tonch), Weight & Rate at Time of Entry)**:
     - Select **Purity Preset** (`24K`, `22K`, `20K`, `18K`, `14K` for Gold; `999 Fine`, `925 Sterling`, `80% Tunch`, `70% Tunch` for Silver).
     - Show the **Tunch / Tonch (%)** box: explain that if a silver ornament is `82.5%` tunch, they can type `82.5` directly and the system calculates exact **Fine Metal Weight (`Net Wt × Tunch %`)** to the milligram (`0.001g`).
     - Enter **Gross Weight (g)** and **Stone / Less Weight (g)** -> show how **Net Weight (g)** and **Fine Weight (g)** compute live.
     - Point out **Rate at Time of Entry (₹/g)** -> records the exact metal bhav on the day the stock was added.
   - **Section 3 (Customer Selling Wastage & Making Charge Defaults for POS)**:
     - Set what the shop charges the retail customer at the time of sale (Selling Wastage % and Selling Labour in `₹/g`, `Flat ₹`, or `%`).
   - **Section 4 (Karigar / Artisan Hisab — Tunch + Wastage & Majuri Settlement)**:
     - Show how AURIC follows authentic Indian Sarafa **Bahi-Khata Karigar Hisab** by separating **Metal Liability**, **Cash Majuri**, and **Immediate Settlement**:
       1. **Karigar Name & Metal Liability (`Tunch + Wastage = Payable Tunch`)**:
          - Pick an existing Karigar from the dropdown (auto-fills their agreed Wastage % and Majuri rate) or type a new Karigar name.
          - Show the live badge: `Payable Tunch = Item Tunch % + Karigar Wastage %` (e.g., `80% Tunch + 3.5% Wastage = 83.5% Payable Tunch -> Fine Grams Payable`).
       2. **Cash Majuri / Making Charge Mode Dropdown (5 Verified Sarafa Modes)**:
          - **Tunch + Wastage Only (₹0 Cash Majuri)** — standard for Agra/Mathura Silver Payal and Rajkot/Coimbatore Gold Chains where the Karigar's profit is entirely in the wastage %!
          - **Per Gram in Rupees (₹/g)** — e.g., `₹350/g` cash majuri on net weight.
          - **Flat / Per Piece / Jodi in Rupees (₹)** — e.g., `₹2,500` flat for the piece or pair.
          - **Percentage of Metal Value (%)** — e.g., `6%` of metal value.
          - **Extra Fine Metal Weight (Grams)** — e.g., `0.500g` extra fine metal credit.
       3. **Immediate Settlement Given at Entry (`Jama / Naam`)**:
          - Record if Fine Gold/Silver or Cash was handed to the Karigar on the spot (`Metal Given Wt (g)`, `Given Metal Tunch (%)`, `Cash Majuri Paid Now (₹)`).
          - Point out the **4-Column Live Karigar Jama/Naam Summary Box** showing *Fine Metal Payable*, *Fine Metal Given Now*, *Net Fine Balance Due*, and *Net Cash Majuri Due*.
   - **Click `Save to Gold/Silver Stock`**:
     - Show the new item immediately appearing in the stock table with its **Tag ID**, **Purity & Tunch**, **Fine Weight**, **Entry Rate**, **Wastage & Selling Labour**, and **Karigar / Artisan Hisab**.

---

### Step 4: Unified Party & Khata Master Ledger — Customers, Karigars & Suppliers (2 Minutes)
1. **Click `Party & Khata Ledger` in the left sidebar**:
   - Explain: *"Small jewelers don't want 3 different complicated screens to add or remove people. Here, Customers (Grahak), Karigars (Artisans), and Bullion Suppliers (Vyapari) are all managed in one Unified Bahi-Khata Ledger."*
   - Show the **Role Filter Tabs**: `All Parties`, `Customers`, `Karigars`, `Suppliers`.
   - Point out the **Triple-Balance Summary Strip** at the top and on every party card:
     - **Cash Balance (₹)**
     - **Fine Gold Balance (999 g)**
     - **Fine Silver Balance (999 g)**
   - **Live Action**:
     - Click **`+ Add Party (Customer / Karigar / Supplier)`** -> switch between Customer, Karigar, and Supplier pills to show how easy it is to add any person with their opening Cash, Gold, and Silver balances.
     - Select a Karigar or Customer -> click **`Jama / Naam Hisab`** to record a Cash or Fine Gold/Silver settlement, or click **`Remove`** to show how easily obsolete entries can be removed.

---

### Step 5: Selling on POS — Customizing Columns & Editing Labour/Wastage Live (2 Minutes)
1. **Click `Sale & Billing POS` in the left sidebar**:
   - **Show Quick-Add Stock Chips**: Click one Gold item and one Silver Tunch item.
2. **Show Live Inline Editing in the Sale Table**:
   - Point out that each item's **Rate (₹/g)**, **Wastage %**, **Labour Cost (`₹/g`, `Flat ₹`, or `%`)**, and **Discount (₹)** can be edited right inside the table during customer bargaining.
3. **Show Customizable Sale Page & Invoice Columns (`Customize Sale Columns` / `Edit / Rename Columns`)**:
   - Click **`Edit / Rename Columns`**.
   - Explain: *"Every jeweler writes bills differently. Some write 'Tunch' instead of 'Purity', some write 'Majuri' or 'Ghadai' instead of 'Labour Cost', and some want to hide the Wastage % column from the printed bill."*
   - Rename `Purity / Tunch` -> `Tunch` or `Labour Cost` -> `Majuri (₹)`, or add a custom fee column (`Hallmark Fee`).
4. **Complete the Sale & Print Bill**:
   - Click `Fill` next to **Cash**, then click **`Complete Sale & Generate Bill`**.
   - Toggle between the **A4 Tax Invoice** and **80mm Thermal Receipt** to show the customized columns on the final GST bill.
