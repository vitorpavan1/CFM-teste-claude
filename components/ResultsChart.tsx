
import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { type CashFlow } from '../types';

interface ResultsChartProps {
  cashFlows: CashFlow[];
  purchaseDate: string;
  isDarkMode?: boolean;
}

function parseDateAsUTC(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function ResultsChart({ cashFlows, purchaseDate, isDarkMode = true }: ResultsChartProps): React.ReactElement {
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

  const gridColor = isDarkMode ? "#4a5568" : "#e2e8f0";
  const textColor = isDarkMode ? "#a0aec0" : "#64748b";
  const areaColor = "#06b6d4"; // Cyan-500

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const date = data.date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
      
      return (
        <div className={`${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'} p-4 border rounded-lg shadow-xl max-w-xs z-50`}>
          <p className={`${isDarkMode ? 'text-gray-200 border-gray-700' : 'text-gray-800 border-gray-200'} font-bold mb-3 text-sm border-b pb-2`}>
            {`Data: ${date}`}
          </p>
          
          {data.events.length > 0 ? (
            <div className="space-y-3 mb-3 max-h-40 overflow-y-auto custom-scrollbar">
              {data.events.map((event: any, idx: number) => (
                <div key={idx} className={`text-xs pl-3 border-l-2 ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                  <p className="text-cyan-600 dark:text-cyan-400 font-semibold mb-1">
                    {event.type === 'J' ? 'Juros (Cupom)' : 'Resgate (Principal)'}
                  </p>
                  <div className="grid grid-cols-2 gap-x-4">
                    <div>
                      <span className="text-gray-500 text-[10px] uppercase tracking-wider block">Valor Futuro</span>
                      <span className={`font-mono ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{formatCurrency(event.fv)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 text-[10px] uppercase tracking-wider block">Valor Presente</span>
                      <span className={`font-mono font-bold ${isDarkMode ? 'text-cyan-300' : 'text-cyan-700'}`}>{formatCurrency(event.pv)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
             <p className="text-xs text-gray-500 italic">Início do Investimento</p>
          )}

          <div className={`pt-3 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} mt-2`}>
            <span className="text-xs text-gray-500 uppercase tracking-wider block">VP Acumulado</span>
            <p className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(data.value)}</p>
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
          left: 10,
          bottom: 0,
        }}
      >
        <defs>
          <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={areaColor} stopOpacity={0.8}/>
            <stop offset="95%" stopColor={areaColor} stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
        <XAxis 
          dataKey="name"
          tick={{ fill: textColor, fontSize: 12 }} 
          stroke={gridColor}
          interval="preserveStartEnd"
          minTickGap={30}
          tickLine={false}
          axisLine={false}
          dy={10}
        />
        <YAxis 
          tickFormatter={yTickFormatter}
          tick={{ fill: textColor, fontSize: 12 }} 
          stroke={gridColor}
          domain={[0, 'auto']}
          tickLine={false}
          axisLine={false}
          dx={-10}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area 
          type="monotone" 
          dataKey="value" 
          stroke={areaColor} 
          strokeWidth={3}
          fillOpacity={1} 
          fill="url(#colorValue)" 
          activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }} 
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
