/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import { AppState, Transaction } from '../types';
import { calculateFinancialStats, formatCurrency, parseLocalDate } from '../utils/finance';
import { 
  ShoppingBag, 
  Calculator, 
  Percent, 
  Sparkles, 
  Package,
  Save,
  Trash2
} from 'lucide-react';

interface VintedModeProps {
  state: AppState;
  onAddTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
}

export default function VintedMode({ state, onAddTransaction, onDeleteTransaction }: VintedModeProps) {
  const profile = state.userProfile!;
  const stats = calculateFinancialStats(state);

  // Vinted Item calculator state
  const [itemName, setItemName] = useState('Artículo Vinted');
  const [salePrice, setSalePrice] = useState<number>(0);
  const [packingCost, setPackingCost] = useState<number>(0);
  const [shippingCost, setShippingCost] = useState<number>(0);
  const [platformFee, setPlatformFee] = useState<number>(0);

  // Vinted Sales Summary from registered transactions
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  const vintedTransactions = state.transactions.filter(t => 
    (t.category === 'Ventas Vinted' || t.description.toLowerCase().includes('vinted')) &&
    parseLocalDate(t.date).getMonth() === currentMonth &&
    parseLocalDate(t.date).getFullYear() === currentYear
  ).map(tx => {
      // Helper to parse notes: "Venta: ${itemName}. P.Venta: ${salePrice}, Embalaje: ${packingCost}, Envío: ${shippingCost}, Comis: ${platformFee}"
      const parts = tx.notes.split('. ')[1]?.split(', ') || [];
      const getVal = (label: string) => parseFloat(parts.find(p => p.startsWith(label))?.split(': ')[1] || '0');
      
      const pVenta = getVal('P.Venta');
      const embalaje = getVal('Embalaje');
      const envio = getVal('Envío');
      const comis = getVal('Comis');
      const gastos = embalaje + envio + comis;
      
      return {
          ...tx,
          income: pVenta,
          expenses: gastos
      };
  });

  const vintedSales = vintedTransactions.reduce((sum, t) => sum + t.income, 0);

  // Calculations
  const netProfit = salePrice - packingCost - shippingCost - platformFee;
  const marginPercent = salePrice > 0 ? Math.round((netProfit / salePrice) * 100) : 0;

  const handleSaveSale = () => {
    if (netProfit <= 0) {
      alert("Por favor, asegúrate de que el beneficio neto sea positivo.");
      return;
    }
    
    const newTransaction: Transaction = {
      id: `vt-${Date.now()}`,
      amount: netProfit,
      type: 'income',
      date: new Date().toISOString().split('T')[0],
      category: 'Ventas Vinted',
      description: itemName,
      paymentMethod: 'Vinted',
      notes: `Venta: ${itemName}. P.Venta: ${salePrice}, Embalaje: ${packingCost}, Envío: ${shippingCost}, Comis: ${platformFee}`
    };
    
    onAddTransaction(newTransaction);
    alert('¡Venta guardada correctamente!');
    
    // Reset form
    setItemName('Artículo Vinted');
    setSalePrice(0);
    setPackingCost(0);
    setShippingCost(0);
    setPlatformFee(0);
  };

  return (
    <div id="vinted-mode-view" className="space-y-6">
      
      {/* View Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <ShoppingBag className="text-pink-400" size={24} />
          Modo Vinted y Ventas Pyme
        </h1>
        <p className="text-xs text-slate-400">
          Supervisa el margen de beneficio neto de tus ventas, registra tus beneficios y gestiona tu inventario.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column (2 cols span): Profit Calculator */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Quick Calculator Card */}
          <div className="card-hover bg-[#0E0E10] border border-white/[0.06] p-6 rounded-[28px] space-y-5">
            <h2 className="text-md font-bold text-slate-200 flex items-center gap-2 font-mono uppercase tracking-wider">
              <Calculator size={18} className="text-pink-400" />
              Calculadora de Venta
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1">Nombre del Artículo</label>
                <input
                  type="text"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-pink-500 font-sans"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                
                {/* Precio Venta */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[9px] font-mono text-slate-400 uppercase tracking-widest mb-1">P. Venta ({profile.currency})</label>
                  <input
                    type="number"
                    value={salePrice}
                    onChange={(e) => setSalePrice(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono"
                  />
                </div>

                {/* Embalaje */}
                <div>
                  <label className="block text-[9px] font-mono text-slate-400 uppercase tracking-widest mb-1">Embalaje ({profile.currency})</label>
                  <input
                    type="number"
                    value={packingCost}
                    onChange={(e) => setPackingCost(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono"
                  />
                </div>

                {/* Envío */}
                <div>
                  <label className="block text-[9px] font-mono text-slate-400 uppercase tracking-widest mb-1">Envío ({profile.currency})</label>
                  <input
                    type="number"
                    value={shippingCost}
                    onChange={(e) => setShippingCost(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono"
                  />
                </div>

                {/* Comisión */}
                <div>
                  <label className="block text-[9px] font-mono text-slate-400 uppercase tracking-widest mb-1">Comisión ({profile.currency})</label>
                  <input
                    type="number"
                    value={platformFee}
                    onChange={(e) => setPlatformFee(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono"
                  />
                </div>

              </div>
            </div>

            {/* Calculations summaries */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-850">
              
              <div className="bg-slate-950/40 p-4 rounded-xl text-center border border-slate-800/40">
                <span className="text-[9px] font-mono text-slate-500 uppercase block">Beneficio Neto</span>
                <span className="text-md font-semibold text-pink-400 font-mono">{formatCurrency(netProfit, profile.currency)}</span>
              </div>

              <div className="bg-slate-950/40 p-4 rounded-xl text-center border border-slate-800/40">
                <span className="text-[9px] font-mono text-slate-500 uppercase block">Margen Neto</span>
                <span className="text-md font-bold text-teal-300 font-mono flex items-center justify-center gap-0.5">
                  <Percent size={12} /> {marginPercent}%
                </span>
              </div>

              <div className="bg-slate-950/40 p-4 rounded-xl text-center border border-slate-800/40 flex flex-col justify-center">
                 <button
                    onClick={handleSaveSale}
                    className="flex items-center justify-center gap-2 bg-pink-600 hover:bg-pink-700 text-white font-bold py-2 px-4 rounded-xl transition-all"
                >
                    <Save size={14}/>
                    Guardar
                </button>
              </div>

            </div>
          </div>

          {/* Inventario de Ventas */}
          <div className="card-hover bg-[#0E0E10] border border-white/[0.06] p-6 rounded-[28px] space-y-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-1.5 font-mono uppercase tracking-wider">
              <Package size={16} className="text-slate-400" />
              Ventas de este mes
            </h3>

            <div className="space-y-2">
              {vintedTransactions.length > 0 ? (
                vintedTransactions.map((tx) => (
                    <div key={tx.id} className="bg-slate-950/40 p-3 rounded-xl border border-slate-850 flex justify-between items-center text-xs">
                        <span className="text-slate-300 font-medium">{tx.description}</span>
                        <div className="flex items-center gap-3">
                            <span className="font-mono text-pink-400">{formatCurrency(tx.amount, profile.currency)}</span>
                            <button 
                                onClick={() => onDeleteTransaction(tx.id)}
                                className="text-slate-600 hover:text-red-400 transition-colors"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                ))
              ) : (
                <div className="text-xs text-slate-500 text-center py-4">No hay ventas registradas este mes.</div>
              )}
            </div>
            
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-850 flex justify-between items-center mt-2">
              <div>
                <span className="text-xs font-semibold text-slate-200 block">Total del Mes</span>
              </div>
              <div className="text-lg font-semibold text-pink-400 font-mono">
                {formatCurrency(vintedSales, profile.currency)}
              </div>
            </div>
          </div>

        </div>

        {/* Right column: Advice on side-gigs */}
        <div className="space-y-6">
          
          <div className="bg-gradient-to-r from-slate-900 to-pink-950/10 border border-pink-500/20 p-6 rounded-[28px] space-y-4">
            <div className="flex items-center space-x-1.5 text-pink-400 font-mono text-xs uppercase tracking-wider">
              <Sparkles size={14} />
              <span>Optimización de Ventas IA</span>
            </div>
            
            <h3 className="text-md font-bold text-white tracking-tight leading-snug">Estrategias de Precios para {itemName}</h3>
            
            <div className="text-xs text-slate-300 space-y-3 leading-relaxed font-sans">
              <p>
                "Para maximizar el retorno de tu <strong>{itemName}</strong>, te sugerimos listarlo inicialmente un 15% por encima de tu precio de venta objetivo (ej. {formatCurrency(Math.round(salePrice * 1.15), profile.currency)})."
              </p>
              <p>
                "Esto te otorgará margen de negociación al recibir ofertas directas de compradoras interesadas en Vinted, aumentando la tasa de conversión en un 28%."
              </p>
              <p>
                "<strong>Consejo de Embalaje:</strong> Utiliza cajas recicladas de envíos anteriores. Reducir tu coste de embalaje de {formatCurrency(packingCost, profile.currency)} a 0 € eleva de forma instantánea tu margen neto un {Math.round((packingCost / (salePrice || 1)) * 100)}%."
              </p>
            </div>

            <div className="pt-4 border-t border-slate-850 flex items-center justify-between text-[10px] font-mono text-slate-500">
              <span>Orientación en DAC7</span>
              <span className="text-pink-400 font-bold">ALMO</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
