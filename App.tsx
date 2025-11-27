
import React, { useState } from 'react';
import { CalculatorForm } from './components/CalculatorForm';
import { ResultsDisplay } from './components/ResultsDisplay';
import { PortfolioManager } from './components/PortfolioManager';
import { type FormData, type CalculationResult } from './types';
import { calculateNTNB } from './utils/calculator';
import { TreasureIcon, CalculatorIcon, ChartBarIcon } from './components/Icons';

export default function App(): React.ReactElement {
  const [activeTab, setActiveTab] = useState<'individual' | 'portfolio'>('individual');
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCalculate = (formData: FormData) => {
    try {
      const calculation = calculateNTNB(formData);
      setResult(calculation);
      setError(null);
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError('An unknown error occurred during calculation.');
      }
      setResult(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-6xl mx-auto">
        <header className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-2">
            <TreasureIcon className="w-10 h-10 text-amber-400" />
            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Calculadora de Rentabilidade NTN-B
            </h1>
          </div>
          <p className="text-lg text-gray-400">
            Projete os ganhos do seu investimento no Tesouro Direto.
          </p>
        </header>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-gray-800 p-1 rounded-lg inline-flex shadow-lg">
            <button
              onClick={() => setActiveTab('individual')}
              className={`flex items-center px-6 py-2 rounded-md transition-all duration-200 ${
                activeTab === 'individual'
                  ? 'bg-gray-700 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <CalculatorIcon className="w-4 h-4 mr-2" />
              Simulador Individual
            </button>
            <button
              onClick={() => setActiveTab('portfolio')}
              className={`flex items-center px-6 py-2 rounded-md transition-all duration-200 ${
                activeTab === 'portfolio'
                  ? 'bg-gray-700 text-cyan-300 shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <ChartBarIcon className="w-4 h-4 mr-2" />
              Minha Carteira
            </button>
          </div>
        </div>

        <main>
          {activeTab === 'individual' ? (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              <div className="lg:col-span-2">
                <CalculatorForm onCalculate={handleCalculate} mode="single" />
              </div>
              <div className="lg:col-span-3">
                {error && (
                  <div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg">
                    <p className="font-bold">Erro no Cálculo</p>
                    <p>{error}</p>
                  </div>
                )}
                {!result && !error && (
                  <div className="h-full flex items-center justify-center bg-gray-800/50 border-2 border-dashed border-gray-700 rounded-lg p-8">
                    <p className="text-gray-400 text-center">
                      Preencha os dados ao lado e clique em "Calcular" para ver a projeção dos seus resultados.
                    </p>
                  </div>
                )}
                {result && <ResultsDisplay result={result} />}
              </div>
            </div>
          ) : (
            <PortfolioManager />
          )}
        </main>

        <footer className="text-center mt-12 text-gray-500 text-sm">
          <p>
            Esta é uma ferramenta de simulação. A rentabilidade real pode variar.
            Cálculos baseados na metodologia de projeção de fluxo de caixa da B3/Tesouro Direto.
          </p>
        </footer>
      </div>
    </div>
  );
}
