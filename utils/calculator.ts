import { type FormData, type CalculationResult, type CashFlow } from '../types';
import { adjustToBusinessDay, isBusinessDay } from './holidays';

// NTN-B pays 6% annual coupon, distributed as 3% semi-annually (simple rate, not compounded)
const SEMI_ANNUAL_COUPON_RATE = 0.03;

// B3 custody fee: 0.20% per year on positions above R$ 10,000
const B3_CUSTODY_FEE_RATE = 0.002; // 0.20% annually
const B3_CUSTODY_FEE_THRESHOLD = 10000;

// Helper to parse a 'YYYY-MM-DD' string into a UTC Date object
function parseDateAsUTC(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  // Month is 0-indexed in JavaScript's Date
  return new Date(Date.UTC(year, month - 1, day));
}

// Helper to get the difference between two dates in days
function getDaysDifference(startDate: Date, endDate: Date): number {
  const msInDay = 1000 * 60 * 60 * 24;
  return (endDate.getTime() - startDate.getTime()) / msInDay;
}

// Helper to get the difference between two dates in years (using actual days)
function getYearDifference(startDate: Date, endDate: Date): number {
  const days = getDaysDifference(startDate, endDate);
  return days / 252; // Using 252 business days per year (Brazilian standard)
}

// Returns the previous coupon date before a given date
function getPreviousCouponDate(date: Date): Date {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();

  // Coupon dates are May 15 (month 4) and Nov 15 (month 10)
  if (month < 4 || (month === 4 && date.getUTCDate() < 15)) {
    // Before May 15, previous coupon is Nov 15 of previous year
    return new Date(Date.UTC(year - 1, 10, 15));
  } else if (month < 10 || (month === 10 && date.getUTCDate() < 15)) {
    // Before Nov 15, previous coupon is May 15 of current year
    return new Date(Date.UTC(year, 4, 15));
  } else {
    // After Nov 15, previous coupon is Nov 15 of current year
    return new Date(Date.UTC(year, 10, 15));
  }
}

// Returns the next coupon date after a given date
function getNextCouponDate(date: Date): Date {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();

  // Coupon dates are May 15 (month 4) and Nov 15 (month 10)
  if (month < 4 || (month === 4 && date.getUTCDate() < 15)) {
    // Before May 15, next coupon is May 15 of current year
    return new Date(Date.UTC(year, 4, 15));
  } else if (month < 10 || (month === 10 && date.getUTCDate() < 15)) {
    // Before Nov 15, next coupon is Nov 15 of current year
    return new Date(Date.UTC(year, 10, 15));
  } else {
    // After Nov 15, next coupon is May 15 of next year
    return new Date(Date.UTC(year + 1, 4, 15));
  }
}

// Generates coupon payment dates (May 15, Nov 15) between two dates using UTC.
// Adjusts dates to next business day if they fall on weekends/holidays
function getCouponDates(startDate: Date, endDate: Date): Date[] {
  const dates: Date[] = [];
  let currentYear = startDate.getUTCFullYear();
  const endYear = endDate.getUTCFullYear();

  while (currentYear <= endYear + 1) {
    // Create coupon dates in UTC to ensure consistency
    const mayCoupon = new Date(Date.UTC(currentYear, 4, 15)); // May is month 4
    const novCoupon = new Date(Date.UTC(currentYear, 10, 15)); // Nov is month 10

    // Compare timestamps to check if coupon is within the investment period
    if (mayCoupon.getTime() > startDate.getTime() && mayCoupon.getTime() <= endDate.getTime()) {
      // Adjust to next business day if needed
      const adjustedMay = adjustToBusinessDay(mayCoupon);
      dates.push(adjustedMay);
    }
    if (novCoupon.getTime() > startDate.getTime() && novCoupon.getTime() <= endDate.getTime()) {
      // Adjust to next business day if needed
      const adjustedNov = adjustToBusinessDay(novCoupon);
      dates.push(adjustedNov);
    }

    currentYear++;
  }
  return dates;
}

// Calculates pro-rata coupon for purchase between coupon dates
function calculateProRataCoupon(
  purchaseDate: Date,
  vnaAtPurchase: number,
  ipcaDecimal: number,
  quantity: number
): { date: Date; amount: number } | null {
  const nextCoupon = getNextCouponDate(purchaseDate);
  const prevCoupon = getPreviousCouponDate(purchaseDate);

  // Check if we should pay a pro-rata coupon
  // Only if purchase is after the previous coupon date
  if (purchaseDate.getTime() <= prevCoupon.getTime()) {
    return null;
  }

  // Days from previous coupon to next coupon (typically ~182 days)
  const totalDays = getDaysDifference(prevCoupon, nextCoupon);

  // Days from previous coupon to purchase date
  const daysSincePrevCoupon = getDaysDifference(prevCoupon, purchaseDate);

  // Days from purchase to next coupon
  const daysUntilNextCoupon = totalDays - daysSincePrevCoupon;

  // Pro-rata factor (portion of the coupon period held)
  const proRataFactor = daysUntilNextCoupon / totalDays;

  // Calculate VNA at next coupon date
  const yearsToNextCoupon = getYearDifference(purchaseDate, nextCoupon);
  const projectedVna = vnaAtPurchase * Math.pow(1 + ipcaDecimal, yearsToNextCoupon);

  // Pro-rata coupon amount
  const proRataCoupon = projectedVna * SEMI_ANNUAL_COUPON_RATE * proRataFactor * quantity;

  return {
    date: adjustToBusinessDay(nextCoupon),
    amount: proRataCoupon
  };
}

