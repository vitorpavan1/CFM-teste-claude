import React from 'react';
import { type CalculationResult, type CashFlow } from '../types';
import { Card } from './ui/Card';
import { ResultsChart } from './ResultsChart';
import { ChartBarIcon, CurrencyDollarIcon, TrendingUpIcon, CalendarIcon } from './Icons';

const formatCurrency = (value: number) => {
  if (typeof value !== 'number' || !isFinite(value)) {
    return 'N/A';
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const formatDate = (date: Date) => {
  // Display dates in UTC to match the calculation timezone and avoid off-by-one day errors.
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(date);
};

const MetricCard: React.FC<{ title: string; value: string; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
  <div className={`p-4 rounded-lg bg-gray-800 border-l-4 ${color}`}>
    <div className="flex items-center">
      <div className="mr-4 text-2xl">{icon}</div>
      <div>
        <p className="text-sm text-gray-400">{title}</p>
        <p className="text-lg font-bold text-white">{value}</p>
      </div>
    </div>
  </div>
);

export function ResultsDisplay({ result }: { result: CalculationResult }): React.ReactElement {
  const annualizedReturnText = isFinite(result.annualizedReturn) 
    ? `${result.annualizedReturn.toFixed(2)}%` 
    : 'N/A';

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-xl font-semibold text-white mb-4">Resumo da Projeção</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <MetricCard title="Investimento Total" value={formatCurrency(result.totalInvestment)} icon={<CurrencyDollarIcon className="text-blue-400" />} color="border-blue-500" />
          <MetricCard title="Valor Bruto Resgatado" value={formatCurrency(result.grossAmountReturned)} icon={<TrendingUpIcon className="text-green-400" />} color="border-green-500" />
          <MetricCard title="Lucro Bruto" value={formatCurrency(result.grossProfit)} icon={<ChartBarIcon className="text-amber-400" />} color="border-amber-500" />
          <MetricCard title="Rentabilidade Anualizada" value={annualizedReturnText} icon={<CalendarIcon className="text-purple-400" />} color="border-purple-500" />
        </div>
        <p className="text-xs text-gray-500 mt-4">* O cálculo assume que o Preço de Compra é o VNA na data da compra. A rentabilidade é uma projeção e não considera impostos.</p>
      </Card>
      
      <Card>
        <h2 className="text-xl font-semibold text-white mb-4">Projeção do Fluxo de Caixa</h2>
        <div className="max-h-60 overflow-y-auto pr-2">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-gray-800">
              <tr>
                <th className="p-2 text-sm font-semibold text-gray-300">Data</th>
                <th className="p-2 text-sm font-semibold text-gray-300">Tipo</th>
                <th className="p-2 text-sm font-semibold text-gray-300 text-right">Valor Bruto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {result.cashFlows.map((flow, index) => (
                <tr key={index} className="hover:bg-gray-700/50">
                  <td className="p-2">{formatDate(flow.date)}</td>
                  <td className="p-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${flow.type === 'Cupom' ? 'bg-blue-900 text-blue-300' : 'bg-green-900 text-green-300'}`}>
                      {flow.type}
                    </span>
                  </td>
                  <td className="p-2 font-mono text-right">{formatCurrency(flow.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-semibold text-white mb-4">Retorno Bruto Acumulado</h2>
        <div className="h-64">
           <ResultsChart cashFlows={result.cashFlows} purchaseDate={result.formData.purchaseDate} />
        </div>
      </Card>
    </div>
  );
}