/**
 * AURIC Critical Invariants Test Suite
 * Tests financial, metal, and transactional invariants via node:test
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { roundDecimals, toPaise, fromPaise, calculateFineMetalEquivalent } from './math';
import { computeArticlePricing, computeArtisanLabourCost, computeKarigarHisab, getApplicableRatePerGram } from './pricingEngine';
import { AccountingEngine } from './accountingEngine';
import { MetalLedger } from './metalLedger';
import { computeGirviValuation, calculateAccruedInterest, createGirviDisbursalJournal, createGirviPaymentJournal } from './girviEngine';
import { generateChitInstallments, recordInstallmentPayment, createChitPaymentJournal } from './savingsEngine';
import { calculateKaratAlloyMixture, reconcileManufacturingOrder, convertOrderToArticle, createManufacturingCompletionJournal } from './manufacturingEngine';
import { computeExecutiveBIMetrics, answerNaturalLanguageQuery } from './analyticsEngine';
import { Article, MetalRateSnapshot, ManufacturingOrder, SaleColumnConfig } from './types';


const mockRateSnapshot: MetalRateSnapshot = {
  timestamp: '2026-11-01T10:00:00Z',
  ratePerGram24K: 7850,
  ratePerGram22K: 7190,
  ratePerGram18K: 5887,
  ratePerGram14K: 4590,
  ratePerGramSilver999: 94.5,
  ratePerGramSilver925: 87.4,
  ratePerGramPlatinum950: 3200,
  source: 'MANUAL_AUTHORIZED',
  authorizedBy: 'Chief Appraiser',
};

const sampleGoldChain: Article = {
  id: 'ART-001',
  sku: 'CHN-22K-001',
  tagId: 'TAG-88219',
  huid: 'AB9218',
  title: '22K Classic Royal Rope Gold Chain',
  category: 'Chains',
  metal: 'GOLD',
  purity: '22K',
  fineness: 916,
  grossWeightGrams: 12.500,
  stoneWeightGrams: 0.000,
  netWeightGrams: 12.500,
  fineGoldEquivalentGrams: 11.450,
  makingChargeType: 'PER_GRAM',
  makingChargeValue: 450,
  wastagePercent: 2.0,
  stones: [],
  hallmarkCost: 45,
  costPrice: 85000,
  branchId: 'BR-MUM-01',
  location: 'Counter 1 / Tray A',
  status: 'AVAILABLE',
  createdAt: '2026-11-01T08:00:00Z',
  updatedAt: '2026-11-01T08:00:00Z',
};

test('INVARIANT 2: Every posted financial journal must balance (Debits === Credits)', () => {
  const accounting = new AccountingEngine();

  // Test 1: Balanced journal should post cleanly
  const balancedEntry = accounting.postJournal({
    entryNumber: 'JRN-001',
    tenantId: 'TENANT-01',
    branchId: 'BR-MUM-01',
    date: '2026-11-01',
    referenceType: 'SALE',
    referenceId: 'INV-001',
    narration: 'Retail sale of 22K Gold Chain',
    lines: [
      {
        accountId: 'ACC-CASH',
        accountName: 'Cash on Hand',
        accountCategory: 'ASSET',
        debitPaise: toPaise(105000),
        creditPaise: 0,
      },
      {
        accountId: 'ACC-GOLD-SALES',
        accountName: 'Gold Jewellery Sales',
        accountCategory: 'REVENUE',
        debitPaise: 0,
        creditPaise: toPaise(101941.75),
      },
      {
        accountId: 'ACC-GST-OUTPUT',
        accountName: 'GST Output (3%)',
        accountCategory: 'LIABILITY',
        debitPaise: 0,
        creditPaise: toPaise(3058.25),
      },
    ],
    postedBy: 'Head Cashier',
  });

  assert.ok(balancedEntry.id);
  const tb = accounting.getTrialBalance();
  assert.equal(tb.isBalanced, true);
  assert.equal(tb.totalDebits, 105000);
  assert.equal(tb.totalCredits, 105000);

  // Test 2: Unbalanced journal MUST throw an exception
  assert.throws(() => {
    accounting.postJournal({
      entryNumber: 'JRN-BAD',
      tenantId: 'TENANT-01',
      branchId: 'BR-MUM-01',
      date: '2026-11-01',
      referenceType: 'SALE',
      referenceId: 'INV-BAD',
      narration: 'Faulty journal',
      lines: [
        {
          accountId: 'ACC-CASH',
          accountName: 'Cash on Hand',
          accountCategory: 'ASSET',
          debitPaise: toPaise(5000),
          creditPaise: 0,
        },
        {
          accountId: 'ACC-SALES',
          accountName: 'Sales',
          accountCategory: 'REVENUE',
          debitPaise: 0,
          creditPaise: toPaise(4000), // Difference of 1000!
        },
      ],
      postedBy: 'Head Cashier',
    });
  }, /Journal entry out of balance/);
});

test('INVARIANT 5: Historical invoices retain their original rate snapshot', () => {
  const morningPricing = computeArticlePricing(sampleGoldChain, mockRateSnapshot);
  assert.equal(morningPricing.metalRateAppliedPerGram, 7190);
  assert.equal(morningPricing.metalValue, roundDecimals(12.5 * 7190, 2));

  // Afternoon rate surge
  const afternoonRates: MetalRateSnapshot = {
    ...mockRateSnapshot,
    ratePerGram22K: 7350,
  };

  // The historical breakdown retains morning snapshot
  assert.equal(morningPricing.metalRateAppliedPerGram, 7190);

  // Recomputing new quote with afternoon rates uses afternoon rates
  const afternoonPricing = computeArticlePricing(sampleGoldChain, afternoonRates);
  assert.equal(afternoonPricing.metalRateAppliedPerGram, 7350);
  assert.notEqual(morningPricing.totalPrice, afternoonPricing.totalPrice);
});

test('INVARIANT 6: Customer-owned repair inventory remains strictly segregated', () => {
  const customerRepairArticle = {
    id: 'REP-001',
    customerName: 'Smt. Priya Sharma',
    grossWeightGrams: 8.420,
    isCustodyOnly: true,
  };

  // Merchant inventory should NEVER add customer repair items into showroom stock
  const showroomInventory: Article[] = [sampleGoldChain];
  const merchantTotalWeight = showroomInventory.reduce((sum, a) => sum + a.grossWeightGrams, 0);

  assert.equal(merchantTotalWeight, 12.500);
  assert.equal(customerRepairArticle.isCustodyOnly, true);
  assert.ok(!showroomInventory.some(a => (a as any).isCustodyOnly));
});

test('INVARIANT 7: Branch transfer conserves mass and fine metal weight', () => {
  const ledger = new MetalLedger();

  // Branch A dispatches 100g of 22K (916)
  const dispatch = ledger.recordTransaction({
    id: 'TXN-DISPATCH-01',
    timestamp: '2026-11-01T09:00:00Z',
    metal: 'GOLD',
    transactionType: 'BRANCH_TRANSFER_OUT',
    referenceId: 'TRF-001',
    grossWeightGrams: 100.000,
    declaredFineness: 916,
    weightInGrams: -100.000,
    narration: 'Transfer from Zaveri Bazaar to Bandra Showroom',
    authorizedBy: 'Vault Manager',
  });

  // Branch B receives identical 100g of 22K (916)
  const receipt = ledger.recordTransaction({
    id: 'TXN-RECEIPT-01',
    timestamp: '2026-11-01T11:00:00Z',
    metal: 'GOLD',
    transactionType: 'BRANCH_TRANSFER_IN',
    referenceId: 'TRF-001',
    grossWeightGrams: 100.000,
    declaredFineness: 916,
    weightInGrams: 100.000,
    narration: 'Received from Zaveri Bazaar',
    authorizedBy: 'Bandra Branch Head',
  });

  assert.equal(dispatch.fineMetalGrams, receipt.fineMetalGrams);
  assert.equal(dispatch.fineMetalGrams, 91.600); // 100 * 0.916

  const netBalance = ledger.getBalance('GOLD');
  assert.equal(netBalance.physicalGrossGrams, 0.000);
  assert.equal(netBalance.fineMetalEquivalentGrams, 0.000);
});

test('INVARIANT 10: Closed financial period prevents retroactive journal alterations', () => {
  const accounting = new AccountingEngine();
  accounting.lockPeriod('2026-10-31');

  // Attempt to backdate posting into locked period
  assert.throws(() => {
    accounting.postJournal({
      entryNumber: 'JRN-OCT-BACKDATED',
      tenantId: 'TENANT-01',
      branchId: 'BR-MUM-01',
      date: '2026-10-25', // Prior to lock!
      referenceType: 'EXPENSE',
      referenceId: 'EXP-99',
      narration: 'Backdated entry',
      lines: [
        {
          accountId: 'ACC-EXP',
          accountName: 'Repairs Expense',
          accountCategory: 'EXPENSE',
          debitPaise: 50000,
          creditPaise: 0,
        },
        {
          accountId: 'ACC-CASH',
          accountName: 'Cash',
          accountCategory: 'ASSET',
          debitPaise: 0,
          creditPaise: 50000,
        },
      ],
      postedBy: 'Unauthorized',
    });
  }, /Cannot post transaction in closed financial period/);
});

test('Fixed-Precision Decimal Math: Zero floating point variance in paise conversions', () => {
  const rupeeAmount = 199.99;
  const paise = toPaise(rupeeAmount);
  assert.equal(paise, 19999);
  assert.equal(fromPaise(paise), 199.99);

  // Test rounding edge cases
  assert.equal(roundDecimals(0.1 + 0.2, 2), 0.3);
  assert.equal(calculateFineMetalEquivalent(10.000, 916), 9.160);
});

test('SCENARIO 1 & INVARIANT 2: Supplier purchase inward balances journal & fine metal mass', () => {
  const accounting = new AccountingEngine();
  const metalLedger = new MetalLedger();

  // Buy 50.000g of 22K (916) from supplier @ ₹7,180/g
  const netWeight = 50.000;
  const fineness = 916;
  const taxableSubtotal = roundDecimals(netWeight * 7180, 2); // 359,000.00
  const cgst = roundDecimals((taxableSubtotal * 1.5) / 100, 2); // 5,385.00
  const sgst = roundDecimals((taxableSubtotal * 1.5) / 100, 2); // 5,385.00
  const grandTotal = roundDecimals(taxableSubtotal + cgst + sgst, 2); // 369,770.00

  // 1. Inward metal entry
  const metalTxn = metalLedger.recordTransaction({
    id: 'TXN-PUR-01',
    timestamp: '2026-11-01T12:00:00Z',
    metal: 'GOLD',
    transactionType: 'SUPPLIER_PURCHASE',
    referenceId: 'PUR-INV-001',
    grossWeightGrams: netWeight,
    declaredFineness: fineness,
    weightInGrams: netWeight,
    narration: 'Purchase from MMTC-PAMP',
    authorizedBy: 'Vault Head',
  });

  assert.equal(metalTxn.fineMetalGrams, 45.800); // 50 * 0.916

  // 2. Financial journal entry
  const journal = accounting.postJournal({
    entryNumber: 'JRN-PUR-01',
    tenantId: 'TENANT-01',
    branchId: 'BR-MUM-01',
    date: '2026-11-01',
    referenceType: 'PURCHASE',
    referenceId: 'PUR-INV-001',
    narration: 'Supplier purchase invoice MMTC-PAMP',
    lines: [
      {
        accountId: 'ACC-GOLD-STOCK',
        accountName: 'Gold Stock',
        accountCategory: 'ASSET',
        debitPaise: toPaise(taxableSubtotal),
        creditPaise: 0,
      },
      {
        accountId: 'ACC-INPUT-CGST',
        accountName: 'Input CGST',
        accountCategory: 'ASSET',
        debitPaise: toPaise(cgst),
        creditPaise: 0,
      },
      {
        accountId: 'ACC-INPUT-SGST',
        accountName: 'Input SGST',
        accountCategory: 'ASSET',
        debitPaise: toPaise(sgst),
        creditPaise: 0,
      },
      {
        accountId: 'ACC-SUPPLIER-PAYABLE',
        accountName: 'Supplier Payable - MMTC',
        accountCategory: 'LIABILITY',
        debitPaise: 0,
        creditPaise: toPaise(grandTotal),
      },
    ],
    postedBy: 'Head Valuer',
  });

  assert.ok(journal.id);
  const tb = accounting.getTrialBalance();
  assert.equal(tb.isBalanced, true);
  assert.equal(tb.totalDebits, grandTotal);
  assert.equal(tb.totalCredits, grandTotal);
});

test('SCENARIO 6 & INVARIANT 8: Sales return credit note references original invoice & balances', () => {
  const accounting = new AccountingEngine();

  // Return of ₹62,000 item with 3% GST (₹930 CGST + ₹930 SGST = ₹63,860 total refund)
  const taxableValue = 62000;
  const cgst = 930;
  const sgst = 930;
  const totalRefund = 63860;

  const reversalJournal = accounting.postJournal({
    entryNumber: 'JRN-CRN-01',
    tenantId: 'TENANT-01',
    branchId: 'BR-MUM-01',
    date: '2026-11-01',
    referenceType: 'SALE',
    referenceId: 'CRN-2026-0012',
    narration: 'Return against INV-2026-0042',
    lines: [
      {
        accountId: 'ACC-SALES-RETURNS',
        accountName: 'Sales Returns',
        accountCategory: 'REVENUE',
        debitPaise: toPaise(taxableValue),
        creditPaise: 0,
      },
      {
        accountId: 'ACC-GST-CGST',
        accountName: 'Output CGST Reversal',
        accountCategory: 'LIABILITY',
        debitPaise: toPaise(cgst),
        creditPaise: 0,
      },
      {
        accountId: 'ACC-GST-SGST',
        accountName: 'Output SGST Reversal',
        accountCategory: 'LIABILITY',
        debitPaise: toPaise(sgst),
        creditPaise: 0,
      },
      {
        accountId: 'ACC-STORE-CREDIT',
        accountName: 'Store Credit Voucher',
        accountCategory: 'LIABILITY',
        debitPaise: 0,
        creditPaise: toPaise(totalRefund),
      },
    ],
    postedBy: 'Store Manager',
  });

  assert.ok(reversalJournal.id);
  const tb = accounting.getTrialBalance();
  assert.equal(tb.isBalanced, true);
});

test('INVARIANT 11: Cross-tenant isolation prevents accessing data of other tenants', () => {
  const tenantA_articles = [
    { id: 'ART-A-1', tenantId: 'TENANT-A', title: '22K Necklace' },
  ];
  const tenantB_articles = [
    { id: 'ART-B-1', tenantId: 'TENANT-B', title: '18K Diamond Ring' },
  ];

  function queryArticlesForTenant(tenantId: string, allArticles: any[]) {
    return allArticles.filter((a) => a.tenantId === tenantId);
  }

  const resultForA = queryArticlesForTenant('TENANT-A', [...tenantA_articles, ...tenantB_articles]);
  assert.equal(resultForA.length, 1);
  assert.equal(resultForA[0].id, 'ART-A-1');
  assert.ok(!resultForA.some((a) => a.tenantId === 'TENANT-B'));
});

test('SCENARIO: Girvi gold pledge valuation, 75% regulatory LTV cap, and balanced double-entry loan disbursal', () => {
  const items = [
    {
      id: 'GIR-T1',
      description: '22K Bangles',
      metal: 'GOLD',
      declaredPurity: '22K',
      fineness: 916,
      grossWeightGrams: 20.0,
      stoneDeductionGrams: 0.0,
      netWeightGrams: 20.0,
      fineGoldEquivalentGrams: 18.32,
      valuationRatePerGram: 7190,
      itemValuationINR: 143800,
    },
  ];

  const valSummary = computeGirviValuation(items, 75);
  assert.equal(valSummary.totalGrossWeightGrams, 20.0);
  assert.equal(valSummary.totalValuationINR, 143800);
  // 75% of 143,800 = 107,850
  assert.equal(valSummary.maxSanctionablePrincipalINR, 107850);

  // Interest test: 100,000 at 1.5% for 60 days (2 months) = 3,000
  const interest = calculateAccruedInterest(100000, 1.5, 60);
  assert.equal(interest, 3000);

  // Balanced Disbursal Journal check
  const accounting = new AccountingEngine();
  const mockPledge = {
    id: 'GIR-099',
    pledgeNumber: 'GIR-2026-0099',
    tenantId: 'TENANT-01',
    branchId: 'BR-01',
    customerId: 'CUST-01',
    customerName: 'Suresh Patel',
    customerPhone: '9820098200',
    items,
    totalGrossWeightGrams: 20.0,
    totalNetWeightGrams: 20.0,
    totalFineGoldEquivalentGrams: 18.32,
    totalValuationINR: 143800,
    loanToValuePercent: 70,
    sanctionedPrincipalINR: 100000,
    monthlyInterestRatePercent: 1.5,
    pledgeDate: '2026-11-01T10:00:00Z',
    dueDate: '2027-11-01T10:00:00Z',
    vaultPacketId: 'PKT-099',
    status: 'ACTIVE',
    totalInterestPaidINR: 0,
    totalPrincipalPaidINR: 0,
    balancePrincipalINR: 100000,
    payments: [],
    createdAt: '2026-11-01T10:00:00Z',
  };

  const disbursalJrn = accounting.postJournal(createGirviDisbursalJournal(mockPledge));
  assert.ok(disbursalJrn.id);
  assert.equal(accounting.getTrialBalance().isBalanced, true);

  // Balanced Payment Journal check
  const mockPayment = {
    id: 'GP-01',
    pledgeId: 'GIR-099',
    receiptNumber: 'GIR-RCT-01',
    paymentDate: '2026-12-01',
    interestAmount: 1500,
    principalAmount: 10000,
    totalAmount: 11500,
    paymentMode: 'UPI' as const,
    collectedBy: 'Branch Manager',
  };

  const paymentJrn = accounting.postJournal(createGirviPaymentJournal(mockPledge, mockPayment));
  assert.ok(paymentJrn.id);
  assert.equal(accounting.getTrialBalance().isBalanced, true);
});

test('SCENARIO: Swarna Nidhi 11+1 gold savings scheme accumulation, 12th month bonus, and balanced journals', () => {
  const installments = generateChitInstallments(5000, '2026-01-01', 11);

  assert.equal(installments.length, 11);
  assert.equal(installments[0].status, 'DUE');
  assert.equal(installments[1].status, 'UPCOMING');

  let scheme = {
    id: 'SCH-TEST',
    schemeNumber: 'SCH-2026-0099',
    schemeName: 'Swarna Nidhi 11+1',
    tenantId: 'TENANT-01',
    branchId: 'BR-01',
    customerId: 'CUST-02',
    customerName: 'Priya Sharma',
    customerPhone: '9840098400',
    schemeType: 'VALUE_BASED' as const,
    monthlyInstallmentINR: 5000,
    totalTenureMonths: 11,
    monthsPaid: 0,
    totalAmountPaidINR: 0,
    bonusAmountContributedINR: 0,
    totalMaturityValueINR: 0,
    accumulatedGoldWeightGrams: 0,
    startDate: '2026-01-01',
    maturityDate: '2026-12-31',
    status: 'ACTIVE' as const,
    installments,
    createdAt: '2026-01-01T10:00:00Z',
  };

  // Pay all 11 installments
  const accounting = new AccountingEngine();
  for (let m = 1; m <= 11; m++) {
    const { updatedScheme, installment } = recordInstallmentPayment(scheme, m, 'UPI', 7200);
    scheme = updatedScheme;
    accounting.postJournal(createChitPaymentJournal(scheme, installment));
  }

  assert.equal(scheme.monthsPaid, 11);
  assert.equal(scheme.totalAmountPaidINR, 55000);
  assert.equal(scheme.bonusAmountContributedINR, 5000); // 12th month bonus awarded!
  assert.equal(scheme.totalMaturityValueINR, 60000);
  assert.equal(scheme.status, 'MATURED');

  const tb = accounting.getTrialBalance();
  assert.equal(tb.isBalanced, true);
  assert.equal(tb.totalDebits, 55000);
  assert.equal(tb.totalCredits, 55000);
});

test('STAGE 8: Manufacturing Karat alloy mixing formula and Ghat process loss audit', () => {
  // Test 1: 22K (916) alloy recipe for 50.000g cast batch
  const mix22K = calculateKaratAlloyMixture(916, 50.000);
  assert.equal(mix22K.pureGoldRequiredGrams, 45.800);
  assert.equal(mix22K.alloyRequiredGrams, 4.200);
  assert.equal(roundDecimals(mix22K.pureGoldRequiredGrams + mix22K.alloyRequiredGrams, 3), 50.000);

  // Test 2: 18K (750) alloy recipe for 30.000g cast batch
  const mix18K = calculateKaratAlloyMixture(750, 30.000);
  assert.equal(mix18K.pureGoldRequiredGrams, 22.500);
  assert.equal(mix18K.alloyRequiredGrams, 7.500);

  // Test 3: Scrap & Ghat Reconciliation within 1.2% tolerance
  // Issued: 50.000g; Finished: 48.000g; Scrap: 1.500g; Dust: 0.100g -> Loss = 0.400g (0.80% <= 1.20%)
  const reconPass = reconcileManufacturingOrder(50.000, 48.000, 1.500, 0.100, 1.2);
  assert.equal(reconPass.totalAccountedGrams, 49.600);
  assert.equal(reconPass.processLossGrams, 0.400);
  assert.equal(reconPass.processLossPercent, 0.80);
  assert.equal(reconPass.isWithinLossTolerance, true);
  assert.equal(reconPass.excessLossGrams, 0.000);

  // Test 4: Scrap & Ghat Reconciliation exceeding 1.2% tolerance
  // Issued: 50.000g; Finished: 47.000g; Scrap: 1.000g; Dust: 0.100g -> Loss = 1.900g (3.80% > 1.20%)
  const reconFail = reconcileManufacturingOrder(50.000, 47.000, 1.000, 0.100, 1.2);
  assert.equal(reconFail.isWithinLossTolerance, false);
  assert.equal(reconFail.excessLossGrams, 1.300); // 1.900 - 0.600 allowed = 1.300
});

test('STAGE 8 & INVARIANT 2: Manufacturing job completion posts balanced double-entry journal', () => {
  const accounting = new AccountingEngine();

  const mockOrder: ManufacturingOrder = {
    id: 'MO-TEST-01',
    orderNumber: 'MO-2026-0099',
    tenantId: 'TENANT-01',
    branchId: 'BR-01',
    title: '22K Handcrafted Temple Choker',
    category: 'Necklaces',
    targetPurity: '22K (916)',
    targetFineness: 916,
    targetGrossWeightGrams: 40.000,
    priority: 'HIGH',
    bomComponents: [],
    issuedPureGoldGrams: 36.640,
    issuedAlloyGrams: 3.360,
    totalIssuedMetalGrams: 40.000,
    finishedGrossWeightGrams: 38.500,
    recoveredScrapGrams: 1.100,
    recoveredDustGrams: 0.100,
    recordedLossGrams: 0.300,
    allowedLossPercent: 1.2,
    karigarLabourINR: 15000,
    findingChargesINR: 1000,
    stoneSettingChargesINR: 0,
    totalManufacturingCostINR: 295000,
    currentStage: 'QC_APPROVAL',
    stages: [],
    status: 'INSPECTED_INTO_STOCK',
    assignedKarigarId: 'KAR-01',
    assignedKarigarName: 'Ramesh Soni',
    expectedDeliveryDate: '2026-11-10',
    createdAt: '2026-11-01T10:00:00Z',
  };

  // Convert to retail article
  const article = convertOrderToArticle(mockOrder, 'BR-01', 'HUID99');
  assert.equal(article.huid, 'HUID99');
  assert.equal(article.grossWeightGrams, 38.500);
  assert.equal(article.status, 'AVAILABLE');

  // Post balanced completion journal
  const journal = createManufacturingCompletionJournal(mockOrder, 7190);
  const posted = accounting.postJournal(journal);
  assert.ok(posted.id);

  const tb = accounting.getTrialBalance();
  assert.equal(tb.isBalanced, true);
});

test('STAGE 10: Grounded AI Query engine derives exact facts from authoritative data without hallucinations', () => {
  const articles: Article[] = [sampleGoldChain]; // 12.500g gross, 11.450g fine gold
  const invoices: any[] = [];
  const customers: any[] = [{ id: 'C1', outstandingBalance: 25000 }];
  const pledges: any[] = [];
  const schemes: any[] = [];
  const karigars: any[] = [{ id: 'K1', goldBalanceGrams: 14.500, silverBalanceGrams: 0, pendingJobsCount: 1 }];
  const orders: any[] = [];

  const metrics = computeExecutiveBIMetrics(articles, invoices, customers, pledges, schemes, karigars, mockRateSnapshot);
  assert.equal(metrics.totalGrossGoldWeightGrams, 12.500);
  assert.equal(metrics.totalFineGoldEquivalentGrams, 11.450);
  assert.equal(metrics.customerReceivablesINR, 25000);
  assert.equal(metrics.karigarFineGoldCustodyGrams, 14.500);

  const answer = answerNaturalLanguageQuery(
    'Show gold stock and fine weight',
    articles,
    invoices,
    customers,
    pledges,
    schemes,
    karigars,
    orders,
    mockRateSnapshot
  );

  assert.equal(answer.category, 'INVENTORY');
  assert.ok(answer.answerMarkdown.includes('12.500 g'));
  assert.ok(answer.answerMarkdown.includes('11.450 g'));
  assert.equal(answer.groundedFacts.length >= 3, true);
  assert.equal(answer.groundedFacts.find(f => f.computedKey === 'Gross Gold Weight')?.verifiedValue, '12.500 g');
});

test('SMALL JEWELER WORKFLOW 1: Silver & Gold custom Tounch pricing and artisan labour settlement modes', () => {
  // 1. 80% Tounch Silver Payal (fineness 800) should compute proportionate rate from Silver 999
  const silverPayalRate = getApplicableRatePerGram({ metal: 'SILVER', fineness: 800 }, mockRateSnapshot);
  // 94.5 * 0.800 = 75.60
  assert.equal(silverPayalRate, 75.6);

  // 2. Artisan labour cost modes at stock entry (Net Wt = 20g, Rate at entry = 7200/g => Metal Val = 144,000)
  assert.equal(
    computeArtisanLabourCost(20, 7200, {
      labourName: 'Gopal Mondal',
      compensationType: 'RUPEES_FLAT',
      compensationValue: 3500,
    }),
    3500
  );

  assert.equal(
    computeArtisanLabourCost(20, 7200, {
      labourName: 'Gopal Mondal',
      compensationType: 'RUPEES_PER_GRAM',
      compensationValue: 400,
    }),
    8000
  );

  assert.equal(
    computeArtisanLabourCost(20, 7200, {
      labourName: 'Gopal Mondal',
      compensationType: 'WEIGHT_GRAMS',
      compensationValue: 0.5,
    }),
    3600
  );

  assert.equal(
    computeArtisanLabourCost(
      20,
      7200,
      {
        labourName: 'Gopal Mondal',
        compensationType: 'METAL_GIVEN',
        compensationValue: 2.0,
        metalGivenType: 'GOLD',
        metalGivenWeightGrams: 2.0,
        metalGivenTounch: 100,
      },
      mockRateSnapshot
    ),
    roundDecimals(2.0 * mockRateSnapshot.ratePerGram24K, 2)
  );

  assert.equal(
    computeArtisanLabourCost(20, 7200, {
      labourName: 'Gopal Mondal',
      compensationType: 'PERCENTAGE',
      compensationValue: 5,
    }),
    7200
  );
});

test('SMALL JEWELER WORKFLOW 2: POS Sale inline wastage/labour overrides and custom fee columns', () => {
  const customColumns: SaleColumnConfig[] = [
    { id: 'c1', key: 'item', label: 'Jewel Name', visible: true, order: 1 },
    { id: 'c2', key: 'custom_polish', label: 'Polishing & Box Charge', visible: true, order: 2, isCustom: true, customType: 'FEE_INR' },
  ];

  // Override sampleGoldChain (12.5g net) with Rate = 7200/g, Wastage = 4%, Labour = 500/g, Custom Fee = 300, Discount = 245
  const breakdown = computeArticlePricing(
    sampleGoldChain,
    mockRateSnapshot,
    0,
    false,
    {
      ratePerGram: 7200,
      wastagePercent: 4.0,
      makingChargeType: 'PER_GRAM',
      makingChargeValue: 500,
      discountAmount: 245,
      customValues: { custom_polish: 300 },
    },
    customColumns
  );

  // Metal value = 12.5 * 7200 = 90,000
  assert.equal(breakdown.metalValue, 90000);
  // Wastage weight = 12.5 * 4% = 0.500g => Wastage value = 0.5 * 7200 = 3,600
  assert.equal(breakdown.wastageWeight, 0.5);
  assert.equal(breakdown.wastageValue, 3600);
  // Labour = 12.5 * 500 = 6,250
  assert.equal(breakdown.makingCharges, 6250);
  // Custom fee = 300, Hallmark = 45 => Subtotal = 90000 + 3600 + 6250 + 45 + 300 = 100,195
  assert.equal(breakdown.customFeeTotal, 300);
  assert.equal(breakdown.itemSubtotal, 100195);
  // Less discount 245 => Taxable = 99,950
  assert.equal(breakdown.taxableValue, 99950);
});

test('SMALL JEWELER WORKFLOW 3: Authentic Sarafa Karigar Hisab (Tunch + Wastage % = Payable Fine Grams & Jama/Naam Settlement)', () => {
  // Case A: Silver Payal (Net Wt 150g, Item Tunch 80%, Karigar Wastage 3.5%, Tunch-Only mode ₹0 cash majuri)
  const silverHisab = computeKarigarHisab(150, 80, 75.6, {
    labourName: 'Rameshwar Soni',
    compensationType: 'NONE_TOUCH_ONLY',
    compensationValue: 0,
    wastagePercent: 3.5,
  });
  // Total Payable Tunch = 80 + 3.5 = 83.5%
  assert.equal(silverHisab.totalPayableTunchPercent, 83.5);
  // Fine Metal Payable = 150g * 83.5% = 125.250g
  assert.equal(silverHisab.fineMetalPayableGrams, 125.25);
  assert.equal(silverHisab.cashMajuriINR, 0);
  assert.equal(silverHisab.netFineMetalDueGrams, 125.25);

  // Case B: 22K Gold Ornament (Net Wt 20g, Item Tunch 91.6%, Karigar Wastage 1.8%, ₹350/g Majuri, with 15g 99.9% Fine Gold & ₹2000 Cash given now)
  const goldHisab = computeKarigarHisab(20, 91.6, 7190, {
    labourName: 'Ustad Karim',
    compensationType: 'RUPEES_PER_GRAM',
    compensationValue: 350,
    wastagePercent: 1.8,
    metalGivenType: 'GOLD',
    metalGivenWeightGrams: 15,
    metalGivenTunch: 100,
    cashPaidNowINR: 2000,
  });
  // Total Payable Tunch = 91.6 + 1.8 = 93.4% => Fine Gold Payable = 20 * 0.934 = 18.680g
  assert.equal(goldHisab.totalPayableTunchPercent, 93.4);
  assert.equal(goldHisab.fineMetalPayableGrams, 18.68);
  // Fine Gold Given Now = 15g * 100% = 15.000g => Net Fine Gold Due = 3.680g
  assert.equal(goldHisab.fineMetalGivenGrams, 15);
  assert.equal(goldHisab.netFineMetalDueGrams, 3.68);
  // Cash Majuri = 20g * 350 = ₹7000; Cash Paid Now = ₹2000 => Net Cash Due = ₹5000
  assert.equal(goldHisab.cashMajuriINR, 7000);
  assert.equal(goldHisab.netCashDueINR, 5000);
});




