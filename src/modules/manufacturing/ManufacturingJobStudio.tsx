/**
 * AURIC Manufacturing & Job Card Studio (Stage 8)
 * Complete jewellery production lifecycle: BOM design, 8-stage workshop progress,
 * karat alloy mixing formula, Ghat scrap loss audit, and finished article conversion.
 */

import React, { useState } from 'react';
import { 
  Hammer, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Printer, 
  FileText, 
  Sparkles, 
  ArrowRight, 
  Gem, 
  Scale, 
  ShieldCheck, 
  Layers, 
  ChevronRight,
  TrendingDown
} from 'lucide-react';
import { 
  ManufacturingOrder, 
  ProductionStageName, 
  Karigar, 
  Branch, 
  MetalRateSnapshot,
  Article 
} from '../../core/types';
import { 
  calculateKaratAlloyMixture, 
  reconcileManufacturingOrder, 
  convertOrderToArticle, 
  createManufacturingCompletionJournal 
} from '../../core/manufacturingEngine';
import { formatCurrencyINR, formatWeightGrams, roundDecimals } from '../../core/math';

interface ManufacturingJobStudioProps {
  orders: ManufacturingOrder[];
  karigars: Karigar[];
  activeBranch: Branch;
  metalRates: MetalRateSnapshot;
  onUpdateOrder: (order: ManufacturingOrder) => void;
  onCreateOrder: (order: ManufacturingOrder) => void;
  onReceiveFinishedArticle: (article: Article, journal: any) => void;
}

const PRODUCTION_STAGES: { id: ProductionStageName; label: string; icon: string }[] = [
  { id: 'CAD_3D_DESIGN', label: '1. CAD 3D Design', icon: '💻' },
  { id: 'WAX_TREE', label: '2. Wax Tree', icon: '🕯️' },
  { id: 'CASTING', label: '3. Vacuum Casting', icon: '🔥' },
  { id: 'FILING_ASSEMBLY', label: '4. Filing & Assembly', icon: '🔧' },
  { id: 'STONE_SETTING', label: '5. Stone Setting', icon: '💎' },
  { id: 'POLISHING_FINISHING', label: '6. Polish & Rhodium', icon: '✨' },
  { id: 'HALLMARKING_HUID', label: '7. BIS Hallmarking', icon: '🏷️' },
  { id: 'QC_APPROVAL', label: '8. Final QC Pass', icon: '✅' },
];

