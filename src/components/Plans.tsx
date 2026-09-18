/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AppState, FinancialPlan } from '../types';
import { calculateFinancialStats, formatCurrency } from '../utils/finance';
import { 
  Plus, 
  Sparkles, 
  Compass, 
  TrendingUp, 
  AlertCircle, 
  X, 
  Activity, 
  Coins, 
  Heart, 
  HelpCircle,
  Clock,
  ArrowRight,
  Trash2
} from 'lucide-react';

interface PlansProps {
  state: AppState;
  onAddPlan: (p: FinancialPlan) => void;
  onDeletePlan: (id: string) => void;
}

export default function Plans({ state, onAddPlan, onDeletePlan }: PlansProps) {
  const profile = state.userProfile!;
  const [showGeneratorModal, setShowGeneratorModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form states
  const [planType, setPlanType] = useState<'saving' | 'investment' | 'debt_payoff' | 'expense_cut' | 'car' | 'home' | 'business'>('saving');
  const [targetAmount, setTargetAmount] = useState('5000');
  const [timeframe, setTimeframe] = useState('12');

  const planTypeLabels: Record<string, string> = {
    saving: 'Plan de Ahorro Rápido',
    investment: 'Plan de Inversión y Retorno',
    debt_payoff: 'Plan para Eliminar Deudas',
    expense_cut: 'Plan de Reducción de Gastos fijos',
    car: 'Plan de Ahorro para Vehículo',
    home: 'Plan para Entrada de Vivienda',
    business: 'Plan de Arranque de Negocio'
  };

  const handleGeneratePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const stats = calculateFinancialStats(state);
      
      const response = await fetch('/api/gemini/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: planType,
          targetAmount: Number(targetAmount),
          timeframeMonths: Number(timeframe),
          profile,
          stats
        })
      });

      if (!response.ok) throw new Error('Plan generation failure');

      const data = await response.json();

      const newPlan: FinancialPlan = {
        id: `plan-${Date.now()}`,
        title: data.title || planTypeLabels[planType],
        type: planType,
        targetAmount: Number(targetAmount) || undefined,
        timeframeMonths: Number(timeframe) || 12,
        actions: data.actions || [
          'Reducir un 15% de gastos discrecionales en ocio y comidas fuera.',
          'Automatizar aportación mensual recurrente a cuenta remunerada.',
          'Configurar alertas de presupuesto al llegar al 80% del límite.',
          'Auditar suscripciones duplicadas.'
        ],
        progressionPercent: 5, // Starts at 5% progress
        simulationScenarios: data.simulationScenarios || {
          optimistic: 'Rendimiento excelente acumulando plusvalías.',
          moderate: 'Cumplimiento nominal de las metas planteadas.',
          conservative: 'Ahorro base acumulado protegiendo contra la inflación.'
        }
      };

      onAddPlan(newPlan);
      setShowGeneratorModal(false);
    } catch (error) {
      console.error('Plan generation failed:', error);
      // Fallback
      onAddPlan({
        id: `plan-${Date.now()}`,
        title: `Plan de Contingencia de ${planTypeLabels[planType]}`,
        type: planType,
        targetAmount: Number(targetAmount),
        timeframeMonths: Number(timeframe),
        actions: [
          'Automatizar un 10% de ahorro del salario neto al inicio del mes.',
          'Auditar suscripciones de ocio activas cancelando las redundantes.',
          'Transferir excedente mensual a cartera indexada diversificada.',
          'Revisar tarifas de suministros domésticos (luz, gas, internet) para recortar fijos.'
        ],
        progressionPercent: 10,
        simulationScenarios: {
          optimistic: 'Si aumentas el ahorro en un 5% extra, lograrás la meta un mes antes.',
          moderate: 'Siguiendo el plan actual lograrás completar la meta en el tiempo estimado.',
          conservative: 'En el peor de los casos acumulando ahorro neto cubrirás el 85% de la meta.'
        }
      });
      setShowGeneratorModal(false);
    } finally {
      setLoading(false);
    }
  };

  const getPlanIconType = (type: string) => {
    switch (type) {
      case 'investment': return <TrendingUp className="text-teal-400" size={18} />;
      case 'saving': return <Coins className="text-emerald-400" size={18} />;
      default: return <Compass className="text-blue-400" size={18} />;
    }
  };

  return (
    <div id="plans-view" className="space-y-6">
      
      {/* View Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Compass className="text-emerald-400" size={24} />
            Planes Financieros Inteligentes
          </h1>
          <p className="text-xs text-slate-400">
            Crea hojas de ruta tácticas diseñadas por la IA a partir de tus ingresos, gastos recurrentes e inversiones.
          </p>
        </div>

        <button
          onClick={() => setShowGeneratorModal(true)}
          className="flex items-center space-x-1.5 bg-gradient-to-r from-emerald-400 to-teal-500 hover:scale-[1.02] active:scale-[0.98] text-slate-950 font-bold px-4 py-2.5 rounded-xl text-sm transition-all shadow-lg"
        >
          <Plus size={16} />
          <span>Generar Plan con IA</span>
        </button>
      </div>

      {/* Plans List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {state.financialPlans.map((plan) => (
          <div key={plan.id} className="card-hover bg-[#0E0E10] border border-white/[0.06] p-6 rounded-[28px] space-y-6 relative overflow-hidden flex flex-col justify-between">
            
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-850">
                    {getPlanIconType(plan.type)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100">{plan.title}</h3>
                    <span className="text-[10px] text-slate-500 font-mono">Plazo: {plan.timeframeMonths} meses</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => onDeletePlan(plan.id)}
                    className="text-slate-600 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                  {plan.targetAmount && (
                    <span className="text-xs font-mono font-bold text-slate-400 bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-full">
                      Meta: {formatCurrency(plan.targetAmount, profile.currency)}
                    </span>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>Progreso estimado</span>
                  <span>{plan.progressionPercent}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-emerald-400 to-teal-400 h-full rounded-full transition-all duration-300" 
                    style={{ width: `${plan.progressionPercent}%` }}
                  />
                </div>
              </div>

              {/* Action items checklist */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">Acciones del Plan</span>
                <div className="space-y-2">
                  {plan.actions.map((act, index) => (
                    <div key={index} className="flex items-start space-x-2 text-xs text-slate-300">
                      <div className="w-4 h-4 rounded-full bg-slate-950 text-emerald-400 border border-slate-800 flex items-center justify-center text-[10px] shrink-0 font-mono mt-0.5">
                        {index + 1}
                      </div>
                      <p className="font-sans leading-relaxed">{act}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Simulated Scenario Matrix */}
              <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800/40 space-y-3">
                <div className="flex items-center space-x-1.5 text-[10px] font-mono text-emerald-400 uppercase tracking-widest">
                  <Activity size={12} />
                  <span>Predicciones y Escenarios</span>
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="text-[9px] font-mono font-bold text-emerald-400 uppercase block">Optimista (+8% rto)</span>
                    <p className="text-[11px] text-slate-400 leading-normal">{plan.simulationScenarios.optimistic}</p>
                  </div>
                  <div>
                    <span className="text-[9px] font-mono font-bold text-slate-300 uppercase block">Conservador (contingencia)</span>
                    <p className="text-[11px] text-slate-400 leading-normal">{plan.simulationScenarios.conservative}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-850 mt-4 flex justify-between items-center">
              <span className="text-[10px] text-slate-500 font-mono">Orientación de IA • Simulación Financiera</span>
              <button 
                onClick={() => {
                  // Simulate progress advancement
                  alert("¡Has registrado el seguimiento del plan! Se ha sumado +50 XP a tu cuenta por mantener la disciplina financiera.");
                }}
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 group transition-colors"
              >
                Actualizar Avance <ArrowRight size={12} className="transform group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

          </div>
        ))}

        {state.financialPlans.length === 0 && (
          <div className="md:col-span-2 text-center py-24 bg-[#0E0E10] border border-white/[0.06] rounded-[28px]">
            <Compass className="text-slate-700 mx-auto mb-4" size={48} />
            <p className="text-sm text-slate-500 font-mono">No hay planes inteligentes activos. Haz clic en "Generar Plan" para iniciar.</p>
          </div>
        )}
      </div>

      {/* Generator Modal */}
      {showGeneratorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg bg-[#0E0E10] border border-white/[0.06] rounded-[28px] p-6 shadow-2xl space-y-6 relative"
          >
            <button 
              onClick={() => setShowGeneratorModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            <div>
              <div className="flex items-center space-x-2 text-emerald-400 font-mono text-xs uppercase tracking-wider">
                <Sparkles size={14} />
                <span>Generador Cognitivo de Planes</span>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-white mt-1">Generar Nueva Estrategia Financiera</h2>
              <p className="text-xs text-slate-500 mt-1">La IA cruzará tu margen de ahorro con el objetivo solicitado para diseñar tácticas y predicciones matemáticas realistas.</p>
            </div>

            <form onSubmit={handleGeneratePlan} className="space-y-4">
              
              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1.5">Tipo de Objetivo o Enfoque</label>
                <select
                  value={planType}
                  onChange={(e) => setPlanType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-base text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="saving">Ahorro Rápido (Colchón de emergencia)</option>
                  <option value="investment">Inversión Recurrente en Fondos/ETFs</option>
                  <option value="debt_payoff">Plan de Eliminación Acelerada de Deudas</option>
                  <option value="expense_cut">Plan Quirúrgico de Reducción de Gastos</option>
                  <option value="car">Ahorro o entrada para Coche</option>
                  <option value="home">Entrada para Compra de Vivienda</option>
                  <option value="business">Capital Semilla para Lanzar Negocio</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1.5">Meta ({profile.currency})</label>
                  <input
                    type="number"
                    required
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    placeholder="Ej. 10000"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-base text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1.5">Plazo (Meses)</label>
                  <input
                    type="number"
                    required
                    value={timeframe}
                    onChange={(e) => setTimeframe(e.target.value)}
                    placeholder="Ej. 12"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-base text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {loading ? (
                <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl text-center space-y-3 py-6">
                  <div className="flex justify-center items-center space-x-2">
                    <Clock className="animate-spin text-emerald-400" size={16} />
                    <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">Calculando Viabilidad...</span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-sans max-w-[280px] mx-auto leading-relaxed">
                    Gemini está analizando tu capacidad de ahorro disponible de {formatCurrency(profile.incomeFixed + profile.incomeVariable - (profile.expenseHousing + profile.expenseFood + profile.expenseLeisure), profile.currency)} /mes para estructurar la predicción de tu plan.
                  </p>
                </div>
              ) : (
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-white hover:bg-[#E5E5EA] font-semibold text-black text-xs transition-all shadow-md mt-4"
                >
                  Generar Plan con Inteligencia Artificial
                </button>
              )}

            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
}
