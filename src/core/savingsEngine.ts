/**
 * AURIC Swarna Nidhi (11+1 Gold Savings Scheme) Domain Logic
 * Handles 11-month customer contribution + 12th month showroom bonus,
 * gold weight accumulation, and double-entry accounting.
 */

import { GoldChitScheme, ChitInstallment, JournalEntry } from './types';
import { roundDecimals, toPaise } from './math';

/**
 * Initializes an 11-month installment schedule with calculated due dates
 */
export function generateChitInstallments(
  monthlyAmountINR: number,
  startDateStr: string,
  totalTenureMonths = 11
): ChitInstallment[] {
  const installments: ChitInstallment[] = [];
  const start = new Date(startDateStr);

  for (let i = 1; i <= totalTenureMonths; i++) {
    const dueDate = new Date(start);
    dueDate.setMonth(start.getMonth() + (i - 1));

    installments.push({
      id: `INST-${i}`,
      installmentNumber: i,
      dueDate: dueDate.toISOString().split('T')[0],
      amount: monthlyAmountINR,
      status: i === 1 ? 'DUE' : 'UPCOMING',
    });
  }

  return installments;
}

/**
 * Records an installment payment into the scheme
 */
export function recordInstallmentPayment(
  scheme: GoldChitScheme,
  installmentNumber: number,
  paymentMode: 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER',
  goldRatePerGram22K: number
): { updatedScheme: GoldChitScheme; installment: ChitInstallment } {
  const targetIndex = scheme.installments.findIndex((inst) => inst.installmentNumber === installmentNumber);
  if (targetIndex === -1) {
    throw new Error(`Installment number ${installmentNumber} does not exist in scheme`);
  }

  const existingInst = scheme.installments[targetIndex];
  if (existingInst.status === 'PAID') {
    throw new Error(`Installment ${installmentNumber} is already paid`);
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const receiptNo = `RCT-${scheme.schemeNumber}-M${installmentNumber}`;
  
  let allocatedGrams = 0;
  if (scheme.schemeType === 'WEIGHT_BASED' && goldRatePerGram22K > 0) {
    allocatedGrams = roundDecimals(existingInst.amount / goldRatePerGram22K, 3);
  }

  const updatedInstallment: ChitInstallment = {
    ...existingInst,
    paidDate: todayStr,
    goldRateAppliedPerGram: goldRatePerGram22K,
    allocatedGoldWeightGrams: allocatedGrams,
    paymentMode,
    receiptNumber: receiptNo,
    status: 'PAID',
  };

  const updatedInstallments = [...scheme.installments];
  updatedInstallments[targetIndex] = updatedInstallment;

  // Next installment becomes DUE if pending
  const nextPending = updatedInstallments.find((i) => i.status === 'UPCOMING');
  if (nextPending) {
    nextPending.status = 'DUE';
  }

  const newMonthsPaid = scheme.monthsPaid + 1;
  const newTotalPaid = roundDecimals(scheme.totalAmountPaidINR + existingInst.amount, 2);
  const newAccumulatedWeight = roundDecimals(scheme.accumulatedGoldWeightGrams + allocatedGrams, 3);
  
  // If all 11 months are paid, add 1 month showroom bonus and mark scheme as MATURED!
  const isMatured = newMonthsPaid >= scheme.totalTenureMonths;
  const bonus = isMatured ? scheme.monthlyInstallmentINR : 0;
  const maturityValue = roundDecimals(newTotalPaid + bonus, 2);

  const updatedScheme: GoldChitScheme = {
    ...scheme,
    monthsPaid: newMonthsPaid,
    totalAmountPaidINR: newTotalPaid,
    bonusAmountContributedINR: bonus,
    totalMaturityValueINR: maturityValue,
    accumulatedGoldWeightGrams: newAccumulatedWeight,
    status: isMatured ? 'MATURED' : 'ACTIVE',
    installments: updatedInstallments,
  };

  return { updatedScheme, installment: updatedInstallment };
}

/**
 * Creates double-entry journal for receiving a savings scheme installment:
 * Dr. Cash / Bank [Installment Amount]
 *   Cr. Customer Advance / Scheme Deposit Liability [Installment Amount]
 */
export function createChitPaymentJournal(
  scheme: GoldChitScheme,
  installment: ChitInstallment
): Omit<JournalEntry, 'id'> {
  const amountPaise = toPaise(installment.amount);
  return {
    entryNumber: `JRN-${installment.receiptNumber}`,
    tenantId: scheme.tenantId,
    branchId: scheme.branchId,
    date: installment.paidDate || new Date().toISOString().split('T')[0],
    referenceType: 'PAYMENT',
    referenceId: installment.receiptNumber || scheme.schemeNumber,
    narration: `Swarna Nidhi Deposit #${installment.installmentNumber} from ${scheme.customerName} [${scheme.schemeNumber}]`,
    lines: [
      {
        accountId: installment.paymentMode === 'CASH' ? 'ACC-CASH' : 'ACC-BANK-CURRENT',
        accountName: installment.paymentMode === 'CASH' ? 'Cash on Hand' : 'Bank Current Account',
        accountCategory: 'ASSET',
        debitPaise: amountPaise,
        creditPaise: 0,
      },
      {
        accountId: 'ACC-SCHEME-LIABILITY',
        accountName: 'Swarna Nidhi Customer Scheme Deposits (Liability)',
        accountCategory: 'LIABILITY',
        debitPaise: 0,
        creditPaise: amountPaise,
      },
    ],
    postedBy: 'Scheme Cashier',
    postedAt: new Date().toISOString(),
  };
}
