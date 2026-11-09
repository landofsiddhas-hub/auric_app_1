/**
 * AURIC Girvi (Gold Loan / Pawn Broking) Domain Logic
 * Enforces RBI / State Money Lenders regulatory LTV caps,
 * simple monthly interest accruals, and double-entry accounting.
 */

import { GirviPledge, GirviPayment, GirviItem, JournalEntry } from './types';
import { roundDecimals, toPaise, calculateFineMetalEquivalent } from './math';

export interface GirviValuationSummary {
  totalGrossWeightGrams: number;
  totalNetWeightGrams: number;
  totalFineGoldEquivalentGrams: number;
  totalValuationINR: number;
  maxSanctionablePrincipalINR: number;
}

/**
 * Calculates total weight, purity valuation, and statutory 75% LTV ceiling for pledged articles
 */
export function computeGirviValuation(
  items: GirviItem[],
  maxLtvPercent = 75
): GirviValuationSummary {
  let gross = 0;
  let net = 0;
  let fine = 0;
  let valuation = 0;

  for (const item of items) {
    gross += item.grossWeightGrams;
    const itemNet = Math.max(0, item.grossWeightGrams - item.stoneDeductionGrams);
    net += itemNet;
    const itemFine = calculateFineMetalEquivalent(itemNet, item.fineness);
    fine += itemFine;
    valuation += item.itemValuationINR;
  }

  const roundedGross = roundDecimals(gross, 3);
  const roundedNet = roundDecimals(net, 3);
  const roundedFine = roundDecimals(fine, 3);
  const roundedValuation = roundDecimals(valuation, 2);
  const maxSanction = roundDecimals((roundedValuation * maxLtvPercent) / 100, 2);

  return {
    totalGrossWeightGrams: roundedGross,
    totalNetWeightGrams: roundedNet,
    totalFineGoldEquivalentGrams: roundedFine,
    totalValuationINR: roundedValuation,
    maxSanctionablePrincipalINR: maxSanction,
  };
}

/**
 * Calculates accrued interest using standard simple monthly interest:
 * Accrued = Principal * (MonthlyRate% / 100) * (Days / 30)
 */
export function calculateAccruedInterest(
  principal: number,
  monthlyInterestRatePercent: number,
  daysElapsed: number
): number {
  if (principal <= 0 || daysElapsed <= 0) return 0;
  const months = daysElapsed / 30;
  const interest = principal * (monthlyInterestRatePercent / 100) * months;
  return roundDecimals(interest, 2);
}

/**
 * Creates double-entry journal for Girvi loan disbursal:
 * Dr. Girvi Loan Receivables (Asset) [Principal]
 *   Cr. Cash on Hand / Bank (Asset) [Principal]
 * Note: Pledged gold ornaments remain customer property in segregated vault custody (Bailment).
 */
export function createGirviDisbursalJournal(pledge: GirviPledge): Omit<JournalEntry, 'id'> {
  const principalPaise = toPaise(pledge.sanctionedPrincipalINR);
  return {
    entryNumber: `JRN-${pledge.pledgeNumber}-DISB`,
    tenantId: pledge.tenantId,
    branchId: pledge.branchId,
    date: pledge.pledgeDate.split('T')[0],
    referenceType: 'PAYMENT',
    referenceId: pledge.pledgeNumber,
    narration: `Girvi Gold Loan Disbursal to ${pledge.customerName} against ${pledge.items.length} ornaments (${pledge.totalGrossWeightGrams}g) in Vault [${pledge.vaultPacketId}]`,
    lines: [
      {
        accountId: 'ACC-GIRVI-RECEIVABLES',
        accountName: 'Girvi Loan Receivables (Pawn Asset)',
        accountCategory: 'ASSET',
        debitPaise: principalPaise,
        creditPaise: 0,
      },
      {
        accountId: 'ACC-CASH',
        accountName: 'Cash on Hand (Till)',
        accountCategory: 'ASSET',
        debitPaise: 0,
        creditPaise: principalPaise,
      },
    ],
    postedBy: 'Girvi Officer',
    postedAt: new Date().toISOString(),
  };
}

/**
 * Creates double-entry journal for Girvi interest & principal servicing payment:
 * Dr. Cash / Bank [Total Amount Received]
 *   Cr. Girvi Interest Income [Interest Amount]
 *   Cr. Girvi Loan Receivables [Principal Reduction]
 */
export function createGirviPaymentJournal(
  pledge: GirviPledge,
  payment: GirviPayment
): Omit<JournalEntry, 'id'> {
  const lines = [
    {
      accountId: payment.paymentMode === 'CASH' ? 'ACC-CASH' : 'ACC-BANK-CURRENT',
      accountName: payment.paymentMode === 'CASH' ? 'Cash on Hand' : 'Bank Current Account',
      accountCategory: 'ASSET' as const,
      debitPaise: toPaise(payment.totalAmount),
      creditPaise: 0,
    },
  ];

  if (payment.interestAmount > 0) {
    lines.push({
      accountId: 'ACC-GIRVI-INTEREST-INCOME',
      accountName: 'Interest Income on Girvi Loans',
      accountCategory: 'REVENUE' as const,
      debitPaise: 0,
      creditPaise: toPaise(payment.interestAmount),
    });
  }

  if (payment.principalAmount > 0) {
    lines.push({
      accountId: 'ACC-GIRVI-RECEIVABLES',
      accountName: 'Girvi Loan Receivables (Pawn Asset)',
      accountCategory: 'ASSET' as const,
      debitPaise: 0,
      creditPaise: toPaise(payment.principalAmount),
    });
  }

  return {
    entryNumber: `JRN-${payment.receiptNumber}`,
    tenantId: pledge.tenantId,
    branchId: pledge.branchId,
    date: payment.paymentDate.split('T')[0],
    referenceType: 'PAYMENT',
    referenceId: payment.receiptNumber,
    narration: `Girvi Payment received for ${pledge.pledgeNumber}: Int ₹${payment.interestAmount}, Prin ₹${payment.principalAmount}`,
    lines,
    postedBy: payment.collectedBy,
    postedAt: new Date().toISOString(),
  };
}