export const ManufacturingJobStudio: React.FC<ManufacturingJobStudioProps> = ({
  orders,
  karigars,
  activeBranch,
  metalRates,
  onUpdateOrder,
  onCreateOrder,
  onReceiveFinishedArticle,
}) => {
  const [selectedOrderId, setSelectedOrderId] = useState<string>(orders[0]?.id || '');
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [showReconcileModal, setShowReconcileModal] = useState(false);
  const [showJobSheetPrint, setShowJobSheetPrint] = useState(false);

  // New Order Form State
  const [newTitle, setNewTitle] = useState('22K Antique Filigree Peacock Kangan');
  const [newCategory, setNewCategory] = useState('Bangles');
  const [newTargetPurity, setNewTargetPurity] = useState('22K (916)');
  const [newTargetFineness, setNewTargetFineness] = useState(916);
  const [newTargetWeight, setNewTargetWeight] = useState(38.500);
  const [newKarigarId, setNewKarigarId] = useState(karigars[0]?.id || '');
  const [newPriority, setNewPriority] = useState<'NORMAL' | 'HIGH' | 'RUSH_WEDDING'>('HIGH');
  const [newLabourINR, setNewLabourINR] = useState(14500);

  // Reconciliation Modal State
  const [reconcileFinishedWeight, setReconcileFinishedWeight] = useState(38.100);
  const [reconcileScrapWeight, setReconcileScrapWeight] = useState(1.150);
  const [reconcileDustWeight, setReconcileDustWeight] = useState(0.200);
  const [reconcileHuid, setReconcileHuid] = useState(`BIS${Math.floor(1000 + Math.random() * 9000)}`);

  const activeOrder = orders.find((o) => o.id === selectedOrderId) || orders[0];

  // Dynamic Alloy calculation for active order or new form
  const alloyFormula = calculateKaratAlloyMixture(
    activeOrder?.targetFineness || 916,
    activeOrder?.targetGrossWeightGrams || 38.5
  );

  const handleAdvanceStage = (order: ManufacturingOrder) => {
    const currentIndex = PRODUCTION_STAGES.findIndex((s) => s.id === order.currentStage);
    if (currentIndex >= PRODUCTION_STAGES.length - 1) return;

    const nextStage = PRODUCTION_STAGES[currentIndex + 1].id;
    const updatedStages = order.stages.map((st) => {
      if (st.stage === order.currentStage) {
        return { ...st, status: 'COMPLETED' as const, completedAt: new Date().toISOString().slice(0, 10) };
      }
      if (st.stage === nextStage) {
        return { ...st, status: 'IN_PROGRESS' as const, startedAt: new Date().toISOString().slice(0, 10) };
      }
      return st;
    });

    const isFinished = nextStage === 'QC_APPROVAL';

    const updatedOrder: ManufacturingOrder = {
      ...order,
      currentStage: nextStage,
      stages: updatedStages,
      status: isFinished ? 'COMPLETED' : 'WIP',
    };

    onUpdateOrder(updatedOrder);
  };

  const handleCreateOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const assignedKarigar = karigars.find((k) => k.id === newKarigarId) || karigars[0];
    const mixture = calculateKaratAlloyMixture(newTargetFineness, newTargetWeight);
    const orderNo = `MO-2026-00${orders.length + 83}`;

    const newOrder: ManufacturingOrder = {
      id: `MO-${Date.now()}`,
      orderNumber: orderNo,
      tenantId: activeBranch.id,
      branchId: activeBranch.id,
      title: newTitle,
      category: newCategory,
      targetPurity: newTargetPurity,
      targetFineness: newTargetFineness,
      targetGrossWeightGrams: newTargetWeight,
      priority: newPriority,
      bomComponents: [
        {
          id: `BOM-${Date.now()}-1`,
          componentType: 'PRECIOUS_METAL',
          name: '24K Pure Gold Grain Bullion',
          estimatedQuantity: mixture.pureGoldRequiredGrams,
          unit: 'GRAMS',
          estimatedCostINR: roundDecimals(mixture.pureGoldRequiredGrams * metalRates.ratePerGram24K, 2),
        },
        {
          id: `BOM-${Date.now()}-2`,
          componentType: 'ALLOY_COPPER_SILVER',
          name: 'Master Casting Alloy (Copper + Silver)',
          estimatedQuantity: mixture.alloyRequiredGrams,
          unit: 'GRAMS',
          estimatedCostINR: roundDecimals(mixture.alloyRequiredGrams * 250, 2),
        },
      ],
      issuedPureGoldGrams: mixture.pureGoldRequiredGrams,
      issuedAlloyGrams: mixture.alloyRequiredGrams,
      totalIssuedMetalGrams: newTargetWeight,
      allowedLossPercent: 1.2,
      karigarLabourINR: newLabourINR,
      findingChargesINR: 1200,
      stoneSettingChargesINR: 0,
      totalManufacturingCostINR: roundDecimals(
        mixture.pureGoldRequiredGrams * metalRates.ratePerGram24K + newLabourINR + 1200,
        2
      ),
      currentStage: 'CAD_3D_DESIGN',
      stages: PRODUCTION_STAGES.map((s, idx) => ({
        stage: s.id,
        status: idx === 0 ? 'IN_PROGRESS' : 'PENDING',
        startedAt: idx === 0 ? new Date().toISOString().slice(0, 10) : undefined,
        assignedKarigarName: assignedKarigar.name,
      })),
      status: 'ISSUED_TO_WORKSHOP',
      assignedKarigarId: assignedKarigar.id,
      assignedKarigarName: assignedKarigar.name,
      expectedDeliveryDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
    };

    onCreateOrder(newOrder);
    setSelectedOrderId(newOrder.id);
    setShowNewOrderModal(false);
  };

  const handleReconcileAndInwardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrder) return;

    const recon = reconcileManufacturingOrder(
      activeOrder.totalIssuedMetalGrams,
      reconcileFinishedWeight,
      reconcileScrapWeight,
      reconcileDustWeight,
      activeOrder.allowedLossPercent
    );

    const completedOrder: ManufacturingOrder = {
      ...activeOrder,
      finishedGrossWeightGrams: reconcileFinishedWeight,
      recoveredScrapGrams: reconcileScrapWeight,
      recoveredDustGrams: reconcileDustWeight,
      recordedLossGrams: recon.processLossGrams,
      currentStage: 'QC_APPROVAL',
      status: 'INSPECTED_INTO_STOCK',
      completedDate: new Date().toISOString().slice(0, 10),
    };

    const newArticle = convertOrderToArticle(completedOrder, activeBranch.id, reconcileHuid);
    const journal = createManufacturingCompletionJournal(completedOrder, metalRates.ratePerGram22K);

    completedOrder.generatedArticleId = newArticle.id;
    onUpdateOrder(completedOrder);
    onReceiveFinishedArticle(newArticle, journal);
    setShowReconcileModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Hammer className="w-5 h-5 text-amber-600" />
            Manufacturing & Job Card Studio (Stage 8)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Bill of Materials (BOM), 8-stage workshop progress, Ghat loss audits, and finished stock conversion.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowNewOrderModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            New Manufacturing Order
          </button>
        </div>
      </div>

      {/* Main Studio Viewport */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Orders List */}
        <div className="space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
            Active Workshop Orders ({orders.length})
          </div>

          <div className="space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
            {orders.map((ord) => {
              const isSelected = ord.id === activeOrder?.id;
              const completedStages = ord.stages.filter((s) => s.status === 'COMPLETED').length;
              return (
                <div
                  key={ord.id}
                  onClick={() => setSelectedOrderId(ord.id)}
                  className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-500/80 shadow-sm ring-1 ring-amber-500/20'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-mono text-[11px] font-bold text-amber-600 dark:text-amber-400">
                      {ord.orderNumber}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        ord.status === 'INSPECTED_INTO_STOCK'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : ord.status === 'COMPLETED'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                      }`}
                    >
                      {ord.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <h3 className="font-semibold text-xs text-slate-900 dark:text-white line-clamp-1 mb-1">
                    {ord.title}
                  </h3>

                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                    <span>{ord.targetPurity} · {formatWeightGrams(ord.targetGrossWeightGrams)}</span>
                    <span className="text-slate-700 dark:text-slate-300 font-medium">{ord.assignedKarigarName.split(' ')[0]}</span>
                  </div>

                  {/* Mini Progress Bar */}
                  <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                      <span>{ord.currentStage.replace(/_/g, ' ')}</span>
                      <span>{completedStages}/8 stages</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-amber-500 h-1.5 rounded-full transition-all"
                        style={{ width: `${(completedStages / 8) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center & Right Columns: Active Order Details & Job Card */}
        {activeOrder && (
          <div className="lg:col-span-2 space-y-6">
            
            {/* Top Job Card Header */}
            <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-amber-600 dark:text-amber-400">
                      {activeOrder.orderNumber}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {activeOrder.priority}
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                    {activeOrder.title}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowJobSheetPrint(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print Job Sheet
                  </button>

                  {activeOrder.status !== 'INSPECTED_INTO_STOCK' && (
                    <button
                      onClick={() => setShowReconcileModal(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Reconcile & Receive Stock
                    </button>
                  )}
                </div>
              </div>

              {/* Summary Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Target Metal Purity</span>
                  <div className="font-semibold text-slate-900 dark:text-white mt-0.5">
                    {activeOrder.targetPurity} ({activeOrder.targetFineness} fineness)
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Target Gross Weight</span>
                  <div className="font-semibold text-slate-900 dark:text-white mt-0.5">
                    {formatWeightGrams(activeOrder.targetGrossWeightGrams)}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Assigned Karigar</span>
                  <div className="font-semibold text-slate-900 dark:text-white mt-0.5 truncate">
                    {activeOrder.assignedKarigarName}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Est. Mfg Cost</span>
                  <div className="font-semibold text-amber-600 dark:text-amber-400 mt-0.5">
                    {formatCurrencyINR(activeOrder.totalManufacturingCostINR)}
                  </div>
                </div>
              </div>
            </div>

            {/* 8-Stage Production Flow */}
            <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-amber-600" />
                  Workshop Production Pipeline
                </h3>

                {activeOrder.status === 'WIP' && (
                  <button
                    onClick={() => handleAdvanceStage(activeOrder)}
                    className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors"
                  >
                    <span>Advance to Next Stage</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {PRODUCTION_STAGES.map((st, idx) => {
                  const stageRecord = activeOrder.stages.find((s) => s.stage === st.id);
                  const isDone = stageRecord?.status === 'COMPLETED';
                  const isCurrent = activeOrder.currentStage === st.id && activeOrder.status !== 'INSPECTED_INTO_STOCK';

                  return (
                    <div
                      key={st.id}
                      className={`p-3 rounded-xl border transition-all ${
                        isCurrent
                          ? 'bg-amber-500/10 border-amber-500/80 ring-1 ring-amber-500/30'
                          : isDone
                          ? 'bg-emerald-500/5 border-emerald-500/30 dark:bg-emerald-950/20'
                          : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-base">{st.icon}</span>
                        {isDone ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : isCurrent ? (
                          <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700" />
                        )}
                      </div>
                      <div className="text-[11px] font-bold text-slate-900 dark:text-white leading-tight">
                        {st.label}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1 capitalize">
                        {stageRecord?.status?.toLowerCase().replace(/_/g, ' ') || 'Pending'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Karat Alloy Formulation & BOM Breakdown */}
            <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-amber-600" />
                Karat Master Alloy Mixture & Bill of Materials (BOM)
              </h3>

              {/* Alloy Formula Box */}
              <div className="p-4 bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/50 rounded-xl space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-amber-900 dark:text-amber-200">
                    Karat Alloy Recipe: {activeOrder.targetPurity} ({alloyFormula.targetFineness} / 1000)
                  </span>
                  <span className="text-[11px] font-mono text-amber-700 dark:text-amber-300">
                    Total Cast Mass: {formatWeightGrams(activeOrder.targetGrossWeightGrams)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-amber-100 dark:border-amber-900/60">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Pure 24K Gold Required</span>
                    <div className="text-sm font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                      {formatWeightGrams(alloyFormula.pureGoldRequiredGrams)} ({alloyFormula.goldPercentage}%)
                    </div>
                  </div>

                  <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-amber-100 dark:border-amber-900/60">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Master Alloy (Cu + Ag)</span>
                    <div className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                      {formatWeightGrams(alloyFormula.alloyRequiredGrams)} ({alloyFormula.alloyPercentage}%)
                    </div>
                  </div>
                </div>
              </div>

              {/* BOM Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-2 px-3">Component</th>
                      <th className="py-2 px-3">Type</th>
                      <th className="py-2 px-3 text-right">Est. Quantity</th>
                      <th className="py-2 px-3 text-right">Est. Cost (INR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {activeOrder.bomComponents.map((c) => (
                      <tr key={c.id}>
                        <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-white">
                          {c.name}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                          {c.componentType.replace(/_/g, ' ')}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono">
                          {c.estimatedQuantity} {c.unit}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-medium">
                          {formatCurrencyINR(c.estimatedCostINR)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* MODAL: New Manufacturing Order */}
      {showNewOrderModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-600" />
                Create New Jewellery Manufacturing Order
              </h3>
              <button
                onClick={() => setShowNewOrderModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateOrderSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                  Article Title / Ornament Description
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    <option value="Bangles">Bangles / Kangan</option>
                    <option value="Necklaces">Necklaces / Choker</option>
                    <option value="Rings">Rings / Solitaire</option>
                    <option value="Earrings">Earrings / Jhumkas</option>
                    <option value="Mangalsutra">Mangalsutra</option>
                    <option value="Chains">Chains</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                    Target Karat Purity
                  </label>
                  <select
                    value={newTargetPurity}
                    onChange={(e) => {
                      setNewTargetPurity(e.target.value);
                      if (e.target.value.includes('22K')) setNewTargetFineness(916);
                      else if (e.target.value.includes('18K')) setNewTargetFineness(750);
                      else if (e.target.value.includes('14K')) setNewTargetFineness(585);
                      else setNewTargetFineness(999);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    <option value="22K (916)">22K (916 BIS Hallmark)</option>
                    <option value="18K (750)">18K (750 Diamond Mount)</option>
                    <option value="14K (585)">14K (585 Daily Wear)</option>
                    <option value="24K (999)">24K (999 Pure Bullion)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                    Target Gross Weight (Grams)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    required
                    value={newTargetWeight}
                    onChange={(e) => setNewTargetWeight(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                    Karigar Labour Charges (INR)
                  </label>
                  <input
                    type="number"
                    required
                    value={newLabourINR}
                    onChange={(e) => setNewLabourINR(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                  Assign Master Artisan (Karigar)
                </label>
                <select
                  value={newKarigarId}
                  onChange={(e) => setNewKarigarId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                >
                  {karigars.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.name} ({k.speciality})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewOrderModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-sm"
                >
                  Issue Job Card to Workshop
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Reconcile Scrap & Receive Stock */}
      {showReconcileModal && activeOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Workshop Scrap Reconciliation & Stock Receipt
              </h3>
              <button
                onClick={() => setShowReconcileModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleReconcileAndInwardSubmit} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
                <div className="flex justify-between font-mono text-slate-500">
                  <span>Total Raw Metal Issued:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {formatWeightGrams(activeOrder.totalIssuedMetalGrams)}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-amber-600">
                  <span>Allowable Workshop Ghat Loss:</span>
                  <span>{activeOrder.allowedLossPercent}% max</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                  Finished Article Gross Weight on Digital Scale (Grams)
                </label>
                <input
                  type="number"
                  step="0.001"
                  required
                  value={reconcileFinishedWeight}
                  onChange={(e) => setReconcileFinishedWeight(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                    Scrap Metal Recovered (g)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    required
                    value={reconcileScrapWeight}
                    onChange={(e) => setReconcileScrapWeight(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                    Polish Dust Recovered (g)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    required
                    value={reconcileDustWeight}
                    onChange={(e) => setReconcileDustWeight(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                  BIS Hallmarking 6-Character HUID Stamp
                </label>
                <input
                  type="text"
                  required
                  value={reconcileHuid}
                  onChange={(e) => setReconcileHuid(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono tracking-widest uppercase font-bold"
                />
              </div>

              {/* Dynamic Reconciliation Preview */}
              {(() => {
                const preview = reconcileManufacturingOrder(
                  activeOrder.totalIssuedMetalGrams,
                  reconcileFinishedWeight,
                  reconcileScrapWeight,
                  reconcileDustWeight,
                  activeOrder.allowedLossPercent
                );

                return (
                  <div
                    className={`p-3 rounded-xl border text-xs space-y-1 ${
                      preview.isWithinLossTolerance
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                        : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300'
                    }`}
                  >
                    <div className="flex justify-between font-bold">
                      <span>Process Loss (Ghat): {formatWeightGrams(preview.processLossGrams)}</span>
                      <span>{preview.processLossPercent}% of input</span>
                    </div>
                    <div className="text-[11px]">
                      {preview.isWithinLossTolerance
                        ? '✓ Within allowable workshop tolerance.'
                        : `⚠️ Warning: Loss exceeds ${activeOrder.allowedLossPercent}% limit by ${formatWeightGrams(preview.excessLossGrams)}.`}
                    </div>
                  </div>
                );
              })()}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowReconcileModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm"
                >
                  Approve QC & Add to Showroom Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Job Sheet Preview */}
      {showJobSheetPrint && activeOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-2xl max-w-2xl w-full p-8 shadow-2xl space-y-6 font-sans">
            <div className="flex justify-between items-start border-b pb-4">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-amber-900">
                  AURIC WORKSHOP JOB CARD (वर्कशॉप जॉब शीट)
                </h2>
                <div className="text-xs text-slate-500 font-mono">
                  Order #{activeOrder.orderNumber} · Branch: {activeBranch.name}
                </div>
              </div>
              <div className="text-right text-xs">
                <div className="font-bold text-slate-900">Date: {activeOrder.createdAt.slice(0, 10)}</div>
                <div className="text-amber-600 font-bold uppercase">Priority: {activeOrder.priority}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <div><span className="font-bold">Ornament:</span> {activeOrder.title}</div>
                <div><span className="font-bold">Category:</span> {activeOrder.category}</div>
                <div><span className="font-bold">Target Purity:</span> {activeOrder.targetPurity}</div>
                <div><span className="font-bold">Target Gross Weight:</span> {formatWeightGrams(activeOrder.targetGrossWeightGrams)}</div>
              </div>
              <div className="space-y-1">
                <div><span className="font-bold">Assigned Karigar:</span> {activeOrder.assignedKarigarName}</div>
                <div><span className="font-bold">Raw Gold Issued:</span> {formatWeightGrams(activeOrder.issuedPureGoldGrams)}</div>
                <div><span className="font-bold">Master Alloy Issued:</span> {formatWeightGrams(activeOrder.issuedAlloyGrams)}</div>
                <div><span className="font-bold">Delivery Deadline:</span> {activeOrder.expectedDeliveryDate}</div>
              </div>
            </div>

            {/* Stages Grid */}
            <div className="border rounded-lg overflow-hidden text-xs">
              <div className="bg-slate-100 font-bold p-2 text-slate-700">7-Stage Quality Sign-off</div>
              <div className="grid grid-cols-4 divide-x divide-y text-[11px] p-2 gap-2">
                {PRODUCTION_STAGES.map((s) => (
                  <div key={s.id} className="p-1.5 space-y-1">
                    <div className="font-bold">{s.label}</div>
                    <div className="text-[10px] text-slate-500 border-t pt-1">Sign: _________</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t text-xs text-slate-500">
              <span>Authorized Vault Manager Signature</span>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-amber-600 text-white font-bold rounded-lg"
                >
                  Print Job Card
                </button>
                <button
                  onClick={() => setShowJobSheetPrint(false)}
                  className="px-4 py-2 bg-slate-200 text-slate-800 font-bold rounded-lg"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
