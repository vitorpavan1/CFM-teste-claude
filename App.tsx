
import React, { useState, useEffect } from 'react';
import { CalculatorForm } from './components/CalculatorForm';
import { ResultsDisplay } from './components/ResultsDisplay';
import { PortfolioManager } from './components/PortfolioManager';
import { type FormData, type CalculationResult } from './types';
import { calculateNTNB } from './utils/calculator';
import { TreasureIcon, CalculatorIcon, ChartBarIcon, SunIcon, MoonIcon } from './components/Icons';

export default function App(): React.ReactElement {
  const [activeTab, setActiveTab] = useState<'individual' | 'portfolio'>('individual');
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Initialize Theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-200 font-sans flex flex-col items-center transition-colors duration-300">
      
      {/* Navbar / Header Area */}
      <div className="w-full bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 mb-8 sticky top-0 z-20">
        <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TreasureIcon className="w-8 h-8 text-amber-500 dark:text-amber-400" />
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                Calculadora NTN-B
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                Simulador Oficial B3/Tesouro
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Tab Navigation (Desktop) */}
            <div className="hidden md:flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('individual')}
                className={`flex items-center px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                  activeTab === 'individual'
                    ? 'bg-white dark:bg-gray-600 text-cyan-700 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <CalculatorIcon className="w-4 h-4 mr-2" />
                Simulador
              </button>
              <button
                onClick={() => setActiveTab('portfolio')}
                className={`flex items-center px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                  activeTab === 'portfolio'
                    ? 'bg-white dark:bg-gray-600 text-amber-700 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <ChartBarIcon className="w-4 h-4 mr-2" />
                Carteira
              </button>
            </div>

            {/* Theme Toggle */}
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-amber-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              aria-label="Alternar tema"
            >
              {isDarkMode ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
            </button>
          </div>
        </div>
        
        {/* Mobile Tabs */}
        <div className="md:hidden flex border-t border-gray-200 dark:border-gray-700">
           <button
                onClick={() => setActiveTab('individual')}
                className={`flex-1 py-3 text-sm font-medium text-center ${
                  activeTab === 'individual'
                    ? 'text-cyan-600 dark:text-cyan-400 border-b-2 border-cyan-600 dark:border-cyan-400 bg-gray-50 dark:bg-gray-800'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                Simulador
            </button>
            <button
                onClick={() => setActiveTab('portfolio')}
                className={`flex-1 py-3 text-sm font-medium text-center ${
                  activeTab === 'portfolio'
                    ? 'text-amber-600 dark:text-amber-400 border-b-2 border-amber-600 dark:border-amber-400 bg-gray-50 dark:bg-gray-800'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                Carteira
            </button>
        </div>
      </div>

      <div className="w-full max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <main>
          {activeTab === 'individual' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
              {/* Form Section */}
              <div className="lg:col-span-4 xl:col-span-3">
                <div className="sticky top-24">
                  <CalculatorForm onCalculate={handleCalculate} mode="single" />
                </div>
              </div>

              {/* Results Section */}
              <div className="lg:col-span-8 xl:col-span-9">
                {error && (
                  <div className="bg-red-100 dark:bg-red-900/50 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 p-4 rounded-lg mb-6 shadow-sm">
                    <p className="font-bold flex items-center"><span className="text-xl mr-2">⚠️</span> Erro no Cálculo</p>
                    <p>{error}</p>
                  </div>
                )}
                {!result && !error && (
                  <div className="h-[60vh] flex flex-col items-center justify-center bg-white dark:bg-gray-800/50 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-8 transition-colors">
                    <CalculatorIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Comece sua simulação</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-center max-w-md mt-2">
                      Preencha os dados do título à esquerda e clique em "Calcular" para ver a análise completa de rentabilidade.
                    </p>
                  </div>
                )}
                {result && <ResultsDisplay result={result} isDarkMode={isDarkMode} />}
              </div>
            </div>
          ) : (
            <PortfolioManager isDarkMode={isDarkMode} />
          )}
        </main>

        <footer className="text-center mt-16 pb-8 text-gray-400 dark:text-gray-600 text-xs">
          <p>
            Ferramenta de simulação educacional. Rentabilidade passada não garante resultados futuros.
            <br />
            Metodologia baseada nas especificações oficiais do Tesouro Nacional para NTN-B.
          </p>
        </footer>
      </div>
    </div>
  );
}
