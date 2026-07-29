/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import { AppState } from '../types';
import { calculateFinancialStats, formatCurrency } from '../utils/finance';
import { 
  BarChart4, 
  TrendingUp, 
  PieChart, 
  Activity, 
  HelpCircle, 
  Sparkles,
  Percent,
  TrendingDown
} from 'lucide-react';

interface StatisticsProps {
  state: AppState;
}

export default function Statistics({ state }: StatisticsProps) {
  const profile = state.userProfile!;
  const stats = calculateFinancialStats(state);

  const [activeChart, setActiveChart] = useState<'cashflow' | 'assets' | 'categories'>('cashflow');

  // 1. Categories data setup
  const totalExpenses = stats.totalExpenses || 1;
  const categoriesData = [
    { name: 'Vivienda', amt: profile.expenseHousing, percent: Math.round((profile.expenseHousing / totalExpenses) * 100), color: 'bg-blue-500' },
    { name: 'Alimentación', amt: profile.expenseFood, percent: Math.round((profile.expenseFood / totalExpenses) * 100), color: 'bg-amber-400' },
    { name: 'Ocio', amt: profile.expenseLeisure, percent: Math.round((profile.expenseLeisure / totalExpenses) * 100), color: 'bg-pink-400' },
    { name: 'Suscripciones', amt: profile.expenseSubscriptions, percent: Math.round((profile.expenseSubscriptions / totalExpenses) * 100), color: 'bg-purple-400' },
    { name: 'Transporte', amt: profile.expenseTransport, percent: Math.round((profile.expenseTransport / totalExpenses) * 100), color: 'bg-indigo-400' },
    { name: 'Otros', amt: profile.expenseOther, percent: Math.round((profile.expenseOther / totalExpenses) * 100), color: 'bg-slate-400' }
  ].sort((a, b) => b.amt - a.amt);

  // 2. Mock Cashflow months trend
  const cashflowTrend = [
    { month: 'Ene', income: Math.round(stats.totalIncome * 0.9), expense: Math.round(stats.totalExpenses * 1.1) },
    { month: 'Feb', income: Math.round(stats.totalIncome * 0.95), expense: Math.round(stats.totalExpenses * 0.9) },
    { month: 'Mar', income: Math.round(stats.totalIncome), expense: Math.round(stats.totalExpenses * 0.95) },
    { month: 'Abr', income: Math.round(stats.totalIncome * 1.05), expense: Math.round(stats.totalExpenses * 1.0) },
    { month: 'May', income: Math.round(stats.totalIncome), expense: Math.round(stats.totalExpenses * 0.85) },
    { month: 'Jun', income: stats.totalIncome, expense: stats.totalExpenses }
  ];

  const maxTrendValue = Math.max(...cashflowTrend.flatMap(d => [d.income, d.expense])) || 1000;

  return (
    <div id="statistics-view" className="space-y-6 font-sans">
      
      {/* View Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <BarChart4 className="text-emerald-400" size={24} />
            Análisis Visual Estadístico
          </h1>
          <p className="text-xs text-slate-400">
            Examina tus ratios, distribuciones por categorías y series temporales de flujo de caja con gráficos interactivos.
          </p>
        </div>

        {/* Chart Selector tab pills */}
        <div className="flex gap-1 bg-slate-900 p-1 rounded-xl border border-slate-850">
          {[
            { key: 'cashflow', label: 'Flujo de Caja' },
            { key: 'assets', label: 'Asignación' },
            { key: 'categories', label: 'Gastos' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveChart(tab.key as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeChart === tab.key
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Chart Card (2 Cols Span) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-6 min-h-[380px] flex flex-col justify-between">
          
          {/* Chart Header */}
          <div>
            <h3 className="text-md font-bold text-slate-200">
              {activeChart === 'cashflow' ? 'Evolución de Ingresos vs Gastos' : activeChart === 'assets' ? 'Distribución del Patrimonio' : 'Distribución Relativa por Categorías'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {activeChart === 'cashflow' ? 'Serie semestral comparativa de entradas de liquidez frente a salidas totales.' : activeChart === 'assets' ? 'Relación de capital líquido frente a carteras de renta variable e inversiones.' : 'Desglose proporcional de todas tus categorías de egresos recurrentes.'}
            </p>
          </div>

          {/* Render Active Chart View */}
          <div className="flex-1 flex items-center justify-center py-6">
            
            {/* 1. CASHFLOW CHART */}
            {activeChart === 'cashflow' && (
              <div className="w-full space-y-6">
                {/* Custom SVG Columns Grid */}
                <div className="flex justify-between items-end h-48 px-4 border-b border-slate-800 pb-2">
                  {cashflowTrend.map((t, idx) => {
                    const incPercent = (t.income / maxTrendValue) * 100;
                    const expPercent = (t.expense / maxTrendValue) * 100;

                    return (
                      <div key={idx} className="flex flex-col items-center flex-1 space-y-2">
                        {/* Dual bars */}
                        <div className="flex items-end space-x-1.5 h-36">
                          {/* Income Bar */}
                          <div 
                            className="w-3.5 bg-emerald-400/80 rounded-t-sm hover:bg-emerald-400 transition-all cursor-pointer relative group"
                            style={{ height: `${incPercent}%` }}
                          >
                            {/* Hover tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-slate-950 text-[9px] font-mono font-bold text-white px-2 py-0.5 rounded shadow">
                              {formatCurrency(t.income, profile.currency)}
                            </div>
                          </div>

                          {/* Expense Bar */}
                          <div 
                            className="w-3.5 bg-red-400/80 rounded-t-sm hover:bg-red-400 transition-all cursor-pointer relative group"
                            style={{ height: `${expPercent}%` }}
                          >
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-slate-950 text-[9px] font-mono font-bold text-white px-2 py-0.5 rounded shadow">
                              {formatCurrency(t.expense, profile.currency)}
                            </div>
                          </div>
                        </div>

                        {/* Month Label */}
                        <span className="text-[10px] font-mono text-slate-500">{t.month}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Chart Legends */}
                <div className="flex justify-center items-center space-x-6 text-[10px] font-mono text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 bg-emerald-400 rounded-sm" />
                    <span>Ingresos de Caja</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 bg-red-400 rounded-sm" />
                    <span>Egresos / Gastos</span>
                  </div>
                </div>
              </div>
            )}

            {/* 2. ASSETS RING */}
            {activeChart === 'assets' && (
              <div className="flex flex-col sm:flex-row justify-center items-center gap-8 w-full">
                
                {/* SVG Radial donut chart */}
                <div className="relative w-36 h-36 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    {/* Background grey ring */}
                    <circle cx="72" cy="72" r="60" className="stroke-slate-800" strokeWidth="12" fill="transparent" />
                    {/* Savings Segment (availableCash) */}
                    <circle 
                      cx="72" 
                      cy="72" 
                      r="60" 
                      className="stroke-emerald-400" 
                      strokeWidth="12" 
                      fill="transparent" 
                      strokeDasharray={`${2 * Math.PI * 60}`}
                      strokeDashoffset={`${2 * Math.PI * 60 * (1 - stats.availableCash / (stats.netWorth || 1))}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute text-center flex flex-col">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Patrimonio</span>
                    <span className="text-md font-bold text-slate-200 font-mono">
                      {Math.round((stats.availableCash / (stats.netWorth || 1)) * 100)}% Liq.
                    </span>
                  </div>
                </div>

                {/* Legend list */}
                <div className="space-y-4">
                  <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850 flex items-center space-x-4">
                    <span className="text-xl">💰</span>
                    <div>
                      <span className="text-[10px] font-mono text-slate-500 uppercase">Ahorro Líquido</span>
                      <span className="text-sm font-bold text-slate-200 block font-mono">{formatCurrency(stats.availableCash, profile.currency)}</span>
                    </div>
                  </div>

                  <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850 flex items-center space-x-4">
                    <span className="text-xl">📈</span>
                    <div>
                      <span className="text-[10px] font-mono text-slate-500 uppercase">Inversión Activa</span>
                      <span className="text-sm font-bold text-slate-200 block font-mono">{formatCurrency(stats.totalInvestments, profile.currency)}</span>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* 3. CATEGORIES PROGRESS BAR */}
            {activeChart === 'categories' && (
              <div className="w-full space-y-3.5 max-h-[220px] overflow-y-auto pr-2">
                {categoriesData.map((cat, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-200">{cat.name}</span>
                      <span className="font-mono text-slate-400">
                        {formatCurrency(cat.amt, profile.currency)} ({cat.percent}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                      <div 
                        className={`${cat.color} h-full rounded-full transition-all duration-300`} 
                        style={{ width: `${Math.min(100, cat.percent)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>

          <div className="pt-4 border-t border-slate-850 mt-4 flex justify-between items-center text-[10px] font-mono text-slate-500">
            <span>Gráficos Propios de Precisión</span>
            <span>ALMO AI Engine</span>
          </div>

        </div>

        {/* Side Widget: Financial score details */}
        <div className="space-y-6">
          
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
            <h3 className="text-xs font-mono text-slate-500 uppercase tracking-widest block mb-1">Ratios Clave del Diagnóstico</h3>

            <div className="space-y-4">
              {/* Savings rate */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-400 font-sans">
                  <span>Tasa de Ahorro Neto</span>
                  <span className="font-mono font-bold text-emerald-400">{stats.savingsRate}%</span>
                </div>
                <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-400 rounded-full" 
                    style={{ width: `${Math.min(100, stats.savingsRate)}%` }}
                  />
                </div>
              </div>

              {/* Debt To Income ratio */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-400 font-sans">
                  <span>Deuda sobre Ingresos</span>
                  <span className="font-mono font-bold text-red-400">{stats.debtToIncomeRatio}%</span>
                </div>
                <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-red-400 rounded-full" 
                    style={{ width: `${Math.min(100, stats.debtToIncomeRatio)}%` }}
                  />
                </div>
              </div>

              {/* Cashflow health index */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-400 font-sans">
                  <span>Margen de Flujo de Caja</span>
                  <span className="font-mono font-bold text-teal-300">{stats.cashFlowIndex}%</span>
                </div>
                <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-teal-300 rounded-full" 
                    style={{ width: `${Math.min(100, stats.cashFlowIndex)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* AI diagnosis on stats */}
          <div className="bg-gradient-to-r from-slate-900 to-emerald-950/10 border border-emerald-500/20 p-5 rounded-3xl space-y-3">
            <div className="flex items-center space-x-1.5 text-emerald-400 font-mono text-xs uppercase tracking-wider">
              <Sparkles size={14} />
              <span>Análisis de Coeficientes</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              "Felicidades. Tu tasa de ahorro neta de {stats.savingsRate}% se encuentra significativamente por encima del percentil estándar de {profile.country} ({stats.savingsRate >= 20 ? 'excelente grado de salud' : 'nivel intermedio'}). Mantener este nivel acelerará la consecución de tus objetivos prioritarios de futuro."
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
