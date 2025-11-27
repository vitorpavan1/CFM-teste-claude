import React, { useState, useMemo } from 'react';
import { type BondItem, type FormData } from '../types';
import { CalculatorForm } from './CalculatorForm';
import { ConsolidatedChart } from './ConsolidatedChart';
import { calculatePortfolio } from '../utils/calculator';
import { Card } from './ui/Card';
import { TrashIcon, CalendarIcon, CurrencyDollarIcon, TrendingUpIcon, PlusIcon } from './Icons';
import { ResultsDisplay } from './ResultsDisplay';

interface PortfolioManagerProps {
  isDarkMode: boolean;
  bonds: BondItem[];
  setBonds: React.Dispatch<React.SetStateAction<BondItem[]>>;
}

export function PortfolioManager({ isDarkMode, bonds, setBonds }: PortfolioManagerProps): React.ReactElement {
  const [selectedBondId, setSelectedBondId] = useState<string | null>(null);

  const handleAddBond = (data: FormData) => {
    const newBond: BondItem = {
      ...data,
      id: crypto.randomUUID(),
      name: `NTN-B ${data.maturityDate.split('-')[0]} (${data.purchaseRate}%)`
    };
    setBonds(prev => [...prev, newBond]);
  };

  const handleRemoveBond = (id: string) => {
    setBonds(prev => prev.filter(b => b.id !== id));
    if (selectedBondId === id) setSelectedBondId(null);
  };

  const portfolioResult = useMemo(() => {
    if (bonds.length === 0) return null;
    return calculatePortfolio(bonds);
  }, [bonds]);

  const selectedBondResult = useMemo(() => {
    if (!portfolioResult || !selectedBondId) return null;
    return portfolioResult.individualResults.find(r => r.id === selectedBondId) || null;
  }, [portfolioResult, selectedBondId]);

  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Col: Form and List (3 columns on large) */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-6">
          <CalculatorForm onCalculate={() => {}} onAddToPortfolio={handleAddBond} mode="portfolio" />
          
          <Card>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Carteira</h3>
                <span className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs px-2 py-1 rounded-full font-bold">{bonds.length}</span>
            </div>
            
            {bonds.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-8 italic border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                Nenhum título adicionado.
              </p>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                {bonds.map(bond => (
                  <div key={bond.id} className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-200 dark:border-gray-600 flex justify-between items-center group hover:bg-white dark:hover:bg-gray-700 hover:shadow-md transition-all duration-200">
                    <div 
                        className="cursor-pointer flex-grow"
                        onClick={() => setSelectedBondId(selectedBondId === bond.id ? null : bond.id)}
                    >
                      <div className="text-sm font-bold text-cyan-700 dark:text-cyan-200">{bond.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Venc: {bond.maturityDate.split('-')[0]} • Qtd: {bond.quantity} • {bond.purchaseRate}%
                      </div>
                    </div>
                    <button 
                      onClick={() => handleRemoveBond(bond.id)}
                      className="text-gray-400 hover:text-red-500 p-2 transition-colors rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
                      title="Remover título"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Col: Consolidated Results (9 columns on large) */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-6">
          {portfolioResult ? (
            <>
               {/* Summary Cards */}
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                 <Card className="border-l-4 border-blue-500 bg-blue-50 dark:bg-gray-800">
                   <div className="flex items-center">
                     <CurrencyDollarIcon className="w-10 h-10 text-blue-500 dark:text-blue-400 mr-4" />
                     <div>
                       <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wide">Total Investido</p>
                       <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(portfolioResult.totalInvested)}</p>
                     </div>
                   </div>
                 </Card>
                 <Card className="border-l-4 border-green-500 bg-green-50 dark:bg-gray-800">
                   <div className="flex items-center">
                     <TrendingUpIcon className="w-10 h-10 text-green-500 dark:text-green-400 mr-4" />
                     <div>
                       <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wide">Retorno Bruto Total</p>
                       <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(portfolioResult.totalReturned)}</p>
                     </div>
                   </div>
                 </Card>
                  <Card className="border-l-4 border-purple-500 bg-purple-50 dark:bg-gray-800">
                   <div className="flex items-center">
                     <CalendarIcon className="w-10 h-10 text-purple-500 dark:text-purple-400 mr-4" />
                     <div>
                       <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wide">Ano do 1º Fluxo</p>
                       <p className="text-xl font-bold text-gray-900 dark:text-white">
                         {portfolioResult.consolidatedFlows.length > 0 ? portfolioResult.consolidatedFlows[0].year : '-'}
                       </p>
                     </div>
                   </div>
                 </Card>
               </div>

               {/* Consolidated Chart */}
               <Card>
                 <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Fluxo de Caixa Anual Consolidado</h3>
                 <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Soma de todos os cupons e amortizações projetados por ano.</p>
                 <div className="h-96">
                   <ConsolidatedChart flows={portfolioResult.consolidatedFlows} />
                 </div>
               </Card>

               {/* Selected Bond Details (Drilldown) */}
               {selectedBondResult ? (
                 <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-8 animate-fade-in">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-2xl font-bold text-cyan-700 dark:text-cyan-400">
                            Detalhes: {selectedBondResult.name}
                        </h3>
                        <button 
                            onClick={() => setSelectedBondId(null)} 
                            className="text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 px-4 py-2 rounded-lg text-gray-700 dark:text-white font-medium transition-colors"
                        >
                            Fechar Detalhes
                        </button>
                    </div>
                    <ResultsDisplay result={selectedBondResult} isDarkMode={isDarkMode} />
                 </div>
               ) : (
                  <div className="bg-gray-100 dark:bg-gray-800/50 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-8 text-center">
                      <p className="text-gray-500 dark:text-gray-400">Clique em um título na lista à esquerda para ver seus detalhes individuais (fluxos, VNA, PU).</p>
                  </div>
               )}
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800/30 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-12 text-gray-400">
              <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-full mb-4">
                <PlusIcon className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-lg font-medium text-gray-600 dark:text-gray-300">Sua carteira está vazia</p>
              <p className="text-sm text-gray-500">Adicione títulos usando o formulário ou vá para a aba "Importar".</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}