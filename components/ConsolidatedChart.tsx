
import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { type ConsolidatedYearlyFlow } from '../types';

interface ConsolidatedChartProps {
  flows: ConsolidatedYearlyFlow[];
}

export function ConsolidatedChart({ flows }: ConsolidatedChartProps): React.ReactElement {
  const formatCurrency = (value: number) => {
      if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`;
      if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}k`;
      return `R$ ${value.toFixed(0)}`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 p-3 border border-gray-600 rounded shadow-lg">
          <p className="label text-gray-200 font-bold mb-2">{`Ano: ${label}`}</p>
          <p className="text-cyan-400 text-sm">{`Cupons: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(payload[0].value)}`}</p>
          <p className="text-amber-400 text-sm">{`Principal: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(payload[1].value)}`}</p>
          <div className="mt-2 pt-2 border-t border-gray-700">
             <p className="text-white font-bold">{`Total: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(payload[0].value + payload[1].value)}`}</p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={flows}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 5,
        }}
        barSize={40}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" vertical={false} />
        <XAxis 
          dataKey="year" 
          tick={{ fill: '#a0aec0', fontSize: 12 }} 
          stroke="#718096"
        />
        <YAxis 
          tickFormatter={formatCurrency}
          tick={{ fill: '#a0aec0', fontSize: 12 }} 
          stroke="#718096"
        />
        <Tooltip content={<CustomTooltip />} cursor={{fill: '#374151', opacity: 0.4}} />
        <Legend verticalAlign="top" height={36}/>
        <Bar name="Juros (Cupons)" dataKey="couponValue" stackId="a" fill="#06b6d4" />
        <Bar name="Principal (Resgate)" dataKey="principalValue" stackId="a" fill="#f59e0b" />
      </BarChart>
    </ResponsiveContainer>
  );
}
