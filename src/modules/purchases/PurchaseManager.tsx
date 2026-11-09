import React, { useState } from 'react';
import { 
  Truck, 
  Plus, 
  Coins, 
  FileCheck, 
  ShieldCheck, 
  Receipt, 
  Building2 
} from 'lucide-react';
import { Article, Branch, MetalType, PurchaseInvoice, Supplier } from '../../core/types';
import { calculateFineMetalEquivalent, formatCurrencyINR, formatWeightGrams, roundDecimals } from '../../core/math';

interface PurchaseManagerProps {
  suppliers: Supplier[];
  activeBranch: Branch;
  onPostPurchase: (invoice: PurchaseInvoice, createdArticles: Article[]) => void;
}

export const PurchaseManager: React.FC<PurchaseManagerProps> = ({
  suppliers,
  activeBranch,
  onPostPurchase,
}) => {
  const [showInwardModal, setShowInwardModal] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState(suppliers[0]?.id || '');
  const [articleTitle, setArticleTitle] = useState('22K Casting Gold Bangles Lot');
  const [category, setCategory] = useState('Bangles');
  const [purity, setPurity] = useState('22K');
  const [fineness, setFineness] = useState(916);
  const [grossWeight, setGrossWeight] = useState(50.000);
  const [stoneWeight, setStoneWeight] = useState(0.000);
  const [ratePerGram, setRatePerGram] = useState(7180);
  const [makingRatePerGram, setMakingRatePerGram] = useState(220);
  const [paymentMode, setPaymentMode] = useState<PurchaseInvoice['paymentMode']>('SUPPLIER_CREDIT');
  const [supplierBillRef, setSupplierBillRef] = useState(`MMTC-${Math.floor(1000 + Math.random() * 9000)}`);
  const [huidInput, setHuidInput] = useState('');

  // Interactive purchase calculations
  const netWeight = Math.max(0, roundDecimals(grossWeight - stoneWeight, 3));
  const fineGoldEquivalent = calculateFineMetalEquivalent(netWeight, fineness);
  const metalValue = roundDecimals(netWeight * ratePerGram, 2);
  const makingTotal = roundDecimals(netWeight * makingRatePerGram, 2);
  const taxableSubtotal = roundDecimals(metalValue + makingTotal, 2);
  const cgstAmount = roundDecimals((taxableSubtotal * 1.5) / 100, 2);
  const sgstAmount = roundDecimals((taxableSubtotal * 1.5) / 100, 2);
  const grandTotal = roundDecimals(taxableSubtotal + cgstAmount + sgstAmount, 2);

  const selectedSupplier = suppliers.find((s) => s.id === selectedCustomerIdSafe(selectedSupplierId)) || suppliers[0];

  function selectedCustomerIdSafe(id: string) {
    return id;
  }

  const handleInwardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const purchaseInvoiceNumber = `PUR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const inwardItem = {
      id: `PUR-ITEM-${Date.now()}`,
      title: articleTitle,
      category,
      purity,
      fineness,
      grossWeightGrams: grossWeight,
      stoneWeightGrams: stoneWeight,
      netWeightGrams: netWeight,
      fineGoldEquivalentGrams: fineGoldEquivalent,
      ratePerGram,
      metalValue,
      makingCharges: makingTotal,
      huid: huidInput.trim() ? huidInput.trim().toUpperCase() : undefined,
    };

    const newInvoice: PurchaseInvoice = {
      id: `PUR-INV-${Date.now()}`,
      purchaseInvoiceNumber,
      supplierId: selectedSupplier.id,
      supplierName: selectedSupplier.name,
      supplierGstin: selectedSupplier.gstin,
      branchId: activeBranch.id,
      invoiceDate: new Date().toISOString().slice(0, 10),
      items: [inwardItem],
      totalGrossWeightGrams: grossWeight,
      totalFineGoldEquivalentGrams: fineGoldEquivalent,
      taxableSubtotal,
      cgstAmount,
      sgstAmount,
      grandTotal,
      paymentMode,
      status: 'RECEIVED_AND_POSTED',
      receivedBy: 'Vault Head / Inspector',
      createdAt: new Date().toISOString(),
    };

    // Auto-generate inventory article with unique tag ID
    const newArticle: Article = {
      id: `ART-PUR-${Date.now()}`,
      sku: `${category.slice(0, 3).toUpperCase()}-${purity}-${Math.floor(100 + Math.random() * 900)}`,
      tagId: `TAG-${Math.floor(10000 + Math.random() * 90000)}`,
      huid: huidInput.trim() ? huidInput.trim().toUpperCase() : undefined,
      title: articleTitle,
      category,
      metal: 'GOLD',
      purity,
      fineness,
      grossWeightGrams: grossWeight,
      stoneWeightGrams: stoneWeight,
      netWeightGrams: netWeight,
      fineGoldEquivalentGrams: fineGoldEquivalent,
      makingChargeType: 'PER_GRAM',
      makingChargeValue: makingRatePerGram + 200, // Retail markup
      wastagePercent: 2.0,
      stones: [],
      hallmarkCost: 45,
      costPrice: taxableSubtotal,
      branchId: activeBranch.id,
      location: 'Showroom Safe 1 / Inward Tray',
      status: 'AVAILABLE',
      supplierId: selectedSupplier.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onPostPurchase(newInvoice, [newArticle]);
    setShowInwardModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Truck className="w-5 h-5 text-amber-600" />
            Supplier Purchasing & Goods Inward Terminal
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Gold bullion & casting receipts, HUID lot inwarding, and supplier metal ledger accounting.
          </p>
        </div>

        <button
          onClick={() => setShowInwardModal(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Record Supplier Goods Inward
        </button>
      </div>

      {/* Supplier Profile Grid */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          Authorized Bullion Dealers & Casting Manufacturers
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {suppliers.map((s) => (
            <div
              key={s.id}
              className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div className="font-bold text-sm text-slate-900 dark:text-white">{s.name}</div>
                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded font-mono">
                  {s.category.replace('_', ' ')}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 font-mono">GSTIN: {s.gstin} · {s.city}</div>

              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg text-xs font-mono space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Fine Gold Account:</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">
                    {formatWeightGrams(s.fineGoldBalanceGrams)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Fiat Payable:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {formatCurrencyINR(s.fiatPayableAmount)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Inward Modal */}
      {showInwardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b pb-3">
              <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-600" />
                Goods Inward Receipt & Auto-Tagging
              </span>
              <button
                onClick={() => setShowInwardModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleInwardSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  Supplier:
                </label>
                <select
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.city})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                    Article Title:
                  </label>
                  <input
                    type="text"
                    required
                    value={articleTitle}
                    onChange={(e) => setArticleTitle(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                    Category:
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="Bangles">Bangles</option>
                    <option value="Chains">Chains</option>
                    <option value="Rings">Rings</option>
                    <option value="Necklaces">Necklaces</option>
                    <option value="Coins">Coins / Bullion</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                    Purity:
                  </label>
                  <select
                    value={purity}
                    onChange={(e) => {
                      setPurity(e.target.value);
                      if (e.target.value === '22K') setFineness(916);
                      if (e.target.value === '18K') setFineness(750);
                      if (e.target.value === '24K') setFineness(999);
                    }}
                    className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  >
                    <option value="22K">22K (916)</option>
                    <option value="18K">18K (750)</option>
                    <option value="24K">24K (999)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                    Gross Wt (g):
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    required
                    value={grossWeight}
                    onChange={(e) => setGrossWeight(Number(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 font-mono border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                    Rate (₹/g):
                  </label>
                  <input
                    type="number"
                    required
                    value={ratePerGram}
                    onChange={(e) => setRatePerGram(Number(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 font-mono border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                    Making Cost (₹/g):
                  </label>
                  <input
                    type="number"
                    value={makingRatePerGram}
                    onChange={(e) => setMakingRatePerGram(Number(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 font-mono border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                    BIS 6-Digit HUID (if stamped):
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="e.g. IN9941"
                    value={huidInput}
                    onChange={(e) => setHuidInput(e.target.value)}
                    className="w-full px-2.5 py-1.5 uppercase font-mono border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Purchase Bill Calculation */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg text-xs font-mono space-y-1">
                <div className="flex justify-between text-slate-500">
                  <span>Fine 24K Equiv Inflow:</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">{formatWeightGrams(fineGoldEquivalent)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Taxable Purchase Subtotal:</span>
                  <span>{formatCurrencyINR(taxableSubtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>GST (3% Input Credit):</span>
                  <span>{formatCurrencyINR(cgstAmount + sgstAmount)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white">
                  <span>Grand Total Payable:</span>
                  <span>{formatCurrencyINR(grandTotal)}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowInwardModal(false)}
                  className="px-3 py-1.5 text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow"
                >
                  Post Inward & Create Stock Tag
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
