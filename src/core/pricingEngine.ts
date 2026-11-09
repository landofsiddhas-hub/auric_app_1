/**
 * AURIC Deterministic Jewellery Pricing Engine
 * Computes transparent, auditable price breakdowns based on live metal rates,
 * making charges, wastage, stones, hallmark, discounts, and GST.
 */

import {
  Article,
  ArtisanLabourRecord,
  CartItemOverride,
  MetalRateSnapshot,
  PricingBreakdown,
  SaleColumnConfig,
} from './types';
import { roundDecimals, calculateFineMetalEquivalent, calculateGst } from './math';

export function getApplicableRatePerGram(article: Pick<Article, 'metal' | 'fineness'>, rates: MetalRateSnapshot): number {
  if (article.metal === 'GOLD') {
    if (article.fineness >= 995) return rates.ratePerGram24K;
    if (article.fineness === 916) return rates.ratePerGram22K;
    if (article.fineness === 750) return rates.ratePerGram18K;
    if (article.fineness === 585) return rates.ratePerGram14K;
    // Proportionate Tunch calculation for 20K (833) or custom Gold Tunch %
    return roundDecimals((rates.ratePerGram24K * article.fineness) / 1000, 2);
  }

  if (article.metal === 'SILVER') {
    if (article.fineness >= 999) return rates.ratePerGramSilver999;
    if (article.fineness === 925) return rates.ratePerGramSilver925;
    // Proportionate Tunch calculation for 80% (800), 75% (750), 70% (700) or custom Silver Tunch
    return roundDecimals((rates.ratePerGramSilver999 * article.fineness) / 1000, 2);
  }

  if (article.metal === 'PLATINUM') {
    return rates.ratePerGramPlatinum950;
  }

  return 0;
}

export interface KarigarHisabBreakdown {
  itemTunchPercent: number;
  karigarWastagePercent: number;
  totalPayableTunchPercent: number;
  itemFineWeightGrams: number;
  karigarWastageFineGrams: number;
  extraWeightLabourGrams: number;
  totalFineMetalPayableGrams: number;
  fineMetalPayableGrams: number;
  fineMetalGivenGrams: number;
  netFineMetalDueGrams: number;
  cashMajuriINR: number;
  cashPaidNowINR: number;
  netCashDueINR: number;
  totalAcquisitionLabourAndWastageINR: number;
}

/**
 * Authentic Indian Sarafa Karigar Hisab (Jama / Naam) Calculator:
 * Separates:
 * 1. Metal & Wastage Hisab: Total Payable Tunch % = Item Tunch % + Karigar Wastage %
 *    -> Total Fine Metal Payable (g) = Net Weight * (Item Tunch + Karigar Wastage) / 100 (+ any extra gram labour)
 * 2. Cash Majuri (Making Charge): ₹0 (Tunch-only), ₹/g, ₹ Flat (Piece/Jodi), or % of Metal Value
 * 3. Immediate Settlement at Entry: Fine Metal Given Now (g) & Cash Paid Now (₹) vs Net Balance Due
 */
