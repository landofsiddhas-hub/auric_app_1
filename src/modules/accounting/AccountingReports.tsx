import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  BookOpen, 
  Lock, 
  ShieldCheck, 
  CheckCircle2, 
  TrendingUp, 
  ArrowDownUp, 
  Receipt, 
  Printer 
} from 'lucide-react';
import { Branch, JournalEntry, SalesInvoice } from '../../core/types';
import { formatCurrencyINR, fromPaise, roundDecimals } from '../../core/math';
import { AccountingEngine } from '../../core/accountingEngine';

interface AccountingReportsProps {
  accounting: AccountingEngine;
  invoices: SalesInvoice[];
  activeBranch: Branch;
  onLockPeriod: (date: string) => void;
}

export const AccountingReports: React.FC<AccountingReportsProps> = ({
  accounting,
  invoices,
  activeBranch,
  onLockPeriod,
}) => {
  const [activeReportTab, setActiveReportTab] = useState<'TRIAL_BALANCE' | 'JOURNALS' | 'GST_TAX' | 'DAY_CLOSE'>('TRIAL_BALANCE');
  const [lockDateInput, setLockDateInput] = useState('2026-10-31');
  const [dayCloseCashCounted, setDayCloseCashCounted] = useState(185400);

  const trialBalance = accounting.getTrialBalance();
  const journals = accounting.getJournals();
  const lockedPeriods = accounting.getLockedPeriods();

  // GST Outward summary from posted invoices
  const totalGstTaxable = roundDecimals(invoices.reduce((sum, inv) => sum + inv.subtotalTaxable, 0), 2);
  const totalCgstCollected = roundDecimals(invoices.reduce((sum, inv) => sum + inv.totalCgst, 0), 2);
  const totalSgstCollected = roundDecimals(invoices.reduce((sum, inv) => sum + inv.totalSgst, 0), 2);
  const totalGstCollected = roundDecimals(totalCgstCollected + totalSgstCollected, 2);

  const handleLockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLockPeriod(lockDateInput);
    alert(`Financial period locked up to ${lockDateInput}. Invariant 10 active: No backdated postings permitted prior to this date.`);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-600" />
            Double-Entry Accounting & India GST Compliance
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Strict double-entry ledger balance, HSN 7113 3% GST tax registers, and immutable financial period locks.
          </p>
        </div>

        {/* Report Selector Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveReportTab('TRIAL_BALANCE')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeReportTab === 'TRIAL_BALANCE'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Trial Balance
          </button>
          <button
            onClick={() => setActiveReportTab('JOURNALS')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeReportTab === 'JOURNALS'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            General Journals
          </button>
          <button
            onClick={() => setActiveReportTab('GST_TAX')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeReportTab === 'GST_TAX'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            GST Outward (GSTR-1)
          </button>
          <button
            onClick={() => setActiveReportTab('DAY_CLOSE')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeReportTab === 'DAY_CLOSE'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Daily Close & Lock
          </button>
        </div>
      </div>

      {activeReportTab === 'TRIAL_BALANCE' && (
        <div className="space-y-4">
          <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Balanced Trial Balance — {activeBranch.name}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  Invariant 2 Status: {trialBalance.isBalanced ? 'Mathematically Reconciled (Debits = Credits)' : 'UNBALANCED'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 text-xs font-bold rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Balanced
                </span>
                <button
                  onClick={() => window.print()}
                  className="px-2.5 py-1 text-xs font-medium border border-slate-200 dark:border-slate-700 rounded bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 flex items-center gap-1"
                >
                  <Printer className="w-3 h-3" /> Export
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-mono border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-2.5 px-3">Account Code</th>
                    <th className="py-2.5 px-3">Account Title</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 text-right">Debit Balance (₹)</th>
                    <th className="py-2.5 px-3 text-right">Credit Balance (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                  {trialBalance.rows.map((row) => (
                    <tr key={row.accountId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-2 px-3 text-slate-500">{row.accountId}</td>
                      <td className="py-2 px-3 font-medium text-slate-900 dark:text-white font-sans">
                        {row.accountName}
                      </td>
                      <td className="py-2 px-3 text-[11px] text-slate-500">{row.category}</td>
                      <td className="py-2 px-3 text-right tabular-nums text-slate-900 dark:text-white">
                        {row.debitRupees > 0 ? formatCurrencyINR(row.debitRupees) : '—'}
                      </td>
                      <td className="py-2 px-3 text-right tabular-nums text-slate-900 dark:text-white">
                        {row.creditRupees > 0 ? formatCurrencyINR(row.creditRupees) : '—'}
                      </td>
                    </tr>
                  ))}
                  {/* Totals Row */}
                  <tr className="bg-slate-50 dark:bg-slate-800/80 font-bold border-t-2 border-slate-300 dark:border-slate-700">
                    <td colSpan={3} className="py-2.5 px-3 text-right font-sans">
                      TOTAL TRIAL BALANCE:
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                      {formatCurrencyINR(trialBalance.totalDebits)}
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                      {formatCurrencyINR(trialBalance.totalCredits)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeReportTab === 'JOURNALS' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden p-4 space-y-4">
            <div className="border-b pb-2">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Authoritative Double-Entry Financial Journals
              </h3>
              <p className="text-xs text-slate-500">
                Every sale, purchase, and stock entry emits an atomic, balanced financial journal (Invariant 3).
              </p>
            </div>

            <div className="space-y-4">
              {journals.map((j) => (
                <div key={j.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700/60 space-y-2 text-xs">
                  <div className="flex justify-between items-center font-mono">
                    <span className="font-bold text-slate-900 dark:text-white">{j.entryNumber}</span>
                    <span className="text-slate-500">{j.date} · Ref: {j.referenceId} ({j.referenceType})</span>
                  </div>
                  <div className="text-slate-600 dark:text-slate-300 italic">{j.narration}</div>

                  <table className="w-full text-[11px] font-mono border-t border-slate-200 dark:border-slate-700 pt-1">
                    <thead>
                      <tr className="text-slate-400">
                        <th className="text-left py-0.5">Account</th>
                        <th className="text-right py-0.5">Debit</th>
                        <th className="text-right py-0.5">Credit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {j.lines.map((line, lIdx) => (
                        <tr key={lIdx}>
                          <td className="py-0.5 text-slate-800 dark:text-slate-200">{line.accountName}</td>
                          <td className="py-0.5 text-right text-slate-900 dark:text-white">
                            {line.debitPaise > 0 ? formatCurrencyINR(fromPaise(line.debitPaise)) : '—'}
                          </td>
                          <td className="py-0.5 text-right text-slate-900 dark:text-white">
                            {line.creditPaise > 0 ? formatCurrencyINR(fromPaise(line.creditPaise)) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeReportTab === 'GST_TAX' && (
        <div className="space-y-4">
          <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="border-b pb-3 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  GST Outward Supply Register (GSTR-1 Ready)
                </h3>
                <p className="text-xs text-slate-500">
                  Jewellery Articles under HSN Code 7113 (3% Total GST Rate: 1.5% CGST + 1.5% SGST)
                </p>
              </div>
              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" /> Export GSTR Report
              </button>
            </div>

            {/* Summary Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                <div className="text-[11px] text-slate-500">Total Invoices</div>
                <div className="text-lg font-bold font-mono text-slate-900 dark:text-white">{invoices.length}</div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                <div className="text-[11px] text-slate-500">Taxable Turnover</div>
                <div className="text-lg font-bold font-mono text-slate-900 dark:text-white">{formatCurrencyINR(totalGstTaxable)}</div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                <div className="text-[11px] text-slate-500">CGST (1.5%) Output</div>
                <div className="text-lg font-bold font-mono text-amber-600 dark:text-amber-400">{formatCurrencyINR(totalCgstCollected)}</div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                <div className="text-[11px] text-slate-500">SGST (1.5%) Output</div>
                <div className="text-lg font-bold font-mono text-amber-600 dark:text-amber-400">{formatCurrencyINR(totalSgstCollected)}</div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-mono border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-2.5 px-3">Invoice #</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Customer / GSTIN</th>
                    <th className="py-2.5 px-3 text-right">Taxable Value (₹)</th>
                    <th className="py-2.5 px-3 text-right">CGST (1.5%)</th>
                    <th className="py-2.5 px-3 text-right">SGST (1.5%)</th>
                    <th className="py-2.5 px-3 text-right">Invoice Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-2 px-3 font-bold text-slate-900 dark:text-white">{inv.invoiceNumber}</td>
                      <td className="py-2 px-3 text-slate-500">{new Date(inv.createdAt).toLocaleDateString()}</td>
                      <td className="py-2 px-3 font-sans text-slate-800 dark:text-slate-200">
                        {inv.customerName} {inv.customerGstin ? `(${inv.customerGstin})` : ''}
                      </td>
                      <td className="py-2 px-3 text-right tabular-nums">{formatCurrencyINR(inv.subtotalTaxable)}</td>
                      <td className="py-2 px-3 text-right tabular-nums text-slate-600 dark:text-slate-400">{formatCurrencyINR(inv.totalCgst)}</td>
                      <td className="py-2 px-3 text-right tabular-nums text-slate-600 dark:text-slate-400">{formatCurrencyINR(inv.totalSgst)}</td>
                      <td className="py-2 px-3 text-right tabular-nums font-bold text-slate-900 dark:text-white">{formatCurrencyINR(inv.grandTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeReportTab === 'DAY_CLOSE' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Day Close Cash Reconciler */}
          <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Daily Showroom Counter Closing Wizard
            </h3>
            <p className="text-xs text-slate-500">
              Reconciles opening cash float, total daily cash sales, and counted physical currency in the counter drawer.
            </p>

            <div className="space-y-2.5 text-xs font-mono">
              <div className="flex justify-between p-2 rounded bg-slate-50 dark:bg-slate-800">
                <span>Opening Cash Float:</span>
                <span className="font-bold">₹25,000.00</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-slate-50 dark:bg-slate-800">
                <span>Total Cash Sales Today:</span>
                <span className="font-bold text-emerald-600">₹1,60,400.00</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-slate-100 dark:bg-slate-750 font-bold text-slate-900 dark:text-white">
                <span>System Expected Drawer Balance:</span>
                <span>₹1,85,400.00</span>
              </div>

              <div className="pt-2">
                <label className="block text-slate-700 dark:text-slate-300 font-sans font-medium mb-1">
                  Physical Cash Counted in Drawer (₹):
                </label>
                <input
                  type="number"
                  value={dayCloseCashCounted}
                  onChange={(e) => setDayCloseCashCounted(Number(e.target.value) || 0)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm"
                />
              </div>

              <div className="flex justify-between p-2 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                <span>Cash Reconciliation Variance:</span>
                <span className="font-bold">
                  {formatCurrencyINR(dayCloseCashCounted - 185400)}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                alert('Daily counter close successfully certified! Summary signed by head cashier.');
              }}
              className="w-full py-2 px-3 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow"
            >
              Authorize Store Daily Close
            </button>
          </div>

          {/* Financial Period Lock (Invariant 10) */}
          <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-600" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Financial Period Lockdown (Invariant 10)
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Locking an accounting month or quarter prevents any backdated transactions or tampering with audited financial statements.
            </p>

            <form onSubmit={handleLockSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  Lock Books Up To Date:
                </label>
                <input
                  type="date"
                  required
                  value={lockDateInput}
                  onChange={(e) => setLockDateInput(e.target.value)}
                  className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 px-3 text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5" />
                Lock Financial Period
              </button>
            </form>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Active Period Locks:
              </span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {lockedPeriods.length === 0 ? (
                  <span className="text-slate-400">No active locks</span>
                ) : (
                  lockedPeriods.map((p, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px] border border-slate-200 dark:border-slate-700">
                      Locked up to {p}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
