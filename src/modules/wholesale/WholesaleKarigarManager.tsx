import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Coins, 
  Scale, 
  ShieldCheck, 
  ArrowRightLeft, 
  FileText, 
  CheckCircle2 
} from 'lucide-react';
import { Karigar, MetalType } from '../../core/types';
import { calculateFineMetalEquivalent, formatCurrencyINR, formatWeightGrams, roundDecimals } from '../../core/math';

interface WholesaleKarigarProps {
  karigars: Karigar[];
  onAddKarigar: (karigar: Karigar) => void;
  onIssueMetalToKarigar: (karigarId: string, metal: MetalType, grossWeight: number, fineness: number) => void;
}

export const WholesaleKarigarManager: React.FC<WholesaleKarigarProps> = ({
  karigars,
  onAddKarigar,
  onIssueMetalToKarigar,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'KARIGARS' | 'WHOLESALE_ORDERS'>('KARIGARS');
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [selectedKarigarId, setSelectedKarigarId] = useState(karigars[0]?.id || '');
  const [issueMetal, setIssueMetal] = useState<MetalType>('GOLD');
  const [issueWeight, setIssueWeight] = useState(25.000);
  const [issueFineness, setIssueFineness] = useState(999);
  const [issueJobNotes, setIssueJobNotes] = useState('Lot for 22K Bridal Necklace casting');

  // Wholesale orders mock
  const [wholesaleOrders] = useState([
    {
      id: 'WH-2026-001',
      partyName: 'Surat Diamond & Bullion Mart',
      orderDate: '2026-10-29',
      category: '22K Plain Bangles (Casting)',
      orderGrossWeight: 250.000,
      fineGoldContent: 229.000,
      settlementMode: 'BHAAV_CUT_METAL_FIXATION',
      rateFixedPerGram: 7200,
      labourChargePerGram: 180,
      totalLabourPayable: 45000,
      metalOwedGrams: 229.000,
      status: 'DISPATCHED_INVOICED',
    },
    {
      id: 'WH-2026-002',
      partyName: 'Ahmedabad Heritage Jewellers',
      orderDate: '2026-10-31',
      category: '18K Diamond Mounted Sets',
      orderGrossWeight: 140.200,
      fineGoldContent: 105.150,
      settlementMode: 'FINE_METAL_RETURN',
      rateFixedPerGram: 5900,
      labourChargePerGram: 320,
      totalLabourPayable: 44864,
      metalOwedGrams: 105.150,
      status: 'PRODUCTION_IN_PROGRESS',
    },
  ]);

  const handleIssueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onIssueMetalToKarigar(selectedKarigarId, issueMetal, issueWeight, issueFineness);
    setShowIssueModal(false);
  };

  const selectedKarigar = karigars.find((k) => k.id === selectedKarigarId) || karigars[0];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-600" />
            Artisan Karigar & Wholesale Operations
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Artisan metal ledgers, bullion issue/return reconciliations, and weight-based wholesale orders.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveSubTab('KARIGARS')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeSubTab === 'KARIGARS'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Karigar Metal Balances
          </button>
          <button
            onClick={() => setActiveSubTab('WHOLESALE_ORDERS')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeSubTab === 'WHOLESALE_ORDERS'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Wholesale Bhaav-Cut Orders
          </button>
        </div>
      </div>

      {activeSubTab === 'KARIGARS' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              Registered Artisans & Workshops ({karigars.length})
            </span>
            <button
              onClick={() => setShowIssueModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm"
            >
              <Coins className="w-3.5 h-3.5" />
              Issue Metal to Artisan
            </button>
          </div>

          {/* Karigars Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {karigars.map((k) => (
              <div
                key={k.id}
                className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between border-b pb-2">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">{k.name}</h3>
                    <p className="text-[11px] text-slate-500 font-mono">{k.phone}</p>
                  </div>
                  <span className="text-[10px] bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded font-medium border border-amber-200 dark:border-amber-800/40">
                    {k.pendingJobsCount} Active Jobs
                  </span>
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-400">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Specialty:</span> {k.specialization}
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg space-y-1 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Fine Gold Holding:</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">
                      {formatWeightGrams(k.goldBalanceGrams)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Silver Holding:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {formatWeightGrams(k.silverBalanceGrams)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-700 font-semibold text-slate-900 dark:text-white">
                    <span>Labour Payable:</span>
                    <span>{formatCurrencyINR(k.labourPayableAmount)}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => {
                      setSelectedKarigarId(k.id);
                      setShowIssueModal(true);
                    }}
                    className="flex-1 py-1 text-center text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 rounded hover:bg-amber-100"
                  >
                    Issue Metal
                  </button>
                  <button
                    onClick={() => {
                      alert(`Opening Karigar Job & Loss statement for ${k.name}. Allowed burning loss: 0.8% standard.`);
                    }}
                    className="flex-1 py-1 text-center text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded hover:bg-slate-200"
                  >
                    View Ledger
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Wholesale Bhaav Cut Orders Table */
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              Active Wholesale Orders ({wholesaleOrders.length})
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Weight-based metal settlement & rate fixation
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-mono border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-2.5 px-3">Order #</th>
                  <th className="py-2.5 px-3">Wholesale Party</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3 text-right">Order Gross Wt</th>
                  <th className="py-2.5 px-3 text-right">Fine Gold Wt</th>
                  <th className="py-2.5 px-3">Settlement Terms</th>
                  <th className="py-2.5 px-3 text-right">Labour Due</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {wholesaleOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white">
                      {ord.id}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-white">
                      {ord.partyName}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                      {ord.category}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                      {formatWeightGrams(ord.orderGrossWeight)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-amber-600 dark:text-amber-400">
                      {formatWeightGrams(ord.fineGoldContent)}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                      {ord.settlementMode === 'BHAAV_CUT_METAL_FIXATION' ? 'Bhaav Cut @ ₹' + ord.rateFixedPerGram : 'Pure Metal Return'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {formatCurrencyINR(ord.totalLabourPayable)}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[10px]">
                      <span className="px-2 py-0.5 rounded font-semibold bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                        {ord.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Metal Issue to Karigar Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-sm w-full border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-amber-600" />
                Issue Precious Metal to Artisan
              </span>
              <button
                onClick={() => setShowIssueModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleIssueSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  Artisan / Karigar:
                </label>
                <select
                  value={selectedKarigarId}
                  onChange={(e) => setSelectedKarigarId(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  {karigars.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.name} ({k.specialization})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                    Metal:
                  </label>
                  <select
                    value={issueMetal}
                    onChange={(e) => setIssueMetal(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="GOLD">Gold</option>
                    <option value="SILVER">Silver</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                    Fineness (e.g. 999/916):
                  </label>
                  <input
                    type="number"
                    value={issueFineness}
                    onChange={(e) => setIssueFineness(Number(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 font-mono border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  Gross Weight to Issue (Grams):
                </label>
                <input
                  type="number"
                  step="0.001"
                  required
                  value={issueWeight}
                  onChange={(e) => setIssueWeight(Number(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 font-mono text-sm font-bold border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  Job Instructions / Order Reference:
                </label>
                <input
                  type="text"
                  required
                  value={issueJobNotes}
                  onChange={(e) => setIssueJobNotes(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="p-2 bg-amber-50/60 dark:bg-slate-800/60 rounded border border-amber-200 dark:border-slate-700 text-[11px] font-mono flex justify-between">
                <span>Calculated Pure Fine Metal:</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  {formatWeightGrams(calculateFineMetalEquivalent(issueWeight, issueFineness))}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
                  className="px-3 py-1.5 text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg"
                >
                  Confirm Issue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
