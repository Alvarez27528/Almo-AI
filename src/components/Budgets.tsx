/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import { AppState } from '../types';
import { calculateFinancialStats, formatCurrency } from '../utils/finance';
import { 
  PieChart, 
  AlertTriangle, 
  Sparkles, 
  ShieldCheck, 
  Settings, 
  Sliders, 
  Bookmark, 
  Info,
  CheckCircle2
} from 'lucide-react';

interface BudgetsProps {
  state: AppState;
}

export default function Budgets({ state }: BudgetsProps) {
  const profile = state.userProfile!;
  const stats = calculateFinancialStats(state);

  const [alertThreshold, setAlertThreshold] = useState<number>(80); // Alert when 80% spent
  const [successSaved, setSuccessSaved] = useState(false);

  // Custom Category caps configured by user
  const [housingCap, setHousingCap] = useState(1000);
  const [foodCap, setFoodCap] = useState(400);
  const [leisureCap, setLeisureCap] = useState(300);
  const [subsCap, setSubsCap] = useState(100);

  // 1. Calculate real category expenditures from current transactions
  const realExpenditures = {
    Vivienda: state.transactions.filter(t => t.category === 'Vivienda' || t.category === 'Alquiler/Hipoteca').reduce((sum, t) => sum + t.amount, 0) || profile.expenseHousing,
    Alimentación: state.transactions.filter(t => t.category === 'Alimentación').reduce((sum, t) => sum + t.amount, 0) || profile.expenseFood,
    Ocio: state.transactions.filter(t => t.category === 'Ocio').reduce((sum, t) => sum + t.amount, 0) || profile.expenseLeisure,
    Suscripciones: state.transactions.filter(t => t.category === 'Suscripciones').reduce((sum, t) => sum + t.amount, 0) || profile.expenseSubscriptions,
  };

  // 50/30/20 Rule recommendation based on real total income
  const totalBudgetable = stats.totalIncome;
  const targetNeeds = Math.round(totalBudgetable * 0.5);
  const targetWants = Math.round(totalBudgetable * 0.3);
  const targetSavings = Math.round(totalBudgetable * 0.2);

  // Current real 50/30/20 distribution
  // Needs = Vivienda + Alimentación + Transporte + Salud + Impuestos
  const realNeeds = 
    realExpenditures.Vivienda + 
    realExpenditures.Alimentación + 
    profile.expenseTransport + 
    profile.expenseHealth + 
    profile.expenseTaxes;

  // Wants = Ocio + Suscripciones
  const realWants = realExpenditures.Ocio + realExpenditures.Suscripciones;

  // Savings = Actual monthly net savings
  const realSavings = stats.monthlySavings;

  const getPercentOfLimit = (spent: number, limit: number) => {
    return Math.round((spent / (limit || 1)) * 100);
  };

  const isOverThreshold = (spent: number, limit: number) => {
    return getPercentOfLimit(spent, limit) >= alertThreshold;
  };

  const handleSaveBudgetSettings = () => {
    setSuccessSaved(true);
    setTimeout(() => setSuccessSaved(false), 2000);
  };

  return (
    <div id="budgets-view" className="space-y-6">
      
      {/* View Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <PieChart className="text-emerald-400" size={24} />
          Límites de Presupuestos e Alertas
        </h1>
        <p className="text-xs text-slate-400">
          Supervisa el cumplimiento de tus objetivos con la regla premium 50/30/20 y configura topes para proteger tu patrimonio de desvíos innecesarios.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column (2 cols span): 50/30/20 Rule compliance */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Rule Card 50/30/20 */}
          <div className="card-hover bg-[#0E0E10] border border-white/[0.06] p-6 rounded-[28px] space-y-6">
            <div>
              <h2 className="text-md font-bold text-slate-100">Distribución de Ley 50/30/20</h2>
              <p className="text-xs text-slate-500 mt-0.5">Distribución ideal recomendada por ALMO AI basada en tus ingresos netos de {formatCurrency(stats.totalIncome, profile.currency)}.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* Needs 50% */}
              <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-850 space-y-3 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500" />
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-200">Necesidades (50%)</span>
                  <span className="text-[10px] font-mono text-slate-500">Tope: {formatCurrency(targetNeeds, profile.currency)}</span>
                </div>
                <div>
                  <span className="text-lg font-mono font-bold text-white">{formatCurrency(realNeeds, profile.currency)}</span>
                  <p className="text-[10px] text-slate-400 mt-1">Suministros, alquiler, vivienda, tasas.</p>
                </div>
                <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                  <div 
                    className="bg-blue-500 h-full rounded-full transition-all duration-300" 
                    style={{ width: `${Math.min(100, (realNeeds / (targetNeeds || 1)) * 100)}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono text-slate-500 block text-right">
                  {Math.round((realNeeds / (targetNeeds || 1)) * 100)}% Utilizado
                </span>
              </div>

              {/* Wants 30% */}
              <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-850 space-y-3 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-pink-500" />
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-200">Ocio y Deseos (30%)</span>
                  <span className="text-[10px] font-mono text-slate-500">Tope: {formatCurrency(targetWants, profile.currency)}</span>
                </div>
                <div>
                  <span className="text-lg font-mono font-bold text-white">{formatCurrency(realWants, profile.currency)}</span>
                  <p className="text-[10px] text-slate-400 mt-1">Restaurantes, ocio, caprichos.</p>
                </div>
                <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                  <div 
                    className="bg-pink-500 h-full rounded-full transition-all duration-300" 
                    style={{ width: `${Math.min(100, (realWants / (targetWants || 1)) * 100)}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono text-slate-500 block text-right">
                  {Math.round((realWants / (targetWants || 1)) * 100)}% Utilizado
                </span>
              </div>

              {/* Savings 20% */}
              <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-850 space-y-3 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-400" />
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-200">Ahorro Neto (20%)</span>
                  <span className="text-[10px] font-mono text-slate-500">Tope: {formatCurrency(targetSavings, profile.currency)}</span>
                </div>
                <div>
                  <span className="text-lg font-mono font-bold text-white">{formatCurrency(realSavings, profile.currency)}</span>
                  <p className="text-[10px] text-slate-400 mt-1">Inversión, colchón, amortizaciones.</p>
                </div>
                <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-400 h-full rounded-full transition-all duration-300" 
                    style={{ width: `${Math.min(100, (realSavings / (targetSavings || 1)) * 100)}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono text-slate-500 block text-right">
                  {Math.round((realSavings / (targetSavings || 1)) * 100)}% Cumplido
                </span>
              </div>

            </div>
          </div>

          {/* Active category budget lines */}
          <div className="card-hover bg-[#0E0E10] border border-white/[0.06] p-6 rounded-[28px] space-y-5">
            <h3 className="text-sm font-bold text-slate-200 font-mono uppercase tracking-wider flex items-center gap-2">
              <Sliders size={16} className="text-emerald-400" />
              Límites Individuales de Gasto
            </h3>

            <div className="space-y-4">
              {[
                { label: 'Vivienda (Alquiler o Hipoteca)', spent: realExpenditures.Vivienda, limit: housingCap, icon: '🏠' },
                { label: 'Alimentación (Compra general)', spent: realExpenditures.Alimentación, limit: foodCap, icon: '🛒' },
                { label: 'Ocio y Restauración', spent: realExpenditures.Ocio, limit: leisureCap, icon: '🍕' },
                { label: 'Suscripciones y Software', spent: realExpenditures.Suscripciones, limit: subsCap, icon: '🎬' }
              ].map((cat, idx) => {
                const percent = getPercentOfLimit(cat.spent, cat.limit);
                const overLimit = percent >= 100;
                const closeToLimit = percent >= alertThreshold;
                
                return (
                  <div key={idx} className="bg-slate-950/40 p-4 rounded-2xl border border-slate-850 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-[#0E0E10] border border-white/[0.06] flex items-center justify-center text-lg shadow-inner">
                        {cat.icon}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-200">{cat.label}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          Consumido: {formatCurrency(cat.spent, profile.currency)} / Límite: {formatCurrency(cat.limit, profile.currency)}
                        </div>
                      </div>
                    </div>

                    <div className="w-full sm:w-48 space-y-1.5 text-right">
                      <div className="flex justify-between sm:justify-end sm:space-x-2 text-xs font-mono">
                        {overLimit ? (
                          <span className="text-red-400 font-bold flex items-center gap-1 text-[10px]">
                            <AlertTriangle size={12} /> ¡Límite Excedido!
                          </span>
                        ) : closeToLimit ? (
                          <span className="text-amber-400 font-bold flex items-center gap-1 text-[10px]">
                            <AlertTriangle size={12} /> Alerta activa
                          </span>
                        ) : (
                          <span className="text-emerald-400 font-semibold text-[10px]">Consumo Seguro</span>
                        )}
                        <span className="text-slate-400">{percent}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${
                            overLimit ? 'bg-red-500' : closeToLimit ? 'bg-amber-400' : 'bg-emerald-400'
                          }`} 
                          style={{ width: `${Math.min(100, percent)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right column: Configuration, alert thresholds, advice */}
        <div className="space-y-6">
          
          {/* Configuration and Threshold settings */}
          <div className="card-hover bg-[#0E0E10] border border-white/[0.06] p-6 rounded-[28px] space-y-6">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-1.5 font-mono uppercase tracking-wider">
              <Settings size={16} className="text-slate-400" />
              Parámetros de Alerta
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1.5">Umbral de Aviso Preventivo</label>
                <div className="grid grid-cols-3 gap-2">
                  {[70, 80, 90].map((t) => (
                    <button
                      key={t}
                      onClick={() => setAlertThreshold(t)}
                      className={`py-2 rounded-xl border text-xs font-semibold transition-all ${
                        alertThreshold === t
                          ? 'bg-amber-500/10 border-amber-500/50 text-amber-400'
                          : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {t}% del límite
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-500 mt-2 font-sans">
                  ALMO AI enviará avisos preventivos y marcará en amarillo los presupuestos cuando alcancen este porcentaje.
                </p>
              </div>

              <div className="relative flex items-center justify-center py-1">
                <div className="w-full border-t border-slate-800"></div>
              </div>

              {/* Adjust custom category limits */}
              <div className="space-y-3">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">Modificar Límites directos</span>
                
                <div className="space-y-2">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">🛒 Límite Alimentación</label>
                    <input 
                      type="number"
                      value={foodCap}
                      onChange={(e) => setFoodCap(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-base text-slate-200 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">🍕 Límite Ocio</label>
                    <input 
                      type="number"
                      value={leisureCap}
                      onChange={(e) => setLeisureCap(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-base text-slate-200 font-mono"
                    />
                  </div>
                </div>
              </div>

              {successSaved ? (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-center text-xs flex items-center justify-center gap-2">
                  <CheckCircle2 size={14} />
                  <span>Configuración guardada correctamente</span>
                </div>
              ) : (
                <button
                  onClick={handleSaveBudgetSettings}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white font-semibold text-xs transition-all text-center"
                >
                  Guardar Cambios de Alerta
                </button>
              )}
            </div>
          </div>

          {/* Advice card on budgets */}
          <div className="bg-gradient-to-r from-slate-900 to-amber-950/10 border border-amber-500/20 p-5 rounded-[28px] space-y-4">
            <div className="flex items-center space-x-1.5 text-amber-400 font-mono text-xs uppercase tracking-wider">
              <Sparkles size={14} />
              <span>Ajustes Inteligentes recomendados</span>
            </div>
            
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              "Observando tu presupuesto de este mes, tu gasto en <strong>Suscripciones (Netflix, Spotify, etc.)</strong> ya roza el {getPercentOfLimit(realExpenditures.Suscripciones, subsCap)}% del límite asignado. Considera pausar una suscripción para redirigir 15 € mensuales adicionales a tu <strong>Plan de Entrada de Vivienda</strong>, acelerando tu meta en 2 meses."
            </p>

            <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-500">
              <ShieldCheck size={12} className="text-emerald-400" />
              <span>Protección activa ALMO AI</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
