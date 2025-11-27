
export interface FormData {
  quantity: number;
  purchaseDate: string;
  maturityDate: string;
  purchaseRate: number; // The Yield (Taxa de compra)
  
  // New VNA Calculation Fields
  vnaPrevious: number; // VNA of the 15th of previous month
  projectedIpca: number; // Monthly inflation projection (%)
}

export interface BondItem extends FormData {
  id: string;
  name?: string; // Optional user-friendly name (e.g. "Aposentadoria 2055")
}

export interface CashFlow {
  date: Date;
  type: 'J' | 'P'; // J = Juros (Coupon), P = Principal
  businessDays: number;
  rate: number; // The coupon rate used for FV calculation (approx 2.956%)
  futureValue: number; // Nominal value
  presentValue: number; // Discounted value
  cumulativePresentValue: number; // For charts
}

export interface CalculationResult {
  totalInvestment: number; // Derived from PU * quantity
  unitPrice: number; // PU Operação
  quotation: number; // Cotação do Título (%) - NEW FIELD
  grossAmountReturned: number; // Sum of Future Values
  grossProfit: number; 
  duration: number; // Macaulay Duration (optional, but good for completeness)
  cashFlows: CashFlow[];
  formData: FormData;
  calculatedVna: number; // The final projected VNA used
}

export interface ConsolidatedYearlyFlow {
  year: number;
  totalValue: number;
  couponValue: number;
  principalValue: number;
  flowCount: number;
}

export interface PortfolioResult {
  individualResults: (CalculationResult & { id: string; name?: string })[];
  consolidatedFlows: ConsolidatedYearlyFlow[];
  totalInvested: number;
  totalReturned: number;
  totalProfit: number;
}