export function computeKarigarHisab(
  netWeightGrams: number,
  itemTunchPercent: number,
  rateAtEntryPerGram: number,
  labour: Partial<ArtisanLabourRecord> & {
    labourWastagePercent?: number;
    compensationType?: string;
    compensationValue?: number;
    metalGivenTounch?: number;
  },
  rates?: MetalRateSnapshot
): KarigarHisabBreakdown {
  const karigarWastagePercent = labour.wastagePercent ?? labour.labourWastagePercent ?? 0;
  const mode = (labour.compensationType ?? labour.labourRateType ?? 'RUPEES_PER_GRAM') as string;
  const rateVal = labour.compensationValue ?? labour.labourRateValue ?? 0;

  const totalPayableTunchPercent = roundDecimals(itemTunchPercent + karigarWastagePercent, 2);

  const itemFineWeightGrams = roundDecimals((netWeightGrams * itemTunchPercent) / 100, 3);
  const karigarWastageFineGrams = roundDecimals((netWeightGrams * karigarWastagePercent) / 100, 3);
  const extraWeightLabourGrams =
    mode === 'WEIGHT_GRAMS' ? roundDecimals(rateVal, 3) : 0;

  const totalFineMetalPayableGrams = roundDecimals(
    itemFineWeightGrams + karigarWastageFineGrams + extraWeightLabourGrams,
    3
  );

  const givenTunch = labour.metalGivenTunch ?? labour.metalGivenTounch ?? 99.9;
  const givenGrossGrams =
    labour.metalGivenType && labour.metalGivenType !== 'NONE'
      ? labour.metalGivenWeightGrams || 0
      : mode === 'METAL_GIVEN'
      ? labour.metalGivenWeightGrams ?? rateVal
      : 0;
  const fineMetalGivenGrams = roundDecimals((givenGrossGrams * givenTunch) / 100, 3);
  const netFineMetalDueGrams = roundDecimals(totalFineMetalPayableGrams - fineMetalGivenGrams, 3);

  const metalValueAtEntry = roundDecimals(netWeightGrams * rateAtEntryPerGram, 2);
  let cashMajuriINR = 0;
  switch (mode) {
    case 'NONE_TOUCH_ONLY':
      cashMajuriINR = 0;
      break;
    case 'RUPEES_FLAT':
      cashMajuriINR = roundDecimals(rateVal, 2);
      break;
    case 'RUPEES_PER_GRAM':
      cashMajuriINR = roundDecimals(netWeightGrams * rateVal, 2);
      break;
    case 'PERCENTAGE':
      cashMajuriINR = roundDecimals((metalValueAtEntry * rateVal) / 100, 2);
      break;
    case 'WEIGHT_GRAMS':
    case 'METAL_GIVEN':
    default:
      cashMajuriINR = 0;
      break;
  }

  const cashPaidNowINR = roundDecimals(labour.cashPaidNowINR || 0, 2);
  const netCashDueINR = roundDecimals(cashMajuriINR - cashPaidNowINR, 2);

  // Fine rate per gram for valuing Karigar wastage / weight labour in INR acquisition cost
  let pureRatePerGram = itemTunchPercent > 0 ? (rateAtEntryPerGram * 100) / itemTunchPercent : rateAtEntryPerGram;
  if (rates) {
    if (labour.metalGivenType === 'GOLD') pureRatePerGram = rates.ratePerGram24K;
    else if (labour.metalGivenType === 'SILVER') pureRatePerGram = rates.ratePerGramSilver999;
  }

  const wastageAndWeightValueINR = roundDecimals(
    (karigarWastageFineGrams + extraWeightLabourGrams) * pureRatePerGram,
    2
  );
  const totalAcquisitionLabourAndWastageINR = roundDecimals(cashMajuriINR + wastageAndWeightValueINR, 2);

  return {
    itemTunchPercent,
    karigarWastagePercent,
    totalPayableTunchPercent,
    itemFineWeightGrams,
    karigarWastageFineGrams,
    extraWeightLabourGrams,
    totalFineMetalPayableGrams,
    fineMetalPayableGrams: totalFineMetalPayableGrams,
    fineMetalGivenGrams,
    netFineMetalDueGrams,
    cashMajuriINR,
    cashPaidNowINR,
    netCashDueINR,
    totalAcquisitionLabourAndWastageINR,
  };
}

/**
 * Computes the INR equivalent cost of artisan/karigar labour at the time of stock entry
 */
export function computeArtisanLabourCost(
  netWeightGrams: number,
  rateAtEntryPerGram: number,
  labour: ArtisanLabourRecord,
  rates?: MetalRateSnapshot
): number {
  const metalValueAtEntry = roundDecimals(netWeightGrams * rateAtEntryPerGram, 2);

  switch (labour.compensationType) {
    case 'NONE_TOUCH_ONLY':
      return 0;
    case 'RUPEES_FLAT':
      return roundDecimals(labour.compensationValue || 0, 2);
    case 'RUPEES_PER_GRAM':
      return roundDecimals(netWeightGrams * (labour.compensationValue || 0), 2);
    case 'WEIGHT_GRAMS':
      return roundDecimals((labour.compensationValue || 0) * rateAtEntryPerGram, 2);
    case 'METAL_GIVEN': {
      const givenGrams = labour.metalGivenWeightGrams ?? labour.compensationValue ?? 0;
      const tunchRatio = (labour.metalGivenTunch ?? labour.metalGivenTounch ?? 100) / 100;
      let baseMetalRate = rateAtEntryPerGram;
      if (rates && labour.metalGivenType === 'GOLD') {
        baseMetalRate = rates.ratePerGram24K * tunchRatio;
      } else if (rates && labour.metalGivenType === 'SILVER') {
        baseMetalRate = rates.ratePerGramSilver999 * tunchRatio;
      }
      return roundDecimals(givenGrams * baseMetalRate, 2);
    }
    case 'PERCENTAGE':
      return roundDecimals((metalValueAtEntry * (labour.compensationValue || 0)) / 100, 2);
    default:
      return 0;
  }
}

