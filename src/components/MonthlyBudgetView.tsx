/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AppState, Budget, UserProfile } from '../types';
import { formatCurrency } from '../utils/finance';
import {
  PieChart,
  Home,
  Utensils,
  Car,
  Tv,
  Gamepad2,
  GraduationCap,
  HeartPulse,
  MoreHorizontal,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Edit3,
  Save,
  RotateCcw,
  Sparkles,
  TrendingUp,
  DollarSign,
  Plus,
  ShieldCheck,
  X
} from 'lucide-react';

interface MonthlyBudgetViewProps {
  state: AppState;
  onUpdateBudgets?: (budgets: Budget[]) => void;
}

interface CategoryBudgetItem {
  category: string;
  limitAmount: number;
  spentAmount: number;
  type: 'needs' | 'wants' | 'other';
  icon: React.ReactNode;
  color: string;
}

export default function MonthlyBudgetView({ state, onUpdateBudgets }: MonthlyBudgetViewProps) {
  const profile = state.userProfile as UserProfile;
  const currency = profile?.currency || 'EUR';

  const [activeFilter, setActiveFilter] = useState<'all' | 'needs' | 'wants'>('all');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [tempLimit, setTempLimit] = useState<number>(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatLimit, setNewCatLimit] = useState('');
  const [saveNotification, setSaveNotification] = useState(false);

  // Define Standard Categories with their baseline fallback limits and classification
  const defaultCategoryConfigs: Array<{
    name: string;
    fallbackLimit: number;
    type: 'needs' | 'wants' | 'other';
    icon: React.ReactNode;
    color: string;
    aliases: string[];
  }> = [
    {
      name: 'Vivienda',
      fallbackLimit: profile?.expenseHousing || 900,
      type: 'needs',
      icon: <Home size={18} />,
      color: '#3B82F6', // Blue
      aliases: ['vivienda', 'alquiler', 'hipoteca', 'casa']
    },
    {
      name: 'Alimentación',
      fallbackLimit: profile?.expenseFood || 350,
      type: 'needs',
      icon: <Utensils size={18} />,
      color: '#00FF66', // Emerald
      aliases: ['alimentación', 'alimentacion', 'supermercado', 'comida', 'groceries']
    },
    {
      name: 'Transporte',
      fallbackLimit: profile?.expenseTransport || 150,
      type: 'needs',
      icon: <Car size={18} />,
      color: '#06B6D4', // Cyan
      aliases: ['transporte', 'gasolina', 'coche', 'bus', 'metro']
    },
    {
      name: 'Ocio',
      fallbackLimit: profile?.expenseLeisure || 200,
      type: 'wants',
      icon: <Gamepad2 size={18} />,
      color: '#EC4899', // Pink
      aliases: ['ocio', 'restaurantes', 'entretenimiento', 'fiesta', 'salidas']
    },
    {
      name: 'Suscripciones',
      fallbackLimit: profile?.expenseSubscriptions || 60,
      type: 'wants',
      icon: <Tv size={18} />,
      color: '#8B5CF6', // Purple
      aliases: ['suscripciones', 'netflix', 'spotify', 'servicios', 'software']
    },
    {
      name: 'Educación',
      fallbackLimit: profile?.expenseEducation || 100,
      type: 'needs',
      icon: <GraduationCap size={18} />,
      color: '#F59E0B', // Amber
      aliases: ['educación', 'educacion', 'cursos', 'libros', 'formacion']
    },
    {
      name: 'Salud',
      fallbackLimit: profile?.expenseHealth || 100,
      type: 'needs',
      icon: <HeartPulse size={18} />,
      color: '#10B981', // Teal
      aliases: ['salud', 'farmacia', 'médico', 'medico', 'gimnasio']
    },
    {
      name: 'Otros',
      fallbackLimit: profile?.expenseOther || 150,
      type: 'other',
      icon: <MoreHorizontal size={18} />,
      color: '#6B7280', // Gray
      aliases: ['otros', 'varios', 'gastos varios']
    }
  ];

  // Helper to calculate total spent for a category from state.transactions
  const calculateSpentForCategory = (catName: string, aliases: string[]) => {
    return state.transactions
      .filter(t => {
        if (t.type !== 'expense') return false;
        const catLower = (t.category || '').toLowerCase().trim();
        const mainCatLower = catName.toLowerCase();
        
        if (catLower === mainCatLower) return true;
        return aliases.some(alias => catLower.includes(alias.toLowerCase()));
      })
      .reduce((sum, t) => sum + t.amount, 0);
  };

  // Build current Category Budget list combining state.budgets and profile fallbacks
  const budgetItems: CategoryBudgetItem[] = defaultCategoryConfigs.map(config => {
    // Check if user set an explicit limit in state.budgets
    const explicitBudget = (state.budgets || []).find(
      b => b.category.toLowerCase().trim() === config.name.toLowerCase().trim()
    );

    const limitAmount = explicitBudget && explicitBudget.limitAmount > 0 
      ? explicitBudget.limitAmount 
      : config.fallbackLimit;

    const spentAmount = calculateSpentForCategory(config.name, config.aliases);

    return {
      category: config.name,
      limitAmount,
      spentAmount,
      type: config.type,
      icon: config.icon,
      color: config.color
    };
  });

  // Also append custom user-defined budget categories from state.budgets that are not in default list
  (state.budgets || []).forEach(b => {
    const isDefault = defaultCategoryConfigs.some(
      c => c.name.toLowerCase().trim() === b.category.toLowerCase().trim()
    );
    if (!isDefault && b.category) {
      const spentAmount = calculateSpentForCategory(b.category, [b.category]);
      budgetItems.push({
        category: b.category,
        limitAmount: b.limitAmount,
        spentAmount: spentAmount || b.spentAmount || 0,
        type: 'other',
        icon: <MoreHorizontal size={18} />,
        color: '#6366F1'
      });
    }
  });

  // Calculate totals across all categories
  const totalLimit = budgetItems.reduce((acc, item) => acc + item.limitAmount, 0);
  const totalSpent = budgetItems.reduce((acc, item) => acc + item.spentAmount, 0);
  const totalRemaining = totalLimit - totalSpent;
  const overallPercentage = totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : 0;

  // Filter items
  const filteredItems = budgetItems.filter(item => {
    if (activeFilter === 'needs') return item.type === 'needs';
    if (activeFilter === 'wants') return item.type === 'wants';
    return true;
  });

  // Start Editing inline limit
  const handleStartEdit = (category: string, currentLimit: number) => {
    setEditingCategory(category);
    setTempLimit(currentLimit);
  };

  // Save Inline limit change
  const handleSaveLimit = (category: string) => {
    if (tempLimit < 0) return;

    const currentBudgets = [...(state.budgets || [])];
    const existingIndex = currentBudgets.findIndex(
      b => b.category.toLowerCase().trim() === category.toLowerCase().trim()
    );

    if (existingIndex >= 0) {
      currentBudgets[existingIndex] = {
        ...currentBudgets[existingIndex],
        limitAmount: tempLimit
      };
    } else {
      const itemSpent = calculateSpentForCategory(category, [category]);
      currentBudgets.push({
        category,
        limitAmount: tempLimit,
        spentAmount: itemSpent
      });
    }

    if (onUpdateBudgets) {
      onUpdateBudgets(currentBudgets);
    }
    setEditingCategory(null);
    setSaveNotification(true);
    setTimeout(() => setSaveNotification(false), 2500);
  };

  // Add custom new category budget
  const handleAddCustomCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim() || !newCatLimit || parseFloat(newCatLimit) <= 0) return;

    const limitVal = parseFloat(newCatLimit);
    const currentBudgets = [...(state.budgets || [])];
    const existingIndex = currentBudgets.findIndex(
      b => b.category.toLowerCase().trim() === newCatName.trim().toLowerCase()
    );

    if (existingIndex >= 0) {
      currentBudgets[existingIndex] = {
        ...currentBudgets[existingIndex],
        limitAmount: limitVal
      };
    } else {
      currentBudgets.push({
        category: newCatName.trim(),
        limitAmount: limitVal,
        spentAmount: 0
      });
    }

    if (onUpdateBudgets) {
      onUpdateBudgets(currentBudgets);
    }

    setNewCatName('');
    setNewCatLimit('');
    setShowAddModal(false);
    setSaveNotification(true);
    setTimeout(() => setSaveNotification(false), 2500);
  };

  return (
    <div id="monthly-budget-view" className="bg-[#121214] border border-[#ffffff08] p-6 sm:p-8 rounded-3xl space-y-8 shadow-xl relative overflow-hidden">
      
      {/* Background Subtle Accent Glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-[#00FF66]/5 blur-3xl pointer-events-none rounded-full" />

      {/* Header with Title, Actions & Notification */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#ffffff05] pb-5 relative z-10">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#00FF66]/10 text-[#00FF66]">
              <PieChart size={20} />
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              Control de Presupuesto Mensual
            </h3>
          </div>
          <p className="text-xs text-[#8E8E93] mt-1">
            Supervisión en tiempo real del límite establecido vs. gastos registrados por categoría.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {saveNotification && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#00FF66]/15 border border-[#00FF66]/30 text-[#00FF66] text-xs font-bold"
            >
              <CheckCircle2 size={14} />
              <span>¡Límites actualizados!</span>
            </motion.div>
          )}

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#1A1A1E] hover:bg-[#24242A] border border-[#ffffff10] text-xs font-semibold text-white transition-all hover:scale-[1.02] active:scale-95"
          >
            <Plus size={14} className="text-[#00FF66]" />
            <span>Añadir Límite Custom</span>
          </button>
        </div>
      </div>

      {/* Summary Stat Cards Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 relative z-10">
        
        {/* Total Limit */}
        <div className="bg-[#18181B]/80 border border-[#ffffff08] p-4 rounded-2xl space-y-1">
          <span className="text-[10px] font-mono text-[#8E8E93] uppercase tracking-wider block">
            Presupuesto Límite Total
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-mono font-extrabold text-white">
              {formatCurrency(totalLimit, currency)}
            </span>
            <span className="text-xs text-[#8E8E93] font-mono">100%</span>
          </div>
        </div>

        {/* Total Spent */}
        <div className="bg-[#18181B]/80 border border-[#ffffff08] p-4 rounded-2xl space-y-1">
          <span className="text-[10px] font-mono text-[#8E8E93] uppercase tracking-wider block">
            Gastado este Mes
          </span>
          <div className="flex items-baseline justify-between">
            <span className={`text-xl font-mono font-extrabold ${
              overallPercentage > 95 ? 'text-rose-400' : overallPercentage > 75 ? 'text-amber-400' : 'text-[#00FF66]'
            }`}>
              {formatCurrency(totalSpent, currency)}
            </span>
            <span className={`text-xs font-mono font-bold ${
              overallPercentage > 95 ? 'text-rose-400' : overallPercentage > 75 ? 'text-amber-400' : 'text-[#00FF66]'
            }`}>
              {overallPercentage}%
            </span>
          </div>
        </div>

        {/* Remaining */}
        <div className="bg-[#18181B]/80 border border-[#ffffff08] p-4 rounded-2xl space-y-1">
          <span className="text-[10px] font-mono text-[#8E8E93] uppercase tracking-wider block">
            {totalRemaining >= 0 ? 'Margen Disponible' : 'Exceso sobre Límite'}
          </span>
          <div className="flex items-baseline justify-between">
            <span className={`text-xl font-mono font-extrabold ${totalRemaining >= 0 ? 'text-white' : 'text-rose-400'}`}>
              {formatCurrency(Math.abs(totalRemaining), currency)}
            </span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
              totalRemaining >= 0 
                ? 'bg-[#00FF66]/10 text-[#00FF66] border border-[#00FF66]/20' 
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
            }`}>
              {totalRemaining >= 0 ? 'En Rango' : 'Superado'}
            </span>
          </div>
        </div>

      </div>

      {/* Global Overall Progress Bar */}
      <div className="space-y-2 bg-[#18181B]/50 p-4 rounded-2xl border border-[#ffffff05] relative z-10">
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-300 font-medium flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-[#00FF66]" />
            Estado Global del Presupuesto
          </span>
          <span className="font-mono text-[#8E8E93]">
            {formatCurrency(totalSpent, currency)} de {formatCurrency(totalLimit, currency)}
          </span>
        </div>
        <div className="w-full h-3 bg-[#27272A] rounded-full overflow-hidden p-0.5 border border-[#ffffff08]">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, overallPercentage)}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={`h-full rounded-full transition-all duration-300 ${
              overallPercentage >= 100
                ? 'bg-gradient-to-r from-rose-500 to-red-600 shadow-lg shadow-rose-500/30'
                : overallPercentage >= 75
                ? 'bg-gradient-to-r from-amber-400 to-amber-500 shadow-lg shadow-amber-400/20'
                : 'bg-gradient-to-r from-[#00FF66] to-[#10B981] shadow-lg shadow-[#00FF66]/20'
            }`}
          />
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center justify-between gap-2 border-b border-[#ffffff05] pb-2 relative z-10">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeFilter === 'all'
                ? 'bg-[#18181B] text-white border border-[#ffffff15]'
                : 'text-[#8E8E93] hover:text-white'
            }`}
          >
            Todas ({budgetItems.length})
          </button>
          <button
            onClick={() => setActiveFilter('needs')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeFilter === 'needs'
                ? 'bg-[#18181B] text-white border border-[#ffffff15]'
                : 'text-[#8E8E93] hover:text-white'
            }`}
          >
            Necesidades
          </button>
          <button
            onClick={() => setActiveFilter('wants')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeFilter === 'wants'
                ? 'bg-[#18181B] text-white border border-[#ffffff15]'
                : 'text-[#8E8E93] hover:text-white'
            }`}
          >
            Estilo de Vida
          </button>
        </div>

        <span className="text-[11px] text-[#8E8E93] font-mono hidden sm:inline-block">
          Sincronizado en tiempo real con Movimientos
        </span>
      </div>

      {/* Real-time Category Progress Bars Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
        {filteredItems.map(item => {
          const percent = item.limitAmount > 0 ? Math.round((item.spentAmount / item.limitAmount) * 100) : 0;
          const isOverLimit = item.spentAmount > item.limitAmount;
          const isWarning = percent >= 75 && !isOverLimit;
          const isEditingThis = editingCategory === item.category;

          return (
            <motion.div
              key={item.category}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-2xl border transition-all ${
                isOverLimit
                  ? 'bg-rose-500/5 border-rose-500/25'
                  : isWarning
                  ? 'bg-amber-500/5 border-amber-500/20'
                  : 'bg-[#18181B]/60 border-[#ffffff08] hover:border-[#ffffff15]'
              }`}
            >
              {/* Top row: Category info & inline edit trigger */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2.5">
                  <div 
                    className="p-2 rounded-xl text-white shadow-sm"
                    style={{ backgroundColor: `${item.color}20`, color: item.color }}
                  >
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{item.category}</h4>
                    <span className="text-[10px] text-[#8E8E93] font-mono uppercase tracking-wider">
                      {item.type === 'needs' ? 'Necesidad Básica' : item.type === 'wants' ? 'Estilo de Vida' : 'General'}
                    </span>
                  </div>
                </div>

                {/* Percentage Badge or Edit Trigger */}
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-full border ${
                    isOverLimit
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      : isWarning
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      : 'bg-[#00FF66]/10 text-[#00FF66] border-[#00FF66]/30'
                  }`}>
                    {percent}% {isOverLimit && 'Excedido'}
                  </span>

                  {!isEditingThis ? (
                    <button
                      onClick={() => handleStartEdit(item.category, item.limitAmount)}
                      title="Editar límite de esta categoría"
                      className="p-1.5 rounded-lg text-[#8E8E93] hover:text-white hover:bg-[#24242A] transition-colors"
                    >
                      <Edit3 size={13} />
                    </button>
                  ) : (
                    <button
                      onClick={() => setEditingCategory(null)}
                      className="p-1.5 rounded-lg text-[#8E8E93] hover:text-white hover:bg-[#24242A] transition-colors"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
              </div>

              {/* Amount Row or Inline Edit Input */}
              {!isEditingThis ? (
                <div className="flex items-baseline justify-between text-xs my-2">
                  <span className="text-slate-300 font-mono">
                    <strong className="text-white font-extrabold">{formatCurrency(item.spentAmount, currency)}</strong> gastados
                  </span>
                  <span className="text-[#8E8E93] font-mono text-[11px]">
                    Límite: <strong className="text-slate-200">{formatCurrency(item.limitAmount, currency)}</strong>
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 my-2.5 p-2 bg-[#121214] rounded-xl border border-[#ffffff15]">
                  <span className="text-xs font-mono text-[#8E8E93]">Nuevo Límite:</span>
                  <input
                    type="number"
                    value={tempLimit}
                    onChange={(e) => setTempLimit(parseFloat(e.target.value) || 0)}
                    className="w-24 bg-[#18181B] border border-[#ffffff10] px-2 py-1 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-[#00FF66]"
                    autoFocus
                  />
                  <button
                    onClick={() => handleSaveLimit(item.category)}
                    className="px-2.5 py-1 rounded-lg bg-[#00FF66] text-black text-xs font-bold flex items-center gap-1 hover:bg-[#00FF66]/90"
                  >
                    <Save size={12} />
                    <span>Ok</span>
                  </button>
                </div>
              )}

              {/* Progress Bar Component */}
              <div className="w-full h-2.5 bg-[#27272A] rounded-full overflow-hidden p-0.5 border border-[#ffffff08] my-1">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, percent)}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className={`h-full rounded-full transition-all duration-300 ${
                    isOverLimit
                      ? 'bg-gradient-to-r from-rose-500 to-red-600'
                      : isWarning
                      ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                      : 'bg-gradient-to-r from-[#00FF66] to-[#10B981]'
                  }`}
                />
              </div>

              {/* Subtext info */}
              <div className="flex justify-between items-center text-[10px] font-mono text-[#8E8E93] mt-2">
                <span>
                  {isOverLimit 
                    ? `Te has desviado en +${formatCurrency(item.spentAmount - item.limitAmount, currency)}`
                    : `Restante: ${formatCurrency(item.limitAmount - item.spentAmount, currency)}`
                  }
                </span>
                <span className={isOverLimit ? 'text-rose-400 font-bold' : isWarning ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                  {isOverLimit ? 'Superado' : isWarning ? 'Cerca del límite' : 'Dentro del rango'}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Modal for Custom Budget Category Creation */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-[#18181B] border border-[#ffffff15] p-6 rounded-3xl space-y-6 shadow-2xl relative"
            >
              <div className="flex justify-between items-center border-b border-[#ffffff10] pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Plus size={18} className="text-[#00FF66]" />
                  Crear Nuevo Límite de Categoría
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1 rounded-lg text-[#8E8E93] hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddCustomCategory} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Nombre de la Categoría
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Viajes, Regalos, Mascotas..."
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#121214] border border-[#ffffff10] text-sm text-white focus:outline-none focus:border-[#00FF66]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Límite Mensual Máximo ({currency})
                  </label>
                  <input
                    type="number"
                    placeholder="Ej. 250"
                    value={newCatLimit}
                    onChange={(e) => setNewCatLimit(e.target.value)}
                    required
                    min="1"
                    step="any"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#121214] border border-[#ffffff10] text-sm text-white font-mono focus:outline-none focus:border-[#00FF66]"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-[#24242A] text-slate-300 text-xs font-semibold hover:bg-[#2D2D35]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-[#00FF66] text-black text-xs font-bold hover:bg-[#00FF66]/90 shadow-lg shadow-[#00FF66]/20"
                  >
                    Guardar Límite
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
