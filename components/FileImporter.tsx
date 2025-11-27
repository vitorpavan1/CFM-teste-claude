import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Card } from './ui/Card';
import { UploadIcon, FileTextIcon, PlusIcon } from './Icons';
import { type BondItem } from '../types';
import { getCalculatedVna } from '../data/vnaData';
import { getIpcaForMonth } from '../data/ipcaData';

interface FileImporterProps {
  onImport: (bonds: BondItem[]) => void;
}

export function FileImporter({ onImport }: FileImporterProps): React.ReactElement {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<BondItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  // Helper to parse "DD/MM/YYYY" or Excel Serial to "YYYY-MM-DD"
  const parseBrDate = (dateStr: string | number | undefined): string => {
    if (!dateStr) return '';
    
    // Excel Serial Number
    if (typeof dateStr === 'number') {
        const date = new Date(Math.round((dateStr - 25569) * 86400 * 1000));
        return date.toISOString().split('T')[0];
    }
    
    if (typeof dateStr === 'string') {
        const clean = dateStr.trim().replace(/['"]/g, '');
        // DD/MM/YYYY
        if (clean.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
            const parts = clean.split('/');
            return `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        // YYYY-MM-DD (Already correct)
        if (clean.match(/^\d{4}-\d{2}-\d{2}$/)) return clean;
        
        // Try standard Date parse for other formats
        const d = new Date(clean);
        if (!isNaN(d.getTime())) {
            return d.toISOString().split('T')[0];
        }
    }
    return '';
  };

  // Helper to parse "4.107,55" or raw numbers
  const parseBrNumber = (val: string | number | undefined): number => {
      if (val === undefined || val === null) return 0;
      if (typeof val === 'number') return val;
      if (typeof val === 'string') {
          // Remove currency symbols, spaces, dots (thousands) and replace comma with dot
          const clean = val.replace(/[R$\s.]/g, '').replace(',', '.');
          return parseFloat(clean) || 0;
      }
      return 0;
  };

  // Extract rate from "Curva | Taxa: 6,0330%" or "6,03%"
  const extractRate = (val: string | number): number => {
      if (!val) return 0;
      if (typeof val === 'number') return val * 100; // Excel sometimes stores 6% as 0.06

      const strVal = String(val);
      
      // Regex looking for "Taxa: X,XX%" pattern
      const match = strVal.match(/Taxa:\s*([\d,.]+)/i);
      if (match && match[1]) {
          return parseBrNumber(match[1]);
      }
      
      // Fallback: try parsing the whole cell if it's just a number
      return parseBrNumber(strVal);
  };

  const processFile = async (file: File) => {
    setFileName(file.name);
    setError(null);
    setPreviewData([]);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array', cellDates: true });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      
      // Get raw data array
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

      if (jsonData.length === 0) throw new Error("Arquivo vazio.");

      // Find Header Row (Heuristic: Look for "Vencimento" and "Qtde")
      let headerRowIndex = -1;
      for (let i = 0; i < Math.min(20, jsonData.length); i++) {
          const row = jsonData[i];
          if (!row) continue;
          
          const joined = row.map((c: any) => String(c).toLowerCase()).join(';');
          if (joined.includes('vencimento') && (joined.includes('qtde') || joined.includes('quantidade'))) {
              headerRowIndex = i;
              break;
          }
      }

      if (headerRowIndex === -1) {
          throw new Error("Não foi possível encontrar o cabeçalho. Certifique-se que o arquivo tenha colunas 'Data Vencimento' e 'Qtde'.");
      }

      const headers = jsonData[headerRowIndex].map((h: any) => String(h).trim().toLowerCase());
      const rows = jsonData.slice(headerRowIndex + 1);

      // Identify Columns
      const idxMaturity = headers.findIndex(h => h.includes('vencimento'));
      const idxPurchase = headers.findIndex(h => h.includes('compra') && !h.includes('p.u') && !h.includes('valor'));
      const idxQty = headers.findIndex(h => h.includes('qtde') || h.includes('quantidade'));
      const idxMarking = headers.findIndex(h => h.includes('marcacao') || h.includes('taxa'));

      if (idxMaturity === -1 || idxPurchase === -1 || idxQty === -1) {
          throw new Error("Colunas obrigatórias não encontradas. O arquivo deve ter: Data Vencimento, Data Compra, Qtde.");
      }

      const parsedBonds: BondItem[] = [];

      rows.forEach((row, rowIndex) => {
          // Skip empty rows
          if (!row || row.length === 0) return;

          const maturityDate = parseBrDate(row[idxMaturity]);
          const purchaseDate = parseBrDate(row[idxPurchase]);
          const quantity = parseBrNumber(row[idxQty]);
          
          // Rate is optional (defaults to 0 if not found), but we try to find it
          let rate = 0;
          if (idxMarking !== -1) {
              rate = extractRate(row[idxMarking]);
          }

          // Validation: Need valid dates and qty
          if (maturityDate && purchaseDate && quantity > 0) {
              // Auto-calculate VNA/IPCA
              const historicalIpca = getIpcaForMonth(purchaseDate);
              const projectedIpca = historicalIpca !== null ? historicalIpca : 0.50; // Default to 0.50 if future
              const vnaPrevious = getCalculatedVna(purchaseDate, projectedIpca);

              parsedBonds.push({
                  id: crypto.randomUUID(),
                  name: `NTN-B ${maturityDate.split('-')[0]} (${rate.toFixed(4)}%)`,
                  maturityDate,
                  purchaseDate,
                  quantity,
                  purchaseRate: rate,
                  vnaPrevious,
                  projectedIpca
              });
          }
      });

      if (parsedBonds.length === 0) {
          throw new Error("Nenhuma linha de dados válida encontrada após o cabeçalho.");
      }

      setPreviewData(parsedBonds);

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Erro ao ler o arquivo. Verifique se é um Excel/CSV válido.");
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <div 
            className={`flex flex-col items-center justify-center py-12 px-4 transition-colors ${isDragging ? 'bg-cyan-50 dark:bg-cyan-900/20 border-cyan-400' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <div className="bg-white dark:bg-gray-800 p-4 rounded-full shadow-sm mb-4">
                <UploadIcon className="w-10 h-10 text-cyan-600 dark:text-cyan-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                Importar Carteira (Excel / CSV)
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6 max-w-md">
                Arraste um arquivo com as colunas: <strong>Data Vencimento, Data Compra, Qtde, Marcacao</strong>.
            </p>
            
            <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".xlsx, .xls, .csv"
                className="hidden"
            />
            
            <button 
                onClick={() => fileInputRef.current?.click()}
                className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-6 rounded-lg transition-colors shadow-sm"
            >
                Selecionar Arquivo
            </button>
            
            {fileName && (
                <div className="mt-4 flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700">
                    <FileTextIcon className="w-5 h-5 mr-2 text-cyan-500" />
                    {fileName}
                </div>
            )}
            
            {error && (
                <div className="mt-4 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-lg border border-red-200 dark:border-red-800 flex items-center">
                    <span className="mr-2 text-lg">⚠️</span> {error}
                </div>
            )}
        </div>
      </Card>

      {previewData.length > 0 && (
          <div className="animate-fade-in">
              <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                    <span className="w-1.5 h-6 bg-cyan-500 rounded-full mr-3"></span>
                    Pré-visualização ({previewData.length} títulos)
                  </h3>
                  <button 
                    onClick={() => onImport(previewData)}
                    className="flex items-center bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition-colors shadow-sm transform hover:scale-105"
                  >
                      <PlusIcon className="w-5 h-5 mr-2" />
                      Confirmar Importação
                  </button>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600">
                      <table className="w-full text-left border-collapse">
                          <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0 z-10 shadow-sm">
                              <tr>
                                  <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Vencimento</th>
                                  <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Compra</th>
                                  <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Qtd</th>
                                  <th className="p-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Taxa (Yield)</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                              {previewData.map((bond, idx) => (
                                  <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                      <td className="p-4 text-sm font-medium text-gray-900 dark:text-gray-200">{bond.maturityDate.split('-').reverse().join('/')}</td>
                                      <td className="p-4 text-sm text-gray-600 dark:text-gray-400">{bond.purchaseDate.split('-').reverse().join('/')}</td>
                                      <td className="p-4 text-sm text-gray-900 dark:text-gray-200 text-right font-mono">{bond.quantity}</td>
                                      <td className="p-4 text-sm text-cyan-600 dark:text-cyan-400 text-right font-bold">{bond.purchaseRate.toFixed(4)}%</td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}