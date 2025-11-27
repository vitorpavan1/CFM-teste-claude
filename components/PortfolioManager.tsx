import React, { useState, useMemo } from 'react';
import { type BondItem, type FormData } from '../types';
import { CalculatorForm } from './CalculatorForm';
import { ConsolidatedChart } from './ConsolidatedChart';
import { calculatePortfolio } from '../utils/calculator';
import { Card } from './ui/Card';
import { TrashIcon, CalendarIcon, CurrencyDollarIcon, TrendingUpIcon, PlusIcon } from './Icons';
import { ResultsDisplay } from './ResultsDisplay';

export function PortfolioManager(): React.ReactElement {
  const [bonds, setBonds] = useState<BondItem[]>([]);
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col: Form and List */}
        <div className="lg:col-span-1 space-y-6">
          <CalculatorForm onCalculate={() => {}} onAddToPortfolio={handleAddBond} mode="portfolio" />
          
          <Card>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-white">Títulos na Carteira</h3>
                <span className="bg-gray-700 text-xs px-2 py-1 rounded-full">{bonds.length}</span>
            </div>
            
            {bonds.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">Nenhum título adicionado.</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1 custom-scrollbar">
                {bonds.map(bond => (
                  <div key={bond.id} className="bg-gray-700/50 p-3 rounded-md flex justify-between items-center group hover:bg-gray-700 transition-colors">
                    <div 
                        className="cursor-pointer flex-grow"
                        onClick={() => setSelectedBondId(selectedBondId === bond.id ? null : bond.id)}
                    >
                      <div className="text-sm font-bold text-cyan-200">{bond.name}</div>
                      <div className="text-xs text-gray-400">
                        Venc: {bond.maturityDate.split('-')[0]} | Qtd: {bond.quantity} | Taxa: {bond.purchaseRate}%
                      </div>
                    </div>
                    <button 
                      onClick={() => handleRemoveBond(bond.id)}
                      className="text-gray-500 hover:text-red-400 p-2 transition-colors"
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

        {/* Right Col: Consolidated Results */}
        <div className="lg:col-span-2 space-y-6">
          {portfolioResult ? (
            <>
               {/* Summary Cards */}
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                 <Card className="border-l-4 border-blue-500">
                   <div className="flex items-center">
                     <CurrencyDollarIcon className="w-8 h-8 text-blue-400 mr-3" />
                     <div>
                       <p className="text-xs text-gray-400">Total Investido</p>
                       <p className="text-lg font-bold text-white">{formatCurrency(portfolioResult.totalInvested)}</p>
                     </div>
                   </div>
                 </Card>
                 <Card className="border-l-4 border-green-500">
                   <div className="flex items-center">
                     <TrendingUpIcon className="w-8 h-8 text-green-400 mr-3" />
                     <div>
                       <p className="text-xs text-gray-400">Total Retorno (Bruto)</p>
                       <p className="text-lg font-bold text-white">{formatCurrency(portfolioResult.totalReturned)}</p>
                     </div>
                   </div>
                 </Card>
                  <Card className="border-l-4 border-purple-500">
                   <div className="flex items-center">
                     <CalendarIcon className="w-8 h-8 text-purple-400 mr-3" />
                     <div>
                       <p className="text-xs text-gray-400">Primeiro Fluxo</p>
                       <p className="text-lg font-bold text-white">
                         {portfolioResult.consolidatedFlows.length > 0 ? portfolioResult.consolidatedFlows[0].year : '-'}
                       </p>
                     </div>
                   </div>
                 </Card>
               </div>

               {/* Consolidated Chart */}
               <Card>
                 <h3 className="text-lg font-semibold text-white mb-4">Fluxo de Caixa Anual Consolidado</h3>
                 <p className="text-sm text-gray-400 mb-6">Soma de todos os cupons e amortizações a receber por ano.</p>
                 <div className="h-80">
                   <ConsolidatedChart flows={portfolioResult.consolidatedFlows} />
                 </div>
               </Card>

               {/* Selected Bond Details (Drilldown) */}
               {selectedBondResult ? (
                 <div className="mt-8 border-t border-gray-700 pt-8 animate-fade-in">
                    <h3 className="text-xl font-bold text-cyan-400 mb-4 flex items-center">
                        Detalhes: {selectedBondResult.name}
                        <button 
                            onClick={() => setSelectedBondId(null)} 
                            className="ml-auto text-xs bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded text-white font-normal"
                        >
                            Fechar Detalhes
                        </button>
                    </h3>
                    <ResultsDisplay result={selectedBondResult} />
                 </div>
               ) : (
                  <div className="bg-gray-800/50 border border-dashed border-gray-700 rounded-lg p-6 text-center text-gray-400">
                      Clique em um título na lista à esquerda para ver seus detalhes individuais.
                  </div>
               )}
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center bg-gray-800/30 border-2 border-dashed border-gray-700 rounded-lg p-12 text-gray-400">
              <PlusIcon className="w-12 h-12 mb-4 opacity-50" />
              <p>Adicione títulos à sua carteira para ver a projeção consolidada.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}