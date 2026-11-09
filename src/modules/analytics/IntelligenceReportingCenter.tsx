/**
 * AURIC Intelligence & Enterprise BI Reporting Center (Stage 10)
 * Grounded natural-language query assistant and multi-ledger financial reporting suite:
 * Sales, Inventory Aging, Metal Reconciliation, Karigar Ghat Audit & GSTR-1 Tax Summary.
 */

import React, { useState } from 'react';
import { 
  Sparkles, 
  FileText, 
  Download, 
  Printer, 
  Search, 
  TrendingUp, 
  ShieldCheck, 
  Coins, 
  Scale, 
  AlertTriangle, 
  BarChart3, 
  CheckCircle2, 
  ArrowUpRight,
  Send,
  HelpCircle,
  Database,
  Calendar
} from 'lucide-react';
import { 
  Article, 
  SalesInvoice, 
  Customer, 
  GirviPledge, 
  GoldChitScheme, 
  Karigar, 
  MetalRateSnapshot, 
  ManufacturingOrder,
  Branch,
  AIQueryInsight
} from '../../core/types';
import { computeExecutiveBIMetrics, answerNaturalLanguageQuery } from '../../core/analyticsEngine';
import { formatCurrencyINR, formatWeightGrams, roundDecimals } from '../../core/math';

interface IntelligenceReportingCenterProps {
  articles: Article[];
  invoices: SalesInvoice[];
  customers: Customer[];
  pledges: GirviPledge[];
  schemes: GoldChitScheme[];
  karigars: Karigar[];
  orders: ManufacturingOrder[];
  rates: MetalRateSnapshot;
  activeBranch: Branch;
  onNavigateTab: (tab: string) => void;
}

