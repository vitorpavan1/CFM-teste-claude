
import React, { useState } from 'react';
import { type FormData } from '../types';
import { Card } from './ui/Card';
import { CalculatorIcon } from './Icons';

interface CalculatorFormProps {
  onCalculate: (formData: FormData) => void;
}

const today = new Date().toISOString().split('T')[0];

const InputField: React.FC<{
  id: keyof FormData;
  label: string;
  type: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  step?: string;
  min?: string;
  required?: boolean;
  adornment?: string;
}> = ({ id, label, type, value, onChange, step, min, required = true, adornment }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1">
      {label}
    </label>
    <div className="relative">
      {adornment && <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">{adornment}</span>}
      <input
        type={type}
        id={id}
        name={id}
        value={value}
        onChange={onChange}
        step={step}
        min={min}
        required={required}
        className={`w-full bg-gray-700/50 border-gray-600 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 text-white ${adornment ? 'pl-7' : ''}`}
      />
    </div>
  </div>
);

export function CalculatorForm({ onCalculate }: CalculatorFormProps): React.ReactElement {
  const [formData, setFormData] = useState<FormData>({
    quantity: 1,
    purchasePrice: 4000,
    projectedIpca: 4.5,
    purchaseDate: today,
    maturityDate: '',
    purchaseRate: 6.0,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCalculate(formData);
  };

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-4">
        <h2 className="text-xl font-semibold text-white mb-4">Parâmetros do Investimento</h2>
        
        <InputField id="quantity" label="Quantidade de Títulos" type="number" value={formData.quantity} onChange={handleChange} min="0.01" step="0.01"/>
        <InputField id="purchasePrice" label="Preço Unitário de Compra" type="number" value={formData.purchasePrice} onChange={handleChange} min="0" step="0.01" adornment="R$"/>
        <InputField id="purchaseRate" label="Taxa de Compra (IPCA + % a.a.)" type="number" value={formData.purchaseRate} onChange={handleChange} min="0" step="0.01" adornment="%"/>
        <InputField id="projectedIpca" label="IPCA Projetado (anual)" type="number" value={formData.projectedIpca} onChange={handleChange} step="0.01" adornment="%"/>
        <InputField id="purchaseDate" label="Data de Compra" type="date" value={formData.purchaseDate} onChange={handleChange}/>
        <InputField id="maturityDate" label="Data de Vencimento" type="date" value={formData.maturityDate} onChange={handleChange} min={formData.purchaseDate} />
        
        <button
          type="submit"
          className="w-full flex items-center justify-center bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 shadow-lg"
        >
          <CalculatorIcon className="w-5 h-5 mr-2" />
          Calcular Rentabilidade
        </button>
      </form>
    </Card>
  );
}
