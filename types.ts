
export interface FormData {
  quantity: number;
  purchasePrice: number;
  projectedIpca: number;
  purchaseDate: string;
  maturityDate: string;
  purchaseRate: number;
}

export interface CashFlow {
  date: Date;
  type: 'Cupom' | 'Resgate Principal';
  amount: number;
  cumulativeAmount: number;
}

export interface CalculationResult {
  totalInvestment: number;
  grossAmountReturned: number;
  grossProfit: number;
  annualizedReturn: number;
  cashFlows: CashFlow[];
  formData: FormData;
}
