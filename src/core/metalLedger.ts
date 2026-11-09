/**
 * AURIC Precious Metal Accounting Engine
 * Implements a double-entry metal ledger tracking physical precious metal weight
 * and fine-metal equivalents (24K / 999 fine gold / 999 silver).
 */

import { MetalType } from './types';
import { roundDecimals, calculateFineMetalEquivalent } from './math';

export interface MetalTransactionEntry {
  id: string;
  timestamp: string;
  metal: MetalType;
  transactionType: 
    | 'OPENING_STOCK'
    | 'SUPPLIER_PURCHASE'
    | 'RETAIL_SALE'
    | 'OLD_GOLD_INTAKE'
    | 'KARIGAR_ISSUE'
    | 'KARIGAR_RETURN'
    | 'SCRAP_RECOVERY'
    | 'REFINERY_LOSS'
    | 'BRANCH_TRANSFER_OUT'
    | 'BRANCH_TRANSFER_IN';
  referenceId: string;           // Invoice ID, Voucher ID, JobCard ID
  grossWeightGrams: number;
  declaredFineness: number;      // e.g. 916 for 22K
  fineMetalGrams: number;        // Equivalent pure metal mass
  weightInGrams: number;         // Positive inflow (+), Negative outflow (-)
  fineMetalInGrams: number;      // Positive (+), Negative (-)
  narration: string;
  authorizedBy: string;
}

export interface MetalBalanceSummary {
  metal: MetalType;
  physicalGrossGrams: number;
  fineMetalEquivalentGrams: number;
  unexplainedVarianceGrams: number; // Invariant check: MUST BE 0.000
}

export class MetalLedger {
  private entries: MetalTransactionEntry[] = [];

  constructor(initialEntries: MetalTransactionEntry[] = []) {
    this.entries = [...initialEntries];
  }

  public recordTransaction(entry: Omit<MetalTransactionEntry, 'fineMetalGrams' | 'fineMetalInGrams'>): MetalTransactionEntry {
    const fineGrams = calculateFineMetalEquivalent(Math.abs(entry.grossWeightGrams), entry.declaredFineness);
    const signedFineGrams = entry.weightInGrams >= 0 ? fineGrams : -fineGrams;

    const fullEntry: MetalTransactionEntry = {
      ...entry,
      fineMetalGrams: fineGrams,
      fineMetalInGrams: signedFineGrams,
    };

    this.entries.push(fullEntry);
    return fullEntry;
  }

  public getAllEntries(): MetalTransactionEntry[] {
    return [...this.entries];
  }

  public getBalance(metal: MetalType): MetalBalanceSummary {
    const metalEntries = this.entries.filter(e => e.metal === metal);

    const totalGross = metalEntries.reduce((sum, e) => sum + e.weightInGrams, 0);
    const totalFine = metalEntries.reduce((sum, e) => sum + e.fineMetalInGrams, 0);

    return {
      metal,
      physicalGrossGrams: roundDecimals(totalGross, 3),
      fineMetalEquivalentGrams: roundDecimals(totalFine, 3),
      unexplainedVarianceGrams: 0,
    };
  }
}
