import React, { useState } from 'react';
import { 
  Wrench, 
  Plus, 
  ShieldCheck, 
  Clock, 
  User, 
  CheckCircle, 
  Printer, 
  ArrowRight 
} from 'lucide-react';
import { Customer, Karigar, RepairOrder } from '../../core/types';
import { formatCurrencyINR, formatWeightGrams, roundDecimals } from '../../core/math';

interface RepairsManagerProps {
  repairs: RepairOrder[];
  customers: Customer[];
  karigars: Karigar[];
  onAddRepair: (repair: RepairOrder) => void;
  onUpdateStatus: (repairId: string, status: RepairOrder['status']) => void;
}

export const RepairsManager: React.FC<RepairsManagerProps> = ({
  repairs,
  customers,
  karigars,
  onAddRepair,
  onUpdateStatus,
}) => {
  const [showIntakeModal, setShowIntakeModal] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id || '');
  const [articleDesc, setArticleDesc] = useState('');
  const [custodyWeight, setCustodyWeight] = useState(12.500);
  const [issueDesc, setIssueDesc] = useState('');
  const [estimatedCost, setEstimatedCost] = useState(2500);
  const [advancePaid, setAdvancePaid] = useState(500);
  const [assignedKarigarId, setAssignedKarigarId] = useState(karigars[0]?.id || '');
  const [pureGoldIssued, setPureGoldIssued] = useState(0.400);
  const [promisedDate, setPromisedDate] = useState('2026-11-05');
  const [selectedReceiptRepair, setSelectedReceiptRepair] = useState<RepairOrder | null>(null);

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId) || customers[0];
  const selectedKarigar = karigars.find((k) => k.id === assignedKarigarId) || karigars[0];

  const handleCreateRepair = (e: React.FormEvent) => {
    e.preventDefault();
    const repairNumber = `REP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newRepair: RepairOrder = {
      id: `REP-${Date.now()}`,
      repairNumber,
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      customerPhone: selectedCustomer.phone,
      articleDescription: articleDesc,
      customerArticleGrossWeight: custodyWeight,
      isCustodyOnly: true, // INVARIANT 6: Bailment custody, NOT merchant stock!
      issueDescription: issueDesc,
      estimatedCost,
      advancePaid,
      assignedKarigarId: selectedKarigar.id,
      assignedKarigarName: selectedKarigar.name,
      pureGoldIssuedGrams: pureGoldIssued,
      goldReturnedGrams: 0,
      status: 'IN_WORKSHOP',
      intakeTimestamp: new Date().toISOString(),
      promisedDate,
    };

    onAddRepair(newRepair);
    setShowIntakeModal(false);
    setSelectedReceiptRepair(newRepair);

    // Reset Form
    setArticleDesc('');
    setCustodyWeight(12.5);
    setIssueDesc('');
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Wrench className="w-5 h-5 text-amber-600" />
            Customer Repairs & Workshop Custody
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Strict bailment custody tracking. Customer-owned articles are mathematically segregated from merchant inventory (Invariant 6).
          </p>
        </div>

        <button
          onClick={() => setShowIntakeModal(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm transition-colors whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Intake Customer Repair Article
        </button>
      </div>

      {/* Repairs Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            Active Custody Orders ({repairs.length})
          </span>
          <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            Non-Inventory Bailment Custody
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-mono border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-2.5 px-3">Job / Custody #</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Customer Article Description</th>
                <th className="py-2.5 px-3 text-right">Intake Custody Wt</th>
                <th className="py-2.5 px-3">Assigned Karigar</th>
                <th className="py-2.5 px-3 text-right">Pure Gold Issued</th>
                <th className="py-2.5 px-3 text-right">Estimate</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {repairs.map((rep) => (
                <tr key={rep.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white">
                    {rep.repairNumber}
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="font-semibold text-slate-900 dark:text-white">{rep.customerName}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{rep.customerPhone}</div>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="font-medium text-slate-800 dark:text-slate-200">{rep.articleDescription}</div>
                    <div className="text-[10px] text-slate-500 truncate max-w-[200px]">{rep.issueDescription}</div>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-800 dark:text-slate-200 font-semibold">
                    {formatWeightGrams(rep.customerArticleGrossWeight)}
                  </td>
                  <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                    {rep.assignedKarigarName || 'Unassigned'}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-amber-600 dark:text-amber-400 font-semibold">
                    {formatWeightGrams(rep.pureGoldIssuedGrams)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                    {formatCurrencyINR(rep.estimatedCost)}
                  </td>
                  <td className="py-2.5 px-3">
                    <select
                      value={rep.status}
                      onChange={(e) => onUpdateStatus(rep.id, e.target.value as any)}
                      className="py-1 px-1.5 text-[10px] font-mono font-bold rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                    >
                      <option value="RECEIVED">RECEIVED</option>
                      <option value="IN_WORKSHOP">IN_WORKSHOP</option>
                      <option value="QUALITY_CHECK">QUALITY_CHECK</option>
                      <option value="READY_FOR_DELIVERY">READY_FOR_DELIVERY</option>
                      <option value="DELIVERED_AND_BILLED">DELIVERED_AND_BILLED</option>
                    </select>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => setSelectedReceiptRepair(rep)}
                      className="p-1.5 text-slate-500 hover:text-amber-600 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                      title="Print Customer Custody Receipt"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Repair Intake Receipt Modal */}
      {selectedReceiptRepair && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-sm w-full border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Custody Intake Receipt
              </span>
              <button
                onClick={() => setSelectedReceiptRepair(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white font-mono text-[11px] space-y-2">
              <div className="text-center font-bold text-xs font-sans">AURIC FINE JEWELS</div>
              <div className="text-center text-[10px] text-slate-500">Bailment Custody Receipt · Workshop Division</div>
              
              <div className="border-t border-b py-2 space-y-1">
                <div>Receipt: {selectedReceiptRepair.repairNumber}</div>
                <div>Customer: {selectedReceiptRepair.customerName}</div>
                <div>Phone: {selectedReceiptRepair.customerPhone}</div>
                <div>Article: {selectedReceiptRepair.articleDescription}</div>
                <div className="font-bold text-amber-600">Custody Gross Weight: {formatWeightGrams(selectedReceiptRepair.customerArticleGrossWeight)}</div>
                <div>Work: {selectedReceiptRepair.issueDescription}</div>
              </div>

              <div className="flex justify-between text-xs font-bold pt-1">
                <span>Estimated Cost:</span>
                <span>{formatCurrencyINR(selectedReceiptRepair.estimatedCost)}</span>
              </div>
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>Advance Paid:</span>
                <span>{formatCurrencyINR(selectedReceiptRepair.advancePaid)}</span>
              </div>
              <div className="text-center text-[9px] text-slate-400 pt-2 border-t">
                Customer retains 100% legal title. Piece held strictly in bailment.
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg flex items-center gap-1"
              >
                <Printer className="w-3.5 h-3.5" /> Print Receipt
              </button>
              <button
                onClick={() => setSelectedReceiptRepair(null)}
                className="px-3 py-1.5 text-xs font-medium border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Intake Modal */}
      {showIntakeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b pb-3">
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                Intake Customer Jewellery for Repair / Custom Workshop
              </span>
              <button
                onClick={() => setShowIntakeModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRepair} className="space-y-3 text-xs">
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
                  Customer Article Description:
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 22K Traditional Antique Kada with floral carving"
                  value={articleDesc}
                  onChange={(e) => setArticleDesc(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                    Customer Article Gross Weight (Grams):
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    required
                    value={custodyWeight}
                    onChange={(e) => setCustodyWeight(Number(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 font-mono border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                    Promised Completion Date:
                  </label>
                  <input
                    type="date"
                    required
                    value={promisedDate}
                    onChange={(e) => setPromisedDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  Problem Description & Workshop Instructions:
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Broken hinge pin, needs 0.40g 22K alloy solder and high-luster buff polish."
                  value={issueDesc}
                  onChange={(e) => setIssueDesc(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                    Assign Karigar Artisan:
                  </label>
                  <select
                    value={assignedKarigarId}
                    onChange={(e) => setAssignedKarigarId(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {karigars.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.name} ({k.specialization})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                    Pure Gold Alloy Issued to Artisan (g):
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={pureGoldIssued}
                    onChange={(e) => setPureGoldIssued(Number(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 font-mono border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold text-amber-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                    Estimated Repair Cost (₹):
                  </label>
                  <input
                    type="number"
                    required
                    value={estimatedCost}
                    onChange={(e) => setEstimatedCost(Number(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 font-mono border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                    Customer Advance Paid (₹):
                  </label>
                  <input
                    type="number"
                    value={advancePaid}
                    onChange={(e) => setAdvancePaid(Number(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 font-mono border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>
                  <strong>Invariant 6 Protected:</strong> This article is registered under customer bailment custody. It will not be added to showroom stock balance or valuation.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowIntakeModal(false)}
                  className="px-3 py-1.5 text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg"
                >
                  Issue Custody Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
