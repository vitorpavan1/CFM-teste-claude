
import React from 'react';
import { type CalculationResult } from '../types';
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
    minimumFractionDigits: 6,
    maximumFractionDigits: 6,
  }).format(value);
};

const formatRate = (value: number) => {
   return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(value);
};

const formatQuotation = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
   minimumFractionDigits: 4,
   maximumFractionDigits: 4,
 }).format(value) + '%';
};

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(date);
};

const MetricCard: React.FC<{ title: string; value: string; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
  <div className={`p-4 rounded-lg bg-gray-800 border-l-4 ${color}`}>
    <div className="flex items-center">
      <div className="mr-4 text-2xl">{icon}</div>
      <div className="overflow-hidden">
        <p className="text-sm text-gray-400 whitespace-nowrap">{title}</p>
        <p className="text-lg font-bold text-white truncate" title={value}>{value}</p>
      </div>
    </div>
  </div>
);

export function ResultsDisplay({ result }: { result: CalculationResult }): React.ReactElement {
  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-xl font-semibold text-white mb-4">Resultado da Precificação</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <MetricCard 
            title="Preço Unitário (PU)" 
            value={formatCurrency(result.unitPrice)} 
            icon={<CurrencyDollarIcon className="text-cyan-400" />} 
            color="border-cyan-500" 
          />
           <MetricCard 
            title="Cotação" 
            value={formatQuotation(result.quotation)} 
            icon={<TrendingUpIcon className="text-yellow-400" />} 
            color="border-yellow-500" 
          />
           <MetricCard 
            title="Investimento Total" 
            value={formatCurrency(result.totalInvestment)} 
            icon={<ChartBarIcon className="text-blue-400" />} 
            color="border-blue-500" 
          />
          <MetricCard 
            title="VNA Projetado" 
            value={formatCurrency(result.calculatedVna)} 
            icon={<TrendingUpIcon className="text-green-400" />} 
            color="border-green-500" 
          />
           <MetricCard 
            title="Duration (Anos)" 
            value={formatRate(result.duration)} 
            icon={<CalendarIcon className="text-purple-400" />} 
            color="border-purple-500" 
          />
        </div>
      </Card>
      
      <Card>
        <h2 className="text-xl font-semibold text-white mb-4">Fluxo de Caixa</h2>
        <div className="max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-gray-900 shadow-md z-10">
              <tr>
                <th className="p-3 text-sm font-semibold text-gray-300 border-b border-gray-700">Data</th>
                <th className="p-3 text-sm font-semibold text-gray-300 border-b border-gray-700 text-center">Tipo</th>
                <th className="p-3 text-sm font-semibold text-gray-300 border-b border-gray-700 text-center">Dias úteis</th>
                <th className="p-3 text-sm font-semibold text-gray-300 border-b border-gray-700 text-right">Taxa (%)</th>
                <th className="p-3 text-sm font-semibold text-gray-300 border-b border-gray-700 text-right">Valor futuro</th>
                <th className="p-3 text-sm font-semibold text-gray-300 border-b border-gray-700 text-right">Valor presente</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {result.cashFlows.map((flow, index) => (
                <tr key={index} className="hover:bg-gray-700/50 transition-colors">
                  <td className="p-3 text-sm text-gray-300">{formatDate(flow.date)}</td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-1 text-xs font-bold rounded ${flow.type === 'J' ? 'text-blue-200' : 'text-amber-200'}`}>
                      {flow.type}
                    </span>
                  </td>
                  <td className="p-3 text-sm text-gray-300 text-center">{flow.businessDays}</td>
                  <td className="p-3 text-sm text-gray-300 text-right">{formatRate(flow.rate)}</td>
                  <td className="p-3 text-sm font-mono text-gray-300 text-right">{formatCurrency(flow.futureValue)}</td>
                  <td className="p-3 text-sm font-mono text-cyan-300 text-right font-bold">{formatCurrency(flow.presentValue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-semibold text-white mb-4">Acúmulo do Valor Presente</h2>
        <div className="h-64">
           <ResultsChart cashFlows={result.cashFlows} purchaseDate={result.formData.purchaseDate} />
        </div>
      </Card>
    </div>
  );
}
