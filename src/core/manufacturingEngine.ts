/**
 * AURIC Jewellery Manufacturing & Job Card Engine
 * Stage 8: Bill of Materials, Karat Alloy Calculations, 7-Stage WIP Tracking,
 * Scrap/Ghat Recovery & Balanced Double-Entry Finished Goods Posting.
 */

import { ManufacturingOrder, BOMComponent, ProductionStageName, Article } from './types';
import { roundDecimals, toPaise } from './math';
import { JournalEntry } from './accountingEngine';

export interface KaratAlloyFormula {
  targetFineness: number;
  pureGoldRequiredGrams: number;
  alloyRequiredGrams: number;
  goldPercentage: number;
  alloyPercentage: number;
}

/**
 * Calculates precise pure 24K bullion vs Master Alloy (Copper + Silver) mixture
 * required to cast a specified target karat batch.
 */
export function calculateKaratAlloyMixture(
  targetFineness: number,
  targetGrossWeightGrams: number
): KaratAlloyFormula {
  const safeFineness = Math.max(100, Math.min(1000, targetFineness));
  const goldRatio = safeFineness / 1000;
  const alloyRatio = 1 - goldRatio;

  const pureGoldRequiredGrams = roundDecimals(targetGrossWeightGrams * goldRatio, 3);
  const alloyRequiredGrams = roundDecimals(targetGrossWeightGrams * alloyRatio, 3);

  return {
    targetFineness: safeFineness,
    pureGoldRequiredGrams,
    alloyRequiredGrams,
    goldPercentage: roundDecimals(goldRatio * 100, 2),
    alloyPercentage: roundDecimals(alloyRatio * 100, 2),
  };
}

export interface ManufacturingReconciliationResult {
  totalIssuedGrams: number;
  finishedGrossWeightGrams: number;
  recoveredScrapGrams: number;
  recoveredDustGrams: number;
  totalAccountedGrams: number;
  processLossGrams: number;
  processLossPercent: number;
  allowedLossGrams: number;
  isWithinLossTolerance: boolean;
  excessLossGrams: number;
}

/**
 * Reconciles workshop output vs issued raw metal.
 * Identifies exact Ghat (Process Loss) and checks against allowed workshop tolerance.
 */
export function reconcileManufacturingOrder(
  totalIssuedGrams: number,
  finishedGrossWeightGrams: number,
  recoveredScrapGrams: number,
  recoveredDustGrams: number,
  allowedLossPercent: number = 1.2
): ManufacturingReconciliationResult {
  const totalAccountedGrams = roundDecimals(
    finishedGrossWeightGrams + recoveredScrapGrams + recoveredDustGrams,
    3
  );

  const processLossGrams = Math.max(0, roundDecimals(totalIssuedGrams - totalAccountedGrams, 3));
  const processLossPercent = totalIssuedGrams > 0 
    ? roundDecimals((processLossGrams / totalIssuedGrams) * 100, 2)
    : 0;

  const allowedLossGrams = roundDecimals((totalIssuedGrams * allowedLossPercent) / 100, 3);
  const isWithinLossTolerance = processLossGrams <= allowedLossGrams;
  const excessLossGrams = Math.max(0, roundDecimals(processLossGrams - allowedLossGrams, 3));

  return {
    totalIssuedGrams,
    finishedGrossWeightGrams,
    recoveredScrapGrams,
    recoveredDustGrams,
    totalAccountedGrams,
    processLossGrams,
    processLossPercent,
    allowedLossGrams,
    isWithinLossTolerance,
    excessLossGrams,
  };
}

/**
 * Transforms a completed manufacturing job card into a showroom-ready retail article
 * with generated SKU, Tag, and BIS Hallmarking HUID.
 */
