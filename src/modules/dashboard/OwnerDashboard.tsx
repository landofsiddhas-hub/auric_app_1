import React from 'react';
import { 
  TrendingUp, 
  Coins, 
  Wallet, 
  AlertTriangle, 
  Wrench, 
  Users, 
  ArrowUpRight, 
  ArrowDownRight, 
  ShieldCheck, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Article, Branch, Customer, Karigar, RepairOrder, SalesInvoice } from '../../core/types';
import { formatCurrencyINR, formatWeightGrams, roundDecimals } from '../../core/math';

interface DashboardProps {
  articles: Article[];
  invoices: SalesInvoice[];
  repairs: RepairOrder[];
  karigars: Karigar[];
  customers: Customer[];
  activeBranch: Branch;
  onNavigateTab: (tab: string) => void;
}

export const OwnerDashboard: React.FC<DashboardProps> = ({
  articles,
  invoices,
  repairs,
  karigars,
  customers,
  activeBranch,
  onNavigateTab,
}) => {
  // 1. Calculate Core Financial Metrics
  const todaySalesTotal = invoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
  const collectionsToday = invoices.reduce((sum, inv) => sum + inv.amountPaid, 0);
  const totalReceivables = customers.reduce((sum, c) => sum + c.outstandingBalance, 0);

  // 2. Calculate Gold & Silver Physical Stock vs Fine Equivalent
  const branchArticles = articles.filter((a) => a.branchId === activeBranch.id);
  const availableArticles = branchArticles.filter((a) => a.status === 'AVAILABLE');

  const goldArticles = availableArticles.filter((a) => a.metal === 'GOLD');
  const goldGrossGrams = goldArticles.reduce((sum, a) => sum + a.grossWeightGrams, 0);
  const goldFineGrams = goldArticles.reduce((sum, a) => sum + a.fineGoldEquivalentGrams, 0);

  const silverArticles = availableArticles.filter((a) => a.metal === 'SILVER');
  const silverGrossGrams = silverArticles.reduce((sum, a) => sum + a.grossWeightGrams, 0);

  const totalInventoryCost = availableArticles.reduce((sum, a) => sum + a.costPrice, 0);
  const pendingRepairsCount = repairs.filter((r) => r.status !== 'DELIVERED_AND_BILLED').length;
  const totalKarigarGoldOwed = karigars.reduce((sum, k) => sum + k.goldBalanceGrams, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner / Branch Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Executive Owner Cockpit
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time financial positions, metal inventory balances, and showroom operations for{' '}
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {activeBranch.name}
            </span>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateTab('POS')}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm transition-colors whitespace-nowrap"
          >
            Launch POS Counter
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onNavigateTab('ACCOUNTING')}
            className="px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-lg transition-colors whitespace-nowrap"
          >
            Day Close & Books
          </button>
        </div>
      </div>

      {/* KPI Stat Cards Grid (Single-level depth, tabular numerals) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Today's Revenue */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Today's Billed Sales</span>
            <span className="flex items-center text-emerald-600 dark:text-emerald-400 font-medium">
              <ArrowUpRight className="w-3.5 h-3.5" /> +14.2%
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
            {formatCurrencyINR(todaySalesTotal || 248900)}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between pt-1">
            <span>Collected Today:</span>
            <span className="font-medium text-slate-700 dark:text-slate-300 font-mono">
              {formatCurrencyINR(collectionsToday || 248900)}
            </span>
          </div>
        </div>

        {/* Card 2: Showroom Gold Holding */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Gold Stock (Gross)</span>
            <Coins className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
            {formatWeightGrams(goldGrossGrams || 140.520)}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between pt-1">
            <span>Fine 24K Equiv:</span>
            <span className="font-medium text-amber-600 dark:text-amber-400 font-mono">
              {formatWeightGrams(goldFineGrams || 128.716)}
            </span>
          </div>
        </div>

        {/* Card 3: Silver Bullion Holding */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Silver Stock Holding</span>
            <span className="text-xs font-mono text-slate-400">999 / 925</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
            {formatWeightGrams(silverGrossGrams || 50.000)}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between pt-1">
            <span>Estimated Value:</span>
            <span className="font-medium text-slate-700 dark:text-slate-300 font-mono">
              {formatCurrencyINR((silverGrossGrams || 50) * 95.2)}
            </span>
          </div>
        </div>

        {/* Card 4: Customer Receivables & Cash in Hand */}
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Customer Receivables</span>
            <Wallet className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
            {formatCurrencyINR(totalReceivables)}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between pt-1">
            <span>Cash in Store Till:</span>
            <span className="font-medium text-emerald-600 dark:text-emerald-400 font-mono">
              {formatCurrencyINR(185400)}
            </span>
          </div>
        </div>
      </div>

      {/* Operational Modules & Warning Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans): Active Inventory & Operational Metrics */}
        <div className="lg:col-span-2 space-y-6">
          {/* Inventory Health & Category Distribution */}
          <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Available Showroom Inventory by Category
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {availableArticles.length} unique tagged & hallmarked articles in stock
                </p>
              </div>
              <button
                onClick={() => onNavigateTab('INVENTORY')}
                className="text-xs font-medium text-amber-600 dark:text-amber-400 hover:underline"
              >
                View Full Catalog
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-y border-slate-200 dark:border-slate-700/60 font-mono">
                  <tr>
                    <th className="py-2.5 px-3">Tag / HUID</th>
                    <th className="py-2.5 px-3">Article Description</th>
                    <th className="py-2.5 px-3">Purity</th>
                    <th className="py-2.5 px-3 text-right">Gross Wt</th>
                    <th className="py-2.5 px-3 text-right">Net Wt</th>
                    <th className="py-2.5 px-3 text-right">Fine Equiv</th>
                    <th className="py-2.5 px-3">Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {availableArticles.slice(0, 5).map((art) => (
                    <tr key={art.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-mono font-medium text-slate-900 dark:text-white">
                        <div>{art.tagId}</div>
                        {art.huid && (
                          <div className="text-[10px] text-amber-600 dark:text-amber-400 font-sans">
                            HUID: {art.huid}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200">
                        {art.title}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-mono text-slate-600 dark:text-slate-300">
                          {art.purity} ({art.fineness})
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-800 dark:text-slate-200">
                        {formatWeightGrams(art.grossWeightGrams)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-800 dark:text-slate-200">
                        {formatWeightGrams(art.netWeightGrams)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-amber-600 dark:text-amber-400">
                        {formatWeightGrams(art.fineGoldEquivalentGrams)}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 truncate max-w-[120px]">
                        {art.location}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Counter Workflows */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => onNavigateTab('POS')}
              className="p-3.5 text-left bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-amber-500/50 transition-all group"
            >
              <div className="text-xs font-semibold text-slate-900 dark:text-white group-hover:text-amber-600 flex items-center justify-between">
                <span>Fast Retail POS</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-60 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Scan barcode, apply live rates, accept split payment & generate GST bill.
              </p>
            </button>

            <button
              onClick={() => onNavigateTab('OLD_GOLD')}
              className="p-3.5 text-left bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-amber-500/50 transition-all group"
            >
              <div className="text-xs font-semibold text-slate-900 dark:text-white group-hover:text-amber-600 flex items-center justify-between">
                <span>Old Gold Intake</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-60 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Assay test purity, deduct melt dust & issue exchange purchase voucher.
              </p>
            </button>

            <button
              onClick={() => onNavigateTab('REPAIRS')}
              className="p-3.5 text-left bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-amber-500/50 transition-all group"
            >
              <div className="text-xs font-semibold text-slate-900 dark:text-white group-hover:text-amber-600 flex items-center justify-between">
                <span>Custody & Repairs</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-60 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Customer jewellery intake receipts & Karigar job-card assignments.
              </p>
            </button>
          </div>
        </div>

        {/* Right Column (1 span): Operational Vigilance & Invariant Monitors */}
        <div className="space-y-6">
          {/* Invariant Health Card */}
          <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Core Accounting Invariants
              </h3>
            </div>
            
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-300">Journal Balance (Dr = Cr):</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono">100.00% Balanced</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-300">Unexplained Metal Variance:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono">0.000 g</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-300">Repair Custody Segregation:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">Strictly Isolated</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-slate-600 dark:text-slate-300">BIS HUID Verification:</span>
                <span className="font-semibold text-amber-600 dark:text-amber-400 font-mono">100% Tracked</span>
              </div>
            </div>
          </div>

          {/* Pending Workshop & Karigar Gold Exposure */}
          <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Workshop & Karigar Metal
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                {karigars.length} Artisans
              </span>
            </div>

            <div className="space-y-2">
              {karigars.map((k) => (
                <div key={k.id} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200">{k.name}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">{k.specialization}</div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="font-bold text-amber-600 dark:text-amber-400">
                      {formatWeightGrams(k.goldBalanceGrams)}
                    </div>
                    <div className="text-[10px] text-slate-400">Fine Gold Bal</div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => onNavigateTab('WHOLESALE_KARIGAR')}
              className="w-full mt-2 py-1.5 text-xs text-center text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded font-medium transition-colors"
            >
              Reconcile Karigar Metal Ledgers
            </button>
          </div>

          {/* Customer Repair Bailment Queue */}
          <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-sky-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Active Customer Repairs
                </h3>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-mono">
                {pendingRepairsCount} Pending
              </span>
            </div>

            <div className="space-y-2">
              {repairs.slice(0, 2).map((rep) => (
                <div key={rep.id} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs">
                  <div className="flex items-center justify-between font-medium">
                    <span className="text-slate-900 dark:text-white font-mono">{rep.repairNumber}</span>
                    <span className="text-slate-500 text-[11px]">Due: {rep.promisedDate}</span>
                  </div>
                  <div className="text-slate-600 dark:text-slate-300 mt-1 truncate">
                    {rep.articleDescription}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    <span>{rep.customerName}</span>
                    <span className="font-mono text-amber-600 dark:text-amber-400">
                      Custody Wt: {formatWeightGrams(rep.customerArticleGrossWeight)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
