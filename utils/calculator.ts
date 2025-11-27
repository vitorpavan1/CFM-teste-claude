import { type FormData, type CalculationResult, type CashFlow, type BondItem, type PortfolioResult, type ConsolidatedYearlyFlow } from '../types';
import { OFFICIAL_HOLIDAYS } from '../data/holidays';

// Constants
// The annual rate is 6%. The semi-annual coupon is (1.06)^0.5 - 1.
// Value is approx 0.029563014...
const SEMI_ANNUAL_COUPON_RATE = Math.pow(1.06, 0.5) - 1; 

// Helper: Truncate a number to N decimal places without rounding (Floor)
function truncate(value: number, decimals: number): number {
  if (!isFinite(value)) return 0;
  const factor = Math.pow(10, decimals);
  return Math.trunc(value * factor) / factor;
}

// --- Date Helpers ---

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function isWeekend(date: Date): boolean {
  const day = date.getUTCDay();
  return day === 0 || day === 6;
}

function isHoliday(date: Date): boolean {
  const dateStr = date.toISOString().split('T')[0];
  return OFFICIAL_HOLIDAYS.has(dateStr);
}

function getNextBusinessDay(date: Date): Date {
  let current = new Date(date);
  while (isWeekend(current) || isHoliday(current)) {
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return current;
}

// Business Days (Dias Úteis)
function countBusinessDays(startDate: Date, endDate: Date): number {
  if (startDate >= endDate) return 0;
  let count = 0;
  let current = new Date(startDate);
  // Start inclusive, End exclusive
  while (current < endDate) {
    if (!isWeekend(current) && !isHoliday(current)) {
      count++;
    }
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return count;
}

// Calendar Days (Dias Corridos) - Needed for VNA Projection exponent
function countCalendarDays(startDate: Date, endDate: Date): number {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round(Math.abs((startDate.getTime() - endDate.getTime()) / oneDay));
}

function parseDateAsUTC(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

// --- Main Calculation ---

export function calculateNTNB(formData: FormData): CalculationResult {
  const { quantity, vnaPrevious, projectedIpca, purchaseDate, maturityDate, purchaseRate } = formData;
  
  if (!purchaseDate || !maturityDate) throw new Error("Invalid dates");
  
  const pDate = parseDateAsUTC(purchaseDate); // Liquidation Date
  const mDate = parseDateAsUTC(maturityDate); // Maturity Date
  
  if (pDate >= mDate) throw new Error("Data de compra deve ser anterior ao vencimento.");

  // --- Step 1: Calculate Projected VNA (Methodology Section 3) ---
  // VNA_proj = VNA_anterior * (1 + IPCA_proj)^x
  // x = (Calendar Days between Settlement and 15th_Prev) / (Calendar Days between 15th_Next and 15th_Prev)
  
  // Logic to determine reference dates based on Purchase Day
  const pDay = pDate.getUTCDate();
  
  let startReferenceDate: Date;
  let endReferenceDate: Date;
  
  if (pDay >= 15) {
      // If purchase is on/after 15th, Reference is 15th of CURRENT month
      startReferenceDate = new Date(Date.UTC(pDate.getUTCFullYear(), pDate.getUTCMonth(), 15));
      endReferenceDate = new Date(Date.UTC(pDate.getUTCFullYear(), pDate.getUTCMonth() + 1, 15));
  } else {
      // If purchase is before 15th, Reference is 15th of PREVIOUS month
      const prevMonth = new Date(pDate);
      prevMonth.setUTCMonth(prevMonth.getUTCMonth() - 1);
      startReferenceDate = new Date(Date.UTC(prevMonth.getUTCFullYear(), prevMonth.getUTCMonth(), 15));
      endReferenceDate = new Date(Date.UTC(pDate.getUTCFullYear(), pDate.getUTCMonth(), 15));
  }
  
  const daysNumerator = countCalendarDays(startReferenceDate, pDate);
  const daysDenominator = countCalendarDays(startReferenceDate, endReferenceDate);
  
  const exponentX = daysNumerator / daysDenominator;
  
  // IPCA Projected is monthly %. Convert to decimal.
  const ipcaDecimal = projectedIpca / 100;
  
  // VNA Project Calculation
  // VNA_proj_bruto = VNA_Prev * (1 + IPCA)^x
  const vnaProjectedRaw = vnaPrevious * Math.pow(1 + ipcaDecimal, exponentX);
  
  // Truncate VNA to 6 decimals
  const vna = truncate(vnaProjectedRaw, 6);

  // --- Step 2: Determine Coupon Cycle ---
  const maturityMonth = mDate.getUTCMonth(); 
  
  let firstCouponMonth: number;
  let secondCouponMonth: number;

  if (maturityMonth === 1 || maturityMonth === 7) { // Feb/Aug
    firstCouponMonth = 1; 
    secondCouponMonth = 7; 
  } else { // May/Nov
    firstCouponMonth = 4; 
    secondCouponMonth = 10; 
  }

  // --- Step 3: Generate Flows ---
  const flows: { date: Date, type: 'J' | 'P' }[] = [];
  const currentYear = pDate.getUTCFullYear();
  const endYear = mDate.getUTCFullYear();
  
  const potentialDates: Date[] = [];
  for (let y = currentYear; y <= endYear; y++) {
    potentialDates.push(new Date(Date.UTC(y, firstCouponMonth, 15)));
    potentialDates.push(new Date(Date.UTC(y, secondCouponMonth, 15)));
  }
  
  potentialDates.forEach(d => {
    if (d > pDate && d <= mDate) {
      flows.push({ date: getNextBusinessDay(d), type: 'J' });
    }
  });

  const adjustedMaturity = getNextBusinessDay(mDate);
  flows.push({ date: adjustedMaturity, type: 'P' });
  flows.sort((a, b) => a.date.getTime() - b.date.getTime());

  // --- Step 4: Calculate Quotation (Cotação) ---
  let quotationSum = 0;
  const rateDecimal = purchaseRate / 100;
  
  flows.forEach(flow => {
    const du = countBusinessDays(pDate, flow.date);
    const discountDivisor = Math.pow(1 + rateDecimal, du / 252);
    const flowFactor = flow.type === 'J' ? SEMI_ANNUAL_COUPON_RATE : 1.0;
    quotationSum += flowFactor / discountDivisor;
  });

  const quotationPct = truncate(quotationSum * 100, 4);

  // --- Step 5: Calculate Price (PU) ---
  const unitPrice = truncate(vna * (quotationPct / 100), 2);

  // --- Step 6: Generate Output Flows ---
  const cashFlows: CashFlow[] = [];
  let cumulativePV = 0;

  flows.forEach(flow => {
      const du = countBusinessDays(pDate, flow.date);
      
      let futureValue = 0;
      if (flow.type === 'J') {
          futureValue = truncate(vna * SEMI_ANNUAL_COUPON_RATE, 2);
      } else {
          futureValue = truncate(vna, 2);
      }

      // Present Value for display
      const discountDivisor = Math.pow(1 + rateDecimal, du / 252);
      const pv = futureValue / discountDivisor;
      
      cumulativePV += pv;

      cashFlows.push({
          date: flow.date,
          type: flow.type,
          businessDays: du,
          rate: flow.type === 'J' ? SEMI_ANNUAL_COUPON_RATE * 100 : 0,
          futureValue: futureValue * quantity,
          presentValue: pv * quantity,
          cumulativePresentValue: cumulativePV * quantity
      });
  });

  // Derived Totals
  const totalInvestment = unitPrice * quantity;
  const grossAmountReturned = cashFlows.reduce((sum, f) => sum + f.futureValue, 0);
  const grossProfit = grossAmountReturned - totalInvestment;

  // Duration
  let weightedDurationSum = 0;
  let priceForDuration = 0;
  cashFlows.forEach(f => {
      const timeInYears = f.businessDays / 252;
      weightedDurationSum += timeInYears * f.presentValue;
      priceForDuration += f.presentValue;
  });
  const duration = priceForDuration > 0 ? weightedDurationSum / priceForDuration : 0;

  return {
    totalInvestment,
    unitPrice,
    quotation: quotationPct, // Added calculation result
    grossAmountReturned,
    grossProfit,
    duration,
    cashFlows,
    formData,
    calculatedVna: vna
  };
}

export function calculatePortfolio(bonds: BondItem[]): PortfolioResult {
  const individualResults = bonds.map(bond => ({
    ...calculateNTNB(bond),
    id: bond.id,
    name: bond.name
  }));

  const totalInvested = individualResults.reduce((sum, res) => sum + res.totalInvestment, 0);
  const totalReturned = individualResults.reduce((sum, res) => sum + res.grossAmountReturned, 0);
  const totalProfit = totalReturned - totalInvested;

  const yearMap = new Map<number, ConsolidatedYearlyFlow>();

  individualResults.forEach(result => {
    result.cashFlows.forEach(flow => {
      const year = flow.date.getUTCFullYear();
      const existing = yearMap.get(year) || { 
        year, 
        totalValue: 0, 
        couponValue: 0, 
        principalValue: 0, 
        flowCount: 0 
      };

      existing.totalValue += flow.futureValue;
      if (flow.type === 'J') {
        existing.couponValue += flow.futureValue;
      } else {
        existing.principalValue += flow.futureValue;
      }
      existing.flowCount += 1;
      yearMap.set(year, existing);
    });
  });

  const consolidatedFlows = Array.from(yearMap.values()).sort((a, b) => a.year - b.year);

  return {
    individualResults,
    consolidatedFlows,
    totalInvested,
    totalReturned,
    totalProfit
  };
}