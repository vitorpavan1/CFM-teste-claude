
import React, { useState, useEffect } from 'react';
import { type FormData } from '../types';
import { Card } from './ui/Card';
import { CalculatorIcon, PlusIcon } from './Icons';
import { getCalculatedVna } from '../data/vnaData';
import { getIpcaForMonth } from '../data/ipcaData';

interface CalculatorFormProps {
  onCalculate: (formData: FormData) => void;
  onAddToPortfolio?: (formData: FormData) => void;
  mode?: 'single' | 'portfolio';
}

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
  placeholder?: string;
  readOnly?: boolean;
}> = ({ id, label, type, value, onChange, step, min, required = true, adornment, placeholder, readOnly }) => (
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
        placeholder={placeholder}
        readOnly={readOnly}
        className={`w-full bg-gray-700/50 border-gray-600 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 text-white ${adornment ? 'pl-7' : ''} ${readOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
      />
    </div>
  </div>
);

export function CalculatorForm({ onCalculate, onAddToPortfolio, mode = 'single' }: CalculatorFormProps): React.ReactElement {
  // Default Purchase Date: Future date (Nov 2025)
  const [formData, setFormData] = useState<FormData>({
    quantity: 1,
    purchaseRate: 6.00,
    purchaseDate: '2025-11-25',
    maturityDate: '2055-05-15',
    vnaPrevious: 0, 
    projectedIpca: 0.50 // Default projection
  });

  const [isPastDate, setIsPastDate] = useState(false);

  // Auto-calculate VNA Previous and IPCA when date changes
  useEffect(() => {
    if (formData.purchaseDate) {
      // 1. Get Historical IPCA for the relevant month
      const historicalIpca = getIpcaForMonth(formData.purchaseDate);
      
      let ipcaToUse = formData.projectedIpca;

      // If we found a historical IPCA, use it and update state
      if (historicalIpca !== null) {
        ipcaToUse = historicalIpca;
        setFormData(prev => ({ ...prev, projectedIpca: historicalIpca }));
      }

      // 2. Get VNA based on date and IPCA
      const vna = getCalculatedVna(formData.purchaseDate, ipcaToUse);
      setFormData(prev => ({ ...prev, vnaPrevious: vna }));

      // Check if date is in the past (simple check against today)
      const selectedDate = new Date(formData.purchaseDate);
      const today = new Date();
      setIsPastDate(selectedDate < today);
    }
  }, [formData.purchaseDate]);

  // Recalculate VNA if user manually changes IPCA
  const handleIpcaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newVal = parseFloat(e.target.value) || 0;
      setFormData(prev => {
          const newVna = getCalculatedVna(prev.purchaseDate, newVal);
          return { ...prev, projectedIpca: newVal, vnaPrevious: newVna };
      });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    if (name === 'projectedIpca') {
        handleIpcaChange(e);
        return;
    }
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'portfolio' && onAddToPortfolio) {
        onAddToPortfolio(formData);
    } else {
        onCalculate(formData);
    }
  };

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-4">
        <h2 className="text-xl font-semibold text-white mb-4">
            {mode === 'portfolio' ? 'Adicionar Título à Carteira' : 'Dados do Título'}
        </h2>
        
        {/* Quantity */}
        <InputField 
            id="quantity" 
            label="Quantidade" 
            type="number" 
            value={formData.quantity} 
            onChange={handleChange} 
            min="0.01" 
            step="0.01"
        />

        <div className="border-t border-gray-700 my-4 pt-4">
          <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider mb-3">Parâmetros de Inflação (VNA)</h3>
          <p className="text-xs text-gray-400 mb-3">
             O VNA e o IPCA do mês são buscados automaticamente na base oficial. Você pode editá-los se necessário.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <InputField 
                  id="projectedIpca" 
                  label={isPastDate ? "IPCA do Mês da Compra" : "IPCA Projetado Mês"}
                  type="number" 
                  value={formData.projectedIpca} 
                  onChange={handleChange} 
                  step="0.01" 
                  adornment="%"
                  placeholder="Ex: 0.50"
              />
              <InputField 
                  id="vnaPrevious" 
                  label="VNA Anterior (Calculado)" 
                  type="number" 
                  value={formData.vnaPrevious} 
                  onChange={handleChange} 
                  step="0.000001" 
                  adornment="R$"
                  readOnly={false} 
              />
          </div>
        </div>

        <div className="border-t border-gray-700 my-4 pt-4">
            <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-3">Taxas e Datas</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField 
                    id="purchaseRate" 
                    label="Taxa Pactuada (Yield Anual)" 
                    type="number" 
                    value={formData.purchaseRate} 
                    onChange={handleChange} 
                    min="0" 
                    step="0.01" 
                    adornment="%"
                />
                <InputField 
                    id="purchaseDate" 
                    label="Data de Liquidação" 
                    type="date" 
                    value={formData.purchaseDate} 
                    onChange={handleChange}
                />
            </div>
            
            <div className="mt-4">
                <InputField 
                    id="maturityDate" 
                    label="Data de Vencimento" 
                    type="date" 
                    value={formData.maturityDate} 
                    onChange={handleChange} 
                    min={formData.purchaseDate} 
                />
            </div>
        </div>
        
        <div className="pt-4">
            {mode === 'single' ? (
                <button
                    type="submit"
                    className="w-full flex items-center justify-center bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 shadow-lg"
                >
                    <CalculatorIcon className="w-5 h-5 mr-2" />
                    CALCULAR PREÇO (PU)
                </button>
            ) : (
                <button
                    type="submit"
                    className="w-full flex items-center justify-center bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105 shadow-lg"
                >
                    <PlusIcon className="w-5 h-5 mr-2" />
                    ADICIONAR À CARTEIRA
                </button>
            )}
        </div>
      </form>
    </Card>
  );
}
