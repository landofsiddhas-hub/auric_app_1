/**
 * AURIC Jewellery Business Operating System
 * Domain Types, Enums and Invariant Contracts
 */

export type MetalType = 'GOLD' | 'SILVER' | 'PLATINUM';

export interface PurityConfig {
  code: string;           // e.g. "24K", "22K", "18K", "14K", "999", "925"
  name: string;           // e.g. "22K Gold (916 Hallmarked)"
  metal: MetalType;
  fineness: number;       // out of 1000 (e.g. 916 for 22K, 750 for 18K, 999 for 24K)
  fineRatio: number;      // fineness / 1000 (e.g. 0.916)
  isStandardHallmark: boolean;
}

export type ArticleStatus = 
  | 'AVAILABLE' 
  | 'RESERVED' 
  | 'SOLD' 
  | 'TRANSFER_PENDING' 
  | 'IN_TRANSIT' 
  | 'REPAIR' 
  | 'QUARANTINED' 
  | 'MELTED' 
  | 'ARCHIVED';

export type MakingChargeType = 'PER_GRAM' | 'PERCENTAGE' | 'FIXED';

export type LabourCompensationType =
  | 'NONE_TOUCH_ONLY'
  | 'RUPEES_FLAT'
  | 'RUPEES_PER_GRAM'
  | 'WEIGHT_GRAMS'
  | 'METAL_GIVEN'
  | 'PERCENTAGE';

export interface ArtisanLabourRecord {
  labourId?: string;
  labourName: string;            // Artisan / Karigar name recorded at stock intake
  compensationType: LabourCompensationType;
  compensationValue: number;     // ₹ flat, ₹/g, weight (g), or % depending on compensationType
  metalGivenType?: 'NONE' | 'GOLD' | 'SILVER';
  metalGivenWeightGrams?: number; // Gold or silver weight in grams handed to artisan
  metalGivenTunch?: number;      // Purity/Tunch % of metal given to artisan (e.g. 99.5 or 99.9)
  metalGivenTounch?: number;     // Legacy alias for metalGivenTunch
  labourWastagePercent?: number; // Artisan wastage / gatva / badti % (added to item Tunch)
  totalPayableTunchPercent?: number; // Item Tunch % + Karigar Wastage %
  fineMetalPayableGrams?: number;    // Total Fine Metal payable to Karigar (g)
  fineMetalGivenGrams?: number;      // Fine Metal handed to Karigar at entry (g)
  netFineMetalDueGrams?: number;     // Remaining Fine Metal owed to/by Karigar (g)
  cashPaidNowINR?: number;           // Cash Majuri paid at entry (₹)
  netCashDueINR?: number;            // Remaining Cash Majuri payable to Karigar (₹)
  totalLabourCostINR?: number;   // Computed INR equivalent of artisan labour at time of entry
}

export interface JewelleryCategory {
  id: string;
  name: string;                  // e.g. "Chains", "Silver Payal (Anklets)", "Silver Pooja Items"
  metalType: 'GOLD' | 'SILVER' | 'BOTH';
  defaultPurity: string;         // e.g. "22K", "925", "80T"
  defaultTounch: number;         // e.g. 91.6, 92.5, 80.0 (Tunch / Tonch %)
  defaultWastagePercent: number; // e.g. 2.5
  defaultMakingChargeType: MakingChargeType;
  defaultMakingChargeValue: number;
}

export interface SaleColumnConfig {
  id: string;
  key: string;                   // Built-in key or custom column key
  label: string;                 // User-editable column header name on POS & Invoice
  visible: boolean;
  order: number;
  isCustom?: boolean;
  customType?: 'TEXT' | 'FEE_INR';
}

export interface CartItemOverride {
  ratePerGram?: number;
  wastagePercent?: number;
  makingChargeType?: MakingChargeType;
  makingChargeValue?: number;
  discountAmount?: number;
  customValues?: Record<string, string | number>;
}

