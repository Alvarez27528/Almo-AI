/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { AppState, Transaction, TransactionType } from '../types';
import { formatCurrency } from '../utils/finance';
import { 
  Plus, 
  Search, 
  Filter, 
  TrendingUp, 
  TrendingDown, 
  ArrowRightLeft, 
  HelpCircle, 
  Calendar,
  X,
  Sparkles,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Tag,
  CreditCard,
  MapPin,
  Activity,
  Clock,
  Award,
  Percent
} from 'lucide-react';

interface TransactionsProps {
  state: AppState;
  onAddTransaction: (t: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onNavigateToScan: () => void;
}

export default function Transactions({ state, onAddTransaction, onDeleteTransaction, onNavigateToScan }: TransactionsProps) {
  const profile = state.userProfile!;
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewAllMode, setViewAllMode] = useState(false);

  // Form Fields
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState('Alimentación');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('Tarjeta Apple Pay');
  const [notes, setNotes] = useState('');
  const [location, setLocation] = useState('');

  const categoriesMap: Record<TransactionType, string[]> = {
    income: ['Ingresos fijo', 'Ventas Vinted', 'Proyectos', 'Dividendos', 'Otros ingresos'],
    expense: ['Vivienda', 'Alimentación', 'Transporte', 'Suscripciones', 'Ocio', 'Educación', 'Salud', 'Impuestos', 'Otros'],
    transfer: ['Ahorros', 'Inversión', 'Efectivo'],
    investment: ['Acciones', 'ETFs', 'Crypto', 'Bienes Raíces'],
    withdrawal: ['Efectivo', 'Cuenta Corriente'],
    loan: ['Pago Préstamo', 'Intereses', 'Amortización Extra']
  };

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    setCategory(categoriesMap[newType][0]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0 || !description) return;

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      amount: Number(amount),
      type,
      category,
      description: description.trim(),
      date,
      paymentMethod,
      notes: notes.trim() || undefined,
      location: location.trim() || undefined
    };

    onAddTransaction(newTx);
    setShowAddModal(false);
    
    // Reset Form
    setAmount('');
    setDescription('');
    setNotes('');
    setLocation('');
  };

  const getTxIcon = (txType: TransactionType) => {
    switch (txType) {
      case 'income':
        return <TrendingUp className="text-emerald-400" size={16} />;
      case 'expense':
        return <TrendingDown className="text-red-400" size={16} />;
      case 'transfer':
        return <ArrowRightLeft className="text-blue-400" size={16} />;
      default:
        return <HelpCircle className="text-slate-400" size={16} />;
    }
  };

  const getTxTypeBadgeColor = (txType: TransactionType) => {
    switch (txType) {
      case 'income': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'expense': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'transfer': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'investment': return 'bg-teal-500/10 text-teal-400 border-teal-500/20';
      default: return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  // Filter & Search Logic
  const filteredTransactions = state.transactions.filter(t => {
    const matchesType = filterType === 'all' || t.type === filterType;
    const matchesSearch = 
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div id="transactions-view" className="space-y-6">
      
      {!viewAllMode ? (
        // COMPACT VIEW (No inner scroll container - let it fit on screen!)
        <>
          {/* Header and Add Action */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Registro de Movimientos</h1>
              <p className="text-xs text-[#8E8E93]">Vista rápida de tus últimos movimientos de cartera.</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={onNavigateToScan}
                className="flex items-center space-x-2 bg-[#1C1C1E] text-white border border-white/[0.08] rounded-full px-5 py-2.5 text-sm hover:bg-[#2C2C2E] transition-all font-semibold"
              >
                <Sparkles size={16} />
                <span>Escáner Inteligente</span>
              </button>

              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center space-x-1.5 bg-white text-black font-semibold rounded-full px-5 py-2.5 text-sm hover:bg-[#F5F5F7] transition-all"
              >
                <Plus size={16} />
                <span>Añadir Movimiento</span>
              </button>
            </div>
          </div>

          {/* Compact Transactions Card */}
          <div className="bg-[#0E0E10] border border-white/[0.06] rounded-[28px] overflow-hidden">
            <div className="p-5 border-b border-white/[0.08] flex justify-between items-center bg-[#121214]/40">
              <span className="text-xs font-mono text-[#8E8E93] uppercase tracking-widest font-bold">Últimos Movimientos</span>
              <span className="text-xs font-mono text-[#8E8E93] uppercase tracking-widest font-bold">Importe</span>
            </div>

            <div className="divide-y divide-[#ffffff08]">
              {([...state.transactions]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 2)
              ).map((tx) => (
                <div 
                  key={tx.id} 
                  onClick={() => setSelectedTx(tx)}
                  className="p-4 sm:p-5 flex justify-between items-center hover:bg-[#1C1C1E]/50 transition-all cursor-pointer group/item relative gap-3"
                  title="Haz clic para ver análisis visual detallado"
                >
                  
                  <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                    <div className={`p-2.5 rounded-xl border shrink-0 ${getTxTypeBadgeColor(tx.type)}`}>
                      {getTxIcon(tx.type)}
                    </div>
                    
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-slate-100 flex items-center gap-1.5 flex-wrap">
                        <span className="truncate max-w-[120px] xs:max-w-[160px] sm:max-w-none">{tx.description}</span>
                        <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-400 whitespace-nowrap">
                          {tx.category}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-slate-500 mt-1 flex-wrap gap-y-1">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {tx.date}
                        </span>
                        <span>•</span>
                        <span className="truncate max-w-[90px] xs:max-w-[130px] sm:max-w-none">{tx.paymentMethod}</span>
                      </div>
                      {/* Mobile Analysis Button: Placed underneath details for maximum layout breathing room */}
                      <div className="mt-2 sm:hidden">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTx(tx);
                          }}
                          className="inline-flex items-center space-x-1 bg-[#00FF66]/10 hover:bg-[#00FF66]/25 border border-[#00FF66]/30 px-2.5 py-1 rounded-lg text-[9px] font-semibold uppercase tracking-wider transition-all cursor-pointer text-[#00FF66]"
                        >
                          <Sparkles size={10} className="text-[#00FF66] shrink-0 animate-pulse" />
                          <span>Análisis 🔍</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
                    {/* Desktop-only Analysis Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTx(tx);
                      }}
                      className="hidden sm:flex items-center space-x-1 bg-[#00FF66]/10 hover:bg-[#00FF66]/25 border border-[#00FF66]/30 px-3 py-1.5 rounded-xl text-[10px] font-semibold uppercase tracking-wider transition-all cursor-pointer text-[#00FF66] hover:text-white"
                    >
                      <Sparkles size={10} className="text-[#00FF66] shrink-0 animate-pulse" />
                      <span>Análisis 🔍</span>
                    </button>

                    <div className={`text-sm sm:text-md font-bold font-mono whitespace-nowrap shrink-0 ${
                      tx.type === 'income' ? 'text-emerald-400' : 'text-slate-200'
                    }`}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, profile.currency)}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteTransaction(tx.id);
                      }}
                      className="p-2 rounded-xl text-[#8E8E93] hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer shrink-0"
                      title="Eliminar movimiento"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                </div>
              ))}

              {state.transactions.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-sm text-slate-500 font-mono">No se han registrado movimientos aún.</p>
                </div>
              )}
            </div>

            {/* Ver Todo Button */}
            {state.transactions.length > 0 && (
              <button
                id="view-all-transactions-btn"
                onClick={() => setViewAllMode(true)}
                className="w-full py-4 text-center font-bold text-xs uppercase tracking-wider text-[#00FF66] hover:text-white bg-[#121214] hover:bg-[#1C1C1E]/80 border-t border-[#ffffff08] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Ver todos los movimientos ({state.transactions.length})</span>
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        </>
      ) : (
        // FULL VIEW (No inner scroll container - let it grow naturally and scroll the page!)
        <>
          {/* Back Button & Header */}
          <div className="space-y-4">
            <button
              id="back-to-compact-btn"
              onClick={() => setViewAllMode(false)}
              className="flex items-center gap-2 text-[#00FF66] hover:text-white transition-colors font-bold text-xs uppercase tracking-wider cursor-pointer font-mono"
            >
              <ArrowLeft size={14} />
              <span>Volver a Vista Rápida</span>
            </button>
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white">Todos los Movimientos</h1>
                <p className="text-xs text-[#8E8E93]">Listado completo con búsqueda y filtros avanzados.</p>
              </div>

              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center space-x-1.5 bg-white text-black font-semibold rounded-full px-5 py-2.5 text-sm hover:bg-[#F5F5F7] transition-all"
              >
                <Plus size={16} />
                <span>Añadir Movimiento</span>
              </button>
            </div>
          </div>

          {/* Filters and Search Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-[#121214] p-3 rounded-2xl border border-[#ffffff08]">
            {/* Search */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8E8E93]" size={16} />
              <input
                type="text"
                placeholder="Buscar por descripción..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#050505] border border-white/[0.08] rounded-xl pl-10 pr-4 py-2 text-base text-white placeholder-[#8E8E93] focus:outline-none focus:border-white/25"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-1.5 w-full sm:w-auto overflow-x-auto">
              {[
                { key: 'all', label: 'Todos' },
                { key: 'income', label: 'Ingresos' },
                { key: 'expense', label: 'Gastos' },
                { key: 'investment', label: 'Inversiones' },
                { key: 'loan', label: 'Deudas' }
              ].map(btn => (
                <button
                  key={btn.key}
                  onClick={() => setFilterType(btn.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    filterType === btn.key
                      ? 'bg-white text-black border-white font-medium shadow-sm'
                      : 'bg-[#050505] border-white/[0.08] text-[#8E8E93] hover:border-white/20'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* Transactions List - GROW NATURALLY (NO overflow-y or max-h restrictions) */}
          <div className="bg-[#0E0E10] border border-white/[0.06] rounded-[28px] overflow-hidden">
            <div className="p-5 border-b border-white/[0.08] flex justify-between items-center bg-[#121214]/40">
              <span className="text-xs font-mono text-[#8E8E93] uppercase tracking-widest font-bold">Listado completo ({filteredTransactions.length})</span>
              <span className="text-xs font-mono text-[#8E8E93] uppercase tracking-widest font-bold">Importe</span>
            </div>

            <div className="divide-y divide-[#ffffff08]">
              {([...filteredTransactions]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              ).map((tx) => (
                <div 
                  key={tx.id} 
                  onClick={() => setSelectedTx(tx)}
                  className="p-4 sm:p-5 flex justify-between items-center hover:bg-[#1C1C1E]/50 transition-all cursor-pointer group/item relative gap-3"
                  title="Haz clic para ver análisis visual detallado"
                >
                  
                  <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                    <div className={`p-2.5 rounded-xl border shrink-0 ${getTxTypeBadgeColor(tx.type)}`}>
                      {getTxIcon(tx.type)}
                    </div>
                    
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-slate-100 flex items-center gap-1.5 flex-wrap">
                        <span className="truncate max-w-[120px] xs:max-w-[160px] sm:max-w-none">{tx.description}</span>
                        <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-400 whitespace-nowrap">
                          {tx.category}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-slate-500 mt-1 flex-wrap gap-y-1">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {tx.date}
                        </span>
                        <span>•</span>
                        <span className="truncate max-w-[90px] xs:max-w-[130px] sm:max-w-none">{tx.paymentMethod}</span>
                        {tx.location && (
                          <>
                            <span>•</span>
                            <span className="truncate max-w-[80px] xs:max-w-[110px] sm:max-w-none">{tx.location}</span>
                          </>
                        )}
                      </div>
                      {tx.notes && (
                        <p className="text-[11px] text-slate-500 italic mt-1 font-sans truncate max-w-[200px] sm:max-w-none">
                          Nota: {tx.notes}
                        </p>
                      )}
                      {/* Mobile Analysis Button: Placed underneath details for maximum layout breathing room */}
                      <div className="mt-2 sm:hidden">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTx(tx);
                          }}
                          className="inline-flex items-center space-x-1 bg-[#00FF66]/10 hover:bg-[#00FF66]/25 border border-[#00FF66]/30 px-2.5 py-1 rounded-lg text-[9px] font-semibold uppercase tracking-wider transition-all cursor-pointer text-[#00FF66]"
                        >
                          <Sparkles size={10} className="text-[#00FF66] shrink-0 animate-pulse" />
                          <span>Análisis 🔍</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
                    {/* Desktop-only Analysis Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTx(tx);
                      }}
                      className="hidden sm:flex items-center space-x-1 bg-[#00FF66]/10 hover:bg-[#00FF66]/25 border border-[#00FF66]/30 px-3 py-1.5 rounded-xl text-[10px] font-semibold uppercase tracking-wider transition-all cursor-pointer text-[#00FF66] hover:text-white"
                    >
                      <Sparkles size={10} className="text-[#00FF66] shrink-0 animate-pulse" />
                      <span>Análisis 🔍</span>
                    </button>

                    <div className={`text-sm sm:text-md font-bold font-mono whitespace-nowrap shrink-0 ${
                      tx.type === 'income' ? 'text-emerald-400' : 'text-slate-200'
                    }`}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, profile.currency)}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteTransaction(tx.id);
                      }}
                      className="p-2 rounded-xl text-[#8E8E93] hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer shrink-0"
                      title="Eliminar movimiento"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                </div>
              ))}

              {filteredTransactions.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-sm text-slate-500 font-mono">No se han registrado movimientos con estos filtros.</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Manual Input Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050505]/80 backdrop-blur-sm animate-fade-in">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg bg-[#0E0E10] border border-white/[0.06] rounded-[28px] p-6 shadow-2xl space-y-6 relative"
          >
            <button 
              onClick={() => setShowAddModal(false)}
              className="absolute top-5 right-5 text-[#8E8E93] hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            <div>
              <h2 className="text-xl font-semibold tracking-tight text-white">Añadir Nuevo Movimiento</h2>
              <p className="text-xs text-[#8E8E93]">Completa los campos detallados para registrar tu gasto o ingreso.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono text-[#8E8E93] uppercase tracking-widest mb-1.5">Tipo</label>
                  <select
                    value={type}
                    onChange={(e) => handleTypeChange(e.target.value as TransactionType)}
                    className="w-full bg-[#050505] border border-white/[0.08] rounded-xl px-3 py-2 text-base text-[#F5F5F7] focus:outline-none focus:border-white/20"
                  >
                    <option value="expense">Gasto</option>
                    <option value="income">Ingreso</option>
                    <option value="investment">Inversión</option>
                    <option value="transfer">Transferencia</option>
                    <option value="loan">Préstamo/Deuda</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-[#8E8E93] uppercase tracking-widest mb-1.5">Importe ({profile.currency})</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-[#050505] border border-white/[0.08] rounded-xl px-3 py-2 text-base text-[#F5F5F7] focus:outline-none focus:border-white/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono text-[#8E8E93] uppercase tracking-widest mb-1.5">Categoría</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[#050505] border border-white/[0.08] rounded-xl px-3 py-2 text-base text-[#F5F5F7] focus:outline-none focus:border-white/20"
                  >
                    {categoriesMap[type].map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-[#8E8E93] uppercase tracking-widest mb-1.5">Fecha</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-[#050505] border border-white/[0.08] rounded-xl px-3 py-2 text-base text-[#F5F5F7] focus:outline-none focus:border-white/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-[#8E8E93] uppercase tracking-widest mb-1.5">Descripción o Comercio</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Mercadona Supermercados"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#050505] border border-white/[0.08] rounded-xl px-3 py-2 text-base text-[#F5F5F7] focus:outline-none focus:border-white/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono text-[#8E8E93] uppercase tracking-widest mb-1.5">Método de Pago</label>
                  <input
                    type="text"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    placeholder="Ej. Tarjeta Apple Pay"
                    className="w-full bg-[#050505] border border-white/[0.08] rounded-xl px-3 py-2 text-base text-[#F5F5F7] focus:outline-none focus:border-white/20"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-[#8E8E93] uppercase tracking-widest mb-1.5">Ubicación (Opcional)</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Ej. Madrid, España"
                    className="w-full bg-[#050505] border border-white/[0.08] rounded-xl px-3 py-2 text-base text-[#F5F5F7] focus:outline-none focus:border-white/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-[#8E8E93] uppercase tracking-widest mb-1.5">Notas adicionales (Opcional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Detalles específicos..."
                  rows={2}
                  className="w-full bg-[#050505] border border-white/[0.08] rounded-xl px-3 py-2 text-base text-[#F5F5F7] focus:outline-none focus:border-white/20 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-full bg-white hover:bg-[#F5F5F7] font-semibold text-black text-xs transition-all mt-2 cursor-pointer"
              >
                Guardar Movimiento
              </button>

            </form>
          </motion.div>
        </div>
      )}

      {/* Visual Transaction Analysis Modal (Ordenado por puntos y ultra-visual) */}
      {selectedTx && (
        (() => {
          const isExpense = selectedTx.type === 'expense';
          const isIncome = selectedTx.type === 'income';
          const isInvestment = selectedTx.type === 'investment';
          const isLoan = selectedTx.type === 'loan';
          
          // Global stats
          const expensesList = state.transactions.filter(t => t.type === 'expense');
          const incomesList = state.transactions.filter(t => t.type === 'income');
          const investmentsList = state.transactions.filter(t => t.type === 'investment');
          const loansList = state.transactions.filter(t => t.type === 'loan');
          
          const totalExpenses = expensesList.reduce((sum, t) => sum + t.amount, 0);
          const totalIncomes = incomesList.reduce((sum, t) => sum + t.amount, 0);
          const totalInvestments = investmentsList.reduce((sum, t) => sum + t.amount, 0);
          const totalLoans = loansList.reduce((sum, t) => sum + t.amount, 0);
          
          const netBalance = totalIncomes - totalExpenses;
          
          const typeTxns = state.transactions.filter(t => t.type === selectedTx.type);
          const totalTypeAmount = typeTxns.reduce((sum, t) => sum + t.amount, 0);
          const avgTypeAmount = typeTxns.length > 0 ? totalTypeAmount / typeTxns.length : 0;
          
          const categoryTxns = state.transactions.filter(t => t.category === selectedTx.category && t.type === selectedTx.type);
          const totalCategoryAmount = categoryTxns.reduce((sum, t) => sum + t.amount, 0);
          const pctOfCategory = totalCategoryAmount > 0 ? Math.round((selectedTx.amount / totalCategoryAmount) * 100) : 100;
          const pctOfTotalType = totalTypeAmount > 0 ? Math.round((selectedTx.amount / totalTypeAmount) * 100) : 100;
          
          const dateObj = new Date(selectedTx.date);
          const weekdays = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
          const weekdayName = weekdays[dateObj.getDay()] || 'Desconocido';
          const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
          const pctOfAverage = avgTypeAmount > 0 ? Math.round((selectedTx.amount / avgTypeAmount) * 100) : 100;
          
          return (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#050505]/92 backdrop-blur-lg overflow-hidden animate-fade-in">
              <motion.div 
                initial={{ opacity: 0, y: 100, scale: 1 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 100, scale: 1 }}
                className="w-full max-w-2xl bg-[#0C0C0E] border-t sm:border border-[#ffffff12] rounded-t-[24px] sm:rounded-[32px] p-5 sm:p-7 shadow-2xl relative max-h-[85vh] sm:max-h-[92vh] flex flex-col overflow-hidden"
              >
                {/* Close Button */}
                <button 
                  onClick={() => setSelectedTx(null)}
                  className="absolute top-4 right-4 p-2 rounded-full bg-[#1c1c1e] text-[#8E8E93] hover:text-white hover:bg-slate-800 transition-all cursor-pointer z-10"
                  title="Cerrar análisis"
                >
                  <X size={16} />
                </button>

                {/* Header: Visual Overview */}
                <div className="text-center space-y-2 pb-4 border-b border-[#ffffff05] shrink-0 pr-6">
                  <div className="inline-flex items-center space-x-1.5 bg-[#00FF66]/10 text-[#00FF66] border border-[#00FF66]/20 px-3 py-1 rounded-full text-[9px] font-semibold uppercase tracking-widest animate-pulse">
                    <Sparkles size={10} />
                    <span>Análisis de Movimiento</span>
                  </div>
                  
                  <div>
                    <h2 className="text-lg sm:text-2xl font-semibold tracking-tight text-white leading-tight px-2 break-words">{selectedTx.description}</h2>
                    <p className="text-[9px] sm:text-[10px] text-slate-500 font-mono mt-0.5">ID Único: {selectedTx.id}</p>
                  </div>

                  {/* Gigantic visual Amount */}
                  <div className="py-1">
                    <span className={`text-2xl sm:text-4xl md:text-5xl font-semibold font-mono tracking-tight break-all block px-4 leading-none ${
                      isExpense ? 'text-red-400' : isIncome ? 'text-emerald-400' : isInvestment ? 'text-blue-400' : 'text-purple-400'
                    }`}>
                      {isExpense ? '-' : isIncome ? '+' : ''}{formatCurrency(selectedTx.amount, profile.currency)}
                    </span>
                    <div className="flex justify-center gap-1.5 mt-2 flex-wrap">
                      <span className={`text-[9px] font-mono uppercase tracking-wider font-semibold px-2.5 py-0.5 rounded-full border ${getTxTypeBadgeColor(selectedTx.type)}`}>
                        {selectedTx.type === 'expense' ? 'Gasto 🔻' : selectedTx.type === 'income' ? 'Ingreso 🔺' : selectedTx.type === 'investment' ? 'Inversión 💎' : 'Préstamo/Deuda 🤝'}
                      </span>
                      <span className="text-[9px] font-mono uppercase tracking-wider font-semibold px-2.5 py-0.5 rounded-full bg-[#0E0E10] border border-white/[0.06] text-slate-300">
                        📁 {selectedTx.category}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Scrollable Body Content */}
                <div className="overflow-y-auto py-4 space-y-4 flex-1 pr-1 scrollbar-thin scrollbar-thumb-slate-800">
                  
                  {/* Dashboard of global finances to put it in context */}
                  <div className="bg-slate-950/60 rounded-xl sm:rounded-2xl border border-[#ffffff05] p-3 sm:p-4 shrink-0">
                    <h3 className="text-[9px] sm:text-[10px] font-mono text-slate-500 uppercase tracking-widest font-semibold mb-2.5 text-center">Tus Finanzas (Perspectiva Global)</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-center">
                      <div className="bg-[#121214] p-2.5 sm:p-3 rounded-xl border border-[#ffffff03] flex sm:flex-col justify-between sm:justify-center items-center gap-1">
                        <span className="text-[9px] font-mono text-emerald-400 uppercase tracking-wider">Total Ganado</span>
                        <span className="text-xs sm:text-sm font-bold font-mono text-slate-200 truncate max-w-[120px] sm:max-w-none">{formatCurrency(totalIncomes, profile.currency)}</span>
                      </div>
                      <div className="bg-[#121214] p-2.5 sm:p-3 rounded-xl border border-[#ffffff03] flex sm:flex-col justify-between sm:justify-center items-center gap-1">
                        <span className="text-[9px] font-mono text-red-400 uppercase tracking-wider">Total Gastado</span>
                        <span className="text-xs sm:text-sm font-bold font-mono text-slate-200 truncate max-w-[120px] sm:max-w-none">{formatCurrency(totalExpenses, profile.currency)}</span>
                      </div>
                      <div className="bg-[#121214] p-2.5 sm:p-3 rounded-xl border border-[#ffffff03] flex sm:flex-col justify-between sm:justify-center items-center gap-1">
                        <span className="text-[9px] font-mono text-purple-400 uppercase tracking-wider">Balance Neto</span>
                        <span className={`text-xs sm:text-sm font-bold font-mono truncate max-w-[120px] sm:max-w-none ${netBalance >= 0 ? 'text-[#00FF66]' : 'text-rose-400'}`}>
                          {netBalance >= 0 ? '+' : ''}{formatCurrency(netBalance, profile.currency)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Gauge metrics: En qué te lo has gastado */}
                  <div className="bg-[#121214] border border-[#ffffff05] p-4 sm:p-5 rounded-2xl space-y-3.5 shrink-0">
                    <span className="text-[9px] sm:text-[10px] font-mono text-slate-400 uppercase tracking-widest font-semibold flex items-center gap-1.5">
                      <Percent size={12} className="text-[#00FF66]" />
                      Distribución Porcentual del Movimiento
                    </span>

                    {/* Progress 1: En la categoría */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[11px] font-mono">
                        <span className="text-slate-400">En <strong className="text-slate-200">{selectedTx.category}</strong>:</span>
                        <span className="text-[#00FF66] font-bold">{pctOfCategory}%</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-[#ffffff05]">
                        <div 
                          className="h-full bg-gradient-to-r from-emerald-500/50 to-[#00FF66] rounded-full transition-all duration-1000"
                          style={{ width: `${pctOfCategory}%` }}
                        />
                      </div>
                      <p className="text-[10px] sm:text-[11px] text-slate-500 leading-normal font-sans">
                        Este registro representa el <strong className="text-slate-300">{pctOfCategory}%</strong> de todo el flujo en <strong className="text-slate-300">{selectedTx.category}</strong> (acumulado: {formatCurrency(totalCategoryAmount, profile.currency)} en {categoryTxns.length} registros).
                      </p>
                    </div>

                    {/* Progress 2: En el total de tipo */}
                    <div className="space-y-1.5 pt-2 border-t border-[#ffffff03]">
                      <div className="flex justify-between text-[11px] font-mono">
                        <span className="text-slate-400">Del total de {isExpense ? 'Gastos' : isIncome ? 'Ingresos' : isInvestment ? 'Inversiones' : 'Préstamos'}:</span>
                        <span className="text-amber-400 font-bold">{pctOfTotalType}%</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-[#ffffff05]">
                        <div 
                          className="h-full bg-gradient-to-r from-amber-500/50 to-amber-400 rounded-full transition-all duration-1000"
                          style={{ width: `${pctOfTotalType}%` }}
                        />
                      </div>
                      <p className="text-[10px] sm:text-[11px] text-slate-500 leading-normal font-sans">
                        Este único movimiento representa el <strong className="text-slate-300">{pctOfTotalType}%</strong> de tu volumen acumulado.
                      </p>
                    </div>
                  </div>

                  {/* POINTS AREA: Sorted point by point analysis */}
                  <div className="space-y-3">
                    <h3 className="text-[9px] sm:text-[10px] font-mono text-slate-500 uppercase tracking-widest font-semibold border-b border-[#ffffff03] pb-1">
                      Análisis Estructurado por Puntos
                    </h3>
                    
                    <div className="grid grid-cols-1 gap-2.5">
                      
                      {/* Punto 1: Concepto y Tipo */}
                      <div className="flex items-start space-x-2.5 bg-[#121214] p-3 rounded-xl sm:rounded-2xl border border-[#ffffff03] hover:border-[#ffffff08] transition-all">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-[#0E0E10] border border-white/[0.06] text-[#00FF66] shrink-0 mt-0.5 font-bold text-[10px] sm:text-xs font-mono flex items-center justify-center">
                          1
                        </div>
                        <div className="space-y-0.5 flex-1 min-w-0">
                          <span className="text-[8px] sm:text-[9px] font-mono text-[#00FF66] uppercase tracking-widest font-semibold block">Punto 1: Detalle del Concepto e Importe</span>
                          <p className="text-[11px] sm:text-xs text-slate-300 font-sans leading-relaxed">
                            Has registrado un importe de <strong className="text-white font-mono">{formatCurrency(selectedTx.amount, profile.currency)}</strong> para el concepto de <strong className="text-white font-bold">"{selectedTx.description}"</strong>. Es de naturaleza <strong className="text-white">{isExpense ? 'gasto directo' : isIncome ? 'ingreso salarial/extra' : 'movimiento financiero'}</strong>, clasificado dentro de la categoría <strong className="text-[#00FF66]">{selectedTx.category}</strong>.
                          </p>
                        </div>
                      </div>

                      {/* Punto 2: Contexto de Pago y Notas */}
                      <div className="flex items-start space-x-2.5 bg-[#121214] p-3 rounded-xl sm:rounded-2xl border border-[#ffffff03] hover:border-[#ffffff08] transition-all">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-[#0E0E10] border border-white/[0.06] text-sky-400 shrink-0 mt-0.5 font-bold text-[10px] sm:text-xs font-mono flex items-center justify-center">
                          2
                        </div>
                        <div className="space-y-0.5 flex-1 min-w-0">
                          <span className="text-[8px] sm:text-[9px] font-mono text-sky-400 uppercase tracking-widest font-semibold block">Punto 2: Canal de Pago y Metadatos</span>
                          <p className="text-[11px] sm:text-xs text-slate-300 font-sans leading-relaxed">
                            La transacción fue procesada usando el método de pago <strong className="text-white">{selectedTx.paymentMethod}</strong>. {selectedTx.location ? `Se localizó en: ${selectedTx.location}.` : 'No incluye localización GPS específica.'} {selectedTx.notes ? `Notas añadidas: "${selectedTx.notes}"` : 'No se agregaron notas o especificaciones adicionales.'}
                          </p>
                        </div>
                      </div>

                      {/* Punto 3: Temporalidad y Hábitos */}
                      <div className="flex items-start space-x-2.5 bg-[#121214] p-3 rounded-xl sm:rounded-2xl border border-[#ffffff03] hover:border-[#ffffff08] transition-all">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-[#0E0E10] border border-white/[0.06] text-blue-400 shrink-0 mt-0.5 font-bold text-[10px] sm:text-xs font-mono flex items-center justify-center">
                          3
                        </div>
                        <div className="space-y-0.5 flex-1 min-w-0">
                          <span className="text-[8px] sm:text-[9px] font-mono text-blue-400 uppercase tracking-widest font-semibold block">Punto 3: Impacto Temporal y Día de Registro</span>
                          <p className="text-[11px] sm:text-xs text-slate-300 font-sans leading-relaxed">
                            Sucedió un <strong className="text-white">{weekdayName}</strong>, el día de fecha <strong className="text-white font-mono">{selectedTx.date}</strong>. {isWeekend 
                              ? '⚠️ Al ser Fin de Semana, aumenta la probabilidad de que este sea un gasto recreativo. Vigila los gastos hormiga que suelen duplicarse los sábados y domingos.' 
                              : '✓ Registrado en Día Laborable. Esto generalmente denota gastos fijos, del día a día, o controlados dentro de tu rutina laboral.'}
                          </p>
                        </div>
                      </div>

                      {/* Punto 4: Desviación de Medias */}
                      <div className="flex items-start space-x-2.5 bg-[#121214] p-3 rounded-xl sm:rounded-2xl border border-[#ffffff03] hover:border-[#ffffff08] transition-all">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-[#0E0E10] border border-white/[0.06] text-purple-400 shrink-0 mt-0.5 font-bold text-[10px] sm:text-xs font-mono flex items-center justify-center">
                          4
                        </div>
                        <div className="space-y-0.5 flex-1 min-w-0">
                          <span className="text-[8px] sm:text-[9px] font-mono text-purple-400 uppercase tracking-widest font-semibold block">Punto 4: Desviación y Análisis de Salud</span>
                          <p className="text-[11px] sm:text-xs text-slate-300 font-sans leading-relaxed">
                            Este movimiento es de <strong className="text-white font-mono">{formatCurrency(selectedTx.amount, profile.currency)}</strong>, lo que equivale al <strong className="text-white">{pctOfAverage}%</strong> del promedio de tus {isExpense ? 'gastos' : 'ingresos'} ({formatCurrency(avgTypeAmount, profile.currency)}). {selectedTx.amount > avgTypeAmount 
                              ? '⚠️ Este movimiento supera notablemente tu media habitual. Te recomendamos evaluar si es un gasto recurrente o un evento único de fuerza mayor.' 
                              : '✓ ¡Excelente control! Se encuentra por debajo de la media general, demostrando disciplina en esta categoría.'}
                          </p>
                        </div>
                      </div>

                      {/* Punto 5: XP y Recompensas */}
                      <div className="flex items-start space-x-2.5 bg-[#121214] p-3 rounded-xl sm:rounded-2xl border border-[#ffffff03] hover:border-[#ffffff08] transition-all">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-[#0E0E10] border border-white/[0.06] text-amber-400 shrink-0 mt-0.5 font-bold text-[10px] sm:text-xs font-mono flex items-center justify-center animate-bounce">
                          5
                        </div>
                        <div className="space-y-0.5 flex-1 min-w-0">
                          <span className="text-[8px] sm:text-[9px] font-mono text-amber-400 uppercase tracking-widest font-semibold block">Punto 5: Recompensa de Registro (+150 XP)</span>
                          <p className="text-[11px] sm:text-xs text-slate-300 font-sans leading-relaxed">
                            Mantener tus registros diarios con precisión mejora tu nivel general. Al registrar este movimiento has sumado <strong className="text-amber-400 font-bold">+150 XP</strong> para tu nivel de Inteligencia Financiera. ¡Felicidades por cultivar este gran hábito!
                          </p>
                        </div>
                      </div>

                    </div>
                  </div>

                </div>

                {/* Fixed Footer */}
                <div className="pt-3 border-t border-[#ffffff05] shrink-0">
                  <button
                    onClick={() => setSelectedTx(null)}
                    className="w-full py-3.5 rounded-2xl bg-white hover:bg-slate-200 text-black font-semibold text-xs uppercase tracking-widest transition-all cursor-pointer text-center shadow-lg"
                  >
                    Entendido, Cerrar Análisis
                  </button>
                </div>

              </motion.div>
            </div>
          );
        })()
      )}

    </div>
  );
}
