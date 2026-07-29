/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { AppState, InvestmentAsset } from '../types';
import { formatCurrency } from '../utils/finance';
import { 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  X, 
  BarChart4, 
  DollarSign, 
  Activity, 
  Briefcase, 
  PieChart,
  Trash2
} from 'lucide-react';

interface InvestmentsProps {
  state: AppState;
  onAddAsset: (asset: InvestmentAsset) => void;
  onDeleteAsset: (id: string) => void;
}

export default function Investments({ state, onAddAsset, onDeleteAsset }: InvestmentsProps) {
  const profile = state.userProfile!;
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [ticker, setTicker] = useState('');
  const [name, setName] = useState('');
  const [shares, setShares] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [type, setType] = useState<'stocks' | 'crypto' | 'etfs' | 'cash' | 'real_estate'>('etfs');

  // Compute Overall stats
  const totalInvested = state.investments.reduce((sum, item) => sum + (item.investedAmount || ((item.buyPrice || 0) * (item.shares || 1))), 0);
  const totalCurrentValue = state.investments.reduce((sum, item) => sum + item.currentValue, 0);
  const overallReturn = totalCurrentValue - totalInvested;
  const overallRoiPercent = totalInvested > 0 ? Math.round((overallReturn / totalInvested) * 100) : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticker || !name || !shares || !buyPrice || !currentValue) return;

    const newAsset: InvestmentAsset = {
      id: `asset-${Date.now()}`,
      assetName: name.trim(),
      assetType: type === 'etfs' ? 'etf' : type === 'stocks' ? 'stock' : type === 'crypto' ? 'crypto' : type === 'real_estate' ? 'real_estate' : 'other',
      investedAmount: Number(shares) * Number(buyPrice),
      currentValue: Number(currentValue),
      purchaseDate: new Date().toISOString().split('T')[0],
      ticker: ticker.toUpperCase().trim(),
      shares: Number(shares),
      buyPrice: Number(buyPrice)
    };

    onAddAsset(newAsset);
    setShowAddModal(false);

    // Reset Form
    setTicker('');
    setName('');
    setShares('');
    setBuyPrice('');
    setCurrentValue('');
  };

  const getAssetTypeBadge = (t: string) => {
    switch (t) {
      case 'stocks':
      case 'stock': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'crypto': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'etfs':
      case 'etf': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'real_estate': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      default: return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div id="investments-view" className="space-y-6">
      
      {/* View Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Briefcase className="text-emerald-400" size={24} />
            Cartera de Inversiones Activas
          </h1>
          <p className="text-xs text-slate-400">
            Supervisa el rendimiento en tiempo real de tus acciones, criptoactivos y carteras indexadas.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-1.5 bg-gradient-to-r from-emerald-400 to-teal-500 hover:scale-[1.02] active:scale-[0.98] text-slate-950 font-bold px-4 py-2.5 rounded-xl text-sm transition-all shadow-lg"
        >
          <Plus size={16} />
          <span>Añadir Activo</span>
        </button>
      </div>

      {/* Portfolio Overview Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Total portfolio size */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative overflow-hidden">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block mb-1">Valor Total Cartera</span>
          <div className="text-3xl font-extrabold text-white tracking-tight font-mono">
            {formatCurrency(totalCurrentValue, profile.currency)}
          </div>
          <span className="text-[10px] text-slate-500 block mt-2 font-sans">
            Tolerancia de riesgo configurada en {profile.riskLevel}.
          </span>
        </div>

        {/* Investment ROI */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative overflow-hidden">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block mb-1">Rendimiento Histórico</span>
          <div className={`text-3xl font-extrabold tracking-tight font-mono flex items-center gap-2 ${
            overallReturn >= 0 ? 'text-emerald-400' : 'text-red-400'
          }`}>
            {overallReturn >= 0 ? '+' : '-'}
            {formatCurrency(Math.abs(overallReturn), profile.currency)}
            <span className="text-sm font-bold font-mono">
              ({overallRoiPercent}%)
            </span>
          </div>
          <span className="text-[10px] text-slate-500 block mt-2 font-sans flex items-center gap-1">
            {overallReturn >= 0 ? <TrendingUp size={12} className="text-emerald-400" /> : <TrendingDown size={12} className="text-red-400" />}
            Frente al capital inicial aportado.
          </span>
        </div>

        {/* Assets weighting info */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative overflow-hidden">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block mb-1">Distribución Táctica</span>
          <div className="flex items-center space-x-3 mt-1">
            <PieChart className="text-purple-400 shrink-0" size={32} />
            <div className="text-xs space-y-0.5">
              <div className="flex items-center space-x-1.5 font-mono text-slate-300">
                <span className="w-2 h-2 rounded-full bg-purple-500 block" />
                <span>ETFs Indexados ({Math.round((state.investments.filter(i => i.assetType === 'etf' || i.ticker === 'etfs').reduce((sum, item) => sum + item.currentValue, 0) / (totalCurrentValue || 1)) * 100)}%)</span>
              </div>
              <div className="flex items-center space-x-1.5 font-mono text-slate-300">
                <span className="w-2 h-2 rounded-full bg-amber-500 block" />
                <span>Criptoactivos ({Math.round((state.investments.filter(i => i.assetType === 'crypto').reduce((sum, item) => sum + item.currentValue, 0) / (totalCurrentValue || 1)) * 100)}%)</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Asset Holdings Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
        <div className="p-5 border-b border-slate-850 flex justify-between items-center bg-slate-900/40">
          <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">Activo</span>
          <div className="flex space-x-12 sm:space-x-24 text-xs font-mono text-slate-500 uppercase tracking-widest">
            <span className="w-20 text-right">Rendimiento</span>
            <span className="w-24 text-right">Valor actual</span>
          </div>
        </div>

        <div className="divide-y divide-slate-800/60">
          {state.investments.map((asset) => {
            const nameVal = asset.assetName;
            const tickerVal = asset.ticker || (asset.assetType ? asset.assetType.toUpperCase() : 'INV');
            const investedVal = asset.investedAmount || ((asset.buyPrice || 0) * (asset.shares || 1));
            const diff = asset.currentValue - investedVal;
            const roi = investedVal > 0 ? Math.round((diff / investedVal) * 100) : 0;
            const sharesVal = asset.shares || 1;
            const buyPriceVal = asset.buyPrice || Math.round(investedVal / sharesVal) || 0;
            const aType = asset.assetType || 'other';
            
            return (
              <div key={asset.id} className="p-4 sm:p-5 flex justify-between items-center hover:bg-slate-950/20 transition-all">
                
                <div className="flex items-center space-x-4">
                  <button 
                    onClick={() => onDeleteAsset(asset.id)}
                    className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                  <div className={`p-2 rounded-xl text-xs font-bold border ${getAssetTypeBadge(aType)}`}>
                    {tickerVal}
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-100 block">{nameVal}</span>
                    <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                      {sharesVal} unidades • Compra: {formatCurrency(buyPriceVal, profile.currency)}
                    </span>
                  </div>
                </div>

                <div className="flex space-x-12 sm:space-x-24 text-right font-mono text-xs">
                  
                  {/* Return block */}
                  <div className={`w-20 font-bold ${diff >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {diff >= 0 ? '+' : '-'}
                    {roi}%
                  </div>

                  {/* Current val */}
                  <div className="w-24 font-extrabold text-slate-200">
                    {formatCurrency(asset.currentValue, profile.currency)}
                  </div>

                </div>

              </div>
            );
          })}

          {state.investments.length === 0 && (
            <div className="text-center py-12">
              <span className="text-xs text-slate-500 font-mono">No has registrado ningún activo financiero de inversión.</span>
            </div>
          )}
        </div>
      </div>

      {/* Add Asset Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6 relative"
          >
            <button 
              onClick={() => setShowAddModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            <div>
              <h2 className="text-xl font-bold tracking-tight text-white">Añadir Activo Financiero</h2>
              <p className="text-xs text-slate-500">Registra un nuevo activo en tu portafolio para calcular tu ROI agregado en tiempo real.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 font-sans">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1.5">Ticker / Símbolo</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. AAPL, BTC, IWDA"
                    value={ticker}
                    onChange={(e) => setTicker(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1.5">Clase de Activo</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="etfs">Fondo Indexado / ETF</option>
                    <option value="stocks">Acciones / Equity</option>
                    <option value="crypto">Criptomonedas</option>
                    <option value="real_estate">Bienes Raíces</option>
                    <option value="cash">Metales o Divisas</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1.5">Nombre del Activo</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Apple Inc. o Bitcoin"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1.5">Unidades</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="1.5"
                    value={shares}
                    onChange={(e) => setShares(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1.5">Compra ({profile.currency})</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="120.00"
                    value={buyPrice}
                    onChange={(e) => setBuyPrice(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1.5">Val. Actual ({profile.currency})</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="145.00"
                    value={currentValue}
                    onChange={(e) => setCurrentValue(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 hover:opacity-90 font-bold text-slate-950 text-xs transition-all shadow-md mt-4"
              >
                Guardar e Integrar en Cartera
              </button>

            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
}
