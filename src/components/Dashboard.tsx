/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { AppState, Budget } from '../types';
import { FinancialStats, formatCurrency, parseLocalDate } from '../utils/finance';
import MonthlyBudgetView from './MonthlyBudgetView';
import AnimatedNumber from './ui/AnimatedNumber';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Layers,
  ShoppingBag,
  LineChart as LineChartIcon,
  ScanQrCode,
  ArrowRight,
  Plus,
  Flame,
  Award,
  Info
} from 'lucide-react';

const InfoTooltip = ({ text, children }: { text: string, children: React.ReactNode }) => (
  <div className="group relative inline-block cursor-help">
    {children}
    <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 rounded-lg bg-slate-900 p-2 text-center text-xs text-slate-200 border border-slate-700 opacity-0 transition-opacity duration-300 group-hover:opacity-100 z-50">
      {text}
    </div>
  </div>
);
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

interface DashboardProps {
  state: AppState;
  stats: FinancialStats;
  aiTip: string;
  loadingTip: boolean;
  onNavigate: (tab: string) => void;
  onQuickAddTransaction: () => void;
  onUpdateBudgets?: (budgets: Budget[]) => void;
}

export default function Dashboard({
  state,
  stats,
  aiTip,
  loadingTip,
  onNavigate,
  onQuickAddTransaction,
  onUpdateBudgets,
}: DashboardProps) {
  const profile = state.userProfile!;

  // Prepare chart data for last 6 months
  const now = new Date();
  const chartData = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0); // End of month
    const month = d.toLocaleString('es-ES', { month: 'short' });
    
    // Transactions up to monthEnd
    const historicalTransactions = state.transactions.filter(t => {
       const td = parseLocalDate(t.date);
       return td <= monthEnd;
    });

    // Net Worth Calculation based on transaction types
    const netWorth = historicalTransactions.reduce((acc, t) => {
       if (t.type === 'income') return acc + t.amount;
       if (t.type === 'expense') return acc - t.amount;
       return acc;
    }, 0);

    const monthTransactions = state.transactions.filter(t => {
      const td = parseLocalDate(t.date);
      return td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear();
    });
    
    const income = monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expenses = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    
    return { month, income, expenses, netWorth };
  });

  // Determine Level Status titles
  const getLevelInfo = (lvl: number) => {
    if (lvl >= 1000) return { title: 'Leyenda Financiera', icon: '💎', color: 'text-purple-400' };
    if (lvl >= 100) return { title: 'Maestro Financiero', icon: '👑', color: 'text-yellow-400' };
    if (lvl >= 50) return { title: 'Elite Financiero', icon: '🥇', color: 'text-amber-400' };
    if (lvl >= 10) return { title: 'Pro Financiero', icon: '🥈', color: 'text-slate-300' };
    return { title: 'Inversor Iniciado', icon: '🥉', color: 'text-orange-600' };
  };
  const levelInfo = getLevelInfo(state.userLevel);

  // 1. Group expenses by category for circular PieChart
  const expenseTransactions = state.transactions.filter(t => t.type === 'expense');
  const expenseByCategoryMap: Record<string, number> = {};
  
  expenseTransactions.forEach(t => {
    const category = t.category || 'Otros';
    expenseByCategoryMap[category] = (expenseByCategoryMap[category] || 0) + t.amount;
  });

  // Fallback to profile base expenses if no custom transactions registered yet
  if (expenseTransactions.length === 0 && profile) {
    if (profile.expenseHousing) expenseByCategoryMap['Vivienda'] = profile.expenseHousing;
    if (profile.expenseFood) expenseByCategoryMap['Alimentación'] = profile.expenseFood;
    if (profile.expenseTransport) expenseByCategoryMap['Transporte'] = profile.expenseTransport;
    if (profile.expenseLeisure) expenseByCategoryMap['Ocio'] = profile.expenseLeisure;
    if (profile.expenseSubscriptions) expenseByCategoryMap['Suscripciones'] = profile.expenseSubscriptions;
    if (profile.expenseOther) expenseByCategoryMap['Otros'] = profile.expenseOther;
  }

  const pieChartData = Object.entries(expenseByCategoryMap).map(([name, value]) => ({
    name,
    value
  })).filter(item => item.value > 0);

  const PIE_COLORS = [
    '#00FF66', // Emerald
    '#3B82F6', // Blue
    '#EC4899', // Pink
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#10B981', // Teal
    '#6366F1', // Indigo
    '#F43F5E', // Rose
    '#6B7280'  // Gray
  ];

  // 2. All movements chart data
  const hasMovements = state.transactions.length > 0;
  
  // Sort transactions by date (ascending) to show chronologically
  const sortedTransactions = [...state.transactions]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const movementsChartData = sortedTransactions.slice(-8).map(t => {
    const isPositive = t.type === 'income';
    return {
      fecha: t.date.split('-').slice(1).reverse().join('/'), // DD/MM
      concepto: t.description.length > 15 ? t.description.substring(0, 15) + '...' : t.description,
      monto: isPositive ? t.amount : -t.amount,
      tipo: t.type,
      categoria: t.category
    };
  });

  const finalMovementsData = hasMovements ? movementsChartData : [
    { fecha: '12/07', concepto: 'Nómina Recibida', monto: 1800, tipo: 'income', categoria: 'Trabajo' },
    { fecha: '14/07', concepto: 'Alquiler Piso', monto: -650, tipo: 'expense', categoria: 'Vivienda' },
    { fecha: '16/07', concepto: 'Supermercado', monto: -120, tipo: 'expense', categoria: 'Alimentación' },
    { fecha: '18/07', concepto: 'Cena Amigos', monto: -45, tipo: 'expense', categoria: 'Ocio' },
    { fecha: '19/07', concepto: 'Venta Pyme', monto: 120, tipo: 'income', categoria: 'Trabajo' },
    { fecha: '20/07', concepto: 'Suscripción Netflix', monto: -18, tipo: 'expense', categoria: 'Suscripciones' },
  ];


  return (
    <div id="dashboard-container" className="space-y-8">
      
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-5"
      >
        <div>
          <p className="text-[13px] font-medium text-[#8E8E93] mb-1.5">
            {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }).replace(/^\w/, c => c.toUpperCase())}
          </p>
          <h1 className="text-[34px] sm:text-[40px] leading-[1.05] font-semibold tracking-[-0.03em] text-white">
            Hola, {profile.name.split(' ')[0]}
          </h1>
          <p className="text-[14px] text-[#8E8E93] mt-2">
            Tu patrimonio, optimizado para {profile.country}.
          </p>
        </div>

        <div className="flex items-center gap-3 glass px-3.5 py-2.5 rounded-2xl w-full sm:w-auto">
          <div className="w-10 h-10 rounded-[12px] bg-white text-black flex items-center justify-center text-lg font-semibold shrink-0">
            {levelInfo.icon}
          </div>
          <div className="flex-1 min-w-[140px]">
            <div className="flex justify-between items-baseline">
              <span className="text-[12px] font-semibold text-white">Nivel {state.userLevel}</span>
              <span className="text-[10px] text-[#8E8E93] font-mono tabular-nums">{state.userXP} XP</span>
            </div>
            <div className="w-full h-1 bg-white/[0.08] rounded-full mt-1.5 overflow-hidden">
              <motion.div
                className="bg-[#00FF66] h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(state.userXP % 100) / 1}%` }}
                transition={{ type: 'spring', stiffness: 60, damping: 18, delay: 0.2 }}
              />
            </div>
            <span className="text-[10px] text-[#5A5A5E] block mt-1">{levelInfo.title}</span>
          </div>
        </div>
      </motion.div>

      {/* KPI tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
          className="card-hover relative overflow-hidden card-hover bg-[#0E0E10] border border-white/[0.06] p-6 sm:p-7 rounded-[28px]"
        >
          <div className="absolute -top-24 -right-24 w-56 h-56 bg-[#00FF66]/[0.08] blur-[70px] rounded-full pointer-events-none" />
          <div className="flex justify-between items-center mb-4">
            <span className="text-[12px] font-medium text-[#8E8E93]">Saldo disponible</span>
            <span className="w-8 h-8 rounded-full bg-[#00FF66]/10 text-[#00FF66] flex items-center justify-center"><Wallet size={15} /></span>
          </div>
          <div className="text-[36px] sm:text-[40px] leading-none font-semibold text-white tracking-[-0.03em]">
            <InfoTooltip text="Dinero real disponible tras sumar ahorros base y movimientos netos.">
              <AnimatedNumber value={stats.availableCash} format={v => formatCurrency(v, profile.currency)} />
            </InfoTooltip>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="card-hover relative overflow-hidden card-hover bg-[#0E0E10] border border-white/[0.06] p-6 sm:p-7 rounded-[28px]"
        >
          <div className="absolute -top-24 -right-24 w-56 h-56 bg-cyan-400/[0.07] blur-[70px] rounded-full pointer-events-none" />
          <div className="flex justify-between items-center mb-4">
            <span className="text-[12px] font-medium text-[#8E8E93]">Balance del mes</span>
            <span className="w-8 h-8 rounded-full bg-cyan-400/10 text-cyan-400 flex items-center justify-center">
              {stats.totalIncome - stats.totalExpenses >= 0 ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
            </span>
          </div>
          <div className="text-[36px] sm:text-[40px] leading-none font-semibold text-white tracking-[-0.03em]">
            <InfoTooltip text="Ingresos totales menos gastos registrados en el mes actual.">
              <AnimatedNumber value={stats.totalIncome - stats.totalExpenses} format={v => formatCurrency(v, profile.currency)} />
            </InfoTooltip>
          </div>
          <div className="mt-4 text-[12px]">
            {stats.previousMonthExpenses > 0 ? (
              stats.totalExpenses <= stats.previousMonthExpenses ? (
                <span className="inline-flex items-center gap-1 text-[#00FF66] bg-[#00FF66]/10 px-2 py-0.5 rounded-full font-medium">
                  <TrendingDown size={11} /> {Math.round(((stats.previousMonthExpenses - stats.totalExpenses) / stats.previousMonthExpenses) * 100)}% menos gasto que el mes pasado
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full font-medium">
                  <TrendingUp size={11} /> {Math.round(((stats.totalExpenses - stats.previousMonthExpenses) / stats.previousMonthExpenses) * 100)}% más gasto que el mes pasado
                </span>
              )
            ) : <span className="text-[#5A5A5E]">Sin datos del mes anterior</span>}
          </div>
        </motion.div>
      </div>

      {/* Main Bento Core: 2 Column Layout (Adjusted for perfect mobile layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left column (2 cols span): Financial Health & AI tip & Cashflow */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* AI Intelligence Board (High Tech Green Glow) */}
          <div className="card-hover card-hover bg-[#0E0E10] border border-white/[0.06] p-6 sm:p-8 rounded-[28px] relative overflow-hidden">
            <div className="absolute -top-20 -left-20 w-48 h-48 bg-[#00FF66]/[0.06] blur-[60px] rounded-full pointer-events-none" />
            
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={14} className="text-[#00FF66]" />
              <span className="text-[12px] font-medium text-[#8E8E93]">Consejo de ALMO AI</span>
            </div>
            
            <h3 className="text-[19px] font-semibold text-white tracking-[-0.02em] mb-3">
              Recomendación de tu asesor personal
            </h3>

            <div className="text-slate-300 text-sm leading-relaxed min-h-[48px] font-sans">
              {loadingTip ? (
                <div className="flex items-center space-x-3 py-2">
                  <div className="animate-pulse flex space-x-2">
                    <div className="h-1.5 w-1.5 bg-[#00FF66] rounded-full" />
                    <div className="h-1.5 w-1.5 bg-[#00FF66] rounded-full" />
                    <div className="h-1.5 w-1.5 bg-[#00FF66] rounded-full" />
                  </div>
                  <span className="text-xs text-[#00FF66] font-mono">Generando recomendación de cartera...</span>
                </div>
              ) : (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[#D1D1D6] text-[14px] leading-relaxed">
                  "{aiTip}"
                </motion.p>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-[#ffffff08] flex flex-wrap gap-2">
              <button 
                onClick={() => onNavigate('chat')} 
                className="text-xs font-bold text-[#00FF66] hover:text-[#00FF66]/80 flex items-center gap-1 group transition-colors cursor-pointer"
              >
                Preguntar a ALMO AI <ArrowRight size={12} className="transform group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
          
          {/* Quick Actions Panel - Highly responsive grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              onClick={onQuickAddTransaction}
              className="flex flex-col items-center justify-center p-4 rounded-2xl bg-[#0E0E10] border border-white/[0.06] text-slate-400 hover:border-[#00FF66]/20 hover:bg-[#00FF66]/5 hover:text-white hover:scale-[1.02] active:scale-[0.98] transition-all text-center gap-2 cursor-pointer group"
            >
              <div className="p-2.5 rounded-xl bg-slate-950 border border-[#ffffff08] text-[#00FF66] group-hover:bg-[#00FF66] group-hover:text-black transition-all shadow-md">
                <Plus size={18} className="stroke-[2.5]" />
              </div>
              <span className="text-xs font-bold font-sans">Nuevo Movimiento</span>
            </button>

            <button
              onClick={() => onNavigate('scan')}
              className="flex flex-col items-center justify-center p-4 rounded-2xl bg-[#0E0E10] border border-white/[0.06] text-slate-400 hover:border-[#00FF66]/20 hover:bg-[#00FF66]/5 hover:text-white hover:scale-[1.02] active:scale-[0.98] transition-all text-center gap-2 cursor-pointer group"
            >
              <div className="p-2.5 rounded-xl bg-slate-950 border border-[#ffffff08] text-[#00FF66] group-hover:bg-[#00FF66] group-hover:text-black transition-all shadow-md">
                <ScanQrCode size={18} />
              </div>
              <span className="text-xs font-bold font-sans">Escanear Ticket</span>
            </button>

            <button
              onClick={() => onNavigate('simulator')}
              className="flex flex-col items-center justify-center p-4 rounded-2xl bg-[#0E0E10] border border-white/[0.06] text-slate-400 hover:border-[#00FF66]/20 hover:bg-[#00FF66]/5 hover:text-white hover:scale-[1.02] active:scale-[0.98] transition-all text-center gap-2 cursor-pointer group"
            >
              <div className="p-2.5 rounded-xl bg-slate-950 border border-[#ffffff08] text-[#00FF66] group-hover:bg-[#00FF66] group-hover:text-black transition-all shadow-md">
                <LineChartIcon size={18} />
              </div>
              <span className="text-xs font-bold font-sans">Simular Meta</span>
            </button>

            <button
              onClick={() => onNavigate('vinted')}
              className="flex flex-col items-center justify-center p-4 rounded-2xl bg-[#0E0E10] border border-white/[0.06] text-slate-400 hover:border-[#00FF66]/20 hover:bg-[#00FF66]/5 hover:text-white hover:scale-[1.02] active:scale-[0.98] transition-all text-center gap-2 cursor-pointer group"
            >
              <div className="p-2.5 rounded-xl bg-slate-950 border border-[#ffffff08] text-[#00FF66] group-hover:bg-[#00FF66] group-hover:text-black transition-all shadow-md">
                <ShoppingBag size={18} />
              </div>
              <span className="text-xs font-bold font-sans">Modo Vinted / Pyme</span>
            </button>
          </div>

          {/* Monthly Budget View Component */}
          <MonthlyBudgetView state={state} onUpdateBudgets={onUpdateBudgets} />

          {/* Visual Financial Analytics Section (Recharts) */}
          <div className="card-hover bg-[#0E0E10] border border-white/[0.06] p-6 sm:p-8 rounded-[28px] space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-[#ffffff05] pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-[#00FF66]/10 text-[#00FF66]"><TrendingUp size={16} /></span>
                  Análisis Financiero Visual
                </h3>
                <p className="text-xs text-[#8E8E93] mt-0.5">
                  Estadísticas detalladas de tus gastos y flujo de movimientos.
                </p>
              </div>
              {!hasMovements && (
                <span className="text-[9px] font-mono font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                  Vista con datos de ejemplo
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Circular Chart of Expenses by Category */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-mono text-slate-400 uppercase tracking-widest">
                    Gastos por Categoría
                  </h4>
                  <span className="text-[10px] text-rose-400 bg-rose-400/5 px-2 py-0.5 rounded-md font-mono">
                    Desglose Circular
                  </span>
                </div>

                <div className="h-64 relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#18181B',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '12px',
                        }}
                        itemStyle={{ color: '#F3F4F6', fontSize: '12px' }}
                        formatter={(value: number) => [formatCurrency(value, profile.currency), 'Monto']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  {/* Total indicator in the center of the pie */}
                  <div className="absolute flex flex-col items-center">
                    <span className="text-[10px] font-mono text-slate-500 uppercase">Gastado</span>
                    <span className="text-md font-bold text-white">
                      {formatCurrency(
                        hasMovements 
                          ? expenseTransactions.reduce((sum, t) => sum + t.amount, 0)
                          : pieChartData.reduce((sum, item) => sum + item.value, 0),
                        profile.currency
                      )}
                    </span>
                  </div>
                </div>

                {/* Customized Category Legend */}
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto pr-1">
                  {pieChartData.map((item, index) => (
                    <div key={item.name} className="flex items-center space-x-2 text-xs">
                      <span 
                        className="w-2.5 h-2.5 rounded-full shrink-0" 
                        style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} 
                      />
                      <span className="text-slate-300 truncate">{item.name}</span>
                      <span className="text-slate-500 font-mono text-[10px] ml-auto">
                        {formatCurrency(item.value, profile.currency)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chronological Movements Chart of all transactions (Incomes & Expenses) */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-mono text-slate-400 uppercase tracking-widest">
                    Flujo de Movimientos
                  </h4>
                  <span className="text-[10px] text-[#00FF66] bg-[#00FF66]/5 px-2 py-0.5 rounded-md font-mono">
                    Últimos 8 Registros
                  </span>
                </div>

                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={finalMovementsData}
                      margin={{ top: 10, right: 10, left: -25, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis 
                        dataKey="fecha" 
                        stroke="#71717a" 
                        fontSize={10} 
                        tickLine={false} 
                      />
                      <YAxis 
                        stroke="#71717a" 
                        fontSize={10} 
                        tickLine={false}
                        tickFormatter={(value: number) => `${value > 0 ? '+' : ''}${value}`} 
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#18181B',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '12px',
                        }}
                        itemStyle={{ fontSize: '12px' }}
                        labelStyle={{ color: '#9CA3AF', fontSize: '10px' }}
                        formatter={(value: number, name: any, props: any) => [
                          <span style={{ color: value >= 0 ? '#00FF66' : '#EF4444', fontWeight: 'bold' }}>
                            {formatCurrency(value, profile.currency)}
                          </span>,
                          props.payload.concepto
                        ]}
                      />
                      <Bar 
                        dataKey="monto" 
                        radius={[4, 4, 0, 0]}
                      >
                        {finalMovementsData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.monto >= 0 ? '#00FF66' : '#EF4444'} 
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Subtext info */}
                <div className="text-center p-3 rounded-2xl bg-slate-950/40 border border-[#ffffff05]">
                  <p className="text-[11px] text-slate-400 leading-normal">
                    La barra <span className="text-[#00FF66] font-bold">verde</span> representa ingresos que suman capital y la <span className="text-[#EF4444] font-bold">roja</span> representa gastos/extracciones que restan saldo de tu cartera.
                  </p>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Right column: Financial Health circular score (Glowing Neon Green) & active goals */}
        <div className="space-y-8">
          
          {/* Circular Health Score Card */}
          <div className="card-hover bg-[#0E0E10] border border-white/[0.06] p-6 sm:p-8 rounded-[28px] flex flex-col items-center text-center shadow-xl">
            <h3 className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-4">Puntuación de Salud</h3>
            
            <div className="relative w-36 h-36 flex items-center justify-center">
              {/* Circular track with dynamic color */}
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="72"
                  cy="72"
                  r="62"
                  className="stroke-slate-900"
                  strokeWidth="6"
                  fill="transparent"
                />
                <circle
                  cx="72"
                  cy="72"
                  r="62"
                  className="stroke-[#00FF66] transition-all duration-1000 ease-out"
                  strokeWidth="6"
                  fill="transparent"
                  strokeDasharray={`${2 * Math.PI * 62}`}
                  strokeDashoffset={`${2 * Math.PI * 62 * (1 - stats.financialScore / 100)}`}
                  strokeLinecap="round"
                  style={{ filter: 'drop-shadow(0 0 4px rgba(0,255,102,0.5))' }}
                />
              </svg>
              
              {/* Score text */}
              <div className="absolute flex flex-col items-center">
                <span className="text-4xl font-semibold text-white font-mono bg-gradient-to-r from-white to-[#00FF66] bg-clip-text text-transparent">{stats.financialScore}</span>
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider mt-0.5">de 100</span>
              </div>
            </div>

            <div className="mt-4">
              <span className="text-sm font-semibold text-white flex items-center justify-center gap-1.5">
                <Award size={14} className="text-[#00FF66]" />
                {stats.financialScore >= 80 ? 'Excelente Salud' : stats.financialScore >= 60 ? 'Salud Estable' : 'Necesita Optimizar'}
              </span>
              <p className="text-[11px] text-slate-400 mt-1 max-w-[180px] leading-relaxed">
                {stats.financialScore >= 80 
                  ? 'Posees un excelente fondo de emergencia y baja deuda acumulada.' 
                  : 'Considera recortar ocio para acelerar tu fondo de emergencia de 6 meses.'}
              </p>
            </div>
          </div>

          {/* Active Goals Brief */}
          <div className="card-hover bg-[#0E0E10] border border-white/[0.06] p-6 sm:p-8 rounded-[28px] shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Objetivos</h3>
              <button 
                onClick={() => onNavigate('plans')}
                className="text-xs text-[#00FF66] hover:underline font-bold cursor-pointer"
              >
                Ver todos
              </button>
            </div>

            <div className="space-y-4">
              {state.goals.slice(0, 2).map((goal) => {
                const percent = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
                return (
                  <div key={goal.id} className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-slate-200">{goal.title}</span>
                      <span className="font-mono text-slate-400 text-[11px]">
                        {formatCurrency(goal.currentAmount, profile.currency)} / {formatCurrency(goal.targetAmount, profile.currency)}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-[#ffffff05]">
                      <div 
                        className="bg-gradient-to-r from-[#00FF66] to-[#10B981] h-full rounded-full transition-all duration-300" 
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                      <span className="text-[#00FF66] font-bold">{percent}% Completado</span>
                      <span>Meta: {goal.deadline.split('-')[0]}</span>
                    </div>
                  </div>
                );
              })}

              {state.goals.length === 0 && (
                <div className="text-center py-4 text-xs text-slate-500 font-mono">
                  No hay objetivos creados aún.
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Bills brief */}
          <div className="card-hover bg-[#0E0E10] border border-white/[0.06] p-6 sm:p-8 rounded-[28px] shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Próximos Pagos</h3>
              <button 
                onClick={() => onNavigate('calendar')}
                className="text-xs text-[#00FF66] hover:underline font-bold cursor-pointer"
              >
                Calendario
              </button>
            </div>

            <div className="space-y-2.5">
              {state.calendarEvents
                .filter(ev => !ev.isPaid)
                .slice(0, 2)
                .map((ev) => (
                  <div key={ev.id} className="flex justify-between items-center bg-[#1C1C1E] p-2.5 rounded-xl border border-[#ffffff05]">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-[#00FF66] animate-pulse" />
                      <div>
                        <div className="text-xs font-bold text-white">{ev.title}</div>
                        <div className="text-[10px] text-slate-400 font-mono">Vence: {ev.date}</div>
                      </div>
                    </div>
                    <div className="text-xs font-bold text-rose-400 font-mono">
                      <InfoTooltip text="Pago pendiente programado en el calendario.">
                         -{formatCurrency(ev.amount, profile.currency)}
                      </InfoTooltip>
                    </div>
                  </div>
                ))}

              {state.calendarEvents.filter(ev => !ev.isPaid).length === 0 && (
                <div className="text-center py-3 text-xs text-slate-500 font-mono">
                  No hay pagos pendientes para este mes.
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
