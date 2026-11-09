import React, { useState } from 'react';
import { 
  Scale, 
  Plus, 
  Flame, 
  Receipt, 
  ShieldCheck, 
  CheckCircle2, 
  Printer,
  Trash2,
  ArrowRightLeft
} from 'lucide-react';
import { Customer, MetalRateSnapshot, MetalType, OldMetalIntake } from '../../core/types';
import { calculateFineMetalEquivalent, formatCurrencyINR, formatWeightGrams, roundDecimals } from '../../core/math';

interface OldGoldProps {
  vouchers: OldMetalIntake[];
  customers: Customer[];
  metalRates: MetalRateSnapshot;
  onAddVoucher: (voucher: OldMetalIntake) => void;
  onDeleteVoucher?: (voucherId: string) => void;
}

export const OldGoldIntakeTerminal: React.FC<OldGoldProps> = ({
  vouchers,
  customers,
  metalRates,
  onAddVoucher,
  onDeleteVoucher,
}) => {
  const [showIntakeForm, setShowIntakeForm] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id || '');
  const [declaredPurity, setDeclaredPurity] = useState('Old Traditional Bangle (22K)');
  const [metal, setMetal] = useState<MetalType>('GOLD');
  const [testedFineness, setTestedFineness] = useState(910);
  const [grossWeight, setGrossWeight] = useState(15.200);
  const [dustDeduction, setDustDeduction] = useState(0.500);
  const [meltingDeductionPercent, setMeltingDeductionPercent] = useState(1.5);
  const [assayerName, setAssayerName] = useState('Chief Valuer');

  // Interactive calculation
  const netMeltWeight = Math.max(0, roundDecimals(grossWeight - dustDeduction, 3));
  const fineGrams = calculateFineMetalEquivalent(netMeltWeight, testedFineness);
  
  // Base 24K rate
  const rate24K = metal === 'GOLD' ? metalRates.ratePerGram24K : metalRates.ratePerGramSilver999;
  const purityRate = roundDecimals((rate24K * testedFineness) / 1000, 2);
  const preDeductionValue = roundDecimals(netMeltWeight * purityRate, 2);
  const deductionAmount = roundDecimals((preDeductionValue * meltingDeductionPercent) / 100, 2);
  const netValuation = roundDecimals(preDeductionValue - deductionAmount, 2);

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId) || customers[0];

  const handleCreateVoucher = (e: React.FormEvent) => {
    e.preventDefault();
    const voucherNumber = `OG-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newVoucher: OldMetalIntake = {
      id: `OG-${Date.now()}`,
      voucherNumber,
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      metal,
      declaredPurity,
      testedFineness,
      grossWeightGrams: grossWeight,
      dustStoneDeductionGrams: dustDeduction,
      netMeltWeightGrams: netMeltWeight,
      fineMetalEquivalentGrams: fineGrams,
      purityRatePerGram: purityRate,
      deductionPercent: meltingDeductionPercent,
      netValuationAmount: netValuation,
      status: 'AVAILABLE_FOR_EXCHANGE',
      assayedBy: assayerName,
      createdAt: new Date().toISOString(),
    };

    onAddVoucher(newVoucher);
    setShowIntakeForm(false);
  };

  const availableCount = vouchers.filter(
    (v) => v.status !== 'REDEEMED_IN_SALE' && !v.redeemedInvoiceNumber
  ).length;
  const redeemedCount = vouchers.filter(
    (v) => v.status === 'REDEEMED_IN_SALE' || Boolean(v.redeemedInvoiceNumber)
  ).length;

  return (
    <div className="space-y-6">
      {/* Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Scale className="w-5 h-5 text-amber-600" />
            Old Gold / Silver Exchange Terminal
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Tunch (Tonch) assay testing, melt dust deduction, fine metal valuation, and customer-linked POS exchange vouchers.
          </p>
        </div>

        <button
          onClick={() => setShowIntakeForm(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm transition-colors whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          New Old Metal Intake Voucher
        </button>
      </div>

      {/* Intake Voucher History Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              Recorded Old Metal Intake Vouchers ({vouchers.length})
            </span>
            <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 font-mono text-[10px] font-bold">
              {availableCount} Available for POS Exchange
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 font-mono text-[10px] font-bold">
              {redeemedCount} Redeemed in Sale Bills
            </span>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            Auto-syncs with Customer selection on POS Billing screen
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-mono border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-2.5 px-3">Voucher #</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Metal & Article</th>
                <th className="py-2.5 px-3">Tested Tunch</th>
                <th className="py-2.5 px-3 text-right">Gross Wt</th>
                <th className="py-2.5 px-3 text-right">Net Melt Wt</th>
                <th className="py-2.5 px-3 text-right">Fine Metal</th>
                <th className="py-2.5 px-3 text-right">Net Valuation</th>
                <th className="py-2.5 px-3">Exchange Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {vouchers.map((v) => {
                const isRedeemed = v.status === 'REDEEMED_IN_SALE' || Boolean(v.redeemedInvoiceNumber);
                return (
                  <tr key={v.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white">
                      {v.voucherNumber}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200">
                      {v.customerName}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                      <span className={`inline-block mr-1.5 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                        v.metal === 'SILVER'
                          ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                          : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                      }`}>
                        {v.metal}
                      </span>
                      {v.declaredPurity}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-amber-700 dark:text-amber-400 font-semibold">
                      {(v.testedFineness / 10).toFixed(1)}% ({v.testedFineness}‰)
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                      {formatWeightGrams(v.grossWeightGrams)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                      {formatWeightGrams(v.netMeltWeightGrams)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-amber-600 dark:text-amber-400">
                      {formatWeightGrams(v.fineMetalEquivalentGrams)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                      {formatCurrencyINR(v.netValuationAmount)}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[10px]">
                      {isRedeemed ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-semibold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-3 h-3" />
                          REDEEMED IN BILL #{v.redeemedInvoiceNumber || 'POS'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          <ArrowRightLeft className="w-3 h-3" />
                          AVAILABLE FOR POS EXCHANGE
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {!isRedeemed && onDeleteVoucher ? (
                        <button
                          type="button"
                          onClick={() => onDeleteVoucher(v.id)}
                          title="Void / Remove Unredeemed Voucher"
                          className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <span className="text-[10px] font-mono text-slate-400">Locked</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Voucher Intake Modal */}
      {showIntakeForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b pb-3">
              <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-600" />
                Customer Old Gold / Silver Assay & Intake
              </span>
              <button
                onClick={() => setShowIntakeForm(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateVoucher} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  Customer:
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  Article Description / Customer Declaration:
                </label>
                <input
                  type="text"
                  required
                  value={declaredPurity}
                  onChange={(e) => setDeclaredPurity(e.target.value)}
                  placeholder="e.g. 2 Old Bangles without hallmark"
                  className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                    Metal Type:
                  </label>
                  <select
                    value={metal}
                    onChange={(e) => setMetal(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="GOLD">Gold</option>
                    <option value="SILVER">Silver</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                    Assay Tested Fineness (e.g. 910/1000):
                  </label>
                  <input
                    type="number"
                    max={999}
                    min={375}
                    required
                    value={testedFineness}
                    onChange={(e) => setTestedFineness(Number(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 font-mono border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-amber-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                    Gross Weight (g):
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
                    Dust/Wax/Stone (g):
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={dustDeduction}
                    onChange={(e) => setDustDeduction(Number(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 font-mono border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                    Melt Loss %:
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={meltingDeductionPercent}
                    onChange={(e) => setMeltingDeductionPercent(Number(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 font-mono border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Real-time Valuation Display */}
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 rounded-lg space-y-1 text-xs font-mono">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Net Melt Weight:</span>
                  <span>{formatWeightGrams(netMeltWeight)}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Fine 24K Equiv Content:</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">{formatWeightGrams(fineGrams)}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Applied Rate ({testedFineness} Purity):</span>
                  <span>{formatCurrencyINR(purityRate)}/g</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-amber-200 dark:border-amber-800/80 font-bold text-sm text-slate-900 dark:text-white">
                  <span>Customer Net Credit:</span>
                  <span className="text-amber-600 dark:text-amber-400">{formatCurrencyINR(netValuation)}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowIntakeForm(false)}
                  className="px-3 py-1.5 text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg"
                >
                  Issue Old Metal Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