export interface StoneDetail {
  id: string;
  stoneType: 'DIAMOND' | 'EMERALD' | 'RUBY' | 'SAPPHIRE' | 'CUBIC_ZIRCONIA' | 'PEARL' | 'OTHER';
  carats?: number;
  weightGrams: number;
  pieces: number;
  ratePerCaratOrPiece: number;
  totalPrice: number;
  certification?: string; // e.g. "IGI", "GIA"
}

export interface Article {
  id: string;
  sku: string;
  tagId: string;
  huid?: string;                 // 6-character alphanumeric BIS Hallmarking unique identifier
  title: string;
  category: string;              // Editable category name (Gold or Silver)
  collection?: string;
  metal: MetalType;
  purity: string;                // e.g. "22K", "18K", "24K", "14K", "999", "925", "80T"
  fineness: number;              // out of 1000 (e.g. 916 for 91.6% Tunch)
  tounchPercent?: number;        // e.g. 91.6, 75.0, 80.0 (Tunch / Tonch % = fineness / 10)
  rateAtEntryPerGram?: number;   // Metal rate (₹/g) locked at time of adding stock
  grossWeightGrams: number;      // Total weight on scale
  stoneWeightGrams: number;      // Weight of stones/enamel
  netWeightGrams: number;        // grossWeight - stoneWeight
  fineGoldEquivalentGrams: number; // netWeight * (fineness / 1000)
  makingChargeType: MakingChargeType;
  makingChargeValue: number;     // Selling labour charge: e.g. 450 (per gram) or 12 (%) or 1500 (flat)
  wastagePercent: number;        // Selling wastage %: e.g. 2.5%
  labourDetails?: ArtisanLabourRecord; // Artisan labour & metal settlement recorded at stock entry
  stones: StoneDetail[];
  hallmarkCost: number;          // BIS hallmark charges (e.g. Rs 45)
  costPrice: number;             // Internal acquisition cost
  branchId: string;
  location: string;              // Counter/Tray/Safe identifier
  status: ArticleStatus;
  supplierId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MetalRateSnapshot {
  timestamp: string;
  ratePerGram24K: number;        // Gold 24K (999 fineness)
  ratePerGram22K: number;        // Gold 22K (916 fineness)
  ratePerGram18K: number;        // Gold 18K (750 fineness)
  ratePerGram14K: number;        // Gold 14K (585 fineness)
  ratePerGramSilver999: number;  // Silver 999
  ratePerGramSilver925: number;  // Silver 925 sterling
  ratePerGramPlatinum950: number;// Platinum 950
  source: 'MANUAL_AUTHORIZED' | 'MCX_LIVE_FEED';
  authorizedBy: string;
}

export interface PricingBreakdown {
  articleId: string;
  title: string;
  category?: string;
  tagId: string;
  huid?: string;
  metal: MetalType;
  purity: string;
  tounchPercent: number;         // Tunch / Tonch % (e.g. 91.6)
  grossWeight: number;
  stoneWeight: number;
  netWeight: number;
  fineWeight: number;
  metalRateAppliedPerGram: number;
  rateAtEntryPerGram?: number;
  metalValue: number;
  wastagePercent: number;
  wastageWeight: number;
  wastageValue: number;
  makingChargeType: MakingChargeType;
  makingChargeRate: number;
  makingCharges: number;
  stonesValue: number;
  hallmarkCharges: number;
  customFeeTotal: number;
  customValues?: Record<string, string | number>;
  labourName?: string;
  itemSubtotal: number;
  discountAmount: number;
  taxableValue: number;
  gstRatePercent: number;        // Standard 3% for jewellery in India (1.5% CGST + 1.5% SGST)
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalPrice: number;
}

export type PaymentMethod = 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER' | 'CUSTOMER_ADVANCE' | 'OLD_GOLD_EXCHANGE';

export interface PaymentSplit {
  method: PaymentMethod;
  amount: number;
  referenceNo?: string;          // e.g. UPI txn ID, card auth code, check number
  receiptId?: string;
  notes?: string;
}

export interface OldMetalIntake {
  id: string;
  voucherNumber: string;
  customerId: string;
  customerName: string;
  metal: MetalType;
  declaredPurity: string;        // e.g. "Old 22K"
  testedFineness: number;        // e.g. 910 out of 1000
  grossWeightGrams: number;
  dustStoneDeductionGrams: number;
  netMeltWeightGrams: number;
  fineMetalEquivalentGrams: number;
  purityRatePerGram: number;
  deductionPercent: number;      // Melting / touchstone deduction
  netValuationAmount: number;
  status:
    | 'AVAILABLE_FOR_EXCHANGE'
    | 'REDEEMED_IN_SALE'
    | 'PENDING_APPROVAL'
    | 'ACCEPTED_AGAINST_SALE'
    | 'PURCHASED_CASH'
    | 'SENT_FOR_REFINING';
  redeemedInvoiceNumber?: string;
  redeemedAt?: string;
  assayedBy: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  panNumber?: string;            // Required in India for sales >= ₹2,00,000
  gstin?: string;
  address: string;
  city: string;
  loyaltyPoints: number;
  outstandingBalance: number;    // Cash Receivables (Jama / Len ₹)
  advanceBalance: number;        // Customer advances on hand (Naam / Den ₹)
  goldFineBalanceGrams?: number; // Customer fine gold balance (g)
  silverFineBalanceGrams?: number; // Customer fine silver balance (g)
  notes?: string;
  createdAt: string;
}

export interface SalesInvoice {
  id: string;
  invoiceNumber: string;         // e.g. "INV-2026-0089"
  tenantId: string;
  branchId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerPan?: string;
  customerGstin?: string;
  cashierId: string;
  cashierName: string;
  items: PricingBreakdown[];
  oldGoldVouchers: OldMetalIntake[];
  oldGoldDeductionTotal: number;
  subtotalTaxable: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  grandTotal: number;
  netPayableAfterExchange: number;
  payments: PaymentSplit[];
  amountPaid: number;
  balanceDue: number;            // Credit sale balance
  metalRateSnapshot: MetalRateSnapshot;
  status: 'POSTED' | 'CANCELLED' | 'REFUNDED_PARTIAL' | 'REFUNDED_FULL';
  hsnCode: string;               // 7113 for articles of jewellery
  createdAt: string;
}

export interface RepairOrder {
  id: string;
  repairNumber: string;          // e.g. "REP-2026-0042"
  customerId: string;
  customerName: string;
  customerPhone: string;
  articleDescription: string;    // e.g. "22K Traditional Kada - Resizing & Hinge Fix"
  customerArticleGrossWeight: number;
  isCustodyOnly: true;           // INVARIANT: Customer owned, non-merchant inventory!
  issueDescription: string;
  estimatedCost: number;
  advancePaid: number;
  assignedKarigarId?: string;
  assignedKarigarName?: string;
  pureGoldIssuedGrams: number;
  goldReturnedGrams: number;
  status: 'RECEIVED' | 'IN_WORKSHOP' | 'QUALITY_CHECK' | 'READY_FOR_DELIVERY' | 'DELIVERED_AND_BILLED';
  intakeTimestamp: string;
  promisedDate: string;
  completionDate?: string;
}

export interface Karigar {
  id: string;
  name: string;
  phone: string;
  city?: string;
  panNumber?: string;
  gstin?: string;
  specialization: string;        // e.g. "Kundan Setting", "Antique Casting", "Plain Gold Chains"
  defaultWastagePercent?: number; // Default Karigar Wastage / Touch % (e.g. 2.0%)
  defaultMajuriPerGram?: number;  // Default cash majuri ₹/g
  goldBalanceGrams: number;      // Outstanding fine gold balance with artisan
  silverBalanceGrams: number;    // Outstanding fine silver balance with artisan
  pendingJobsCount: number;
  labourPayableAmount: number;   // Cash Majuri payable (₹)
}

export interface JournalLine {
  accountId: string;
  accountName: string;
  accountCategory: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  debitPaise: number;            // Fixed-integer paise
  creditPaise: number;           // Fixed-integer paise
}

export interface JournalEntry {
  id: string;
  entryNumber: string;
  tenantId: string;
  branchId: string;
  date: string;
  referenceType: 'SALE' | 'PURCHASE' | 'OLD_GOLD' | 'PAYMENT' | 'EXPENSE' | 'STOCK_ADJUSTMENT';
  referenceId: string;
  narration: string;
  lines: JournalLine[];
  postedBy: string;
  postedAt: string;
}

export interface Branch {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  gstin: string;
  phone: string;
  managerName: string;
  isHeadquarters: boolean;
}

export interface Supplier {
  id: string;
  name: string;
  tradeName: string;
  gstin: string;
  panNumber?: string;
  phone: string;
  city: string;
  category: 'BULLION_DEALER' | 'CASTING_MANUFACTURER' | 'DIAMOND_MERCHANT' | 'FINDINGS_SUPPLIER';
  fineGoldBalanceGrams: number;  // Fine gold owed to/by supplier (g)
  fineSilverBalanceGrams?: number; // Fine silver owed to/by supplier (g)
  fiatPayableAmount: number;     // INR balance (₹)
}

export interface PurchaseInvoiceItem {
  id: string;
  title: string;
  category: string;
  purity: string;
  fineness: number;
  grossWeightGrams: number;
  stoneWeightGrams: number;
  netWeightGrams: number;
  fineGoldEquivalentGrams: number;
  ratePerGram: number;
  metalValue: number;
  makingCharges: number;
  huid?: string;
}

export interface PurchaseInvoice {
  id: string;
  purchaseInvoiceNumber: string; // e.g. "PUR-2026-0812"
  supplierId: string;
  supplierName: string;
  supplierGstin: string;
  branchId: string;
  invoiceDate: string;
  items: PurchaseInvoiceItem[];
  totalGrossWeightGrams: number;
  totalFineGoldEquivalentGrams: number;
  taxableSubtotal: number;
  cgstAmount: number;
  sgstAmount: number;
  grandTotal: number;
  paymentMode: 'IMMEDIATE_BANK' | 'SUPPLIER_CREDIT' | 'BHAAV_CUT_METAL_FIXATION';
  status: 'RECEIVED_AND_POSTED' | 'QUARANTINED' | 'CANCELLED';
  receivedBy: string;
  createdAt: string;
}

export interface CreditNote {
  id: string;
  creditNoteNumber: string;      // e.g. "CRN-2026-0034"
  originalInvoiceNumber: string; // INVARIANT 8: Must reference an eligible original sale!
  customerId: string;
  customerName: string;
  articleId: string;
  articleTitle: string;
  tagId: string;
  returnReason: 'SIZE_MISMATCH' | 'DESIGN_EXCHANGE' | 'DEFECT_MELT' | 'CUSTOMER_CHOICE';
  returnedTaxableValue: number;
  returnedCgst: number;
  returnedSgst: number;
  totalRefundAmount: number;
  refundMethod: 'STORE_CREDIT_VOUCHER' | 'BANK_REFUND' | 'CASH_REFUND';
  restockStatus: 'RESTOCKED_AVAILABLE' | 'SENT_FOR_MELT_SCRAP';
  authorizedBy: string;
  createdAt: string;
}

export interface SaaSPlan {
  id: 'STARTER' | 'PROFESSIONAL' | 'BUSINESS' | 'ENTERPRISE';
  name: string;
  monthlyPriceINR: number;
  annualPriceINR: number;
  maxBranches: number;
  maxUsers: number;
  maxArticles: number;
  features: string[];
}

export interface Tenant {
  id: string;
  legalName: string;
  tradeName: string;
  pan: string;
  subscriptionPlan: 'STARTER' | 'PROFESSIONAL' | 'BUSINESS' | 'ENTERPRISE';
  branches: Branch[];
}

export interface GirviItem {
  id: string;
  description: string;
  metal: MetalType;
  declaredPurity: string;
  fineness: number;
  grossWeightGrams: number;
  stoneDeductionGrams: number;
  netWeightGrams: number;
  fineGoldEquivalentGrams: number;
  valuationRatePerGram: number;
  itemValuationINR: number;
}

export interface GirviPayment {
  id: string;
  pledgeId: string;
  receiptNumber: string;
  paymentDate: string;
  interestAmount: number;
  principalAmount: number;
  totalAmount: number;
  paymentMode: 'CASH' | 'UPI' | 'BANK_TRANSFER';
  collectedBy: string;
  narration?: string;
}

export interface GirviPledge {
  id: string;
  pledgeNumber: string;          // e.g. "GIR-2026-0089"
  tenantId: string;
  branchId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerAadhaarLast4?: string;
  customerPan?: string;
  customerAddress?: string;
  items: GirviItem[];
  totalGrossWeightGrams: number;
  totalNetWeightGrams: number;
  totalFineGoldEquivalentGrams: number;
  totalValuationINR: number;
  loanToValuePercent: number;    // e.g. 75%
  sanctionedPrincipalINR: number;
  monthlyInterestRatePercent: number; // e.g. 1.5% per month (18% p.a.)
  pledgeDate: string;
  dueDate: string;               // typically 12 months from pledge date
  vaultPacketId: string;         // e.g. "PKT-VAULT-B2-04"
  status: 'ACTIVE' | 'REDEEMED' | 'OVERDUE' | 'AUCTIONED';
  totalInterestPaidINR: number;
  totalPrincipalPaidINR: number;
  balancePrincipalINR: number;
  payments: GirviPayment[];
  redeemedDate?: string;
  notes?: string;
  createdAt: string;
}

export interface ChitInstallment {
  id: string;
  installmentNumber: number;     // 1 to 11
  dueDate: string;
  paidDate?: string;
  amount: number;
  goldRateAppliedPerGram?: number;
  allocatedGoldWeightGrams?: number;
  paymentMode?: 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER';
  receiptNumber?: string;
  status: 'PAID' | 'DUE' | 'UPCOMING';
}

export interface GoldChitScheme {
  id: string;
  schemeNumber: string;          // e.g. "SCH-SWARNA-2026-0012"
  schemeName: string;            // e.g. "Swarna Nidhi 11+1 Gold Wealth Scheme"
  tenantId: string;
  branchId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  schemeType: 'VALUE_BASED' | 'WEIGHT_BASED';
  monthlyInstallmentINR: number; // e.g. 5000
  totalTenureMonths: number;     // 11 customer months
  monthsPaid: number;
  totalAmountPaidINR: number;
  bonusAmountContributedINR: number; // 1 month bonus paid by jeweler on completion
  totalMaturityValueINR: number; // e.g. 55000 + 5000 = 60000
  accumulatedGoldWeightGrams: number; // Total weight accumulated for weight-based schemes
  startDate: string;
  maturityDate: string;
  status: 'ACTIVE' | 'MATURED' | 'REDEEMED_AT_POS' | 'PREMATURE_CLOSED';
  redemptionInvoiceNumber?: string;
  installments: ChitInstallment[];
  createdAt: string;
}

export interface ThermalLabelConfig {
  tagWidthMm: number;            // e.g. 50
  tagHeightMm: number;           // e.g. 12
  tagStyle: 'BUTTERFLY' | 'DUMBBELL' | 'RATCHET';
  includeBarcode: boolean;
  includeQrCode: boolean;
  includeHuid: boolean;
  includeGrossNetWeight: boolean;
  includePurity: boolean;
  includeSecretPriceCode: boolean;
  secretCodeKey: string;         // e.g. "BHARATGOLD" for 1234567890
}

// ----------------------------------------------------
// STAGE 8: JEWELLERY MANUFACTURING & JOB CARD ENGINE
// ----------------------------------------------------

export type ProductionStageName = 
  | 'CAD_3D_DESIGN' 
  | 'WAX_TREE' 
  | 'CASTING' 
  | 'FILING_ASSEMBLY' 
  | 'STONE_SETTING' 
  | 'POLISHING_FINISHING' 
  | 'HALLMARKING_HUID' 
  | 'QC_APPROVAL';

export interface ProductionStageProgress {
  stage: ProductionStageName;
  assignedKarigarId?: string;
  assignedKarigarName?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';
  startedAt?: string;
  completedAt?: string;
  notes?: string;
}

export interface BOMComponent {
  id: string;
  componentType: 'PRECIOUS_METAL' | 'ALLOY_COPPER_SILVER' | 'DIAMOND' | 'GEMSTONE' | 'FINDING_CLASP';
  name: string;
  estimatedQuantity: number;
  unit: 'GRAMS' | 'CARATS' | 'PIECES';
  purityOrGrade?: string;
  estimatedCostINR: number;
}

export interface ManufacturingOrder {
  id: string;
  orderNumber: string;          // e.g. "MO-2026-0042"
  tenantId: string;
  branchId: string;
  customerId?: string;
  customerName?: string;
  title: string;                // e.g. "22K Heritage Jadau Choker with Uncut Polki"
  category: string;
  targetPurity: string;         // e.g. "22K (916)"
  targetFineness: number;       // 916
  targetGrossWeightGrams: number;
  priority: 'NORMAL' | 'HIGH' | 'RUSH_WEDDING';
  designSketchUrl?: string;
  cadFileReference?: string;
  bomComponents: BOMComponent[];
  
