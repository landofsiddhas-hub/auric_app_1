/**
 * AURIC Double-Entry Financial Accounting Engine
 * Enforces strict mathematical balance on every posted journal:
 * Sum(Debits) === Sum(Credits)
 */

import { JournalEntry, JournalLine } from './types';
import { roundDecimals, toPaise, fromPaise } from './math';

export class AccountingEngine {
  private journals: JournalEntry[] = [];
  private lockedPeriodEndDates: string[] = [];

  constructor(initialJournals: JournalEntry[] = []) {
    this.journals = [...initialJournals];
  }

  /**
   * Posts a journal entry after validating Invariant 2: Sum(Debits) === Sum(Credits)
   */
  public postJournal(entry: Omit<JournalEntry, 'id' | 'postedAt'>): JournalEntry {
    // 1. Period close validation (Invariant 10)
    for (const lockedDate of this.lockedPeriodEndDates) {
      if (entry.date <= lockedDate) {
        throw new Error(`Cannot post transaction in closed financial period (locked until ${lockedDate}).`);
      }
    }

    // 2. Debit / Credit balance validation (Invariant 2)
    const totalDebitPaise = entry.lines.reduce((sum, line) => sum + line.debitPaise, 0);
    const totalCreditPaise = entry.lines.reduce((sum, line) => sum + line.creditPaise, 0);

    if (totalDebitPaise !== totalCreditPaise) {
      throw new Error(
        `Journal entry out of balance! Debits: ₹${fromPaise(totalDebitPaise)}, Credits: ₹${fromPaise(totalCreditPaise)} (Difference: ₹${fromPaise(Math.abs(totalDebitPaise - totalCreditPaise))})`
      );
    }

    if (totalDebitPaise <= 0) {
      throw new Error(`Journal entry must have non-zero balanced postings.`);
    }

    const postedEntry: JournalEntry = {
      ...entry,
      id: `JRN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      postedAt: new Date().toISOString(),
    };

    this.journals.push(postedEntry);
    return postedEntry;
  }

  public getJournals(): JournalEntry[] {
    return [...this.journals];
  }

  /**
   * Generates a balanced Trial Balance
   */
  public getTrialBalance() {
    const accountMap: Record<string, { name: string; category: string; netDebit: number; netCredit: number }> = {};

    for (const journal of this.journals) {
      for (const line of journal.lines) {
        if (!accountMap[line.accountId]) {
          accountMap[line.accountId] = {
            name: line.accountName,
            category: line.accountCategory,
            netDebit: 0,
            netCredit: 0,
          };
        }
        accountMap[line.accountId].netDebit += line.debitPaise;
        accountMap[line.accountId].netCredit += line.creditPaise;
      }
    }

    const rows = Object.entries(accountMap).map(([id, acc]) => {
      const balancePaise = acc.netDebit - acc.netCredit;
      return {
        accountId: id,
        accountName: acc.name,
        category: acc.category,
        debitRupees: balancePaise > 0 ? fromPaise(balancePaise) : 0,
        creditRupees: balancePaise < 0 ? fromPaise(-balancePaise) : 0,
      };
    });

    const totalDebits = roundDecimals(rows.reduce((sum, r) => sum + r.debitRupees, 0), 2);
    const totalCredits = roundDecimals(rows.reduce((sum, r) => sum + r.creditRupees, 0), 2);

    return {
      rows,
      totalDebits,
      totalCredits,
      isBalanced: Math.abs(totalDebits - totalCredits) < 0.01,
    };
  }

  /**
   * Locks all past periods up to the specified date (Invariant 10)
   */
  public lockPeriod(upToDate: string): void {
    if (!this.lockedPeriodEndDates.includes(upToDate)) {
      this.lockedPeriodEndDates.push(upToDate);
      this.lockedPeriodEndDates.sort();
    }
  }

  public getLockedPeriods(): string[] {
    return [...this.lockedPeriodEndDates];
  }
}
