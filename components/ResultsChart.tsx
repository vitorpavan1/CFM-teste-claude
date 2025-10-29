import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { type CashFlow } from '../types';

interface ResultsChartProps {
  cashFlows: CashFlow[];
  purchaseDate: string;
}

// Helper to parse a 'YYYY-MM-DD' string into a UTC Date object
function parseDateAsUTC(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  // Month is 0-indexed in JavaScript's Date
  return new Date(Date.UTC(year, month - 1, day));
}

export function ResultsChart({ cashFlows, purchaseDate }: ResultsChartProps): React.ReactElement {
  const pDate = parseDateAsUTC(purchaseDate);

  const dataMap = new Map<number, { date: Date; value: number }>();
  // Set the starting point of the chart at time zero with zero return.
  if (!isNaN(pDate.getTime())) {
    dataMap.set(pDate.getTime(), { date: pDate, value: 0 });
  }

  for (const flow of cashFlows) {
    // Ensure we only add valid dates to the chart data
    if (flow.date && !isNaN(flow.date.getTime())) {
      dataMap.set(flow.date.getTime(), { date: flow.date, value: flow.cumulativeAmount });
    }
  }

  const chartData = Array.from(dataMap.values())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map(item => ({
      ...item,
      name: item.date.toLocaleDateString('pt-BR', { timeZone: 'UTC' }),
    }));
  
  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 p-2 border border-gray-600 rounded shadow-lg">
          <p className="label text-gray-300">{`Data: ${label}`}</p>
          <p className="intro text-amber-400">{`Retorno Acumulado: ${formatCurrency(payload[0].value)}`}</p>
        </div>
      );
    }
    return null;
  };

  const yTickFormatter = (value: any) => {
    if (typeof value !== 'number' || !isFinite(value)) return '';
    if (value >= 1000000) return `R$${(value / 1000000).toFixed(0)}M`;
    if (value >= 1000) return `R$${(value / 1000).toFixed(0)}k`;
    return `R$${value.toFixed(0)}`;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={chartData}
        margin={{
          top: 10,
          right: 30,
          left: 20,
          bottom: 0,
        }}
      >
        <defs>
          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
        <XAxis 
          dataKey="name"
          tick={{ fill: '#a0aec0', fontSize: 12 }} 
          stroke="#718096"
        />
        <YAxis 
          tickFormatter={yTickFormatter}
          tick={{ fill: '#a0aec0', fontSize: 12 }} 
          stroke="#718096"
          domain={[0, 'auto']}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area type="monotone" dataKey="value" stroke="#f59e0b" fillOpacity={1} fill="url(#colorValue)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}