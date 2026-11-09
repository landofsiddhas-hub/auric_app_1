import React, { useState } from 'react';
import { 
  RotateCcw, 
  Plus, 
  ShieldCheck, 
  Receipt, 
  AlertCircle, 
  CheckCircle2, 
  Printer 
} from 'lucide-react';
import { CreditNote, SalesInvoice } from '../../core/types';
import { formatCurrencyINR, roundDecimals } from '../../core/math';

interface ReturnsProps {
  creditNotes: CreditNote[];
  invoices: SalesInvoice[];
  onIssueCreditNote: (creditNote: CreditNote) => void;
}

export const ReturnsManager: React.FC<ReturnsProps> = ({
  creditNotes,
  invoices,
  onIssueCreditNote,
}) => {
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [invoiceLookup, setInvoiceLookup] = useState('');
  const [foundInvoice, setFoundInvoice] = useState<SalesInvoice | null>(null);
  const [selectedArticleId, setSelectedArticleId] = useState('');
  const [returnReason, setReturnReason] = useState<CreditNote['returnReason']>('SIZE_MISMATCH');
  const [refundMethod, setRefundMethod] = useState<CreditNote['refundMethod']>('STORE_CREDIT_VOUCHER');
  const [restockStatus, setRestockStatus] = useState<CreditNote['restockStatus']>('RESTOCKED_AVAILABLE');
  const [authorizer, setAuthorizer] = useState('Store Manager');

  // Lookup invoice by invoiceNumber
  const handleLookup = () => {
    const inv = invoices.find(
      (i) => i.invoiceNumber.toLowerCase() === invoiceLookup.trim().toLowerCase()
    );
    if (!inv) {
      alert('Invoice not found! Invariant 8 requires linking returns to an eligible original invoice.');
      return;
    }
    setFoundInvoice(inv);
    if (inv.items.length > 0) {
      setSelectedArticleId(inv.items[0].articleId);
    }
  };

  const selectedItem = foundInvoice?.items.find((i) => i.articleId === selectedArticleId);

  const handleReturnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!foundInvoice || !selectedItem) return;

    // Check if this article was already refunded (Invariant 9)
    const alreadyRefunded = creditNotes.some(
      (cn) => cn.originalInvoiceNumber === foundInvoice.invoiceNumber && cn.articleId === selectedItem.articleId
    );
    if (alreadyRefunded) {
      alert('Invariant 9 Violation: This article has already been refunded under a previous credit note.');
      return;
    }

    const creditNoteNumber = `CRN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newCreditNote: CreditNote = {
      id: `CRN-${Date.now()}`,
      creditNoteNumber,
      originalInvoiceNumber: foundInvoice.invoiceNumber,
      customerId: foundInvoice.customerId,
      customerName: foundInvoice.customerName,
      articleId: selectedItem.articleId,
      articleTitle: selectedItem.title,
      tagId: selectedItem.tagId,
      returnReason,
      returnedTaxableValue: selectedItem.taxableValue,
      returnedCgst: selectedItem.cgstAmount,
      returnedSgst: selectedItem.sgstAmount,
      totalRefundAmount: selectedItem.totalPrice,
      refundMethod,
      restockStatus,
      authorizedBy: authorizer,
      createdAt: new Date().toISOString(),
    };

    onIssueCreditNote(newCreditNote);
    setShowReturnModal(false);
    setFoundInvoice(null);
    setInvoiceLookup('');
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-amber-600" />
            Customer Sales Returns & Credit Notes
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Complies with Invariants 8 & 9: All returns reference an eligible posted invoice, preventing double-refunds and restoring inventory status.
          </p>
        </div>

        <button
          onClick={() => setShowReturnModal(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Process Customer Return
        </button>
      </div>

      {/* Credit Notes Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            Issued Credit Notes ({creditNotes.length})
          </span>
          <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            Tax & Stock Reconciled
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-mono border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-2.5 px-3">Credit Note #</th>
                <th className="py-2.5 px-3">Original Invoice</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Returned Article</th>
                <th className="py-2.5 px-3">Reason</th>
                <th className="py-2.5 px-3 text-right">Tax Reversal</th>
                <th className="py-2.5 px-3 text-right">Refund Amount</th>
                <th className="py-2.5 px-3">Restock State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
              {creditNotes.map((cn) => (
                <tr key={cn.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">{cn.creditNoteNumber}</td>
                  <td className="py-2.5 px-3 text-amber-600 dark:text-amber-400 font-semibold">{cn.originalInvoiceNumber}</td>
                  <td className="py-2.5 px-3 font-sans font-medium text-slate-800 dark:text-slate-200">{cn.customerName}</td>
                  <td className="py-2.5 px-3 font-sans text-slate-700 dark:text-slate-300">
                    <div>{cn.articleTitle}</div>
                    <div className="text-[10px] text-slate-400 font-mono">Tag: {cn.tagId}</div>
                  </td>
                  <td className="py-2.5 px-3 font-sans text-[11px] text-slate-500">{cn.returnReason.replace('_', ' ')}</td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-rose-600">
                    - {formatCurrencyINR(cn.returnedCgst + cn.returnedSgst)}
                  </td>
                  <td className="py-2.5 px-3 text-right tabular-nums font-bold text-slate-900 dark:text-white">
                    {formatCurrencyINR(cn.totalRefundAmount)}
                  </td>
                  <td className="py-2.5 px-3 text-[10px]">
                    <span className="px-2 py-0.5 rounded font-semibold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      {cn.restockStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Return Workflow Modal */}
      {showReturnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b pb-3">
              <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-amber-600" />
                Process Sales Return & Issue Credit Note
              </span>
              <button
                onClick={() => setShowReturnModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Step 1: Lookup original invoice */}
            <div className="space-y-2 text-xs">
              <label className="block text-slate-700 dark:text-slate-300 font-medium">
                1. Enter Original Invoice Number (Invariant 8):
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. INV-2026-1299"
                  value={invoiceLookup}
                  onChange={(e) => setInvoiceLookup(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 font-mono border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={handleLookup}
                  className="px-3.5 py-1.5 font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg text-slate-700 dark:text-slate-300"
                >
                  Verify Invoice
                </button>
              </div>
            </div>

            {foundInvoice && (
              <form onSubmit={handleReturnSubmit} className="space-y-3 text-xs border-t pt-3 border-slate-200 dark:border-slate-700">
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg font-mono space-y-0.5">
                  <div className="font-bold text-slate-900 dark:text-white">Invoice: {foundInvoice.invoiceNumber}</div>
                  <div className="text-slate-500 font-sans">Customer: {foundInvoice.customerName}</div>
                  <div className="text-slate-500">Date: {new Date(foundInvoice.createdAt).toLocaleDateString()}</div>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                    Select Article Being Returned:
                  </label>
                  <select
                    value={selectedArticleId}
                    onChange={(e) => setSelectedArticleId(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {foundInvoice.items.map((i) => (
                      <option key={i.articleId} value={i.articleId}>
                        {i.title} ({i.tagId}) — ₹{i.totalPrice}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                      Return Reason:
                    </label>
                    <select
                      value={returnReason}
                      onChange={(e) => setReturnReason(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="SIZE_MISMATCH">Ring / Kada Size Mismatch</option>
                      <option value="DESIGN_EXCHANGE">Exchange for Another Design</option>
                      <option value="CUSTOMER_CHOICE">Customer Discretion</option>
                      <option value="DEFECT_MELT">Defect / Melt Down</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                      Restock Action:
                    </label>
                    <select
                      value={restockStatus}
                      onChange={(e) => setRestockStatus(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="RESTOCKED_AVAILABLE">Restock as AVAILABLE</option>
                      <option value="SENT_FOR_MELT_SCRAP">Send for Melt Scrap</option>
                    </select>
                  </div>
                </div>

                {selectedItem && (
                  <div className="p-3 bg-amber-50/60 dark:bg-slate-800/60 rounded-lg font-mono space-y-1">
                    <div className="flex justify-between text-slate-500">
                      <span>Taxable Reversal:</span>
                      <span>{formatCurrencyINR(selectedItem.taxableValue)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>GST Reversal (1.5% CGST + 1.5% SGST):</span>
                      <span>{formatCurrencyINR(selectedItem.cgstAmount + selectedItem.sgstAmount)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-sm text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-slate-700">
                      <span>Total Credit Note Amount:</span>
                      <span className="text-amber-600 dark:text-amber-400">{formatCurrencyINR(selectedItem.totalPrice)}</span>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setShowReturnModal(false)}
                    className="px-3 py-1.5 text-slate-600 dark:text-slate-400"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow"
                  >
                    Issue Credit Note & Restock
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