export function convertOrderToArticle(
  order: ManufacturingOrder,
  branchId: string,
  huid?: string
): Article {
  const finishedWeight = order.finishedGrossWeightGrams || order.targetGrossWeightGrams;
  const tagSeq = Math.floor(10000 + Math.random() * 90000);
  const skuPrefix = order.category.substring(0, 3).toUpperCase();
  const safeHuid = huid || `BIS${Math.floor(1000 + Math.random() * 9000)}`;

  const fineGoldEquivalent = roundDecimals(finishedWeight * (order.targetFineness / 1000), 3);

  return {
    id: `ART-MFG-${order.id}`,
    sku: `${skuPrefix}-${order.targetPurity.slice(0, 3)}-${tagSeq}`,
    tagId: `TAG-M-${tagSeq}`,
    huid: safeHuid,
    title: order.title,
    category: order.category,
    metal: 'GOLD',
    purity: order.targetPurity,
    fineness: order.targetFineness,
    grossWeightGrams: finishedWeight,
    stoneWeightGrams: 0,
    netWeightGrams: finishedWeight,
    fineGoldEquivalentGrams: fineGoldEquivalent,
    makingChargeType: 'PER_GRAM',
    makingChargeValue: 480, // Showroom making rate per gram
    wastagePercent: 2.5,
    stones: [],
    hallmarkCost: 45,
    costPrice: order.totalManufacturingCostINR,
    branchId: branchId,
    location: 'Counter 1 / New Workshop Additions',
    status: 'AVAILABLE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Creates balanced double-entry accounting journal for job card completion:
 * Dr Showroom Inventory (Finished Asset)
 * Dr Workshop Ghat Loss Expense (if any process loss)
 * Cr WIP Metal Inventory (Released from WIP)
 * Cr Karigar Labour Payable (Artisan compensation liability)
 */
export function createManufacturingCompletionJournal(
  order: ManufacturingOrder,
  metalRatePerGram: number = 7190
): Omit<JournalEntry, 'id'> {
  const finishedWeight = order.finishedGrossWeightGrams || order.targetGrossWeightGrams;
  const scrapWeight = (order.recoveredScrapGrams || 0) + (order.recoveredDustGrams || 0);
  const lossWeight = order.recordedLossGrams || 0;

  // Valuation in INR
  const finishedMetalValue = roundDecimals(finishedWeight * metalRatePerGram, 2);
  const scrapValue = roundDecimals(scrapWeight * metalRatePerGram, 2);
  const lossValue = roundDecimals(lossWeight * metalRatePerGram, 2);
  const labourPayable = roundDecimals(order.karigarLabourINR, 2);

  // Total finished good capital value = finished metal + labour
  const totalFinishedAssetVal = roundDecimals(finishedMetalValue + labourPayable, 2);
  const totalIssuedMetalVal = roundDecimals(order.totalIssuedMetalGrams * metalRatePerGram, 2);

  return {
    entryNumber: `JRN-MFG-${order.orderNumber}`,
    tenantId: order.tenantId,
    branchId: order.branchId,
    date: new Date().toISOString().slice(0, 10),
    referenceType: 'STOCK_ADJUSTMENT',
    referenceId: order.orderNumber,
    narration: `Manufacturing completion & showroom receipt for ${order.orderNumber} (${order.title})`,
    lines: [
      {
        accountId: 'ACC-GOLD-STOCK',
        accountName: 'Gold Showroom Inventory (Finished Articles)',
        accountCategory: 'ASSET',
        debitPaise: toPaise(totalFinishedAssetVal),
        creditPaise: 0,
      },
      ...(scrapValue > 0
        ? [
            {
              accountId: 'ACC-SCRAP-GOLD',
              accountName: 'Recovered Scrap & Casting Polish Dust',
              accountCategory: 'ASSET' as const,
              debitPaise: toPaise(scrapValue),
              creditPaise: 0,
            },
          ]
        : []),
      ...(lossValue > 0
        ? [
            {
              accountId: 'ACC-MFG-GHAT-LOSS',
              accountName: 'Workshop Process Loss (Ghat/Tunch Loss)',
              accountCategory: 'EXPENSE' as const,
              debitPaise: toPaise(lossValue),
              creditPaise: 0,
            },
          ]
        : []),
      {
        accountId: 'ACC-WIP-INVENTORY',
        accountName: 'Work-in-Progress (WIP) Karigar Metal Allocation',
        accountCategory: 'ASSET',
        debitPaise: 0,
        creditPaise: toPaise(totalIssuedMetalVal),
      },
      {
        accountId: 'ACC-KARIGAR-PAYABLE',
        accountName: `Karigar Labour Payable — ${order.assignedKarigarName}`,
        accountCategory: 'LIABILITY',
        debitPaise: 0,
        creditPaise: toPaise(labourPayable),
      },
    ],
    postedBy: 'Head of Manufacturing',
  };
}
