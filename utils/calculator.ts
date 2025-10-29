import { type FormData, type CalculationResult, type CashFlow } from '../types';

const SEMI_ANNUAL_COUPON_RATE = Math.pow(1.06, 0.5) - 1;

// Helper to parse a 'YYYY-MM-DD' string into a UTC Date object
function parseDateAsUTC(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  // Month is 0-indexed in JavaScript's Date
  return new Date(Date.UTC(year, month - 1, day));
}

// Helper to get the difference between two dates in years
function getYearDifference(startDate: Date, endDate: Date): number {
  const msInYear = 1000 * 60 * 60 * 24 * 365.25;
  return (endDate.getTime() - startDate.getTime()) / msInYear;
}

// Generates coupon payment dates (May 15, Nov 15) between two dates using UTC.
function getCouponDates(startDate: Date, endDate: Date): Date[] {
  const dates: Date[] = [];
  let currentYear = startDate.getUTCFullYear();
  const endYear = endDate.getUTCFullYear();

  while (currentYear <= endYear) {
    // Create coupon dates in UTC to ensure consistency
    const mayCoupon = new Date(Date.UTC(currentYear, 4, 15)); // May is month 4
    const novCoupon = new Date(Date.UTC(currentYear, 10, 15)); // Nov is month 10

    // Compare timestamps to check if coupon is within the investment period
    if (mayCoupon.getTime() > startDate.getTime() && mayCoupon.getTime() <= endDate.getTime()) {
      dates.push(mayCoupon);
    }
    if (novCoupon.getTime() > startDate.getTime() && novCoupon.getTime() <= endDate.getTime()) {
      dates.push(novCoupon);
    }
    
    currentYear++;
  }
  return dates;
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

  if (!purchaseDate || !maturityDate) {
    throw new Error('As datas de compra e vencimento são obrigatórias.');
  }
  
  if (quantity <= 0 || purchasePrice <= 0) {
    throw new Error('Quantidade e preço de compra devem ser positivos.');
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

  const ipcaDecimal = projectedIpca / 100;
  const vnaAtPurchase = purchasePrice;
  const totalInvestment = quantity * purchasePrice;
  
  const couponDates = getCouponDates(pDate, mDate);
  
  let totalCouponsValue = 0;
  const cashFlows: Omit<CashFlow, 'cumulativeAmount'>[] = [];
  
  couponDates.forEach(couponDate => {
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

  const totalYears = getYearDifference(pDate, mDate);
  const finalProjectedVna = vnaAtPurchase * Math.pow(1 + ipcaDecimal, totalYears);
  const redemptionAmount = finalProjectedVna * quantity;
  
  cashFlows.push({
    date: mDate,
    type: 'Resgate Principal',
    amount: redemptionAmount,
  });

  const grossAmountReturned = totalCouponsValue + redemptionAmount;
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