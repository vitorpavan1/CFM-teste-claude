
import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { type CashFlow } from '../types';

interface ResultsChartProps {
  cashFlows: CashFlow[];
  purchaseDate: string;
}

function parseDateAsUTC(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function ResultsChart({ cashFlows, purchaseDate }: ResultsChartProps): React.ReactElement {
  const pDate = parseDateAsUTC(purchaseDate);

  // Map to aggregate data by date (handling multiple flows on same day, e.g. Maturity + Coupon)
  const dataMap = new Map<number, { date: Date; value: number; events: { type: string; pv: number; fv: number }[] }>();
  
  // Initialize with start date (0 value)
  if (!isNaN(pDate.getTime())) {
    dataMap.set(pDate.getTime(), { date: pDate, value: 0, events: [] });
  }

  // Populate with cash flows
  for (const flow of cashFlows) {
    if (flow.date && !isNaN(flow.date.getTime())) {
      const time = flow.date.getTime();
      const current = dataMap.get(time) || { date: flow.date, value: 0, events: [] };
      
      current.value = flow.cumulativePresentValue; // Always take the latest cumulative value for this date
      current.events.push({ 
        type: flow.type, 
        pv: flow.presentValue,
        fv: flow.futureValue
      });
      
      dataMap.set(time, current);
    }
  }

  const chartData = Array.from(dataMap.values())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map(item => ({
      ...item,
      name: item.date.getFullYear().toString(),
    }));
  
  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const date = data.date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
      
      return (
        <div className="bg-gray-800 p-3 border border-gray-600 rounded shadow-lg max-w-xs z-50">
          <p className="text-gray-200 font-bold mb-2 text-sm border-b border-gray-700 pb-1">{`Data: ${date}`}</p>
          
          {data.events.length > 0 ? (
            <div className="space-y-3 mb-3">
              {data.events.map((event: any, idx: number) => (
                <div key={idx} className="text-xs pl-2 border-l-2 border-gray-600">
                  <p className="text-cyan-200 font-semibold mb-1">
                    {event.type === 'J' ? 'Juros (Cupom)' : 'Resgate (Principal)'}
                  </p>
                  <div className="grid grid-cols-2 gap-x-4">
                    <div>
                      <span className="text-gray-500 block text-[10px] uppercase tracking-wider">Valor Futuro</span>
                      <span className="text-gray-300 font-mono">{formatCurrency(event.fv)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[10px] uppercase tracking-wider">Valor Presente</span>
                      <span className="text-cyan-300 font-mono font-bold">{formatCurrency(event.pv)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
             <p className="text-xs text-gray-400 mb-2 italic">Início do Investimento</p>
          )}

          <div className="pt-2 border-t border-gray-700 mt-2">
            <span className="text-xs text-gray-400 uppercase tracking-wider">VP Acumulado</span>
            <p className="text-lg font-bold text-white">{formatCurrency(data.value)}</p>
          </div>
        </div>
      );
    }
    return null;
  };

  const yTickFormatter = (value: any) => {
    if (typeof value !== 'number' || !isFinite(value)) return '';
    if (value >= 1000000) return `R$${(value / 1000000).toFixed(1)}M`;
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
            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
        <XAxis 
          dataKey="name"
          tick={{ fill: '#a0aec0', fontSize: 12 }} 
          stroke="#718096"
          interval="preserveStartEnd"
          minTickGap={30}
        />
        <YAxis 
          tickFormatter={yTickFormatter}
          tick={{ fill: '#a0aec0', fontSize: 12 }} 
          stroke="#718096"
          domain={[0, 'auto']}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area 
          type="monotone" 
          dataKey="value" 
          stroke="#06b6d4" 
          fillOpacity={1} 
          fill="url(#colorValue)" 
          activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }} 
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