export function calculateNTNB(formData: FormData): CalculationResult {
  const {
    quantity,
    purchasePrice,
    projectedIpca,
    purchaseDate,
    maturityDate,
    purchaseRate
  } = formData;

  // Validation
  if (!purchaseDate || !maturityDate) {
    throw new Error('As datas de compra e vencimento são obrigatórias.');
  }

  if (quantity <= 0 || purchasePrice <= 0) {
    throw new Error('Quantidade e preço de compra devem ser positivos.');
  }

  if (purchaseRate < 0) {
    throw new Error('A taxa de compra não pode ser negativa.');
  }

  // Consistently parse all dates as UTC to avoid timezone issues.
  const pDate = parseDateAsUTC(purchaseDate);
  const mDate = parseDateAsUTC(maturityDate);

  if (isNaN(pDate.getTime()) || isNaN(mDate.getTime())) {
    throw new Error('Formato de data inválido. Use o formato AAAA-MM-DD.');
  }

  if (pDate.getTime() >= mDate.getTime()) {
    throw new Error('A data de vencimento deve ser posterior à data de compra.');
  }

  // Validate that dates are business days
  if (!isBusinessDay(pDate)) {
    throw new Error('A data de compra deve ser um dia útil.');
  }

  const ipcaDecimal = projectedIpca / 100;
  const vnaAtPurchase = purchasePrice;
  const totalInvestment = quantity * purchasePrice;

  const cashFlows: Omit<CashFlow, 'cumulativeAmount'>[] = [];
  let totalCouponsValue = 0;

  // Check for pro-rata coupon
  const proRataCoupon = calculateProRataCoupon(pDate, vnaAtPurchase, ipcaDecimal, quantity);
  if (proRataCoupon && proRataCoupon.amount > 0) {
    cashFlows.push({
      date: proRataCoupon.date,
      type: 'Cupom',
      amount: proRataCoupon.amount,
    });
    totalCouponsValue += proRataCoupon.amount;
  }

  // Regular coupon dates
  const couponDates = getCouponDates(pDate, mDate);

  couponDates.forEach(couponDate => {
    // Skip if this is the same as pro-rata coupon date
    if (proRataCoupon && couponDate.getTime() === proRataCoupon.date.getTime()) {
      return; // Already added as pro-rata
    }

    const yearsFromPurchase = getYearDifference(pDate, couponDate);
    const projectedVna = vnaAtPurchase * Math.pow(1 + ipcaDecimal, yearsFromPurchase);
    const couponAmount = projectedVna * SEMI_ANNUAL_COUPON_RATE;

    cashFlows.push({
      date: couponDate,
      type: 'Cupom',
      amount: couponAmount * quantity,
    });
    totalCouponsValue += couponAmount * quantity;
  });

  // Maturity redemption
  const totalYears = getYearDifference(pDate, mDate);
  const finalProjectedVna = vnaAtPurchase * Math.pow(1 + ipcaDecimal, totalYears);
  const redemptionAmount = finalProjectedVna * quantity;

  cashFlows.push({
    date: mDate,
    type: 'Resgate Principal',
    amount: redemptionAmount,
  });

  // Calculate B3 custody fee (annual, deducted from total return)
  let totalCustodyFee = 0;
  if (totalInvestment > B3_CUSTODY_FEE_THRESHOLD) {
    // Apply custody fee on the average position value over the period
    totalCustodyFee = totalInvestment * B3_CUSTODY_FEE_RATE * totalYears;

    // Add custody fee as a negative cash flow (deduction)
    cashFlows.push({
      date: mDate, // Simplified: show fee at maturity
      type: 'Cupom', // Using 'Cupom' type for fee (could extend type definition)
      amount: -totalCustodyFee,
    });
  }

  const grossAmountReturned = totalCouponsValue + redemptionAmount - totalCustodyFee;
  const grossProfit = grossAmountReturned - totalInvestment;
  const annualizedReturn = totalYears > 0
    ? (Math.pow(grossAmountReturned / totalInvestment, 1 / totalYears) - 1) * 100
    : 0;

  // Add cumulative amount to cash flows
  let cumulative = 0;
  const processedCashFlows: CashFlow[] = cashFlows
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map(flow => {
      cumulative += flow.amount;
      return { ...flow, cumulativeAmount: cumulative };
    });

  return {
    totalInvestment,
    grossAmountReturned,
    grossProfit,
    annualizedReturn,
    cashFlows: processedCashFlows,
    formData,
  };
}
