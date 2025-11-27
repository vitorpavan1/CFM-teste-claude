
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

const MetricCard: React.FC<{ title: string; value: string; icon: React.ReactNode; color: string; bgClass: string }> = ({ title, value, icon, color, bgClass }) => (
  <div className={`p-4 rounded-lg border-l-4 ${color} ${bgClass} shadow-sm transition-colors`}>
    <div className="flex items-center">
      <div className="mr-3 text-2xl flex-shrink-0">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide truncate">{title}</p>
        <p className="text-lg font-bold text-gray-900 dark:text-white truncate" title={value}>{value}</p>
      </div>
    </div>
  </div>
);

export function ResultsDisplay({ result, isDarkMode }: { result: CalculationResult; isDarkMode?: boolean }): React.ReactElement {
  return (
    <div className="space-y-8">
      {/* Cards Section */}
      <Card>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
          <span className="w-1.5 h-6 bg-cyan-500 rounded-full mr-3"></span>
          Resultado da Precificação
        </h2>
        {/* Changed grid layout to be more responsive and avoid text cut-off */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <MetricCard 
            title="Preço Unitário (PU)" 
            value={formatCurrency(result.unitPrice)} 
            icon={<CurrencyDollarIcon className="text-cyan-600 dark:text-cyan-400" />} 
            color="border-cyan-500"
            bgClass="bg-cyan-50 dark:bg-gray-800"
          />
           <MetricCard 
            title="Cotação" 
            value={formatQuotation(result.quotation)} 
            icon={<TrendingUpIcon className="text-amber-500 dark:text-amber-400" />} 
            color="border-amber-500" 
            bgClass="bg-amber-50 dark:bg-gray-800"
          />
           <MetricCard 
            title="Investimento Total" 
            value={formatCurrency(result.totalInvestment)} 
            icon={<ChartBarIcon className="text-blue-600 dark:text-blue-400" />} 
            color="border-blue-500" 
            bgClass="bg-blue-50 dark:bg-gray-800"
          />
          <MetricCard 
            title="VNA Projetado" 
            value={formatCurrency(result.calculatedVna)} 
            icon={<TrendingUpIcon className="text-green-600 dark:text-green-400" />} 
            color="border-green-500" 
            bgClass="bg-green-50 dark:bg-gray-800"
          />
           <MetricCard 
            title="Duration (Anos)" 
            value={formatRate(result.duration)} 
            icon={<CalendarIcon className="text-purple-600 dark:text-purple-400" />} 
            color="border-purple-500" 
            bgClass="bg-purple-50 dark:bg-gray-800"
          />
        </div>
      </Card>
      
      {/* Table Section */}
      <Card className="overflow-hidden">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
           <span className="w-1.5 h-6 bg-b3-blue dark:bg-amber-500 rounded-full mr-3"></span>
           Fluxo de Caixa Detalhado
        </h2>
        
        <div className="relative overflow-x-auto rounded-lg border border-gray-300 dark:border-gray-700 shadow-sm">
          <div className="max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-100 dark:scrollbar-track-gray-800">
            <table className="w-full text-left border-collapse">
              {/* Header Style Matching B3 (Blue in Light Mode) */}
              <thead className="sticky top-0 bg-[#003366] dark:bg-gray-900 shadow-md z-10">
                <tr>
                  <th className="p-4 text-xs font-bold text-white dark:text-gray-400 uppercase tracking-wider border-b border-gray-600 dark:border-gray-700">Data</th>
                  <th className="p-4 text-xs font-bold text-white dark:text-gray-400 uppercase tracking-wider border-b border-gray-600 dark:border-gray-700 text-center">Tipo</th>
                  <th className="p-4 text-xs font-bold text-white dark:text-gray-400 uppercase tracking-wider border-b border-gray-600 dark:border-gray-700 text-center">Dias úteis</th>
                  <th className="p-4 text-xs font-bold text-white dark:text-gray-400 uppercase tracking-wider border-b border-gray-600 dark:border-gray-700 text-right">Taxa (%)</th>
                  <th className="p-4 text-xs font-bold text-white dark:text-gray-400 uppercase tracking-wider border-b border-gray-600 dark:border-gray-700 text-right">Valor futuro</th>
                  <th className="p-4 text-xs font-bold text-white dark:text-gray-400 uppercase tracking-wider border-b border-gray-600 dark:border-gray-700 text-right">Valor presente</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                {result.cashFlows.map((flow, index) => (
                  <tr key={index} className="hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="p-4 text-sm font-medium text-gray-900 dark:text-gray-200 whitespace-nowrap border-r border-gray-100 dark:border-gray-700">{formatDate(flow.date)}</td>
                    <td className="p-4 text-center border-r border-gray-100 dark:border-gray-700">
                      <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${
                        flow.type === 'J' 
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' 
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                      }`}>
                        {flow.type === 'J' ? 'Juros' : 'Resgate'}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-700 dark:text-gray-400 text-center border-r border-gray-100 dark:border-gray-700">{flow.businessDays}</td>
                    <td className="p-4 text-sm text-gray-700 dark:text-gray-400 text-right border-r border-gray-100 dark:border-gray-700">{formatRate(flow.rate)}</td>
                    <td className="p-4 text-sm font-mono text-gray-700 dark:text-gray-400 text-right border-r border-gray-100 dark:border-gray-700">{formatCurrency(flow.futureValue)}</td>
                    <td className="p-4 text-sm font-mono text-[#003366] dark:text-cyan-300 text-right font-bold">{formatCurrency(flow.presentValue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      {/* Chart Section */}
      <Card>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
           <span className="w-1.5 h-6 bg-purple-500 rounded-full mr-3"></span>
           Acúmulo do Valor Presente
        </h2>
        <div className="h-80 w-full">
           <ResultsChart cashFlows={result.cashFlows} purchaseDate={result.formData.purchaseDate} isDarkMode={isDarkMode} />
        </div>
      </Card>
    </div>
  );
}
