/**
 * AURIC Fixed-Precision Decimal Arithmetic
 * Eliminates IEEE 754 floating point drift for money and precious metal weights.
 */

/**
 * Rounds a number to a specified number of decimal places strictly using Math.round with integer scaling.
 */
export function roundDecimals(value: number, decimals = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

/**
 * Converts INR rupees to integer paise (1 Rupee = 100 paise)
 */
export function toPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

/**
 * Converts integer paise back to Rupee float with 2 decimal precision
 */
export function fromPaise(paise: number): number {
  return roundDecimals(paise / 100, 2);
}

/**
 * Formats a monetary value to Indian currency format (e.g. ₹1,45,200.00)
 */
export function formatCurrencyINR(amount: number): string {
  const rounded = roundDecimals(amount, 2);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rounded);
}

/**
 * Formats weight in grams with 3 decimal places (milligrams precision e.g. "12.450 g")
 */
export function formatWeightGrams(grams: number): string {
  const rounded = roundDecimals(grams, 3);
  return `${rounded.toFixed(3)} g`;
}

/**
 * Calculates theoretical fine metal content (e.g. 24K equivalent)
 * Fine Weight = Net Weight * (Fineness / 1000)
 */
export function calculateFineMetalEquivalent(netWeightGrams: number, fineness: number): number {
  const fineGrams = netWeightGrams * (fineness / 1000);
  return roundDecimals(fineGrams, 3);
}

/**
 * Calculates GST components (CGST + SGST or IGST) based on taxable value
 */
export function calculateGst(taxableValue: number, gstRatePercent = 3.0, isInterState = false) {
  const totalTax = roundDecimals((taxableValue * gstRatePercent) / 100, 2);
  
  if (isInterState) {
    return {
      cgst: 0,
      sgst: 0,
      igst: totalTax,
      totalGst: totalTax,
    };
  }

  // Intra-state split 50/50 (e.g. 1.5% CGST and 1.5% SGST)
  const halfTax = roundDecimals(totalTax / 2, 2);
  const otherHalf = roundDecimals(totalTax - halfTax, 2);

  return {
    cgst: halfTax,
    sgst: otherHalf,
    igst: 0,
    totalGst: totalTax,
  };
}
