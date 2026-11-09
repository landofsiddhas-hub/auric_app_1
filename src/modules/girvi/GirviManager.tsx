import React, { useState } from 'react';
import { 
  Landmark, 
  Plus, 
  Search, 
  ShieldCheck, 
  Coins, 
  Receipt, 
  Printer, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight,
  Clock,
  Sparkles,
  Lock,
  X
} from 'lucide-react';
import { GirviPledge, GirviItem, GirviPayment, Customer, Branch, MetalRateSnapshot } from '../../core/types';
import { formatCurrencyINR, formatWeightGrams, roundDecimals } from '../../core/math';
import { computeGirviValuation, calculateAccruedInterest } from '../../core/girviEngine';

interface GirviManagerProps {
  pledges: GirviPledge[];
  customers: Customer[];
  activeBranch: Branch;
  metalRates: MetalRateSnapshot;
  onAddPledge: (pledge: GirviPledge) => void;
  onRecordPayment: (pledgeId: string, payment: GirviPayment) => void;
  onRedeemPledge: (pledgeId: string, finalPayment?: GirviPayment) => void;
}

export const GirviManager: React.FC<GirviManagerProps> = ({
  pledges,
  customers,
  activeBranch,
  metalRates,
  onAddPledge,
  onRecordPayment,
  onRedeemPledge,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'OVERDUE' | 'REDEEMED'>('ALL');
  
  // Modals
  const [showNewPledgeModal, setShowNewPledgeModal] = useState(false);
  const [selectedPledgeForPayment, setSelectedPledgeForPayment] = useState<GirviPledge | null>(null);
  const [selectedPledgeForTicket, setSelectedPledgeForTicket] = useState<GirviPledge | null>(null);

  // New Pledge Form State
  const [customerId, setCustomerId] = useState(customers[0]?.id || '');
  const [customCustomerName, setCustomCustomerName] = useState('');
  const [customCustomerPhone, setCustomCustomerPhone] = useState('');
  const [aadhaarLast4, setAadhaarLast4] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [monthlyInterestRate, setMonthlyInterestRate] = useState(1.5);
  const [ltvPercent, setLtvPercent] = useState(70);
  const [sanctionedAmount, setSanctionedAmount] = useState<number>(0);
  const [vaultPacketId, setVaultPacketId] = useState(`PKT-SAFE-${Math.floor(100 + Math.random() * 900)}`);
  
  // New items list inside pledge
  const [pledgeItems, setPledgeItems] = useState<GirviItem[]>([
    {
      id: 'GIR-ITM-1',
      description: '22K Gold Traditional Bangles (Pair)',
      metal: 'GOLD',
      declaredPurity: '22K',
      fineness: 916,
      grossWeightGrams: 24.500,
      stoneDeductionGrams: 0.000,
      netWeightGrams: 24.500,
      fineGoldEquivalentGrams: roundDecimals(24.5 * 0.916, 3),
      valuationRatePerGram: metalRates.ratePerGram22K,
      itemValuationINR: roundDecimals(24.5 * metalRates.ratePerGram22K, 2),
    },
  ]);

  // Payment Form State
  const [paymentInterestAmount, setPaymentInterestAmount] = useState<number>(0);
  const [paymentPrincipalAmount, setPaymentPrincipalAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'UPI' | 'BANK_TRANSFER'>('UPI');
  const [paymentNarration, setPaymentNarration] = useState('');

  // Calculations for new pledge
  const valuationSummary = computeGirviValuation(pledgeItems, ltvPercent);

  // Auto-set suggested principal when valuation or LTV changes
  React.useEffect(() => {
    if (sanctionedAmount === 0 && valuationSummary.maxSanctionablePrincipalINR > 0) {
      setSanctionedAmount(Math.min(valuationSummary.maxSanctionablePrincipalINR, Math.round(valuationSummary.maxSanctionablePrincipalINR / 1000) * 1000));
    }
  }, [valuationSummary.maxSanctionablePrincipalINR]);

  const filteredPledges = pledges.filter((p) => {
    const matchesSearch = 
      p.pledgeNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.customerPhone.includes(searchQuery) ||
      p.vaultPacketId.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    if (statusFilter === 'ALL') return true;
    return p.status === statusFilter;
  });

  // Cockpit Totals
  const activePledges = pledges.filter((p) => p.status === 'ACTIVE' || p.status === 'OVERDUE');
  const totalPrincipalDisbursed = activePledges.reduce((acc, p) => acc + p.balancePrincipalINR, 0);
  const totalGoldWeightInVault = activePledges.reduce((acc, p) => acc + p.totalGrossWeightGrams, 0);
  const totalFineGoldInVault = activePledges.reduce((acc, p) => acc + p.totalFineGoldEquivalentGrams, 0);
  const monthlyInterestRunrate = activePledges.reduce((acc, p) => acc + (p.balancePrincipalINR * (p.monthlyInterestRatePercent / 100)), 0);

  const handleAddItemToPledge = () => {
    const newItem: GirviItem = {
      id: `GIR-ITM-${Date.now()}`,
      description: 'Gold Ornament',
      metal: 'GOLD',
      declaredPurity: '22K',
      fineness: 916,
      grossWeightGrams: 10.000,
      stoneDeductionGrams: 0.000,
      netWeightGrams: 10.000,
      fineGoldEquivalentGrams: roundDecimals(10.0 * 0.916, 3),
      valuationRatePerGram: metalRates.ratePerGram22K,
      itemValuationINR: roundDecimals(10.0 * metalRates.ratePerGram22K, 2),
    };
    setPledgeItems([...pledgeItems, newItem]);
  };

  const handleUpdateItem = (index: number, updates: Partial<GirviItem>) => {
    const updated = [...pledgeItems];
    const current = { ...updated[index], ...updates };
    const net = Math.max(0, current.grossWeightGrams - current.stoneDeductionGrams);
    current.netWeightGrams = roundDecimals(net, 3);
    current.fineGoldEquivalentGrams = roundDecimals(net * (current.fineness / 1000), 3);
    current.itemValuationINR = roundDecimals(net * current.valuationRatePerGram, 2);
    updated[index] = current;
    setPledgeItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    if (pledgeItems.length <= 1) return;
    setPledgeItems(pledgeItems.filter((_, i) => i !== index));
  };

  const handleCreatePledgeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const customer = customers.find((c) => c.id === customerId);
    const finalCustName = customer ? customer.name : customCustomerName.trim();
    const finalCustPhone = customer ? customer.phone : customCustomerPhone.trim();

    if (!finalCustName || !finalCustPhone) {
      alert('Please select or specify customer name and phone');
      return;
    }

    if (sanctionedAmount > valuationSummary.maxSanctionablePrincipalINR) {
      alert(`Sanctioned amount cannot exceed regulatory 75% LTV ceiling of ${formatCurrencyINR(valuationSummary.maxSanctionablePrincipalINR)}`);
      return;
    }

    const today = new Date();
    const dueDate = new Date(today);
    dueDate.setFullYear(today.getFullYear() + 1); // 12-month tenure standard

    const newPledge: GirviPledge = {
      id: `GIR-${Date.now()}`,
      pledgeNumber: `GIR-${today.getFullYear()}-${String(pledges.length + 101).padStart(4, '0')}`,
      tenantId: 'TEN-AURIC-01',
      branchId: activeBranch.id,
      customerId: customer ? customer.id : `CUST-GIR-${Date.now()}`,
      customerName: finalCustName,
      customerPhone: finalCustPhone,
      customerAadhaarLast4: aadhaarLast4 || undefined,
      customerPan: panNumber || undefined,
      customerAddress: customerAddress || (customer ? customer.address : undefined),
      items: pledgeItems,
      totalGrossWeightGrams: valuationSummary.totalGrossWeightGrams,
      totalNetWeightGrams: valuationSummary.totalNetWeightGrams,
      totalFineGoldEquivalentGrams: valuationSummary.totalFineGoldEquivalentGrams,
      totalValuationINR: valuationSummary.totalValuationINR,
      loanToValuePercent: roundDecimals((sanctionedAmount / valuationSummary.totalValuationINR) * 100, 1),
      sanctionedPrincipalINR: sanctionedAmount,
      monthlyInterestRatePercent: monthlyInterestRate,
      pledgeDate: today.toISOString(),
      dueDate: dueDate.toISOString(),
      vaultPacketId,
      status: 'ACTIVE',
      totalInterestPaidINR: 0,
      totalPrincipalPaidINR: 0,
      balancePrincipalINR: sanctionedAmount,
      payments: [],
      createdAt: today.toISOString(),
    };

    onAddPledge(newPledge);
    setShowNewPledgeModal(false);
    setSelectedPledgeForTicket(newPledge);
  };

  const handleRecordPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPledgeForPayment) return;

    const total = paymentInterestAmount + paymentPrincipalAmount;
    if (total <= 0) {
      alert('Payment amount must be greater than zero');
      return;
    }

    if (paymentPrincipalAmount > selectedPledgeForPayment.balancePrincipalINR) {
      alert(`Principal payment cannot exceed outstanding balance of ${formatCurrencyINR(selectedPledgeForPayment.balancePrincipalINR)}`);
      return;
    }

    const payment: GirviPayment = {
      id: `GPAY-${Date.now()}`,
      pledgeId: selectedPledgeForPayment.id,
      receiptNumber: `GIR-RCT-${Math.floor(1000 + Math.random() * 9000)}`,
      paymentDate: new Date().toISOString(),
      interestAmount: paymentInterestAmount,
      principalAmount: paymentPrincipalAmount,
      totalAmount: total,
      paymentMode,
      collectedBy: 'Authorized Girvi Officer',
      narration: paymentNarration || (paymentPrincipalAmount > 0 ? `Principal ₹${paymentPrincipalAmount} + Interest ₹${paymentInterestAmount}` : `Interest ₹${paymentInterestAmount}`),
    };

    onRecordPayment(selectedPledgeForPayment.id, payment);

    // If principal is fully paid, prompt to redeem
    if (selectedPledgeForPayment.balancePrincipalINR - paymentPrincipalAmount <= 0) {
      onRedeemPledge(selectedPledgeForPayment.id, payment);
    }

    setSelectedPledgeForPayment(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Cockpit */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-xl shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Landmark className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
              Girvi & Gold Loan Desk
            </h1>
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Indian pawn lending terminal: RBI 75% LTV compliance, simple monthly interest accruals, segregated custody vaulting, and double-entry general ledger.
          </p>
        </div>

        <button
          onClick={() => setShowNewPledgeModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium shadow-sm transition-colors text-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Gold Pledge (गिरवी)</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 rounded-xl shadow-xs">
          <div className="text-xs font-semibold tracking-wider uppercase text-neutral-500 dark:text-neutral-400 mb-1">
            Active Loan Book (Principal)
          </div>
          <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">
            {formatCurrencyINR(totalPrincipalDisbursed)}
          </div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 flex items-center gap-1">
            <Coins className="w-3.5 h-3.5 text-amber-500" />
            <span>Across {activePledges.length} active pledge contracts</span>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 rounded-xl shadow-xs">
          <div className="text-xs font-semibold tracking-wider uppercase text-neutral-500 dark:text-neutral-400 mb-1">
            Gold in Custody Vault
          </div>
          <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">
            {formatWeightGrams(totalGoldWeightInVault)}
          </div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 flex items-center gap-1">
            <Lock className="w-3.5 h-3.5 text-blue-500" />
            <span>Fine Equiv: <strong className="font-mono text-neutral-700 dark:text-neutral-300">{formatWeightGrams(totalFineGoldInVault)}</strong></span>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 rounded-xl shadow-xs">
          <div className="text-xs font-semibold tracking-wider uppercase text-neutral-500 dark:text-neutral-400 mb-1">
            Monthly Interest Yield
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
            {formatCurrencyINR(monthlyInterestRunrate)}
          </div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Average interest: 1.5% - 2.0% per month
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 rounded-xl shadow-xs">
          <div className="text-xs font-semibold tracking-wider uppercase text-neutral-500 dark:text-neutral-400 mb-1">
            Vault Bailment Invariant
          </div>
          <div className="text-base font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mt-1">
            <ShieldCheck className="w-5 h-5 shrink-0" />
            <span>100% Non-Merchant Stock</span>
          </div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Pledged ornaments segregated from showroom sales
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-3 rounded-xl shadow-xs">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search by Pledge #, Customer, Phone, Vault Packet..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          {(['ALL', 'ACTIVE', 'OVERDUE', 'REDEEMED'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                statusFilter === status
                  ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Pledges Table */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 dark:bg-neutral-800/60 border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 font-medium text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Pledge # & Date</th>
                <th className="px-4 py-3">Customer Details</th>
                <th className="px-4 py-3">Vault Packet</th>
                <th className="px-4 py-3">Pledged Ornaments</th>
                <th className="px-4 py-3 text-right">Valuation</th>
                <th className="px-4 py-3 text-right">Principal Disbursed</th>
                <th className="px-4 py-3 text-right">Balance Due</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {filteredPledges.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-neutral-500 dark:text-neutral-400">
                    No Girvi pledge records found.
                  </td>
                </tr>
              ) : (
                filteredPledges.map((p) => {
                  const accruedInterest = calculateAccruedInterest(
                    p.balancePrincipalINR,
                    p.monthlyInterestRatePercent,
                    Math.max(1, Math.floor((Date.now() - new Date(p.pledgeDate).getTime()) / (1000 * 60 * 60 * 24)))
                  );

                  return (
                    <tr key={p.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-neutral-900 dark:text-neutral-100 font-mono">
                          {p.pledgeNumber}
                        </div>
                        <div className="text-xs text-neutral-500 dark:text-neutral-400">
                          {new Date(p.pledgeDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-neutral-900 dark:text-neutral-100">
                          {p.customerName}
                        </div>
                        <div className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">
                          {p.customerPhone}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-mono font-medium border border-neutral-200 dark:border-neutral-700">
                          <Lock className="w-3 h-3 text-amber-500" />
                          {p.vaultPacketId}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-neutral-800 dark:text-neutral-200">
                          {p.items.length} item{p.items.length > 1 ? 's' : ''} ({formatWeightGrams(p.totalGrossWeightGrams)})
                        </div>
                        <div className="text-xs text-neutral-500 dark:text-neutral-400">
                          Fine Gold: <strong className="font-mono">{formatWeightGrams(p.totalFineGoldEquivalentGrams)}</strong>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="font-semibold text-neutral-900 dark:text-neutral-100 tabular-nums">
                          {formatCurrencyINR(p.totalValuationINR)}
                        </div>
                        <div className="text-xs text-neutral-500 dark:text-neutral-400">
                          LTV: {p.loanToValuePercent}%
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="font-semibold text-neutral-900 dark:text-neutral-100 tabular-nums">
                          {formatCurrencyINR(p.sanctionedPrincipalINR)}
                        </div>
                        <div className="text-xs text-neutral-500 dark:text-neutral-400">
                          @{p.monthlyInterestRatePercent}% / mo
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                          {formatCurrencyINR(p.balancePrincipalINR)}
                        </div>
                        {p.status === 'ACTIVE' && (
                          <div className="text-xs text-neutral-500 dark:text-neutral-400">
                            + Int ~{formatCurrencyINR(accruedInterest)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 text-xs font-medium rounded-full ${
                            p.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400'
                              : p.status === 'OVERDUE'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400'
                              : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                          onClick={() => setSelectedPledgeForTicket(p)}
                          title="Print Pawn Ticket / Girvi Receipt"
                          aria-label={`Print pawn ticket for ${p.pledgeNumber}`}
                          className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        {p.status === 'ACTIVE' && (
                          <button
                            onClick={() => {
                              setSelectedPledgeForPayment(p);
                              const interest = calculateAccruedInterest(
                                p.balancePrincipalINR,
                                p.monthlyInterestRatePercent,
                                30 // default 1 month
                              );
                              setPaymentInterestAmount(interest);
                              setPaymentPrincipalAmount(0);
                            }}
                            className="px-2.5 py-1 text-xs font-medium rounded-md bg-amber-600 hover:bg-amber-700 text-white transition-colors"
                          >
                            Pay / Redeem
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Pledge Modal */}
      {showNewPledgeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Landmark className="w-5 h-5" />
                </span>
                <div>
                  <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                    New Girvi Gold Pledge Intake (गिरवी बंधक)
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Pawn collateral agreement, assay valuation, and vault bailment tagging
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowNewPledgeModal(false)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreatePledgeSubmit} className="p-5 overflow-y-auto space-y-5">
              {/* Customer Information */}
              <div className="bg-neutral-50 dark:bg-neutral-800/40 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700/60 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                  Pledger / Customer Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                      Select Customer
                    </label>
                    <select
                      value={customerId}
                      onChange={(e) => {
                        setCustomerId(e.target.value);
                        const c = customers.find((cust) => cust.id === e.target.value);
                        if (c) {
                          setCustomCustomerName(c.name);
                          setCustomCustomerPhone(c.phone);
                          setCustomerAddress(c.address);
                        }
                      }}
                      className="w-full text-xs px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
                    >
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.phone})
                        </option>
                      ))}
                      <option value="NEW">+ Walk-in New Pledger</option>
                    </select>
                  </div>

                  {customerId === 'NEW' && (
                    <>
                      <div>
                        <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={customCustomerName}
                          onChange={(e) => setCustomCustomerName(e.target.value)}
                          placeholder="e.g. Rameshwar Agarwal"
                          className="w-full text-xs px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                          Mobile Number *
                        </label>
                        <input
                          type="text"
                          required
                          value={customCustomerPhone}
                          onChange={(e) => setCustomCustomerPhone(e.target.value)}
                          placeholder="+91 98200..."
                          className="w-full text-xs px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                      Aadhaar (Last 4 Digits)
                    </label>
                    <input
                      type="text"
                      maxLength={4}
                      value={aadhaarLast4}
                      onChange={(e) => setAadhaarLast4(e.target.value)}
                      placeholder="e.g. 5412"
                      className="w-full text-xs px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                      PAN Card Number (Required if &ge; ₹2L)
                    </label>
                    <input
                      type="text"
                      value={panNumber}
                      onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                      placeholder="e.g. ABCDE1234F"
                      className="w-full text-xs px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 font-mono uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                      Vault Packet Seal ID
                    </label>
                    <input
                      type="text"
                      value={vaultPacketId}
                      onChange={(e) => setVaultPacketId(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Pledged Ornaments Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                    Pledged Ornaments & Weighing Scale Entry
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddItemToPledge}
                    className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Another Ornament
                  </button>
                </div>

                <div className="space-y-2">
                  {pledgeItems.map((item, idx) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center"
                    >
                      <div className="md:col-span-4">
                        <label className="block text-[10px] text-neutral-400 uppercase font-semibold">Ornament Description</label>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleUpdateItem(idx, { description: e.target.value })}
                          className="w-full text-xs px-2 py-1 rounded-sm border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-[10px] text-neutral-400 uppercase font-semibold">Gross Weight (g)</label>
                        <input
                          type="number"
                          step="0.001"
                          min="0.1"
                          value={item.grossWeightGrams}
                          onChange={(e) => handleUpdateItem(idx, { grossWeightGrams: parseFloat(e.target.value) || 0 })}
                          className="w-full text-xs px-2 py-1 rounded-sm border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 font-mono tabular-nums"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-[10px] text-neutral-400 uppercase font-semibold">Stone/Enamel (g)</label>
                        <input
                          type="number"
                          step="0.001"
                          min="0"
                          value={item.stoneDeductionGrams}
                          onChange={(e) => handleUpdateItem(idx, { stoneDeductionGrams: parseFloat(e.target.value) || 0 })}
                          className="w-full text-xs px-2 py-1 rounded-sm border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 font-mono tabular-nums"
                        />
                      </div>

                      <div className="md:col-span-3">
                        <label className="block text-[10px] text-neutral-400 uppercase font-semibold">Purity & Valuation</label>
                        <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 tabular-nums">
                          {formatCurrencyINR(item.itemValuationINR)}
                        </div>
                        <div className="text-[10px] text-neutral-400 font-mono">
                          Net: {formatWeightGrams(item.netWeightGrams)} @ ₹{item.valuationRatePerGram}/g
                        </div>
                      </div>

                      <div className="md:col-span-1 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          disabled={pledgeItems.length <= 1}
                          className="p-1 text-neutral-400 hover:text-rose-500 disabled:opacity-30"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Valuation & Loan Sanction Terms */}
              <div className="bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400 block">Total Gross Weight</span>
                    <strong className="font-mono text-neutral-900 dark:text-neutral-100">{formatWeightGrams(valuationSummary.totalGrossWeightGrams)}</strong>
                  </div>
                  <div>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400 block">Total Net Weight</span>
                    <strong className="font-mono text-neutral-900 dark:text-neutral-100">{formatWeightGrams(valuationSummary.totalNetWeightGrams)}</strong>
                  </div>
                  <div>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400 block">Fine 24K Equiv</span>
                    <strong className="font-mono text-neutral-900 dark:text-neutral-100">{formatWeightGrams(valuationSummary.totalFineGoldEquivalentGrams)}</strong>
                  </div>
                  <div>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400 block">Market Valuation</span>
                    <strong className="font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">{formatCurrencyINR(valuationSummary.totalValuationINR)}</strong>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-amber-500/20">
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      Loan to Value (LTV %): <strong>{ltvPercent}%</strong>
                    </label>
                    <input
                      type="range"
                      min="50"
                      max="75"
                      step="1"
                      value={ltvPercent}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setLtvPercent(val);
                        const newMax = roundDecimals((valuationSummary.totalValuationINR * val) / 100, 2);
                        setSanctionedAmount(newMax);
                      }}
                      className="w-full accent-amber-600"
                    />
                    <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
                      RBI Regulatory Limit: Max 75% LTV
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      Sanctioned Loan Principal (₹) *
                    </label>
                    <input
                      type="number"
                      max={valuationSummary.maxSanctionablePrincipalINR}
                      value={sanctionedAmount}
                      onChange={(e) => setSanctionedAmount(parseFloat(e.target.value) || 0)}
                      className="w-full text-sm px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 font-bold tabular-nums"
                    />
                    <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
                      Max Allowed: {formatCurrencyINR(valuationSummary.maxSanctionablePrincipalINR)}
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      Monthly Interest Rate (% per month)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={monthlyInterestRate}
                      onChange={(e) => setMonthlyInterestRate(parseFloat(e.target.value) || 0)}
                      className="w-full text-sm px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 font-mono"
                    />
                    <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
                      Annualized: {(monthlyInterestRate * 12).toFixed(1)}% p.a.
                    </span>
                  </div>
                </div>
              </div>

              {/* Legal Notice */}
              <div className="flex items-start gap-2 text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800/80 p-3 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Legal Custody Notice:</strong> The ornaments listed above are accepted under Bailment (Section 148 of Indian Contract Act). Showroom will not merge these articles into saleable stock. Disbursal of loan triggers immediate double-entry posting to General Journal.
                </span>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowNewPledgeModal(false)}
                  className="px-4 py-2 text-xs font-medium rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs shadow-sm transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Sanction Loan & Seal Vault Packet</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay / Redeem Modal */}
      {selectedPledgeForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-800">
              <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-500" />
                Girvi Servicing Payment & Redemption
              </h2>
              <button onClick={() => setSelectedPledgeForPayment(null)} className="p-1 text-neutral-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPaymentSubmit} className="p-5 space-y-4">
              <div className="bg-neutral-50 dark:bg-neutral-800/40 p-3 rounded-lg text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Pledge Number:</span>
                  <span className="font-mono font-semibold text-neutral-800 dark:text-neutral-200">{selectedPledgeForPayment.pledgeNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Pledger Name:</span>
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200">{selectedPledgeForPayment.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Outstanding Principal:</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">{formatCurrencyINR(selectedPledgeForPayment.balancePrincipalINR)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Vault Location:</span>
                  <span className="font-mono text-neutral-700 dark:text-neutral-300">{selectedPledgeForPayment.vaultPacketId}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Interest Payment (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={paymentInterestAmount}
                    onChange={(e) => setPaymentInterestAmount(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 font-mono tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Principal Repayment (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={selectedPledgeForPayment.balancePrincipalINR}
                    value={paymentPrincipalAmount}
                    onChange={(e) => setPaymentPrincipalAmount(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 font-mono tabular-nums"
                  />
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-neutral-400">Full redemption requires full principal</span>
                    <button
                      type="button"
                      onClick={() => setPaymentPrincipalAmount(selectedPledgeForPayment.balancePrincipalINR)}
                      className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold hover:underline"
                    >
                      Fill Full Principal (₹{selectedPledgeForPayment.balancePrincipalINR})
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Payment Mode
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['UPI', 'CASH', 'BANK_TRANSFER'] as const).map((mode) => (
                      <button
                        type="button"
                        key={mode}
                        onClick={() => setPaymentMode(mode)}
                        className={`py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                          paymentMode === mode
                            ? 'border-amber-600 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400'
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-lg flex items-center justify-between text-sm">
                  <span className="font-semibold text-neutral-700 dark:text-neutral-300">Total Payment:</span>
                  <strong className="text-base text-neutral-900 dark:text-neutral-100 font-mono">
                    {formatCurrencyINR(paymentInterestAmount + paymentPrincipalAmount)}
                  </strong>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setSelectedPledgeForPayment(null)}
                  className="px-4 py-2 text-xs font-medium rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
                >
                  {paymentPrincipalAmount >= selectedPledgeForPayment.balancePrincipalINR ? 'Complete Full Redemption' : 'Post Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pawn Ticket / Girvi Bilti Print Modal */}
      {selectedPledgeForTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-auto">
            <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-850">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-amber-500" />
                <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                  Official Girvi Pawn Receipt (गिरवी पावती)
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:opacity-90"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Receipt
                </button>
                <button onClick={() => setSelectedPledgeForTicket(null)} className="p-1 text-neutral-400">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Formal Indian Pawn Ticket Printable Card */}
            <div className="p-6 space-y-4 text-neutral-900 dark:text-neutral-100 font-sans text-xs bg-white dark:bg-neutral-900">
              <div className="text-center border-b pb-3 border-neutral-200 dark:border-neutral-800">
                <h3 className="text-base font-black tracking-wide uppercase">{activeBranch.name}</h3>
                <p className="text-[11px] text-neutral-500">{activeBranch.address}, {activeBranch.city} • GSTIN: {activeBranch.gstin}</p>
                <p className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-widest mt-1">
                  Licensed Pawn Broker & Money Lender Collateral Receipt
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 border-b pb-3 border-neutral-200 dark:border-neutral-800">
                <div>
                  <span className="text-neutral-500 text-[10px] uppercase font-bold block">Pledge Certificate No:</span>
                  <span className="font-mono font-bold text-sm">{selectedPledgeForTicket.pledgeNumber}</span>
                  <div className="text-neutral-500 text-[10px] mt-1">Date: {new Date(selectedPledgeForTicket.pledgeDate).toLocaleDateString('en-IN')}</div>
                  <div className="text-neutral-500 text-[10px]">Due Date: {new Date(selectedPledgeForTicket.dueDate).toLocaleDateString('en-IN')}</div>
                </div>
                <div>
                  <span className="text-neutral-500 text-[10px] uppercase font-bold block">Pledger / Borrower:</span>
                  <span className="font-bold text-sm">{selectedPledgeForTicket.customerName}</span>
                  <div className="text-neutral-500 text-[10px] mt-1">Phone: {selectedPledgeForTicket.customerPhone}</div>
                  {selectedPledgeForTicket.customerAadhaarLast4 && (
                    <div className="text-neutral-500 text-[10px]">Aadhaar Last 4: XXXX-XXXX-{selectedPledgeForTicket.customerAadhaarLast4}</div>
                  )}
                  {selectedPledgeForTicket.customerPan && (
                    <div className="text-neutral-500 text-[10px]">PAN: {selectedPledgeForTicket.customerPan}</div>
                  )}
                </div>
              </div>

              {/* Items breakdown */}
              <div>
                <table className="w-full text-left text-xs border border-neutral-200 dark:border-neutral-800">
                  <thead className="bg-neutral-100 dark:bg-neutral-800 text-[10px] uppercase font-bold">
                    <tr>
                      <th className="p-2">Ornament Description</th>
                      <th className="p-2 text-right">Gross Wt</th>
                      <th className="p-2 text-right">Net Wt</th>
                      <th className="p-2 text-right">Fineness</th>
                      <th className="p-2 text-right">Valuation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 font-mono text-[11px]">
                    {selectedPledgeForTicket.items.map((item) => (
                      <tr key={item.id}>
                        <td className="p-2 font-sans">{item.description}</td>
                        <td className="p-2 text-right">{formatWeightGrams(item.grossWeightGrams)}</td>
                        <td className="p-2 text-right">{formatWeightGrams(item.netWeightGrams)}</td>
                        <td className="p-2 text-right">{item.declaredPurity} ({item.fineness})</td>
                        <td className="p-2 text-right">{formatCurrencyINR(item.itemValuationINR)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-neutral-50 dark:bg-neutral-800/60 font-semibold border-t border-neutral-200 dark:border-neutral-800">
                    <tr>
                      <td className="p-2 font-bold font-sans">Total Collateral Custody:</td>
                      <td className="p-2 text-right font-mono">{formatWeightGrams(selectedPledgeForTicket.totalGrossWeightGrams)}</td>
                      <td className="p-2 text-right font-mono">{formatWeightGrams(selectedPledgeForTicket.totalNetWeightGrams)}</td>
                      <td className="p-2 text-right font-mono">Fine: {formatWeightGrams(selectedPledgeForTicket.totalFineGoldEquivalentGrams)}</td>
                      <td className="p-2 text-right font-mono">{formatCurrencyINR(selectedPledgeForTicket.totalValuationINR)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Financial terms */}
              <div className="grid grid-cols-3 gap-2 bg-neutral-50 dark:bg-neutral-800/40 p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 font-mono text-xs">
                <div>
                  <span className="text-[10px] text-neutral-500 block">Sanctioned Loan</span>
                  <strong className="text-sm font-bold text-neutral-900 dark:text-neutral-100">{formatCurrencyINR(selectedPledgeForTicket.sanctionedPrincipalINR)}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500 block">Interest Rate</span>
                  <strong className="text-sm font-bold text-neutral-900 dark:text-neutral-100">{selectedPledgeForTicket.monthlyInterestRatePercent}% / mo</strong>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500 block">Vault Packet Seal</span>
                  <strong className="text-sm font-bold text-amber-600">{selectedPledgeForTicket.vaultPacketId}</strong>
                </div>
              </div>

              {/* Legal Terms & Signatures */}
              <div className="pt-2 text-[9px] text-neutral-500 leading-relaxed border-t border-neutral-200 dark:border-neutral-800">
                <p>1. The pledged articles are held under safe custody bailment. 2. Interest is calculated on monthly reducing or simple monthly basis as agreed. 3. Loan must be renewed or settled before 12 months. 4. Redemptions strictly require physical return of this original certificate and photo identification.</p>
              </div>

              <div className="grid grid-cols-2 gap-8 pt-8">
                <div className="text-center border-t border-dashed border-neutral-400 pt-1 text-[10px]">
                  Borrower / Pledger Signature
                </div>
                <div className="text-center border-t border-dashed border-neutral-400 pt-1 text-[10px]">
                  For {activeBranch.name} (Authorized Signatory)
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