export function computeArticlePricing(
  article: Article,
  rateSnapshot: MetalRateSnapshot,
  discountAmount = 0,
  isInterState = false,
  overrides?: CartItemOverride,
  customColumns?: SaleColumnConfig[]
): PricingBreakdown {
  const boardRate = getApplicableRatePerGram(article, rateSnapshot);
  const applicableRate =
    overrides?.ratePerGram !== undefined && overrides.ratePerGram > 0
      ? overrides.ratePerGram
      : boardRate;

  const netWeight = roundDecimals(article.grossWeightGrams - article.stoneWeightGrams, 3);
  const fineWeight = calculateFineMetalEquivalent(netWeight, article.fineness);
  const tounchPercent = article.tounchPercent ?? roundDecimals(article.fineness / 10, 2);

  // 1. Metal Value
  const metalValue = roundDecimals(netWeight * applicableRate, 2);

  // 2. Wastage (supports POS override or article default)
  const effectiveWastagePercent =
    overrides?.wastagePercent !== undefined ? overrides.wastagePercent : article.wastagePercent || 0;
  const wastageWeight = roundDecimals((netWeight * effectiveWastagePercent) / 100, 3);
  const wastageValue = roundDecimals(wastageWeight * applicableRate, 2);

  // 3. Making / Labour Charges (supports POS override or article default)
  const effectiveMakingType = overrides?.makingChargeType ?? article.makingChargeType;
  const effectiveMakingVal =
    overrides?.makingChargeValue !== undefined
      ? overrides.makingChargeValue
      : article.makingChargeValue;

  let makingCharges = 0;
  if (effectiveMakingType === 'PER_GRAM') {
    makingCharges = roundDecimals(netWeight * effectiveMakingVal, 2);
  } else if (effectiveMakingType === 'PERCENTAGE') {
    makingCharges = roundDecimals((metalValue * effectiveMakingVal) / 100, 2);
  } else if (effectiveMakingType === 'FIXED') {
    makingCharges = roundDecimals(effectiveMakingVal, 2);
  }

  // 4. Stones Value
  const stonesValue = (article.stones || []).reduce((sum, s) => sum + (s.totalPrice || 0), 0);

  // 5. Hallmark charges
  const hallmarkCharges = article.hallmarkCost !== undefined ? article.hallmarkCost : 45;

  // 6. Custom Fee Columns (any visible custom column with customType === 'FEE_INR')
  let customFeeTotal = 0;
  if (overrides?.customValues && customColumns) {
    for (const col of customColumns) {
      if (col.isCustom && col.customType === 'FEE_INR' && col.visible) {
        const val = Number(overrides.customValues[col.key]) || 0;
        customFeeTotal = roundDecimals(customFeeTotal + val, 2);
      }
    }
  }

  // 7. Subtotal
  const itemSubtotal = roundDecimals(
    metalValue + wastageValue + makingCharges + stonesValue + hallmarkCharges + customFeeTotal,
    2
  );

  // 8. Discount & Taxable Value
  const rawDiscount = overrides?.discountAmount !== undefined ? overrides.discountAmount : discountAmount;
  const effectiveDiscount = Math.min(Math.max(0, rawDiscount), itemSubtotal);
  const taxableValue = roundDecimals(itemSubtotal - effectiveDiscount, 2);

  // 9. GST (Standard 3% for Jewellery under HSN 7113)
  const gstBreakdown = calculateGst(taxableValue, 3.0, isInterState);

  // 10. Final Gross Total for item
  const totalPrice = roundDecimals(taxableValue + gstBreakdown.totalGst, 2);

  return {
    articleId: article.id,
    title: article.title,
    category: article.category,
    tagId: article.tagId,
    huid: article.huid,
    metal: article.metal,
    purity: article.purity,
    tounchPercent,
    grossWeight: article.grossWeightGrams,
    stoneWeight: article.stoneWeightGrams,
    netWeight,
    fineWeight,
    metalRateAppliedPerGram: applicableRate,
    rateAtEntryPerGram: article.rateAtEntryPerGram,
    metalValue,
    wastagePercent: effectiveWastagePercent,
    wastageWeight,
    wastageValue,
    makingChargeType: effectiveMakingType,
    makingChargeRate: effectiveMakingVal,
    makingCharges,
    stonesValue,
    hallmarkCharges,
    customFeeTotal,
    customValues: overrides?.customValues,
    labourName: article.labourDetails?.labourName,
    itemSubtotal,
    discountAmount: effectiveDiscount,
    taxableValue,
    gstRatePercent: 3.0,
    cgstAmount: gstBreakdown.cgst,
    sgstAmount: gstBreakdown.sgst,
    igstAmount: gstBreakdown.igst,
    totalPrice,
  };
}
