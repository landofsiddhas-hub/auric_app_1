import React, { useState } from 'react';
import { 
  Building2, 
  Check, 
  ShieldCheck, 
  CreditCard, 
  Users, 
  Package, 
  Store, 
  ArrowUpRight, 
  Zap 
} from 'lucide-react';
import { SaaSPlan, Tenant } from '../../core/types';
import { formatCurrencyINR } from '../../core/math';
import { initialSaaSPlans } from '../../data/mockData';

interface SubscriptionProps {
  tenant: Tenant;
  totalArticlesCount: number;
  onUpgradePlan: (planId: SaaSPlan['id']) => void;
}

export const SubscriptionManager: React.FC<SubscriptionProps> = ({
  tenant,
  totalArticlesCount,
  onUpgradePlan,
}) => {
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'ANNUAL'>('MONTHLY');
  const currentPlan = initialSaaSPlans.find((p) => p.id === tenant.subscriptionPlan) || initialSaaSPlans[2];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-600" />
            SaaS Subscription & Tenant Organization
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Multi-tenant organization entitlements, branch quotas, user seats, and commercial subscription management.
          </p>
        </div>

        {/* Monthly vs Annual Toggle */}
        <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold">
          <button
            onClick={() => setBillingCycle('MONTHLY')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              billingCycle === 'MONTHLY'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Monthly Billing
          </button>
          <button
            onClick={() => setBillingCycle('ANNUAL')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              billingCycle === 'ANNUAL'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Annual (Save 17%)
          </button>
        </div>
      </div>

      {/* Active Organization & Quota Health Strip */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {tenant.tradeName}
              </h2>
              <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40">
                Active Plan: {currentPlan.name}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Tenant ID: {tenant.id} · Legal: {tenant.legalName} · PAN: {tenant.pan}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            Tenant Isolation Guard Active (Invariant 11)
          </div>
        </div>

        {/* Quota Usage Bars */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg space-y-1">
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1.5"><Store className="w-3.5 h-3.5" /> Showroom Branches:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">{tenant.branches.length} / {currentPlan.maxBranches}</span>
            </div>
            <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-amber-500" 
                style={{ width: `${(tenant.branches.length / currentPlan.maxBranches) * 100}%` }} 
              />
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg space-y-1">
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1.5"><Package className="w-3.5 h-3.5" /> Tracked Articles:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">{totalArticlesCount} / {currentPlan.maxArticles}</span>
            </div>
            <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500" 
                style={{ width: `${Math.min(100, (totalArticlesCount / currentPlan.maxArticles) * 100)}%` }} 
              />
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg space-y-1">
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Authorized Staff Seats:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">4 / {currentPlan.maxUsers}</span>
            </div>
            <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-sky-500" style={{ width: '13%' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Commercial Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {initialSaaSPlans.map((plan) => {
          const isCurrent = plan.id === tenant.subscriptionPlan;
          const price = billingCycle === 'MONTHLY' ? plan.monthlyPriceINR : Math.round(plan.annualPriceINR / 12);

          return (
            <div
              key={plan.id}
              className={`p-5 rounded-xl border transition-all flex flex-col justify-between ${
                isCurrent
                  ? 'bg-amber-50/40 dark:bg-slate-900 border-amber-400 dark:border-amber-600 shadow-md ring-1 ring-amber-400/50'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-300'
              }`}
            >
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">{plan.name}</h3>
                  {isCurrent && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-600 text-white font-mono">
                      Current
                    </span>
                  )}
                </div>

                <div className="space-y-0.5">
                  <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
                    {formatCurrencyINR(price)}
                    <span className="text-xs text-slate-500 font-normal"> / mo</span>
                  </div>
                  {billingCycle === 'ANNUAL' && (
                    <div className="text-[10px] text-slate-400 font-mono">Billed annually ({formatCurrencyINR(plan.annualPriceINR)})</div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs space-y-1.5 text-slate-600 dark:text-slate-300">
                  <div className="font-semibold text-slate-900 dark:text-white">Limits:</div>
                  <div>· Up to {plan.maxBranches} Showroom {plan.maxBranches > 1 ? 'Branches' : 'Branch'}</div>
                  <div>· Up to {plan.maxUsers} Staff Users</div>
                  <div>· Up to {plan.maxArticles.toLocaleString()} Tracked Articles</div>

                  <div className="font-semibold text-slate-900 dark:text-white pt-1">Features:</div>
                  {plan.features.map((f, fIdx) => (
                    <div key={fIdx} className="flex items-center gap-1.5 text-[11px]">
                      <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  disabled={isCurrent}
                  onClick={() => onUpgradePlan(plan.id)}
                  className={`w-full py-2 px-3 text-xs font-bold rounded-lg transition-colors ${
                    isCurrent
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-default'
                      : 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm'
                  }`}
                >
                  {isCurrent ? 'Active Plan' : `Switch to ${plan.name}`}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
