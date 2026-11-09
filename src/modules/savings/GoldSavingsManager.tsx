import React, { useState } from 'react';
import { 
  PiggyBank, 
  Plus, 
  Search, 
  Sparkles, 
  CheckCircle2, 
  Calendar, 
  CreditCard, 
  Receipt, 
  Award, 
  Scale, 
  Gift, 
  Clock, 
  X,
  ExternalLink
} from 'lucide-react';
import { GoldChitScheme, ChitInstallment, Customer, Branch, MetalRateSnapshot } from '../../core/types';
import { formatCurrencyINR, formatWeightGrams, roundDecimals } from '../../core/math';
import { generateChitInstallments, recordInstallmentPayment } from '../../core/savingsEngine';

interface GoldSavingsManagerProps {
  schemes: GoldChitScheme[];
  customers: Customer[];
  activeBranch: Branch;
  metalRates: MetalRateSnapshot;
  onAddScheme: (scheme: GoldChitScheme) => void;
  onPayInstallment: (schemeId: string, installmentNumber: number, paymentMode: 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER') => void;
  onRedeemSchemeAtPos?: (scheme: GoldChitScheme) => void;
}

export const GoldSavingsManager: React.FC<GoldSavingsManagerProps> = ({
  schemes,
  customers,
  activeBranch,
  metalRates,
  onAddScheme,
  onPayInstallment,
  onRedeemSchemeAtPos,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'MATURED' | 'REDEEMED_AT_POS'>('ALL');
  
  // Modals
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [selectedSchemeForPassbook, setSelectedSchemeForPassbook] = useState<GoldChitScheme | null>(null);
  const [selectedSchemeForPayment, setSelectedSchemeForPayment] = useState<{ scheme: GoldChitScheme; installment: ChitInstallment } | null>(null);
  const [selectedSchemeForVoucher, setSelectedSchemeForVoucher] = useState<GoldChitScheme | null>(null);

  // Enrollment Form State
  const [customerId, setCustomerId] = useState(customers[0]?.id || '');
  const [customName, setCustomName] = useState('');
  const [customPhone, setCustomPhone] = useState('');
  const [schemeType, setSchemeType] = useState<'VALUE_BASED' | 'WEIGHT_BASED'>('VALUE_BASED');
  const [monthlyAmount, setMonthlyAmount] = useState<number>(5000);
  const [paymentModeForEnrollment, setPaymentModeForEnrollment] = useState<'UPI' | 'CASH' | 'CARD'>('UPI');

  // Filtered schemes
  const filteredSchemes = schemes.filter((s) => {
    const matchesSearch =
      s.schemeNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.customerPhone.includes(searchQuery);

    if (!matchesSearch) return false;
    if (filterStatus === 'ALL') return true;
    return s.status === filterStatus;
  });

  // Cockpit Metrics
  const activeSchemes = schemes.filter((s) => s.status === 'ACTIVE');
  const maturedSchemes = schemes.filter((s) => s.status === 'MATURED');
  const totalMonthlyRunRate = activeSchemes.reduce((acc, s) => acc + s.monthlyInstallmentINR, 0);
  const totalAccumulatedWeight = schemes.reduce((acc, s) => acc + s.accumulatedGoldWeightGrams, 0);
  const totalMaturedValueReady = maturedSchemes.reduce((acc, s) => acc + s.totalMaturityValueINR, 0);

  const handleEnrollSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const customer = customers.find((c) => c.id === customerId);
    const finalName = customer ? customer.name : customName.trim();
    const finalPhone = customer ? customer.phone : customPhone.trim();

    if (!finalName || !finalPhone) {
      alert('Please provide customer name and phone');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const installments = generateChitInstallments(monthlyAmount, todayStr, 11);

    // Calculate maturity date: 12 months from today
    const maturity = new Date();
    maturity.setMonth(maturity.getMonth() + 12);

    const newScheme: GoldChitScheme = {
      id: `SCH-${Date.now()}`,
      schemeNumber: `SCH-SWARNA-${new Date().getFullYear()}-${String(schemes.length + 101).padStart(3, '0')}`,
      schemeName: schemeType === 'VALUE_BASED' ? 'Swarna Nidhi 11+1 Gold Wealth Plan' : 'Swarna Varsha Pure Weight Accumulator',
      tenantId: 'TEN-AURIC-01',
      branchId: activeBranch.id,
      customerId: customer ? customer.id : `CUST-SCH-${Date.now()}`,
      customerName: finalName,
      customerPhone: finalPhone,
      schemeType,
      monthlyInstallmentINR: monthlyAmount,
      totalTenureMonths: 11,
      monthsPaid: 0,
      totalAmountPaidINR: 0,
      bonusAmountContributedINR: 0,
      totalMaturityValueINR: 0,
      accumulatedGoldWeightGrams: 0,
      startDate: todayStr,
      maturityDate: maturity.toISOString().split('T')[0],
      status: 'ACTIVE',
      installments,
      createdAt: new Date().toISOString(),
    };

    onAddScheme(newScheme);
    setShowEnrollModal(false);
  };

  const handleConfirmInstallmentPayment = (mode: 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER') => {
    if (!selectedSchemeForPayment) return;
    onPayInstallment(selectedSchemeForPayment.scheme.id, selectedSchemeForPayment.installment.installmentNumber, mode);
    setSelectedSchemeForPayment(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 rounded-xl shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <PiggyBank className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
              Swarna Nidhi (स्वर्ण निधि) Gold Savings Schemes
            </h1>
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Indian 11+1 Jewellery Savings & Gold Chit Plans: 11 customer monthly deposits + 12th month showroom bonus, daily rate lock, and POS maturity redemption vouchers.
          </p>
        </div>

        <button
          onClick={() => setShowEnrollModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium shadow-sm transition-colors text-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Enroll New Member (नया खाता)</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 rounded-xl shadow-xs">
          <div className="text-xs font-semibold tracking-wider uppercase text-neutral-500 dark:text-neutral-400 mb-1">
            Active Chit Members
          </div>
          <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">
            {activeSchemes.length} Members
          </div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Monthly Runrate: <strong className="text-neutral-800 dark:text-neutral-200 font-mono">{formatCurrencyINR(totalMonthlyRunRate)}</strong>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 rounded-xl shadow-xs">
          <div className="text-xs font-semibold tracking-wider uppercase text-neutral-500 dark:text-neutral-400 mb-1">
            Accumulated Gold Weight
          </div>
          <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">
            {formatWeightGrams(totalAccumulatedWeight)}
          </div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 flex items-center gap-1">
            <Scale className="w-3.5 h-3.5 text-amber-500" />
            <span>Locked in @ 22K 916 daily spot rates</span>
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 rounded-xl shadow-xs">
          <div className="text-xs font-semibold tracking-wider uppercase text-neutral-500 dark:text-neutral-400 mb-1">
            Matured (Ready to Redeem)
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
            {formatCurrencyINR(totalMaturedValueReady)}
          </div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            {maturedSchemes.length} accounts ready for POS purchase
          </div>
        </div>

        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-4 rounded-xl shadow-xs">
          <div className="text-xs font-semibold tracking-wider uppercase text-neutral-500 dark:text-neutral-400 mb-1">
            11 + 1 Showroom Loyalty
          </div>
          <div className="text-base font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5 mt-1">
            <Gift className="w-5 h-5 shrink-0 text-amber-500" />
            <span>12th Month 100% Free</span>
          </div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Jeweler adds 1 installment on maturity
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-3 rounded-xl shadow-xs">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search Scheme #, Customer Name, Phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          {(['ALL', 'ACTIVE', 'MATURED', 'REDEEMED_AT_POS'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                filterStatus === status
                  ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
              }`}
            >
              {status === 'REDEEMED_AT_POS' ? 'REDEEMED' : status}
            </button>
          ))}
        </div>
      </div>

      {/* Schemes Grid / Table */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">

            <thead className="bg-neutral-50 dark:bg-neutral-800/60 border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 font-medium text-xs uppercase tracking-wider">
              <tr>
                <th className="px-3.5 py-3">Scheme & Customer</th>
                <th className="px-3 py-3">Type</th>
                <th className="px-3 py-3">Monthly Deposit</th>
                <th className="px-3 py-3">Tenure Progress</th>
                <th className="px-3 py-3 text-right">Deposited & Bonus</th>
                <th className="px-3 py-3 text-right">Maturity Value</th>
                <th className="px-3 py-3 text-center">Status</th>
                <th className="px-3.5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {filteredSchemes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-neutral-500 dark:text-neutral-400">
                    No gold chit scheme records found.
                  </td>
                </tr>
              ) : (
                filteredSchemes.map((scheme) => {
                  const percentComplete = Math.round((scheme.monthsPaid / scheme.totalTenureMonths) * 100);
                  const nextDueInst = scheme.installments.find((i) => i.status === 'DUE');

                  return (
                    <tr key={scheme.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors">
                      <td className="px-3.5 py-3">
                        <div className="font-semibold text-neutral-900 dark:text-neutral-100 font-mono">
                          {scheme.schemeNumber}
                        </div>
                        <div className="font-medium text-neutral-800 dark:text-neutral-200">
                          {scheme.customerName}
                        </div>
                        <div className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">
                          {scheme.customerPhone}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-sm text-[11px] font-semibold ${
                          scheme.schemeType === 'WEIGHT_BASED'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                        }`}>
                          {scheme.schemeType === 'WEIGHT_BASED' ? 'Weight Lock' : 'Value Based'}
                        </span>
                        {scheme.schemeType === 'WEIGHT_BASED' && scheme.accumulatedGoldWeightGrams > 0 && (
                          <div className="text-xs font-mono text-neutral-700 dark:text-neutral-300 mt-0.5">
                            {formatWeightGrams(scheme.accumulatedGoldWeightGrams)}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <div className="font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">
                          {formatCurrencyINR(scheme.monthlyInstallmentINR)}
                        </div>
                        <div className="text-xs text-neutral-500 dark:text-neutral-400">
                          Due 5th of month
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 w-20 bg-neutral-200 dark:bg-neutral-700 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${scheme.status === 'MATURED' ? 'bg-emerald-500' : 'bg-amber-500'}`}
                              style={{ width: `${Math.min(100, percentComplete)}%` }}
                            />
                          </div>
                          <span className="text-xs font-mono font-semibold text-neutral-700 dark:text-neutral-300">
                            {scheme.monthsPaid}/{scheme.totalTenureMonths}m
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <div className="font-semibold text-neutral-900 dark:text-neutral-100 tabular-nums">
                          {formatCurrencyINR(scheme.totalAmountPaidINR)}
                        </div>
                        <div className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 tabular-nums">
                          +{formatCurrencyINR(scheme.bonusAmountContributedINR)} Bonus
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <div className="font-bold text-neutral-900 dark:text-neutral-100 tabular-nums text-sm">
                          {formatCurrencyINR(scheme.totalMaturityValueINR || scheme.totalAmountPaidINR)}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className={`inline-block px-2.5 py-0.5 text-xs font-medium rounded-full ${
                          scheme.status === 'MATURED'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 font-semibold'
                            : scheme.status === 'REDEEMED_AT_POS'
                            ? 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400'
                        }`}>
                          {scheme.status}
                        </span>
                      </td>
                      <td className="px-3.5 py-3 text-right space-x-1.5 whitespace-nowrap">


                        <button
                          onClick={() => setSelectedSchemeForPassbook(scheme)}
                          className="px-2.5 py-1 text-xs font-medium rounded-md border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                        >
                          Passbook
                        </button>

                        {scheme.status === 'ACTIVE' && nextDueInst && (
                          <button
                            onClick={() => setSelectedSchemeForPayment({ scheme, installment: nextDueInst })}
                            className="px-2.5 py-1 text-xs font-medium rounded-md bg-amber-600 hover:bg-amber-700 text-white transition-colors"
                          >
                            Pay M#{nextDueInst.installmentNumber}
                          </button>
                        )}

                        {scheme.status === 'MATURED' && (
                          <button
                            onClick={() => setSelectedSchemeForVoucher(scheme)}
                            className="px-2.5 py-1 text-xs font-semibold rounded-md bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                          >
                            Redeem Voucher
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

      {/* Passbook Modal */}
      {selectedSchemeForPassbook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-auto">
            <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-850">
              <div>
                <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                  <PiggyBank className="w-5 h-5 text-amber-500" />
                  Swarna Nidhi Passbook (खाता विवरणी)
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {selectedSchemeForPassbook.schemeNumber} • {selectedSchemeForPassbook.customerName} ({selectedSchemeForPassbook.customerPhone})
                </p>
              </div>
              <button onClick={() => setSelectedSchemeForPassbook(null)} className="p-1 text-neutral-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-3 gap-3 bg-neutral-50 dark:bg-neutral-800/40 p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs">
                <div>
                  <span className="text-neutral-500 block">Total Deposited</span>
                  <strong className="text-base font-bold text-neutral-900 dark:text-neutral-100 tabular-nums">
                    {formatCurrencyINR(selectedSchemeForPassbook.totalAmountPaidINR)}
                  </strong>
                </div>
                <div>
                  <span className="text-neutral-500 block">Jeweler 12th Month Bonus</span>
                  <strong className="text-base font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    +{formatCurrencyINR(selectedSchemeForPassbook.bonusAmountContributedINR)}
                  </strong>
                </div>
                <div>
                  <span className="text-neutral-500 block">Total Maturity Value</span>
                  <strong className="text-base font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                    {formatCurrencyINR(selectedSchemeForPassbook.totalMaturityValueINR)}
                  </strong>
                </div>
              </div>

              {/* Installments Table */}
              <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-100 dark:bg-neutral-800 text-neutral-500 uppercase font-semibold">
                    <tr>
                      <th className="p-2.5">Month</th>
                      <th className="p-2.5">Due Date</th>
                      <th className="p-2.5 text-right">Amount</th>
                      <th className="p-2.5">Payment Date & Receipt</th>
                      {selectedSchemeForPassbook.schemeType === 'WEIGHT_BASED' && (
                        <th className="p-2.5 text-right">Gold Grams</th>
                      )}
                      <th className="p-2.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                    {selectedSchemeForPassbook.installments.map((inst) => (
                      <tr key={inst.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                        <td className="p-2.5 font-bold font-mono">Month {inst.installmentNumber}</td>
                        <td className="p-2.5 text-neutral-500">{inst.dueDate}</td>
                        <td className="p-2.5 text-right font-mono font-semibold">{formatCurrencyINR(inst.amount)}</td>
                        <td className="p-2.5">
                          {inst.paidDate ? (
                            <div>
                              <span className="text-neutral-800 dark:text-neutral-200">{inst.paidDate} ({inst.paymentMode})</span>
                              <div className="text-[10px] text-neutral-400 font-mono">{inst.receiptNumber}</div>
                            </div>
                          ) : (
                            <span className="text-neutral-400 italic">— Pending —</span>
                          )}
                        </td>
                        {selectedSchemeForPassbook.schemeType === 'WEIGHT_BASED' && (
                          <td className="p-2.5 text-right font-mono">
                            {inst.allocatedGoldWeightGrams ? formatWeightGrams(inst.allocatedGoldWeightGrams) : '—'}
                          </td>
                        )}
                        <td className="p-2.5 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            inst.status === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400'
                              : inst.status === 'DUE'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400'
                              : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'
                          }`}>
                            {inst.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {/* Month 12 Bonus Row */}
                    <tr className="bg-amber-500/10 dark:bg-amber-500/15 font-semibold">
                      <td className="p-2.5 text-amber-700 dark:text-amber-400 font-bold">Month 12 (Bonus)</td>
                      <td className="p-2.5 text-amber-700 dark:text-amber-400">{selectedSchemeForPassbook.maturityDate}</td>
                      <td className="p-2.5 text-right font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                        +{formatCurrencyINR(selectedSchemeForPassbook.monthlyInstallmentINR)}
                      </td>
                      <td className="p-2.5 text-amber-700 dark:text-amber-400" colSpan={selectedSchemeForPassbook.schemeType === 'WEIGHT_BASED' ? 2 : 1}>
                        Showroom Contribution (100% Free Gift)
                      </td>
                      <td className="p-2.5 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 font-bold">
                          BONUS
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pay Installment Quick Modal */}
      {selectedSchemeForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-neutral-200 dark:border-neutral-800">
              <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-amber-500" />
                Pay Installment #{selectedSchemeForPayment.installment.installmentNumber}
              </h2>
              <button onClick={() => setSelectedSchemeForPayment(null)} className="p-1 text-neutral-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-neutral-50 dark:bg-neutral-800/40 p-3 rounded-lg text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-neutral-500">Member:</span>
                <span className="font-semibold text-neutral-800 dark:text-neutral-200">{selectedSchemeForPayment.scheme.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Amount Due:</span>
                <span className="font-bold text-neutral-900 dark:text-neutral-100 font-mono">{formatCurrencyINR(selectedSchemeForPayment.installment.amount)}</span>
              </div>
              {selectedSchemeForPayment.scheme.schemeType === 'WEIGHT_BASED' && (
                <div className="flex justify-between">
                  <span className="text-neutral-500">Live 22K Rate Applied:</span>
                  <span className="font-mono text-neutral-700 dark:text-neutral-300">₹{metalRates.ratePerGram22K}/g</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
                Select Payment Mode:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['UPI', 'CASH', 'CARD'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => handleConfirmInstallmentPayment(mode)}
                    className="p-3 border rounded-xl hover:border-amber-500 hover:bg-amber-500/5 transition-all text-center flex flex-col items-center gap-1.5"
                  >
                    <CreditCard className="w-5 h-5 text-amber-600" />
                    <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">{mode}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Redemption Voucher Modal */}
      {selectedSchemeForVoucher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <Award className="w-6 h-6 text-emerald-500" />
                <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                  Swarna Nidhi Maturity Voucher
                </h2>
              </div>
              <button onClick={() => setSelectedSchemeForVoucher(null)} className="p-1 text-neutral-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 p-5 rounded-2xl text-center space-y-2">
              <span className="text-xs font-bold tracking-widest text-amber-700 dark:text-amber-400 uppercase">
                Official Jewellery Purchase Voucher
              </span>
              <div className="text-3xl font-black text-neutral-900 dark:text-neutral-100 font-mono">
                {formatCurrencyINR(selectedSchemeForVoucher.totalMaturityValueINR)}
              </div>
              <div className="text-xs text-neutral-600 dark:text-neutral-400">
                Includes ₹{selectedSchemeForVoucher.totalAmountPaidINR} customer deposit + ₹{selectedSchemeForVoucher.bonusAmountContributedINR} showroom bonus gift
              </div>
              <div className="pt-2">
                <span className="px-3 py-1 bg-white dark:bg-neutral-800 font-mono font-bold text-sm rounded-lg border border-neutral-300 dark:border-neutral-700">
                  VOUCHER: {selectedSchemeForVoucher.schemeNumber}
                </span>
              </div>
            </div>

            <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center">
              This voucher is fully recognized across all {activeBranch.name} counters for purchasing gold, diamond, and silver jewellery.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
              <button
                onClick={() => setSelectedSchemeForVoucher(null)}
                className="px-4 py-2 text-xs font-medium rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                Close
              </button>
              {onRedeemSchemeAtPos && (
                <button
                  onClick={() => {
                    onRedeemSchemeAtPos(selectedSchemeForVoucher);
                    setSelectedSchemeForVoucher(null);
                  }}
                  className="px-5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center gap-1.5"
                >
                  <ExternalLink className="w-4 h-4" />
                  Apply Directly to Retail POS
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Enroll New Member Modal */}
      {showEnrollModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <PiggyBank className="w-5 h-5 text-amber-500" />
                <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                  Enroll in Swarna Nidhi (11+1) Plan
                </h2>
              </div>
              <button onClick={() => setShowEnrollModal(false)} className="p-1 text-neutral-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEnrollSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Customer
                </label>
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone})
                    </option>
                  ))}
                  <option value="NEW">+ New Walk-in Member</option>
                </select>
              </div>

              {customerId === 'NEW' && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">Phone Number</label>
                    <input
                      type="text"
                      required
                      value={customPhone}
                      onChange={(e) => setCustomPhone(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Scheme Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSchemeType('VALUE_BASED')}
                    className={`p-3 rounded-xl border text-left transition-colors ${
                      schemeType === 'VALUE_BASED'
                        ? 'border-amber-600 bg-amber-500/10 text-amber-700 dark:text-amber-400'
                        : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    <div className="text-xs font-bold">Value Based</div>
                    <div className="text-[10px] text-neutral-500">11 cash deposits + 1 month free cash bonus</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSchemeType('WEIGHT_BASED')}
                    className={`p-3 rounded-xl border text-left transition-colors ${
                      schemeType === 'WEIGHT_BASED'
                        ? 'border-amber-600 bg-amber-500/10 text-amber-700 dark:text-amber-400'
                        : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    <div className="text-xs font-bold">Weight Accumulator</div>
                    <div className="text-[10px] text-neutral-500">Locks in gold grams at daily spot rate each month</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Monthly Installment Amount (₹)
                </label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {[2000, 5000, 10000, 25000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setMonthlyAmount(amt)}
                      className={`py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                        monthlyAmount === amt
                          ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                          : 'border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      ₹{amt / 1000}k
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min="1000"
                  step="500"
                  value={monthlyAmount}
                  onChange={(e) => setMonthlyAmount(parseFloat(e.target.value) || 0)}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 font-bold tabular-nums"
                />
              </div>

              <div className="bg-amber-500/10 p-3 rounded-lg text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-neutral-600 dark:text-neutral-400">11 Customer Months:</span>
                  <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100">{formatCurrencyINR(monthlyAmount * 11)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">12th Showroom Bonus:</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">+{formatCurrencyINR(monthlyAmount)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-amber-500/20 font-bold">
                  <span>Maturity Purchase Power:</span>
                  <span className="font-mono text-neutral-900 dark:text-neutral-100">{formatCurrencyINR(monthlyAmount * 12)}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowEnrollModal(false)}
                  className="px-4 py-2 text-xs font-medium rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
                >
                  Confirm & Open Scheme Passbook
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
