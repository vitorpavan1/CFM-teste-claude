
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
    <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 transition-colors">
      {label}
    </label>
    <div className="relative group">
      {adornment && (
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 dark:text-gray-400 pointer-events-none transition-colors">
          {adornment}
        </span>
      )}
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
        className={`w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm py-2.5 px-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-gray-900 dark:text-white transition-all duration-200 placeholder-gray-400 dark:placeholder-gray-500 ${adornment ? 'pl-8' : ''} ${readOnly ? 'opacity-60 bg-gray-100 dark:bg-gray-800 cursor-not-allowed' : ''}`}
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
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {mode === 'portfolio' ? 'Novo Título' : 'Dados do Título'}
            </h2>
            {mode === 'single' && <span className="text-xs bg-cyan-100 dark:bg-cyan-900 text-cyan-800 dark:text-cyan-200 px-2 py-1 rounded font-medium">Simulação</span>}
        </div>
        
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

        <div className="border-t border-gray-200 dark:border-gray-700 pt-5">
          <div className="flex items-center mb-3">
             <h3 className="text-sm font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider mr-2">Inflação (VNA)</h3>
             <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700"></div>
          </div>
          
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 bg-gray-50 dark:bg-gray-800/50 p-2 rounded border border-gray-100 dark:border-gray-700/50">
             O VNA e o IPCA são preenchidos automaticamente com base na data. Você pode ajustá-los se necessário.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
               <InputField 
                  id="projectedIpca" 
                  label={isPastDate ? "IPCA do Mês" : "IPCA Projetado"}
                  type="number" 
                  value={formData.projectedIpca} 
                  onChange={handleChange} 
                  step="0.01" 
                  adornment="%"
                  placeholder="Ex: 0.50"
              />
              <InputField 
                  id="vnaPrevious" 
                  label="VNA de Referência (Dia 15)" 
                  type="number" 
                  value={formData.vnaPrevious} 
                  onChange={handleChange} 
                  step="0.000001" 
                  adornment="R$"
                  readOnly={false} 
              />
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-5">
            <div className="flex items-center mb-3">
                <h3 className="text-sm font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mr-2">Taxas e Datas</h3>
                <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700"></div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <InputField 
                    id="purchaseRate" 
                    label="Taxa Pactuada (Yield)" 
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
            
            <div className="mt-5">
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
        
        <div className="pt-2">
            {mode === 'single' ? (
                <button
                    type="submit"
                    className="w-full flex items-center justify-center bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform active:scale-95"
                >
                    <CalculatorIcon className="w-5 h-5 mr-2" />
                    CALCULAR PREÇO (PU)
                </button>
            ) : (
                <button
                    type="submit"
                    className="w-full flex items-center justify-center bg-amber-600 hover:bg-amber-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform active:scale-95"
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