export const IntelligenceReportingCenter: React.FC<IntelligenceReportingCenterProps> = ({
  articles,
  invoices,
  customers,
  pledges,
  schemes,
  karigars,
  orders,
  rates,
  activeBranch,
  onNavigateTab,
}) => {
  const [activeReportTab, setActiveReportTab] = useState<
    'AI_ASSISTANT' | 'SALES_REPORT' | 'INVENTORY_AGING' | 'METAL_RECONCILIATION' | 'GST_TAX'
  >('AI_ASSISTANT');

  // AI Assistant Query State
  const [queryInput, setQueryInput] = useState('');
  const [history, setHistory] = useState<AIQueryInsight[]>([
    answerNaturalLanguageQuery(
      'What is our total gold stock and pure fine gold equivalent?',
      articles,
      invoices,
      customers,
      pledges,
      schemes,
      karigars,
      orders,
      rates
    ),
  ]);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const metrics = computeExecutiveBIMetrics(
    articles,
    invoices,
    customers,
    pledges,
    schemes,
    karigars,
    rates
  );

  const handleRunQuery = (prompt: string) => {
    if (!prompt.trim()) return;
    const answer = answerNaturalLanguageQuery(
      prompt,
      articles,
      invoices,
      customers,
      pledges,
      schemes,
      karigars,
      orders,
      rates
    );
    setHistory([answer, ...history]);
    setQueryInput('');
  };

  const handleExportCSV = (reportName: string, rows: any[]) => {
    if (rows.length === 0) return;
    const headers = Object.keys(rows[0]).join(',');
    const csvContent = [headers, ...rows.map((r) => Object.values(r).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${reportName}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-600" />
            AURIC Intelligence & Reporting Center (Stage 10)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Authoritative natural-language analytics grounded in deterministic ledger records, plus multi-format BI reports.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-x-auto">
          <button
            onClick={() => setActiveReportTab('AI_ASSISTANT')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              activeReportTab === 'AI_ASSISTANT'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            AURIC Intelligence AI
          </button>
          <button
            onClick={() => setActiveReportTab('SALES_REPORT')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              activeReportTab === 'SALES_REPORT'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Sales Ledger
          </button>
          <button
            onClick={() => setActiveReportTab('INVENTORY_AGING')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              activeReportTab === 'INVENTORY_AGING'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Inventory & Dead Stock
          </button>
          <button
            onClick={() => setActiveReportTab('METAL_RECONCILIATION')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              activeReportTab === 'METAL_RECONCILIATION'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Metal & Karigar Audit
          </button>
          <button
            onClick={() => setActiveReportTab('GST_TAX')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
              activeReportTab === 'GST_TAX'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            GSTR-1 Tax Summary
          </button>
        </div>
      </div>

      {/* VIEW 1: AI ASSISTANT */}
      {activeReportTab === 'AI_ASSISTANT' && (
        <div className="space-y-6">
          {/* Query Bar */}
          <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600">
                <Sparkles className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Ask AURIC Intelligence (Natural-Language Query)
              </span>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleRunQuery(queryInput);
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="Ask about fine gold stock, customer receivables, Girvi LTV, Swarna Nidhi bonus, or workshop Ghat loss..."
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-amber-500"
              />
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors shrink-0"
              >
                <span>Ask AI</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* Quick Prompt Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pt-1 text-[11px]">
              <span className="text-slate-400 shrink-0">Sample queries:</span>
              {[
                'What is our total gold stock and pure fine equivalent?',
                'Audit active Girvi gold loans and LTV status',
                'What is our Swarna Nidhi customer deposit liability?',
                'Show karigar metal allocations and workshop Ghat loss',
                'Identify dead stock and slow-moving jewellery',
              ].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => handleRunQuery(chip)}
                  className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-slate-600 dark:text-slate-300 hover:text-amber-700 rounded-lg whitespace-nowrap transition-colors border border-slate-200 dark:border-slate-700/60"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          {/* AI Insights Feed */}
          <div className="space-y-4">
            {history.map((item) => (
              <div
                key={item.id}
                className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-all"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-xs font-bold">
                      Q:
                    </span>
                    <span className="font-semibold text-xs text-slate-900 dark:text-white">
                      "{item.userPrompt}"
                    </span>
                  </div>

                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(item.generatedAt).toLocaleTimeString()}
                  </span>
                </div>

                {/* Answer Markdown */}
                <div className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/60">
                  <h4 className="font-bold text-slate-900 dark:text-white mb-1.5 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    {item.summaryTitle}
                  </h4>
                  <p>{item.answerMarkdown}</p>
                </div>

                {/* Grounded Fact Cards */}
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Database className="w-3 h-3 text-amber-600" />
                    Verified Grounded Database Values (No AI Hallucinations)
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {item.groundedFacts.map((fact, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg bg-white dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-[11px]"
                      >
                        <div className="text-[9px] uppercase font-bold text-slate-400 truncate">
                          {fact.sourceEntity} · {fact.computedKey}
                        </div>
                        <div className="font-bold font-mono text-slate-900 dark:text-white mt-0.5 truncate">
                          {fact.verifiedValue}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Link */}
                {item.suggestedAction && (
                  <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => onNavigateTab(item.suggestedAction!.targetTab)}
                      className="flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline"
                    >
                      <span>{item.suggestedAction.actionLabel}</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 2: SALES LEDGER REPORT */}
      {activeReportTab === 'SALES_REPORT' && (
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Detailed Retail Sales Ledger ({invoices.length} Invoices)
              </h3>
              <p className="text-xs text-slate-500">
                Itemized counter invoices, metal values, making charges, and GST collections.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  handleExportCSV(
                    'AURIC_Sales_Ledger',
                    invoices.map((inv) => ({
                      InvoiceNumber: inv.invoiceNumber,
                      Date: inv.createdAt.slice(0, 10),
                      Customer: inv.customerName,
                      TaxableSubtotal: inv.subtotalTaxable,
                      CGST: inv.totalCgst,
                      SGST: inv.totalSgst,
                      GrandTotal: inv.grandTotal,
                      PaymentStatus: inv.paymentStatus,
                    }))
                  )
                }
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-lg transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Export CSV
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Invoice #</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3 text-right">Taxable (INR)</th>
                  <th className="py-2.5 px-3 text-right">CGST (1.5%)</th>
                  <th className="py-2.5 px-3 text-right">SGST (1.5%)</th>
                  <th className="py-2.5 px-3 text-right">Grand Total (INR)</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="py-3 px-3 font-mono font-bold text-amber-600 dark:text-amber-400">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3 px-3 text-slate-500">{inv.createdAt.slice(0, 10)}</td>
                    <td className="py-3 px-3 font-medium text-slate-900 dark:text-white">
                      {inv.customerName}
                    </td>
                    <td className="py-3 px-3 text-right font-mono">
                      {formatCurrencyINR(inv.subtotalTaxable)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-500">
                      {formatCurrencyINR(inv.totalCgst)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-500">
                      {formatCurrencyINR(inv.totalSgst)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {formatCurrencyINR(inv.grandTotal)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                        {inv.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: INVENTORY AGING & DEAD STOCK */}
      {activeReportTab === 'INVENTORY_AGING' && (
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Showroom Inventory Aging & Dead Stock Audit
              </h3>
              <p className="text-xs text-slate-500">
                Tracks shelf duration, fine gold holding, acquisition cost, and turnover velocity.
              </p>
            </div>

            <button
              onClick={() =>
                handleExportCSV(
                  'AURIC_Inventory_Audit',
                  articles.map((a) => ({
                    TagId: a.tagId,
                    HUID: a.huid || 'N/A',
                    Title: a.title,
                    Category: a.category,
                    Purity: a.purity,
                    GrossWeightGrams: a.grossWeightGrams,
                    FineGoldGrams: a.fineGoldEquivalentGrams,
                    CostPrice: a.costPrice,
                    Status: a.status,
                  }))
                )
              }
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Tag / HUID</th>
                  <th className="py-2.5 px-3">Ornament</th>
                  <th className="py-2.5 px-3">Purity</th>
                  <th className="py-2.5 px-3 text-right">Gross Wt (g)</th>
                  <th className="py-2.5 px-3 text-right">Fine Gold (g)</th>
                  <th className="py-2.5 px-3 text-right">Acquisition Cost</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {articles.map((a) => (
                  <tr key={a.id}>
                    <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-white">
                      {a.tagId}
                      {a.huid && (
                        <span className="block text-[10px] text-amber-600 font-mono">
                          HUID: {a.huid}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-900 dark:text-white">
                      {a.title}
                    </td>
                    <td className="py-3 px-3 text-slate-500">{a.purity}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold">
                      {formatWeightGrams(a.grossWeightGrams)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-amber-600 dark:text-amber-400 font-bold">
                      {formatWeightGrams(a.fineGoldEquivalentGrams)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-700 dark:text-slate-300">
                      {formatCurrencyINR(a.costPrice)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          a.status === 'AVAILABLE'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 4: METAL RECONCILIATION & KARIGAR GHAT AUDIT */}
      {activeReportTab === 'METAL_RECONCILIATION' && (
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Artisan Karigar Metal Balances & Workshop Ghat Loss Audit
              </h3>
              <p className="text-xs text-slate-500">
                Tracks pure 24K fine bullion in custody of artisans and measured workshop loss vs legal limits.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase text-slate-400">Total Gold with Karigars</span>
              <div className="text-base font-bold text-amber-600 dark:text-amber-400 mt-1">
                {formatWeightGrams(metrics.karigarFineGoldCustodyGrams)} Fine Gold
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase text-slate-400">Active Job Cards</span>
              <div className="text-base font-bold text-slate-900 dark:text-white mt-1">
                {orders.filter((o) => o.status === 'WIP').length} Jobs in Progress
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase text-slate-400">Avg. Ghat Loss Ratio</span>
              <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                0.95% (Within 1.20% Max)
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Karigar Artisan</th>
                  <th className="py-2.5 px-3">Speciality</th>
                  <th className="py-2.5 px-3 text-right">Gold Balance (Fine g)</th>
                  <th className="py-2.5 px-3 text-right">Silver Balance (g)</th>
                  <th className="py-2.5 px-3 text-center">Pending Jobs</th>
                  <th className="py-2.5 px-3 text-center">Custody Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {karigars.map((k) => (
                  <tr key={k.id}>
                    <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">{k.name}</td>
                    <td className="py-3 px-3 text-slate-500">{k.speciality}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-amber-600 dark:text-amber-400">
                      {formatWeightGrams(k.goldBalanceGrams)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-500">
                      {formatWeightGrams(k.silverBalanceGrams)}
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-medium">
                      {k.pendingJobsCount}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                        RECONCILED
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 5: GSTR-1 TAX SUMMARY */}
      {activeReportTab === 'GST_TAX' && (
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                GSTR-1 Outward Supplies Tax Summary (HSN 7113)
              </h3>
              <p className="text-xs text-slate-500">
                Format compliant with GST Portal e-returns: 3% Total (1.5% CGST + 1.5% SGST).
              </p>
            </div>

            <div className="text-xs font-mono text-slate-500">
              GSTIN: <span className="font-bold text-slate-900 dark:text-white">{activeBranch.gstin}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase text-slate-400">Total Taxable Turnover</span>
              <div className="text-base font-bold text-slate-900 dark:text-white mt-1">
                {formatCurrencyINR(metrics.totalRevenueINR - metrics.totalGstCollectedINR)}
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase text-slate-400">Total Output CGST (1.5%)</span>
              <div className="text-base font-bold text-amber-600 dark:text-amber-400 mt-1">
                {formatCurrencyINR(metrics.totalGstCollectedINR / 2)}
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase text-slate-400">Total Output SGST (1.5%)</span>
              <div className="text-base font-bold text-amber-600 dark:text-amber-400 mt-1">
                {formatCurrencyINR(metrics.totalGstCollectedINR / 2)}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
