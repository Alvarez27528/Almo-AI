/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import { AppState } from '../types';
import { formatCurrency } from '../utils/finance';
import { 
  HelpCircle, 
  TrendingUp, 
  Activity, 
  Sparkles, 
  DollarSign, 
  Home, 
  Car, 
  Coins 
} from 'lucide-react';
import {
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Line,
  LineChart
} from 'recharts';

interface SimulatorProps {
  state: AppState;
}

export default function Simulator({ state }: SimulatorProps) {
  const profile = state.userProfile!;
  
  // Compound Interest States
  const [initialCapital, setInitialCapital] = useState<number>(5000);
  const [monthlyDeposit, setMonthlyDeposit] = useState<number>(300);
  const [annualRate, setAnnualRate] = useState<number>(6); // 6%
  const [time, setTime] = useState<number>(10);
  const [timeUnit, setTimeUnit] = useState<'years' | 'months'>('years');

  // Goal Calculator States
  const [goalType, setGoalType] = useState<'house' | 'car' | 'emergency_fund'>('house');
  const [goalAmount, setGoalAmount] = useState<number>(goalType === 'house' ? 40000 : goalType === 'car' ? 15000 : 8000);
  const [goalMonthly, setGoalMonthly] = useState<number>(400);

  // 1. Compute Compound Interest Array for plotting
  const calculateCompoundData = () => {
    let currentTotal = initialCapital;
    let totalInvested = initialCapital;
    const totalMonths = timeUnit === 'years' ? time * 12 : time;
    const data: { t: number; total: number; invested: number; interest: number }[] = [];
    
    const r = annualRate / 100 / 12; // monthly rate

    for (let m = 1; m <= totalMonths; m++) {
      currentTotal = (currentTotal + monthlyDeposit) * (1 + r);
      totalInvested += monthlyDeposit;
      
      // Plot data points (simplified, e.g., every 12 months)
      if (m % Math.max(1, Math.floor(totalMonths / 20)) === 0 || m === totalMonths) {
        data.push({
          t: m,
          total: Math.round(currentTotal),
          invested: Math.round(totalInvested),
          interest: Math.round(Math.max(0, currentTotal - totalInvested))
        });
      }
    }
    return data;
  };

  const compoundData = calculateCompoundData();
  const finalTotal = compoundData[compoundData.length - 1]?.total || initialCapital;
  const finalInvested = compoundData[compoundData.length - 1]?.invested || initialCapital;
  const finalInterest = compoundData[compoundData.length - 1]?.interest || 0;

  // 2. Goal Calculations
  const estimateGoalMonths = () => {
    const monthlyReturn = 3.5 / 100 / 12; // Assume a safe 3.5% yield on savings account
    let current = state.userProfile?.currentSavings || 0;
    let m = 0;
    
    if (goalMonthly <= 0) return 999;

    while (current < goalAmount && m < 360) {
      current = (current + goalMonthly) * (1 + monthlyReturn);
      m++;
    }
    return m;
  };

  const goalMonths = estimateGoalMonths();
  const goalYears = (goalMonths / 12).toFixed(1);

  // Simple SVG charting
  // (Removed legacy SVG charting in favor of Recharts)

  return (
    <div id="simulator-view" className="space-y-6">
      
      {/* View Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <TrendingUp className="text-emerald-400" size={24} />
          Simulador Escenario de Futuro
        </h1>
        <p className="text-xs text-slate-400">
          Haz proyecciones a largo plazo basadas en interés compuesto o calcula plazos exactos para comprar tu vivienda o coche.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Compound Interest Sandbox */}
        <div className="card-hover bg-[#0E0E10] border border-white/[0.06] p-6 rounded-[28px] space-y-6 flex flex-col justify-between">
          <div className="space-y-5">
            <h2 className="text-sm font-bold text-slate-200 flex items-center gap-1.5 font-mono uppercase tracking-wider">
              <Coins size={16} className="text-amber-400" />
              Arena de Interés Compuesto
            </h2>

            <div className="space-y-4">
              {/* Capital Inicial */}
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1.5 font-sans">
                  <span>Capital de Inicio</span>
                  <span className="font-mono font-bold text-white">{formatCurrency(initialCapital, profile.currency)}</span>
                </div>
                <input 
                  type="range" 
                  min="500" 
                  max="100000" 
                  step="500"
                  value={initialCapital}
                  onChange={(e) => setInitialCapital(Number(e.target.value))}
                  className="w-full accent-emerald-400 h-1 bg-slate-950 rounded-lg cursor-pointer"
                />
              </div>

              {/* Aportación Mensual */}
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1.5 font-sans">
                  <span>Depósito Mensual</span>
                  <span className="font-mono font-bold text-white">{formatCurrency(monthlyDeposit, profile.currency)} /mes</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="5000" 
                  step="50"
                  value={monthlyDeposit}
                  onChange={(e) => setMonthlyDeposit(Number(e.target.value))}
                  className="w-full accent-emerald-400 h-1 bg-slate-950 rounded-lg cursor-pointer"
                />
              </div>

              {/* Tasa de interés */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1">Rendimiento Anual Estimado</label>
                  <div className="relative">
                    <input 
                      type="number"
                      value={annualRate}
                      min="1"
                      max="30"
                      onChange={(e) => setAnnualRate(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-500">%</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1">Plazo de Proyección</label>
                  <div className="relative flex gap-2">
                    <input 
                      type="number"
                      value={time}
                      min="1"
                      max={timeUnit === 'years' ? 50 : 600}
                      onChange={(e) => setTime(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                    <select 
                      value={timeUnit}
                      onChange={(e) => setTimeUnit(e.target.value as 'years' | 'months')}
                      className="bg-slate-950 border border-slate-800 rounded-xl px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                    >
                      <option value="years">años</option>
                      <option value="months">meses</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Projection Outputs summary & chart */}
          <div className="space-y-4 pt-4 border-t border-slate-850">
            
            {/* Compound line chart */}
            <div className="bg-slate-950/40 p-3 rounded-2xl border border-slate-800/40 flex flex-col justify-between">
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block mb-2">Curva de Capital Acumulado</span>
              
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={compoundData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="t" tick={{fontSize: 10, fill: '#94a3b8'}} />
                        <YAxis tick={{fontSize: 10, fill: '#94a3b8'}} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '12px' }}
                            itemStyle={{ color: '#e2e8f0' }}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="total" name="Total" stroke="#34d399" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="invested" name="Aportado" stroke="#3b82f6" strokeWidth={2} dot={false} />
                    </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="flex justify-between items-center text-[9px] font-mono text-slate-500 mt-2">
                <span>{time} {timeUnit}</span>
              </div>
            </div>

            {/* Calculations summaries */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-950/40 p-3 rounded-xl text-center border border-slate-800/40">
                <span className="text-[9px] font-mono text-slate-500 uppercase block">Total Final</span>
                <span className="text-sm font-semibold text-emerald-400 font-mono">{formatCurrency(finalTotal, profile.currency)}</span>
              </div>
              <div className="bg-slate-950/40 p-3 rounded-xl text-center border border-slate-800/40">
                <span className="text-[9px] font-mono text-slate-500 uppercase block">Aportado</span>
                <span className="text-sm font-semibold text-slate-300 font-mono">{formatCurrency(finalInvested, profile.currency)}</span>
              </div>
              <div className="bg-slate-950/40 p-3 rounded-xl text-center border border-slate-800/40">
                <span className="text-[9px] font-mono text-slate-500 uppercase block">Ganancia</span>
                <span className="text-sm font-bold text-teal-300 font-mono">+{formatCurrency(finalInterest, profile.currency)}</span>
              </div>
            </div>

          </div>
        </div>

        {/* Goal Achiever Scenario Planner */}
        <div className="card-hover bg-[#0E0E10] border border-white/[0.06] p-6 rounded-[28px] space-y-6 flex flex-col justify-between">
          <div className="space-y-5">
            <h2 className="text-sm font-bold text-slate-200 flex items-center gap-1.5 font-mono uppercase tracking-wider">
              {goalType === 'house' ? <Home size={16} className="text-blue-400" /> : goalType === 'car' ? <Car size={16} className="text-indigo-400" /> : <Coins size={16} className="text-emerald-400" />}
              Planificador de Objetivos Vitales
            </h2>

            {/* Goal Preset Selectors */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'house', label: 'Vivienda', icon: <Home size={14} />, amt: 40000 },
                { key: 'car', label: 'Coche', icon: <Car size={14} />, amt: 15000 },
                { key: 'emergency_fund', label: 'Fondo Emergencias', icon: <Coins size={14} />, amt: 8000 }
              ].map((preset) => (
                <button
                  key={preset.key}
                  onClick={() => {
                    setGoalType(preset.key as any);
                    setGoalAmount(preset.amt);
                  }}
                  className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                    goalType === preset.key
                      ? 'bg-emerald-500/10 border-emerald-500 text-slate-100'
                      : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {preset.icon}
                  <span className="text-[10px] font-bold font-sans">{preset.label}</span>
                </button>
              ))}
            </div>

            {/* Target Value Slider */}
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1.5 font-sans">
                <span>Importe Objetivo</span>
                <span className="font-mono font-bold text-white">{formatCurrency(goalAmount, profile.currency)}</span>
              </div>
              <input 
                type="range" 
                min="1000" 
                max="250000" 
                step="1000"
                value={goalAmount}
                onChange={(e) => setGoalAmount(Number(e.target.value))}
                className="w-full accent-emerald-400 h-1 bg-slate-950 rounded-lg cursor-pointer"
              />
            </div>

            {/* Monthly saving slider */}
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1.5 font-sans">
                <span>Tu Ahorro Mensual Destinado</span>
                <span className="font-mono font-bold text-white">{formatCurrency(goalMonthly, profile.currency)} /mes</span>
              </div>
              <input 
                type="range" 
                min="50" 
                max="4000" 
                step="50"
                value={goalMonthly}
                onChange={(e) => setGoalMonthly(Number(e.target.value))}
                className="w-full accent-emerald-400 h-1 bg-slate-950 rounded-lg cursor-pointer"
              />
              <span className="text-[10px] text-slate-500 block mt-1 font-sans">
                * Tu colchón de ahorros de inicio actual de {formatCurrency(profile.currentSavings, profile.currency)} se incluye como base de la simulación.
              </span>
            </div>
          </div>

          {/* Goal simulation diagnostic result */}
          <div className="bg-gradient-to-r from-slate-950 via-slate-950 to-emerald-950/10 p-5 rounded-2xl border border-emerald-500/20 space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2 text-emerald-400 font-mono text-xs uppercase tracking-wider">
                <Sparkles size={14} />
                <span>Viabilidad de Meta ALMO AI</span>
              </div>
              <span className="text-[10px] font-mono text-slate-500">TIR 3.5% anualizada</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[9px] font-mono text-slate-500 uppercase block">Plazo Estimado</span>
                <span className="text-xl font-semibold text-white font-sans">{goalMonths >= 360 ? 'Inviable' : `${goalMonths} meses`}</span>
                <span className="text-[10px] text-slate-400 font-mono block mt-0.5">({goalYears} años)</span>
              </div>

              <div>
                <span className="text-[9px] font-mono text-slate-500 uppercase block">Interés Remunerado</span>
                <span className="text-xl font-bold text-emerald-400 font-mono">+{formatCurrency(Math.round(Math.max(0, goalAmount - profile.currentSavings - (goalMonthly * goalMonths))), profile.currency)}</span>
                <span className="text-[10px] text-slate-400 font-sans block mt-0.5">Ahorrado por interés compuesto</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 font-sans leading-normal">
              {goalMonths < 12 
                ? '¡Meta sumamente asequible! En menos de un año lograrás completar la totalidad del objetivo manteniendo tu tasa de ahorro.'
                : goalMonths < 48 
                ? `Manteniendo el plan, comprarás tu ${goalType === 'house' ? 'vivienda' : goalType === 'car' ? 'vehículo' : 'fondo'} de forma solvente. Te aconsejamos colocar las cuotas en una cuenta de alto rendimiento.`
                : 'Esta meta requiere un esfuerzo a largo plazo. Considera aumentar un 15% tus aportaciones mensuales o destinar ingresos extra para acelerar la consecución.'}
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
