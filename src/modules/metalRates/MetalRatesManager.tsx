import React, { useState } from 'react';
import { 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  ShieldAlert, 
  History, 
  RefreshCw, 
  Save 
} from 'lucide-react';
import { Branch, MetalRateSnapshot } from '../../core/types';
import { formatCurrencyINR } from '../../core/math';

interface MetalRatesManagerProps {
  currentRates: MetalRateSnapshot;
  activeBranch: Branch;
  onUpdateRates: (updated: MetalRateSnapshot) => void;
}

export const MetalRatesManager: React.FC<MetalRatesManagerProps> = ({
  currentRates,
  activeBranch,
  onUpdateRates,
}) => {
  const [rate24K, setRate24K] = useState(currentRates.ratePerGram24K);
  const [rate22K, setRate22K] = useState(currentRates.ratePerGram22K);
  const [rate18K, setRate18K] = useState(currentRates.ratePerGram18K);
  const [rate14K, setRate14K] = useState(currentRates.ratePerGram14K);
  const [rateSilver999, setRateSilver999] = useState(currentRates.ratePerGramSilver999);
  const [rateSilver925, setRateSilver925] = useState(currentRates.ratePerGramSilver925);
  const [ratePlat950, setRatePlat950] = useState(currentRates.ratePerGramPlatinum950);
  const [authorizer, setAuthorizer] = useState(currentRates.authorizedBy);
  const [isSavedSuccess, setIsSavedSuccess] = useState(false);

  // Rate history mock log
  const [historyLogs] = useState([
    {
      timestamp: '2026-11-01 09:30 AM',
      rate24K: 7880,
      rate22K: 7218,
      rateSilver: 95.20,
      authorizer: 'K. L. Chhajed (MD)',
      reason: 'Morning MCX Bullion opening revision',
    },
    {
      timestamp: '2026-10-31 04:15 PM',
      rate24K: 7850,
      rate22K: 7190,
      rateSilver: 94.50,
      authorizer: 'Vikram Chhajed (Director)',
      reason: 'Evening market closing rate',
    },
    {
      timestamp: '2026-10-31 10:00 AM',
      rate24K: 7820,
      rate22K: 7160,
      rateSilver: 94.00,
      authorizer: 'K. L. Chhajed (MD)',
      reason: 'Market opening bullion rate',
    },
  ]);

  const handleSaveRates = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedSnapshot: MetalRateSnapshot = {
      timestamp: new Date().toISOString(),
      ratePerGram24K: Number(rate24K),
      ratePerGram22K: Number(rate22K),
      ratePerGram18K: Number(rate18K),
      ratePerGram14K: Number(rate14K),
      ratePerGramSilver999: Number(rateSilver999),
      ratePerGramSilver925: Number(rateSilver925),
      ratePerGramPlatinum950: Number(ratePlat950),
      source: 'MANUAL_AUTHORIZED',
      authorizedBy: authorizer.trim() || 'Managing Director',
    };

    onUpdateRates(updatedSnapshot);
    setIsSavedSuccess(true);
    setTimeout(() => setIsSavedSuccess(false), 3000);
  };

  // Helper: auto-calculate proportionate rates when 24K changes
  const handleAutoDerive = (base24k: number) => {
    setRate24K(base24k);
    setRate22K(Math.round((base24k * 916) / 1000));
    setRate18K(Math.round((base24k * 750) / 1000));
    setRate14K(Math.round((base24k * 585) / 1000));
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-600" />
            Live Metal Rate Management & Audit
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Authoritative gold, silver, and platinum rates per gram with immutable snapshot archiving.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
          <Clock className="w-3.5 h-3.5" />
          <span>Last Updated: {new Date(currentRates.timestamp).toLocaleTimeString()}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Active Rate Configuration Form */}
        <div className="lg:col-span-7 space-y-4">
          <form onSubmit={handleSaveRates} className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Showroom Board Rates ({activeBranch.name})
                </h2>
                <p className="text-xs text-slate-500">
                  Changing board rates applies immediately to all counter POS terminals.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleAutoDerive(rate24K)}
                className="px-2.5 py-1 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 rounded border border-amber-200 dark:border-amber-800 hover:bg-amber-100 flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Auto-Derive Purity
              </button>
            </div>

            {/* Gold Rates Grid */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                Gold Bullion & Hallmark Rates (₹ / Gram)
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Gold 24K (999):
                  </label>
                  <input
                    type="number"
                    required
                    value={rate24K}
                    onChange={(e) => handleAutoDerive(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 font-mono text-xs font-bold border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Gold 22K (916):
                  </label>
                  <input
                    type="number"
                    required
                    value={rate22K}
                    onChange={(e) => setRate22K(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 font-mono text-xs font-bold border border-amber-300 dark:border-amber-700 rounded-lg bg-amber-50/50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Gold 18K (750):
                  </label>
                  <input
                    type="number"
                    required
                    value={rate18K}
                    onChange={(e) => setRate18K(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 font-mono text-xs font-semibold border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Gold 14K (585):
                  </label>
                  <input
                    type="number"
                    required
                    value={rate14K}
                    onChange={(e) => setRate14K(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 font-mono text-xs font-semibold border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Silver & Platinum Rates Grid */}
            <div className="space-y-2 pt-2">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                Silver & Platinum Rates (₹ / Gram)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Silver 999 Bullion:
                  </label>
                  <input
                    type="number"
                    step="0.10"
                    required
                    value={rateSilver999}
                    onChange={(e) => setRateSilver999(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 font-mono text-xs font-semibold border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Silver 925 (Sterling):
                  </label>
                  <input
                    type="number"
                    step="0.10"
                    required
                    value={rateSilver925}
                    onChange={(e) => setRateSilver925(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 font-mono text-xs font-semibold border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Platinum 950:
                  </label>
                  <input
                    type="number"
                    required
                    value={ratePlat950}
                    onChange={(e) => setRatePlat950(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 font-mono text-xs font-semibold border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Authorizer & Compliance */}
            <div className="pt-2">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Authorized By (Managing Director / Chief Valuer):
              </label>
              <input
                type="text"
                required
                value={authorizer}
                onChange={(e) => setAuthorizer(e.target.value)}
                placeholder="e.g. K. L. Chhajed (MD)"
                className="w-full px-2.5 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
              {isSavedSuccess ? (
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" /> Rates successfully updated & broadcasted!
                </span>
              ) : (
                <span className="text-[11px] text-slate-500">
                  Invariant 5 enforced: Past invoices retain their original rate snapshots.
                </span>
              )}

              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                Broadcast Rates
              </button>
            </div>
          </form>
        </div>

        {/* Right Column (5 cols): Audit Trail & Invariant Rules */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-slate-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Historical Rate Audit Trail
              </h3>
            </div>

            <div className="space-y-2 text-xs">
              {historyLogs.map((log, idx) => (
                <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700/60 space-y-1">
                  <div className="flex justify-between font-mono text-[11px] text-slate-500">
                    <span>{log.timestamp}</span>
                    <span className="text-slate-700 dark:text-slate-300 font-semibold">{log.authorizer}</span>
                  </div>
                  <div className="flex justify-between font-mono font-bold text-slate-900 dark:text-white pt-1">
                    <span>24K: {formatCurrencyINR(log.rate24K)}/g</span>
                    <span className="text-amber-600 dark:text-amber-400">22K: {formatCurrencyINR(log.rate22K)}/g</span>
                    <span>Ag: {formatCurrencyINR(log.rateSilver)}/g</span>
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 italic">
                    "{log.reason}"
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