  // Metal Ledger tracking for this Job
  issuedPureGoldGrams: number;
  issuedAlloyGrams: number;
  totalIssuedMetalGrams: number;
  
  // Output weight reconciliation upon completion
  finishedGrossWeightGrams?: number;
  recoveredScrapGrams?: number;
  recoveredDustGrams?: number;
  recordedLossGrams?: number;   // Process loss (Ghat)
  allowedLossPercent: number;   // Standard allowable workshop loss e.g. 1.2%
  
  // Labour and Costing
  karigarLabourINR: number;
  findingChargesINR: number;
  stoneSettingChargesINR: number;
  totalManufacturingCostINR: number;
  
  // Progress & Lifecycle
  currentStage: ProductionStageName;
  stages: ProductionStageProgress[];
  status: 'DRAFT' | 'ISSUED_TO_WORKSHOP' | 'WIP' | 'COMPLETED' | 'INSPECTED_INTO_STOCK' | 'CANCELLED';
  assignedKarigarId: string;
  assignedKarigarName: string;
  expectedDeliveryDate: string;
  completedDate?: string;
  generatedArticleId?: string;  // Linked to newly created showroom stock article once finished
  createdAt: string;
}

// ----------------------------------------------------
// STAGE 10: AURIC INTELLIGENCE & BUSINESS BI METRICS
// ----------------------------------------------------

export interface BIReportMetricSummary {
  metricId: string;
  label: string;
  value: string | number;
  trendPercent?: number;
  trendDirection?: 'UP' | 'DOWN' | 'NEUTRAL';
  auditFormula: string;
  category: 'REVENUE' | 'PRECIOUS_METAL' | 'INVENTORY_HEALTH' | 'RISK_COMPLIANCE';
}

export interface AIQueryInsight {
  id: string;
  userPrompt: string;
  category: 'INVENTORY' | 'SALES' | 'METAL_RECONCILIATION' | 'CREDIT_RISK' | 'KARIGAR_PERFORMANCE';
  summaryTitle: string;
  answerMarkdown: string;
  groundedFacts: {
    sourceEntity: string;
    computedKey: string;
    verifiedValue: string;
  }[];
  suggestedAction?: {
    actionLabel: string;
    targetTab: string;
  };
  generatedAt: string;
}

export type StaffRole = 'OWNER' | 'MANAGER' | 'CASHIER' | 'ACCOUNTANT';

export interface StaffUser {
  id: string;
  name: string;
  role: StaffRole;
  pin: string;                  // 4-digit POS login PIN
  phone?: string;
  assignedBranchId: string | 'ALL';
  active: boolean;
}



