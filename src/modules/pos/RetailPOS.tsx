import React, { useState, useEffect } from 'react';
import {
  Barcode,
  Search,
  Trash2,
  Plus,
  CreditCard,
  Banknote,
  QrCode,
  Receipt,
  Printer,
  ShieldAlert,
  CheckCircle2,
  Scale,
  User,
  Clock,
  SlidersHorizontal,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import {
  Article,
  Branch,
  CartItemOverride,
  Customer,
  MakingChargeType,
  MetalRateSnapshot,
  OldMetalIntake,
  PaymentSplit,
  PricingBreakdown,
  SaleColumnConfig,
  SalesInvoice,
} from '../../core/types';
import { computeArticlePricing, getApplicableRatePerGram } from '../../core/pricingEngine';
import { formatCurrencyINR, formatWeightGrams, roundDecimals } from '../../core/math';
import { initialSaleColumns } from '../../data/mockData';

interface RetailPOSProps {
  articles: Article[];
  customers: Customer[];
  activeBranch: Branch;
  metalRates: MetalRateSnapshot;
  onPostSale: (invoice: SalesInvoice) => void;
  oldGoldVouchers: OldMetalIntake[];
  onAddOldGoldVoucher?: (voucher: OldMetalIntake) => void;
  saleColumns?: SaleColumnConfig[];
  onUpdateSaleColumns?: (cols: SaleColumnConfig[]) => void;
}

const DEFAULT_POS_COLUMNS: SaleColumnConfig[] = [
  { id: 'col-item', key: 'item', label: 'Item / Tag', visible: true, order: 1 },
  { id: 'col-cat', key: 'category', label: 'Category', visible: false, order: 2 },
  { id: 'col-purity', key: 'purityTounch', label: 'Purity / Tunch', visible: true, order: 3 },
  { id: 'col-grosswt', key: 'grossWeight', label: 'Gross Wt (g)', visible: false, order: 4 },
  { id: 'col-netwt', key: 'netWeight', label: 'Net Wt (g)', visible: true, order: 5 },
  { id: 'col-finewt', key: 'fineWeight', label: 'Fine Wt (g)', visible: false, order: 6 },
  { id: 'col-rate', key: 'ratePerGram', label: 'Rate (₹/g)', visible: true, order: 7 },
  { id: 'col-metalval', key: 'metalValue', label: 'Metal Value', visible: false, order: 8 },
  { id: 'col-wastage', key: 'wastage', label: 'Wastage %', visible: true, order: 9 },
  { id: 'col-labour', key: 'labour', label: 'Labour Cost', visible: true, order: 10 },
  { id: 'col-karigar', key: 'karigarName', label: 'Karigar', visible: false, order: 11 },
  { id: 'col-discount', key: 'discount', label: 'Discount (₹)', visible: true, order: 12 },
  { id: 'col-total', key: 'totalPrice', label: 'Item Total (₹)', visible: true, order: 13 },
];

export const RetailPOS: React.FC<RetailPOSProps> = ({
  articles,
  customers,
  activeBranch,
  metalRates,
  onPostSale,
  oldGoldVouchers,
  onAddOldGoldVoucher,
  saleColumns: propColumns,
  onUpdateSaleColumns,
}) => {
  // Load or initialize customizable sale columns
  const [localColumns, setLocalColumns] = useState<SaleColumnConfig[]>(() => {
    try {
      const saved = localStorage.getItem('auric_pos_sale_columns_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore storage errors
    }
    return propColumns && propColumns.length > 0 ? propColumns : DEFAULT_POS_COLUMNS;
  });

  const activeColumns = propColumns && propColumns.length > 0 && onUpdateSaleColumns ? propColumns : localColumns;

  const updateColumns = (nextCols: SaleColumnConfig[]) => {
    const normalized = nextCols.map((c, idx) => ({ ...c, order: idx + 1 }));
    setLocalColumns(normalized);
    try {
      localStorage.setItem('auric_pos_sale_columns_v2', JSON.stringify(normalized));
    } catch {
      // ignore storage errors
    }
    if (onUpdateSaleColumns) {
      onUpdateSaleColumns(normalized);
    }
  };

  useEffect(() => {
    if (propColumns && propColumns.length > 0) {
      setLocalColumns(propColumns);
    }
  }, [propColumns]);

  // POS State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customers[0]?.id || '');
  const [cartItems, setCartItems] = useState<{ article: Article; overrides: CartItemOverride }[]>([]);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Column Customizer Modal / Drawer State
  const [showColumnCustomizer, setShowColumnCustomizer] = useState(false);
  const [newColLabel, setNewColLabel] = useState('');
  const [newColType, setNewColType] = useState<'FEE_INR' | 'TEXT'>('FEE_INR');

  // Old Gold deductions applied to cart (scoped to selected customer)
  const [selectedOldGoldIds, setSelectedOldGoldIds] = useState<string[]>([]);
  const [showQuickOldMetalForm, setShowQuickOldMetalForm] = useState(false);
  const [quickOgMetal, setQuickOgMetal] = useState<'GOLD' | 'SILVER'>('GOLD');
  const [quickOgDesc, setQuickOgDesc] = useState('Old 22K Gold Ornament');
  const [quickOgTunch, setQuickOgTunch] = useState<number>(90.5);
  const [quickOgGrossWt, setQuickOgGrossWt] = useState<number>(10.0);
  const [quickOgLessWt, setQuickOgLessWt] = useState<number>(0.4);
  const [quickOgMeltDeduction, setQuickOgMeltDeduction] = useState<number>(1.5);

  // Payment split amounts
  const [cashAmount, setCashAmount] = useState<number>(0);
  const [upiAmount, setUpiAmount] = useState<number>(0);
  const [cardAmount, setCardAmount] = useState<number>(0);
  const [advanceAmount, setAdvanceAmount] = useState<number>(0);
  const [upiRef, setUpiRef] = useState<string>('');
  const [cardAuth, setCardAuth] = useState<string>('');

  // Invoice & Receipt Modal
  const [postedInvoice, setPostedInvoice] = useState<SalesInvoice | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState<boolean>(false);
  const [invoicePrintView, setInvoicePrintView] = useState<'A4_TAX' | 'THERMAL_80MM'>('A4_TAX');

  // Customer details
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId) || customers[0];

  // Available articles in current branch
  const availableArticles = articles.filter(
    (a) => a.branchId === activeBranch.id && a.status === 'AVAILABLE'
  );

  // Filtered search results
  const searchResults = searchQuery.trim()
    ? availableArticles.filter(
        (a) =>
          a.tagId.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (a.huid && a.huid.toLowerCase().includes(searchQuery.toLowerCase())) ||
          a.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  // Add article to cart with initial editable rate, wastage, and labour defaults
  const handleAddToCart = (article: Article) => {
    if (cartItems.some((item) => item.article.id === article.id)) return;
    const defaultBoardRate = getApplicableRatePerGram(article, metalRates);
    const initialOverrides: CartItemOverride = {
      ratePerGram: defaultBoardRate,
      wastagePercent: article.wastagePercent,
      makingChargeType: article.makingChargeType,
      makingChargeValue: article.makingChargeValue,
      discountAmount: 0,
      customValues: {},
    };
    setCartItems([...cartItems, { article, overrides: initialOverrides }]);
    setSearchQuery('');
    setCheckoutError(null);
  };

  // Remove article from cart
  const handleRemoveFromCart = (articleId: string) => {
    setCartItems(cartItems.filter((item) => item.article.id !== articleId));
  };

  // Update any override field for a cart item (rate, wastage %, labour mode/value, discount, or custom column)
  const handleUpdateCartOverride = (
    articleId: string,
    patch: Partial<CartItemOverride>
  ) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.article.id === articleId
          ? {
              ...item,
              overrides: {
                ...item.overrides,
                ...patch,
              },
            }
          : item
      )
    );
  };

  const handleUpdateCustomColValue = (
    articleId: string,
    colKey: string,
    value: string | number
  ) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.article.id === articleId
          ? {
              ...item,
              overrides: {
                ...item.overrides,
                customValues: {
                  ...(item.overrides.customValues || {}),
                  [colKey]: value,
                },
              },
            }
          : item
      )
    );
  };

  // Sorted visible columns for the Sale Table & Invoice
  const visibleColumns = [...activeColumns]
    .filter((c) => c.visible)
    .sort((a, b) => a.order - b.order);

  // Compute pricing breakdowns for all cart items using overrides & custom columns
  const pricedItems: PricingBreakdown[] = cartItems.map((item) =>
    computeArticlePricing(
      item.article,
      metalRates,
      item.overrides.discountAmount || 0,
      false,
      item.overrides,
      activeColumns
    )
  );

  // Cart financial totals
  const subtotalTaxable = roundDecimals(
    pricedItems.reduce((sum, item) => sum + item.taxableValue, 0),
    2
  );
  const totalCgst = roundDecimals(
    pricedItems.reduce((sum, item) => sum + item.cgstAmount, 0),
    2
  );
  const totalSgst = roundDecimals(
    pricedItems.reduce((sum, item) => sum + item.sgstAmount, 0),
    2
  );
  const grandTotal = roundDecimals(
    pricedItems.reduce((sum, item) => sum + item.totalPrice, 0),
    2
  );

  // Filter Old Gold / Silver vouchers strictly for the currently selected customer
  const customerEligibleVouchers = oldGoldVouchers.filter(
    (v) =>
      v.customerId === selectedCustomer?.id &&
      v.status !== 'REDEEMED_IN_SALE' &&
      v.status !== 'PURCHASED_CASH' &&
      v.status !== 'SENT_FOR_REFINING' &&
      !v.redeemedInvoiceNumber
  );

  const customerRedeemedVouchers = oldGoldVouchers.filter(
    (v) =>
      v.customerId === selectedCustomer?.id &&
      (v.status === 'REDEEMED_IN_SALE' || Boolean(v.redeemedInvoiceNumber))
  );

  // Old Gold deduction sum (only from eligible vouchers of the currently selected customer)
  const acceptedOldGold = customerEligibleVouchers.filter((v) =>
    selectedOldGoldIds.includes(v.id)
  );
  const oldGoldDeductionTotal = roundDecimals(
    acceptedOldGold.reduce((sum, v) => sum + v.netValuationAmount, 0),
    2
  );

  // Quick inline Old Gold / Silver Exchange creation right from POS
  const quickNetMeltWt = Math.max(0, roundDecimals(quickOgGrossWt - quickOgLessWt, 3));
  const quickFineness = roundDecimals(quickOgTunch * 10, 1);
  const quickBaseRate =
    quickOgMetal === 'GOLD' ? metalRates.ratePerGram24K : metalRates.ratePerGramSilver999;
  const quickPurityRate = roundDecimals((quickBaseRate * quickOgTunch) / 100, 2);
  const quickGrossVal = roundDecimals(quickNetMeltWt * quickPurityRate, 2);
  const quickNetValuation = roundDecimals(
    quickGrossVal - (quickGrossVal * quickOgMeltDeduction) / 100,
    2
  );

  const handleCreateQuickOldMetal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || quickNetMeltWt <= 0 || !onAddOldGoldVoucher) return;

    const newVoucher: OldMetalIntake = {
      id: `OG-${Date.now()}`,
      voucherNumber: `OG-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      metal: quickOgMetal,
      declaredPurity: `${quickOgDesc.trim() || 'Old Ornament'} (${quickOgTunch}% Tunch)`,
      testedFineness: quickFineness,
      grossWeightGrams: quickOgGrossWt,
      dustStoneDeductionGrams: quickOgLessWt,
      netMeltWeightGrams: quickNetMeltWt,
      fineMetalEquivalentGrams: roundDecimals((quickNetMeltWt * quickOgTunch) / 100, 3),
      purityRatePerGram: quickPurityRate,
      deductionPercent: quickOgMeltDeduction,
      netValuationAmount: quickNetValuation,
      status: 'AVAILABLE_FOR_EXCHANGE',
      assayedBy: 'POS Counter Assay',
      createdAt: new Date().toISOString(),
    };

    onAddOldGoldVoucher(newVoucher);
    setSelectedOldGoldIds((prev) => [...prev, newVoucher.id]);
    setShowQuickOldMetalForm(false);
  };

  // Net payable after trade-in exchange
  const netPayable = Math.max(0, roundDecimals(grandTotal - oldGoldDeductionTotal, 2));

  // Total payments entered
  const totalPaymentsEntered = roundDecimals(
    cashAmount + upiAmount + cardAmount + advanceAmount,
    2
  );
  const balanceRemaining = roundDecimals(netPayable - totalPaymentsEntered, 2);

  // Quick helper to fill remaining into a payment mode
  const handleQuickPay = (mode: 'CASH' | 'UPI' | 'CARD') => {
    if (balanceRemaining <= 0) return;
    if (mode === 'CASH') setCashAmount(roundDecimals(cashAmount + balanceRemaining, 2));
    if (mode === 'UPI') setUpiAmount(roundDecimals(upiAmount + balanceRemaining, 2));
    if (mode === 'CARD') setCardAmount(roundDecimals(cardAmount + balanceRemaining, 2));
    setCheckoutError(null);
  };

  // Column Customizer Actions
  const handleRenameColumn = (colId: string, newLabel: string) => {
    updateColumns(
      activeColumns.map((c) => (c.id === colId ? { ...c, label: newLabel } : c))
    );
  };

  const handleToggleColumn = (colId: string) => {
    updateColumns(
      activeColumns.map((c) => (c.id === colId ? { ...c, visible: !c.visible } : c))
    );
  };

  const handleMoveColumn = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= activeColumns.length) return;
    const copy = [...activeColumns];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIndex, 0, moved);
    updateColumns(copy);
  };

  const handleAddCustomColumn = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newColLabel.trim();
    if (!trimmed) return;
    const key = `custom_${Date.now()}`;
    const newCol: SaleColumnConfig = {
      id: `col-${Date.now()}`,
      key,
      label: trimmed,
      visible: true,
      order: activeColumns.length + 1,
      isCustom: true,
      customType: newColType,
    };
    updateColumns([...activeColumns, newCol]);
    setNewColLabel('');
  };

  const handleDeleteCustomColumn = (colId: string) => {
    updateColumns(activeColumns.filter((c) => c.id !== colId));
  };

  const handleResetColumns = () => {
    updateColumns(DEFAULT_POS_COLUMNS.length > 0 ? DEFAULT_POS_COLUMNS : initialSaleColumns);
  };

  // PAN Requirement check: Sales >= ₹2,00,000 require PAN in India
  const isPanRequired = grandTotal >= 200000;
  const hasPan = Boolean(
    selectedCustomer?.panNumber && selectedCustomer.panNumber.trim().length >= 10
  );

  // Post sale & issue invoice
  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    if (balanceRemaining > 0.05) {
      setCheckoutError(
        `Payment is incomplete. ${formatCurrencyINR(balanceRemaining)} is remaining. Click "Fill" next to Cash/UPI/Card.`
      );
      return;
    }

    setCheckoutError(null);
    const payments: PaymentSplit[] = [];
    if (cashAmount > 0) payments.push({ method: 'CASH', amount: cashAmount });
    if (upiAmount > 0)
      payments.push({
        method: 'UPI',
        amount: upiAmount,
        referenceNo: upiRef || 'UPI-APP-TXN',
      });
    if (cardAmount > 0)
      payments.push({
        method: 'CARD',
        amount: cardAmount,
        referenceNo: cardAuth || 'AUTH-CARD-POS',
      });
    if (advanceAmount > 0)
      payments.push({ method: 'CUSTOMER_ADVANCE', amount: advanceAmount });
    if (oldGoldDeductionTotal > 0) {
      payments.push({
        method: 'OLD_GOLD_EXCHANGE',
        amount: oldGoldDeductionTotal,
        notes: `Exchange vouchers: ${selectedOldGoldIds.join(', ')}`,
      });
    }

    const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(
      1000 + Math.random() * 9000
    )}`;

    const newInvoice: SalesInvoice = {
      id: `INV-${Date.now()}`,
      invoiceNumber,
      tenantId: 'TEN-AURIC-01',
      branchId: activeBranch.id,
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      customerPhone: selectedCustomer.phone,
      customerPan: selectedCustomer.panNumber,
      customerGstin: selectedCustomer.gstin,
      cashierId: 'USR-CSH-01',
      cashierName: 'Counter Cashier 1',
      items: pricedItems,
      oldGoldVouchers: acceptedOldGold,
      oldGoldDeductionTotal,
      subtotalTaxable,
      totalCgst,
      totalSgst,
      totalIgst: 0,
      grandTotal,
      netPayableAfterExchange: netPayable,
      payments,
      amountPaid: totalPaymentsEntered + oldGoldDeductionTotal,
      balanceDue: Math.max(0, balanceRemaining),
      metalRateSnapshot: { ...metalRates },
      status: 'POSTED',
      hsnCode: '7113',
      createdAt: new Date().toISOString(),
    };

    onPostSale(newInvoice);
    setPostedInvoice(newInvoice);
    setShowInvoiceModal(true);

    // Reset checkout form
    setCartItems([]);
    setSelectedOldGoldIds([]);
    setCashAmount(0);
    setUpiAmount(0);
    setCardAmount(0);
    setAdvanceAmount(0);
    setUpiRef('');
    setCardAuth('');
  };

  return (
    <div className="space-y-5">
      {/* Header & Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Barcode className="w-5 h-5 text-amber-600" />
            Retail Sale POS & Customizable Billing
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Sell Gold & Silver jewels with live editable Wastage %, Labour Charges, and customizable bill columns.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Live Active Rate Indicator */}
          <div className="flex items-center gap-2 text-xs font-mono bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 px-3 py-1.5 rounded-lg text-amber-800 dark:text-amber-200 whitespace-nowrap">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>
              22K: {formatCurrencyINR(metalRates.ratePerGram22K)}/g · Silver 999: ₹{metalRates.ratePerGramSilver999}/g
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowColumnCustomizer(!showColumnCustomizer)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-600" />
            Customize Sale Columns
          </button>
        </div>
      </div>

      {/* Inline Collapsible / Modal Column Customizer */}
      {showColumnCustomizer && (
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border-2 border-amber-400/80 dark:border-amber-600 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-amber-600" />
                Customize Sale Page & Invoice Columns
              </h2>
              <p className="text-[11px] text-slate-500">
                Rename any column title (e.g. change &quot;Purity / Tunch&quot; to &quot;Tunch&quot; or &quot;Labour Cost&quot; to &quot;Majuri&quot;), reorder, toggle visibility, or add a new column.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetColumns}
                className="px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg inline-flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Reset Defaults
              </button>
              <button
                type="button"
                onClick={() => setShowColumnCustomizer(false)}
                className="px-3 py-1 text-xs font-semibold bg-amber-600 text-white rounded-lg"
              >
                Done
              </button>
            </div>
          </div>

          {/* Add New Custom Column Form */}
          <form
            onSubmit={handleAddCustomColumn}
            className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2.5 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700 text-xs"
          >
            <div className="flex-1">
              <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                + Add New Column to Sale Page & Bill
              </label>
              <input
                type="text"
                placeholder="e.g. Hallmark / Stone Fee, Certification, Extra Majuri..."
                value={newColLabel}
                onChange={(e) => setNewColLabel(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                Column Type
              </label>
              <select
                value={newColType}
                onChange={(e) => setNewColType(e.target.value as 'FEE_INR' | 'TEXT')}
                className="px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                <option value="FEE_INR">Extra Charge (₹ Added to Bill)</option>
                <option value="TEXT">Text / Note Column</option>
              </select>
            </div>
            <button
              type="submit"
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded transition-colors whitespace-nowrap"
            >
              + Add Column
            </button>
          </form>

          {/* Columns Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
            {activeColumns.map((col, idx) => (
              <div
                key={col.id}
                className={`p-2 rounded-lg border text-xs flex items-center gap-2 ${
                  col.visible
                    ? 'bg-amber-50/40 dark:bg-slate-800/80 border-amber-300 dark:border-slate-700'
                    : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-60'
                }`}
              >
                <input
                  type="checkbox"
                  aria-label={`Toggle ${col.label}`}
                  checked={col.visible}
                  onChange={() => handleToggleColumn(col.id)}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <input
                  type="text"
                  aria-label={`Column name for ${col.key}`}
                  value={col.label}
                  onChange={(e) => handleRenameColumn(col.id, e.target.value)}
                  className="flex-1 min-w-0 px-2 py-1 text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-900 dark:text-white"
                />
                <div className="flex items-center gap-0.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleMoveColumn(idx, -1)}
                    disabled={idx === 0}
                    title="Move column left"
                    className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                  >
                    <ArrowUp className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveColumn(idx, 1)}
                    disabled={idx === activeColumns.length - 1}
                    title="Move column right"
                    className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                  >
                    <ArrowDown className="w-3 h-3" />
                  </button>
                  {col.isCustom && (
                    <button
                      type="button"
                      onClick={() => handleDeleteCustomColumn(col.id)}
                      title="Delete custom column"
                      className="p-1 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* POS Two-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (8 cols): Article Lookup & Customizable Sale Table */}
        <div className="lg:col-span-8 space-y-4">
          {/* Barcode & Article Search Input + Quick Pick */}
          <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Scan Tag barcode, enter SKU, Category (e.g. Payal, Chains), or item name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            {/* Quick Matching Dropdown */}
            {searchResults.length > 0 && (
              <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 shadow-lg">
                {searchResults.map((art) => (
                  <div
                    key={art.id}
                    onClick={() => handleAddToCart(art)}
                    className="p-2.5 hover:bg-amber-50/50 dark:hover:bg-slate-800/80 cursor-pointer flex items-center justify-between text-xs transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{art.title}</span>
                        <span className="font-mono text-amber-600 dark:text-amber-400">
                          {art.tagId}
                        </span>
                        <span className="px-1.5 py-0.5 text-[10px] rounded bg-slate-100 dark:bg-slate-800 font-mono">
                          {art.metal} · {art.purity} ({art.tounchPercent ?? roundDecimals(art.fineness / 10, 1)}%)
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        Cat: {art.category} · Net: {formatWeightGrams(art.netWeightGrams)} · Wst: {art.wastagePercent}% · Labour:{' '}
                        {art.makingChargeType === 'PER_GRAM'
                          ? `₹${art.makingChargeValue}/g`
                          : art.makingChargeType === 'PERCENTAGE'
                          ? `${art.makingChargeValue}%`
                          : `₹${art.makingChargeValue}`}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="px-2.5 py-1 text-xs font-medium text-white bg-amber-600 hover:bg-amber-700 rounded flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add to Bill
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Quick-Select Stock Chips (Gold & Silver Available Stock) */}
            {availableArticles.length > 0 && (
              <div className="pt-1">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Quick Add Available Gold & Silver Stock ({availableArticles.length} items):
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {availableArticles.slice(0, 8).map((art) => {
                    const inCart = cartItems.some((c) => c.article.id === art.id);
                    return (
                      <button
                        key={art.id}
                        type="button"
                        disabled={inCart}
                        onClick={() => handleAddToCart(art)}
                        className={`px-2.5 py-1 rounded-lg border text-[11px] font-mono flex items-center gap-1.5 transition-colors ${
                          inCart
                            ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 cursor-not-allowed'
                            : art.metal === 'SILVER'
                            ? 'bg-slate-100/80 dark:bg-slate-800 hover:bg-slate-200 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200'
                            : 'bg-amber-50/70 dark:bg-amber-950/30 hover:bg-amber-100 border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200'
                        }`}
                      >
                        <Plus className="w-3 h-3 text-amber-600 shrink-0" />
                        <span className="font-sans font-medium truncate max-w-[140px]">
                          {art.title}
                        </span>
                        <span className="text-[10px] opacity-75">
                          ({art.purity} · {formatWeightGrams(art.netWeightGrams)})
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Customizable Sale Bill Table */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Sale Bill Items ({cartItems.length})
                </span>
                <span className="text-[11px] text-slate-500">
                  · Edit Wastage, Labour Cost & Rate directly in table
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowColumnCustomizer(!showColumnCustomizer)}
                className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Edit / Rename Columns
              </button>
            </div>

            {cartItems.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <Barcode className="w-8 h-8 mx-auto stroke-1 opacity-50" />
                <p className="text-xs">No items in the sale bill yet.</p>
                <p className="text-[11px] text-slate-500">
                  Click any Gold or Silver jewel chip above or search by Tag/Name to start billing.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-mono">
                    <tr>
                      {visibleColumns.map((col) => (
                        <th
                          key={col.id}
                          className={`py-2.5 px-2.5 whitespace-nowrap ${
                            col.key === 'item' || col.key === 'category' || col.key === 'karigarName'
                              ? 'text-left'
                              : 'text-right'
                          }`}
                        >
                          {col.label}
                        </th>
                      ))}
                      <th className="py-2.5 px-2 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {pricedItems.map((pItem, idx) => {
                      const rawCartItem = cartItems[idx];
                      const ov = rawCartItem?.overrides || {};
                      return (
                        <tr
                          key={pItem.articleId}
                          className="hover:bg-slate-50/40 dark:hover:bg-slate-800/30"
                        >
                          {visibleColumns.map((col) => {
                            if (col.key === 'item') {
                              return (
                                <td key={col.id} className="py-2.5 px-2.5">
                                  <div className="font-medium text-slate-900 dark:text-white truncate max-w-[170px]">
                                    {pItem.title}
                                  </div>
                                  <div className="text-[10px] text-slate-500 font-mono">
                                    {pItem.tagId} · {pItem.metal}{' '}
                                    {pItem.huid ? `· HUID: ${pItem.huid}` : ''}
                                  </div>
                                </td>
                              );
                            }

                            if (col.key === 'category') {
                              return (
                                <td key={col.id} className="py-2.5 px-2.5 text-slate-700 dark:text-slate-300">
                                  {pItem.category || rawCartItem.article.category}
                                </td>
                              );
                            }

                            if (col.key === 'purityTounch') {
                              return (
                                <td
                                  key={col.id}
                                  className="py-2.5 px-2.5 text-right font-mono tabular-nums"
                                >
                                  <div className="font-semibold text-slate-900 dark:text-white">
                                    {pItem.purity}
                                  </div>
                                  <div className="text-[10px] text-amber-600 dark:text-amber-400">
                                    {pItem.tounchPercent}% Tunch
                                  </div>
                                </td>
                              );
                            }

                            if (col.key === 'grossWeight') {
                              return (
                                <td
                                  key={col.id}
                                  className="py-2.5 px-2.5 text-right font-mono tabular-nums"
                                >
                                  {formatWeightGrams(pItem.grossWeight)}
                                </td>
                              );
                            }

                            if (col.key === 'netWeight') {
                              return (
                                <td
                                  key={col.id}
                                  className="py-2.5 px-2.5 text-right font-mono tabular-nums font-medium text-slate-900 dark:text-white"
                                >
                                  {formatWeightGrams(pItem.netWeight)}
                                </td>
                              );
                            }

                            if (col.key === 'fineWeight') {
                              return (
                                <td
                                  key={col.id}
                                  className="py-2.5 px-2.5 text-right font-mono tabular-nums text-amber-600"
                                >
                                  {formatWeightGrams(pItem.fineWeight)}
                                </td>
                              );
                            }

                            if (col.key === 'ratePerGram') {
                              return (
                                <td key={col.id} className="py-2.5 px-2.5 text-right">
                                  <input
                                    type="number"
                                    step="0.1"
                                    aria-label={`Rate per gram for ${pItem.title}`}
                                    value={
                                      ov.ratePerGram !== undefined
                                        ? ov.ratePerGram
                                        : pItem.metalRateAppliedPerGram
                                    }
                                    onChange={(e) =>
                                      handleUpdateCartOverride(pItem.articleId, {
                                        ratePerGram: Number(e.target.value) || 0,
                                      })
                                    }
                                    className="w-20 px-1.5 py-1 text-right font-mono text-xs border border-slate-200 dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                                  />
                                </td>
                              );
                            }

                            if (col.key === 'metalValue') {
                              return (
                                <td
                                  key={col.id}
                                  className="py-2.5 px-2.5 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300"
                                >
                                  {formatCurrencyINR(pItem.metalValue)}
                                </td>
                              );
                            }

                            if (col.key === 'wastage') {
                              return (
                                <td key={col.id} className="py-2.5 px-2.5 text-right">
                                  <div className="inline-flex flex-col items-end gap-0.5">
                                    <div className="flex items-center gap-1">
                                      <input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        aria-label={`Wastage percent for ${pItem.title}`}
                                        value={
                                          ov.wastagePercent !== undefined
                                            ? ov.wastagePercent
                                            : pItem.wastagePercent
                                        }
                                        onChange={(e) =>
                                          handleUpdateCartOverride(pItem.articleId, {
                                            wastagePercent: Number(e.target.value) || 0,
                                          })
                                        }
                                        className="w-14 px-1.5 py-1 text-right font-mono text-xs border border-slate-200 dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                                      />
                                      <span className="text-[10px] font-mono text-slate-400">%</span>
                                    </div>
                                    <span className="text-[10px] font-mono text-slate-500 tabular-nums">
                                      {formatCurrencyINR(pItem.wastageValue)}
                                    </span>
                                  </div>
                                </td>
                              );
                            }

                            if (col.key === 'labour') {
                              const currentMakingType =
                                ov.makingChargeType ?? pItem.makingChargeType;
                              const currentMakingVal =
                                ov.makingChargeValue !== undefined
                                  ? ov.makingChargeValue
                                  : pItem.makingChargeRate;
                              return (
                                <td key={col.id} className="py-2.5 px-2.5 text-right">
                                  <div className="inline-flex flex-col items-end gap-1">
                                    <div className="flex items-center gap-1">
                                      <select
                                        aria-label={`Labour mode for ${pItem.title}`}
                                        value={currentMakingType}
                                        onChange={(e) =>
                                          handleUpdateCartOverride(pItem.articleId, {
                                            makingChargeType: e.target.value as MakingChargeType,
                                          })
                                        }
                                        className="px-1 py-1 text-[10px] font-mono border border-slate-200 dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                                      >
                                        <option value="PER_GRAM">₹/g</option>
                                        <option value="FIXED">Flat ₹</option>
                                        <option value="PERCENTAGE">%</option>
                                      </select>
                                      <input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        aria-label={`Labour value for ${pItem.title}`}
                                        value={currentMakingVal}
                                        onChange={(e) =>
                                          handleUpdateCartOverride(pItem.articleId, {
                                            makingChargeValue: Number(e.target.value) || 0,
                                          })
                                        }
                                        className="w-16 px-1.5 py-1 text-right font-mono text-xs border border-slate-200 dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                                      />
                                    </div>
                                    <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 tabular-nums">
                                      = {formatCurrencyINR(pItem.makingCharges)}
                                    </span>
                                  </div>
                                </td>
                              );
                            }

                            if (col.key === 'karigarName') {
                              return (
                                <td key={col.id} className="py-2.5 px-2.5 text-slate-600 dark:text-slate-400">
                                  {pItem.labourName || 'In-house'}
                                </td>
                              );
                            }

                            if (col.key === 'discount') {
                              return (
                                <td key={col.id} className="py-2.5 px-2.5 text-right">
                                  <input
                                    type="number"
                                    min="0"
                                    aria-label={`Discount for ${pItem.title}`}
                                    value={ov.discountAmount || ''}
                                    placeholder="0"
                                    onChange={(e) =>
                                      handleUpdateCartOverride(pItem.articleId, {
                                        discountAmount: Number(e.target.value) || 0,
                                      })
                                    }
                                    className="w-16 px-1.5 py-1 text-right font-mono text-xs border border-slate-200 dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                                  />
                                </td>
                              );
                            }

                            if (col.key === 'totalPrice') {
                              return (
                                <td
                                  key={col.id}
                                  className="py-2.5 px-2.5 text-right font-mono font-semibold text-slate-900 dark:text-white tabular-nums"
                                >
                                  <div>{formatCurrencyINR(pItem.totalPrice)}</div>
                                  <div className="text-[9px] text-slate-400">Incl. 3% GST</div>
                                </td>
                              );
                            }

                            // Custom user-added column (either FEE_INR or TEXT)
                            if (col.isCustom) {
                              const currentVal = ov.customValues?.[col.key] ?? '';
                              return (
                                <td key={col.id} className="py-2.5 px-2.5 text-right">
                                  <input
                                    type={col.customType === 'FEE_INR' ? 'number' : 'text'}
                                    placeholder={col.customType === 'FEE_INR' ? '₹0' : 'Note'}
                                    value={currentVal}
                                    onChange={(e) =>
                                      handleUpdateCustomColValue(
                                        pItem.articleId,
                                        col.key,
                                        col.customType === 'FEE_INR'
                                          ? Number(e.target.value) || 0
                                          : e.target.value
                                      )
                                    }
                                    className="w-20 px-1.5 py-1 text-right font-mono text-xs border border-amber-300 dark:border-amber-700 rounded bg-amber-50/30 dark:bg-slate-800 text-slate-900 dark:text-white"
                                  />
                                </td>
                              );
                            }

                            return <td key={col.id} className="py-2.5 px-2.5" />;
                          })}

                          <td className="py-2.5 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveFromCart(pItem.articleId)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                              aria-label={`Remove ${pItem.title} from cart`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Old Gold / Silver Trade-in Exchange Box (Customer-Scoped & Live Synced) */}
          <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div>
                <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-amber-600" />
                  Apply Old Gold / Silver Exchange Credit ({selectedCustomer?.name})
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Showing unredeemed exchange vouchers belonging to <strong>{selectedCustomer?.name}</strong>. Check to deduct from this bill, or uncheck to keep unredeemed.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-mono text-[11px]">
                  {customerEligibleVouchers.length} available
                </span>
                {onAddOldGoldVoucher && (
                  <button
                    type="button"
                    onClick={() => setShowQuickOldMetalForm(!showQuickOldMetalForm)}
                    className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 font-semibold text-[11px] flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{showQuickOldMetalForm ? 'Close Form' : '+ Quick Exchange'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Inline Quick Old Gold / Silver Exchange Form on POS */}
            {showQuickOldMetalForm && (
              <form
                onSubmit={handleCreateQuickOldMetal}
                className="p-3 rounded-lg bg-amber-50/50 dark:bg-slate-800/70 border border-amber-200 dark:border-amber-800/60 space-y-2.5 text-xs"
              >
                <div className="font-bold text-amber-900 dark:text-amber-300 flex items-center justify-between">
                  <span>Record Instant Old Gold / Silver Exchange for {selectedCustomer?.name}</span>
                  <span className="font-mono">
                    Credit: <strong>{formatCurrencyINR(quickNetValuation)}</strong>
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">Metal</label>
                    <select
                      value={quickOgMetal}
                      onChange={(e) => {
                        const m = e.target.value as 'GOLD' | 'SILVER';
                        setQuickOgMetal(m);
                        setQuickOgTunch(m === 'GOLD' ? 90.5 : 75.0);
                        setQuickOgDesc(m === 'GOLD' ? 'Old 22K Gold Ornament' : 'Old Silver Payal');
                      }}
                      className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    >
                      <option value="GOLD">Gold</option>
                      <option value="SILVER">Silver</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] text-slate-500 mb-0.5">Old Item Description</label>
                    <input
                      type="text"
                      required
                      value={quickOgDesc}
                      onChange={(e) => setQuickOgDesc(e.target.value)}
                      className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">Gross Wt (g)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.1"
                      required
                      value={quickOgGrossWt}
                      onChange={(e) => setQuickOgGrossWt(Number(e.target.value) || 0)}
                      className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">Less Dust (g)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={quickOgLessWt}
                      onChange={(e) => setQuickOgLessWt(Number(e.target.value) || 0)}
                      className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">Tunch (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      max="100"
                      required
                      value={quickOgTunch}
                      onChange={(e) => setQuickOgTunch(Number(e.target.value) || 0)}
                      className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-bold text-amber-600"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] font-mono text-slate-500">
                    Net Melt Wt: {formatWeightGrams(quickNetMeltWt)} · Rate: ₹{quickPurityRate}/g (Less {quickOgMeltDeduction}% melt loss)
                  </span>
                  <button
                    type="submit"
                    className="px-3 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                  >
                    + Add &amp; Apply to Bill
                  </button>
                </div>
              </form>
            )}

            {customerEligibleVouchers.length === 0 ? (
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 flex items-center justify-between">
                <span>
                  No unredeemed Old Gold / Silver exchange vouchers on file for <strong>{selectedCustomer?.name}</strong>.
                </span>
                {onAddOldGoldVoucher && !showQuickOldMetalForm && (
                  <button
                    type="button"
                    onClick={() => setShowQuickOldMetalForm(true)}
                    className="text-amber-600 dark:text-amber-400 font-semibold hover:underline ml-2 shrink-0"
                  >
                    + Weigh Old Gold/Silver Now
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-1.5">
                {customerEligibleVouchers.map((v) => {
                  const isChecked = selectedOldGoldIds.includes(v.id);
                  return (
                    <label
                      key={v.id}
                      className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                        isChecked
                          ? 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-400 dark:border-amber-700'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedOldGoldIds([...selectedOldGoldIds, v.id]);
                            } else {
                              setSelectedOldGoldIds(
                                selectedOldGoldIds.filter((id) => id !== v.id)
                              );
                            }
                          }}
                          className="rounded text-amber-600 focus:ring-amber-500"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900 dark:text-white font-mono">
                              {v.voucherNumber}
                            </span>
                            <span
                              className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold ${
                                isChecked
                                  ? 'bg-amber-200/80 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200'
                                  : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              }`}
                            >
                              {isChecked ? 'APPLIED TO THIS BILL' : 'AVAILABLE FOR EXCHANGE'}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {v.metal} · {v.declaredPurity} · Net Melt Wt: {formatWeightGrams(v.netMeltWeightGrams)}
                          </div>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                        - {formatCurrencyINR(v.netValuationAmount)}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}

            {/* Previously Redeemed Vouchers for this Customer */}
            {customerRedeemedVouchers.length > 0 && (
              <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 space-y-1">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Already Redeemed Vouchers ({selectedCustomer?.name}):
                </div>
                {customerRedeemedVouchers.map((rv) => (
                  <div
                    key={rv.id}
                    className="flex items-center justify-between text-[11px] font-mono text-slate-400 bg-slate-50 dark:bg-slate-800/40 px-2.5 py-1 rounded"
                  >
                    <span>
                      {rv.voucherNumber} · {rv.declaredPurity} ({formatWeightGrams(rv.netMeltWeightGrams)})
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      Redeemed in {rv.redeemedInvoiceNumber || 'Completed Sale'} ({formatCurrencyINR(rv.netValuationAmount)})
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (4 cols): Customer, Summary, Payments, & Checkout */}
        <div className="lg:col-span-4 space-y-4">
          {/* Customer Selection Card */}
          <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-500" />
                Customer Account
              </span>
              <span className="text-slate-500 font-mono text-[11px]">
                Loyalty: {selectedCustomer.loyaltyPoints} pts
              </span>
            </div>

            <select
              aria-label="Select Customer"
              value={selectedCustomerId}
              onChange={(e) => {
                setSelectedCustomerId(e.target.value);
                // Clear any selected Old Gold vouchers from the previous customer
                setSelectedOldGoldIds([]);
                setShowQuickOldMetalForm(false);
              }}
              className="w-full py-1.5 px-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.phone})
                </option>
              ))}
            </select>

            <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
              <span>Customer PAN: {selectedCustomer.panNumber || 'Not recorded'}</span>
              <span>Advance Balance: {formatCurrencyINR(selectedCustomer.advanceBalance)}</span>
            </div>

            {isPanRequired && !hasPan && (
              <div className="flex items-start gap-1.5 p-2 rounded bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-200">
                <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600" />
                <span>
                  <strong>Compliance Notice:</strong> Sale exceeds ₹2,00,000. Customer PAN is required under Rule 114B.
                </span>
              </div>
            )}
          </div>

          {/* Pricing Summary */}
          <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Sale Bill Breakdown
            </h3>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Total Metal Value:</span>
                <span className="font-mono tabular-nums text-slate-900 dark:text-white">
                  {formatCurrencyINR(pricedItems.reduce((s, i) => s + i.metalValue, 0))}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Total Wastage Value:</span>
                <span className="font-mono tabular-nums text-slate-900 dark:text-white">
                  {formatCurrencyINR(pricedItems.reduce((s, i) => s + i.wastageValue, 0))}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Total Labour / Making Cost:</span>
                <span className="font-mono tabular-nums text-slate-900 dark:text-white">
                  {formatCurrencyINR(pricedItems.reduce((s, i) => s + i.makingCharges, 0))}
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                <span>Taxable Value:</span>
                <span className="font-mono tabular-nums text-slate-900 dark:text-white">
                  {formatCurrencyINR(subtotalTaxable)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>CGST (1.5%) + SGST (1.5%):</span>
                <span className="font-mono tabular-nums text-slate-900 dark:text-white">
                  {formatCurrencyINR(totalCgst + totalSgst)}
                </span>
              </div>
              <div className="flex justify-between pt-1.5 border-t border-slate-100 dark:border-slate-800 font-semibold text-slate-900 dark:text-white">
                <span>Gross Total (3% GST Included):</span>
                <span className="font-mono tabular-nums">{formatCurrencyINR(grandTotal)}</span>
              </div>

              {oldGoldDeductionTotal > 0 && (
                <div className="flex justify-between text-amber-600 dark:text-amber-400 font-medium pt-1">
                  <span>Less: Old Metal Exchange:</span>
                  <span className="font-mono tabular-nums">
                    - {formatCurrencyINR(oldGoldDeductionTotal)}
                  </span>
                </div>
              )}

              <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white">
                <span>Net Payable:</span>
                <span className="font-mono tabular-nums text-amber-600 dark:text-amber-400">
                  {formatCurrencyINR(netPayable)}
                </span>
              </div>
            </div>
          </div>

          {/* Split Payment Terminal */}
          <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Payment Collection
              </span>
              <span
                className={`font-mono font-semibold ${
                  balanceRemaining <= 0.05 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {balanceRemaining <= 0.05
                  ? 'Fully Paid'
                  : `Due: ${formatCurrencyINR(balanceRemaining)}`}
              </span>
            </div>

            {checkoutError && (
              <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-[11px] text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{checkoutError}</span>
              </div>
            )}

            <div className="space-y-2 text-xs">
              {/* Cash Input */}
              <div className="flex items-center gap-2">
                <span className="w-16 text-slate-600 dark:text-slate-400 flex items-center gap-1">
                  <Banknote className="w-3.5 h-3.5" /> Cash:
                </span>
                <input
                  type="number"
                  min="0"
                  value={cashAmount || ''}
                  onChange={(e) => setCashAmount(Number(e.target.value) || 0)}
                  placeholder="0.00"
                  className="flex-1 py-1 px-2 font-mono text-xs border border-slate-200 dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
                <button
                  type="button"
                  aria-label="Fill Cash"
                  onClick={() => handleQuickPay('CASH')}
                  className="px-2.5 py-1 text-[10px] font-semibold bg-amber-50 dark:bg-slate-800 hover:bg-amber-100 border border-amber-200 dark:border-slate-700 rounded text-amber-800 dark:text-amber-300"
                >
                  Fill
                </button>
              </div>

              {/* UPI Input */}
              <div className="flex items-center gap-2">
                <span className="w-16 text-slate-600 dark:text-slate-400 flex items-center gap-1">
                  <QrCode className="w-3.5 h-3.5" /> UPI:
                </span>
                <input
                  type="number"
                  min="0"
                  value={upiAmount || ''}
                  onChange={(e) => setUpiAmount(Number(e.target.value) || 0)}
                  placeholder="0.00"
                  className="flex-1 py-1 px-2 font-mono text-xs border border-slate-200 dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
                <button
                  type="button"
                  aria-label="Fill UPI"
                  onClick={() => handleQuickPay('UPI')}
                  className="px-2.5 py-1 text-[10px] font-semibold bg-amber-50 dark:bg-slate-800 hover:bg-amber-100 border border-amber-200 dark:border-slate-700 rounded text-amber-800 dark:text-amber-300"
                >
                  Fill
                </button>
              </div>

              {/* Card Input */}
              <div className="flex items-center gap-2">
                <span className="w-16 text-slate-600 dark:text-slate-400 flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5" /> Card:
                </span>
                <input
                  type="number"
                  min="0"
                  value={cardAmount || ''}
                  onChange={(e) => setCardAmount(Number(e.target.value) || 0)}
                  placeholder="0.00"
                  className="flex-1 py-1 px-2 font-mono text-xs border border-slate-200 dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
                <button
                  type="button"
                  aria-label="Fill Card"
                  onClick={() => handleQuickPay('CARD')}
                  className="px-2.5 py-1 text-[10px] font-semibold bg-amber-50 dark:bg-slate-800 hover:bg-amber-100 border border-amber-200 dark:border-slate-700 rounded text-amber-800 dark:text-amber-300"
                >
                  Fill
                </button>
              </div>
            </div>

            {/* Complete Sale Button */}
            <button
              type="button"
              onClick={handleCheckout}
              disabled={cartItems.length === 0 || balanceRemaining > 0.05}
              className="w-full mt-3 py-2.5 px-4 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Complete Sale & Generate Bill
            </button>
          </div>
        </div>
      </div>

      {/* Invoice & Receipt Modal (Uses Customized Column Headers!) */}
      {showInvoiceModal && postedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-3xl w-full border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-amber-600" />
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  Invoice {postedInvoice.invoiceNumber} Posted
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setInvoicePrintView(
                      invoicePrintView === 'A4_TAX' ? 'THERMAL_80MM' : 'A4_TAX'
                    )
                  }
                  className="px-2.5 py-1 text-xs font-medium border border-slate-200 dark:border-slate-700 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  Format: {invoicePrintView === 'A4_TAX' ? 'A4 Tax Invoice' : '80mm Thermal'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowInvoiceModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 text-sm font-bold"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Printable Preview Area */}
            <div className="p-6 bg-slate-50 dark:bg-slate-950 font-mono text-xs max-h-[70vh] overflow-y-auto">
              {invoicePrintView === 'A4_TAX' ? (
                /* A4 GST Tax Invoice Format with Customized Columns */
                <div className="p-6 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="text-center border-b pb-3 border-slate-200 dark:border-slate-700">
                    <div className="text-base font-bold text-slate-900 dark:text-white font-sans">
                      AURIC FINE JEWELS
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-400">
                      {activeBranch.address}, {activeBranch.city}
                    </div>
                    <div className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                      GSTIN: {activeBranch.gstin}
                    </div>
                    <div className="text-xs font-bold uppercase mt-1 text-slate-800 dark:text-slate-200 tracking-wider">
                      TAX INVOICE (GOLD & SILVER JEWELLERY)
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-[11px] border-b pb-3 border-slate-200 dark:border-slate-700">
                    <div>
                      <div>
                        <strong>Invoice No:</strong> {postedInvoice.invoiceNumber}
                      </div>
                      <div>
                        <strong>Date:</strong> {new Date(postedInvoice.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div>
                        <strong>Billed To:</strong> {postedInvoice.customerName}
                      </div>
                      <div>
                        <strong>Mobile:</strong> {postedInvoice.customerPhone}
                      </div>
                      <div>
                        <strong>PAN:</strong> {postedInvoice.customerPan || 'N/A'}
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Items Table Reflecting User's Custom Column Names */}
                  <table className="w-full text-[11px] border-collapse">
                    <thead>
                      <tr className="border-b border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-mono">
                        {visibleColumns.map((col) => (
                          <th
                            key={col.id}
                            className={`py-1.5 px-2 whitespace-nowrap ${
                              col.key === 'item' ? 'text-left' : 'text-right'
                            }`}
                          >
                            {col.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                      {postedInvoice.items.map((item, idx) => (
                        <tr key={idx}>
                          {visibleColumns.map((col) => {
                            if (col.key === 'item') {
                              return (
                                <td key={col.id} className="py-1.5 px-2 font-sans">
                                  <div className="font-medium text-slate-900 dark:text-white">
                                    {item.title}
                                  </div>
                                  <div className="text-[10px] text-amber-600 font-mono">
                                    {item.tagId} {item.huid ? `· HUID: ${item.huid}` : ''}
                                  </div>
                                </td>
                              );
                            }
                            if (col.key === 'category') {
                              return (
                                <td key={col.id} className="py-1.5 px-2 text-right">
                                  {item.category || '-'}
                                </td>
                              );
                            }
                            if (col.key === 'purityTounch') {
                              return (
                                <td key={col.id} className="py-1.5 px-2 text-right tabular-nums">
                                  {item.purity} ({item.tounchPercent}%)
                                </td>
                              );
                            }
                            if (col.key === 'grossWeight') {
                              return (
                                <td key={col.id} className="py-1.5 px-2 text-right tabular-nums">
                                  {formatWeightGrams(item.grossWeight)}
                                </td>
                              );
                            }
                            if (col.key === 'netWeight') {
                              return (
                                <td key={col.id} className="py-1.5 px-2 text-right tabular-nums">
                                  {formatWeightGrams(item.netWeight)}
                                </td>
                              );
                            }
                            if (col.key === 'fineWeight') {
                              return (
                                <td key={col.id} className="py-1.5 px-2 text-right tabular-nums">
                                  {formatWeightGrams(item.fineWeight)}
                                </td>
                              );
                            }
                            if (col.key === 'ratePerGram') {
                              return (
                                <td key={col.id} className="py-1.5 px-2 text-right tabular-nums">
                                  ₹{item.metalRateAppliedPerGram}/g
                                </td>
                              );
                            }
                            if (col.key === 'metalValue') {
                              return (
                                <td key={col.id} className="py-1.5 px-2 text-right tabular-nums">
                                  {formatCurrencyINR(item.metalValue)}
                                </td>
                              );
                            }
                            if (col.key === 'wastage') {
                              return (
                                <td key={col.id} className="py-1.5 px-2 text-right tabular-nums">
                                  {item.wastagePercent}% ({formatCurrencyINR(item.wastageValue)})
                                </td>
                              );
                            }
                            if (col.key === 'labour') {
                              return (
                                <td key={col.id} className="py-1.5 px-2 text-right tabular-nums">
                                  {formatCurrencyINR(item.makingCharges)}
                                </td>
                              );
                            }
                            if (col.key === 'karigarName') {
                              return (
                                <td key={col.id} className="py-1.5 px-2 text-right">
                                  {item.labourName || '-'}
                                </td>
                              );
                            }
                            if (col.key === 'discount') {
                              return (
                                <td key={col.id} className="py-1.5 px-2 text-right tabular-nums">
                                  {formatCurrencyINR(item.discountAmount)}
                                </td>
                              );
                            }
                            if (col.key === 'totalPrice') {
                              return (
                                <td
                                  key={col.id}
                                  className="py-1.5 px-2 text-right tabular-nums font-bold text-slate-900 dark:text-white"
                                >
                                  {formatCurrencyINR(item.totalPrice)}
                                </td>
                              );
                            }
                            if (col.isCustom) {
                              const v = item.customValues?.[col.key];
                              return (
                                <td key={col.id} className="py-1.5 px-2 text-right tabular-nums">
                                  {col.customType === 'FEE_INR'
                                    ? formatCurrencyINR(Number(v) || 0)
                                    : v || '-'}
                                </td>
                              );
                            }
                            return <td key={col.id} className="py-1.5 px-2" />;
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Totals & Tax Breakdown */}
                  <div className="border-t pt-3 border-slate-200 dark:border-slate-700 text-[11px] space-y-1">
                    <div className="flex justify-between">
                      <span>Total Taxable Amount:</span>
                      <span>{formatCurrencyINR(postedInvoice.subtotalTaxable)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>CGST (1.5%):</span>
                      <span>{formatCurrencyINR(postedInvoice.totalCgst)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>SGST (1.5%):</span>
                      <span>{formatCurrencyINR(postedInvoice.totalSgst)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-xs pt-1 border-t border-slate-200 dark:border-slate-700">
                      <span>Grand Total:</span>
                      <span>{formatCurrencyINR(postedInvoice.grandTotal)}</span>
                    </div>
                    {postedInvoice.oldGoldDeductionTotal > 0 && (
                      <div className="flex justify-between text-amber-600">
                        <span>Old Metal Exchange Credit:</span>
                        <span>- {formatCurrencyINR(postedInvoice.oldGoldDeductionTotal)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-xs text-amber-600">
                      <span>Net Collected:</span>
                      <span>{formatCurrencyINR(postedInvoice.amountPaid)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* 80mm Counter Thermal Slip Format */
                <div className="max-w-[300px] mx-auto p-4 bg-white text-slate-900 border border-slate-300 rounded shadow font-mono text-[10px] space-y-2">
                  <div className="text-center border-b pb-2">
                    <div className="font-bold text-xs">AURIC FINE JEWELS</div>
                    <div>{activeBranch.name}</div>
                    <div>GSTIN: {activeBranch.gstin}</div>
                    <div className="mt-1 font-semibold">CASH / TAX RECEIPT</div>
                  </div>

                  <div>
                    <div>Inv: {postedInvoice.invoiceNumber}</div>
                    <div>Date: {new Date(postedInvoice.createdAt).toLocaleDateString()}</div>
                    <div>Cust: {postedInvoice.customerName}</div>
                  </div>

                  <div className="border-t border-b py-1 space-y-1">
                    {postedInvoice.items.map((i, idx) => (
                      <div key={idx} className="space-y-0.5">
                        <div className="flex justify-between font-semibold">
                          <span>{i.title.slice(0, 18)}</span>
                          <span>{formatCurrencyINR(i.totalPrice)}</span>
                        </div>
                        <div className="text-[9px] text-slate-600">
                          {i.purity} ({i.tounchPercent}%) · {formatWeightGrams(i.netWeight)} · Wst {i.wastagePercent}%
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex justify-between">
                      <span>Taxable:</span>
                      <span>{formatCurrencyINR(postedInvoice.subtotalTaxable)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>GST (3%):</span>
                      <span>
                        {formatCurrencyINR(postedInvoice.totalCgst + postedInvoice.totalSgst)}
                      </span>
                    </div>
                    <div className="flex justify-between font-bold text-xs pt-1 border-t">
                      <span>TOTAL:</span>
                      <span>{formatCurrencyINR(postedInvoice.grandTotal)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="p-3 bg-slate-100 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Invoice
              </button>
              <button
                type="button"
                onClick={() => setShowInvoiceModal(false)}
                className="px-3 py-1.5 text-xs font-medium bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-lg"
              >
                Close & Next Customer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

