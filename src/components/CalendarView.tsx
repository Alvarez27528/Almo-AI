/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { AppState, CalendarEvent, CalendarEventType } from '../types';
import { formatCurrency } from '../utils/finance';
import { 
  CalendarDays, 
  Plus, 
  X, 
  Check, 
  AlertCircle, 
  Sparkles,
  RefreshCw,
  BellRing
} from 'lucide-react';

interface CalendarViewProps {
  state: AppState;
  onPayEvent: (id: string) => void;
  onAddEvent: (ev: CalendarEvent) => void;
}

export default function CalendarView({ state, onPayEvent, onAddEvent }: CalendarViewProps) {
  const profile = state.userProfile!;
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('Suscripciones');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount || !date) return;

    const mapType = (cat: string): CalendarEventType => {
      if (cat === 'Suscripciones') return 'subscription';
      if (cat === 'Vivienda') return 'rent';
      if (cat === 'Suministros') return 'bill';
      if (cat === 'Impuestos') return 'tax';
      if (cat === 'Seguros') return 'insurance';
      return 'reminder';
    };

    const newEv: CalendarEvent = {
      id: `ev-${Date.now()}`,
      title: title.trim(),
      amount: Number(amount),
      date,
      type: mapType(category),
      category,
      isPaid: false
    };

    onAddEvent(newEv);
    setShowAddModal(false);

    // Reset Form
    setTitle('');
    setAmount('');
  };

  return (
    <div id="calendar-view" className="space-y-6 font-sans">
      
      {/* View Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <CalendarDays className="text-emerald-400" size={24} />
            Calendario de Suscripciones y Pagos
          </h1>
          <p className="text-xs text-slate-400">
            Mantén tus gastos fijos bajo control. Planifica el pago de tu alquiler, suministros, seguros y liquidaciones fiscales sin penalizaciones.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-1.5 bg-gradient-to-r from-emerald-400 to-teal-500 hover:scale-[1.02] active:scale-[0.98] text-slate-950 font-bold px-4 py-2.5 rounded-xl text-sm transition-all shadow-lg"
        >
          <Plus size={16} />
          <span>Añadir Vencimiento</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column (2 cols span): Events Agenda */}
        <div className="lg:col-span-2 space-y-4">
          
          <div className="bg-[#0E0E10] border border-white/[0.06] rounded-[28px] overflow-hidden">
            <div className="p-5 border-b border-slate-850 flex justify-between items-center bg-slate-900/40">
              <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">Agenda de Vencimientos</span>
              <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">Importe / Estado</span>
            </div>

            <div className="divide-y divide-slate-800/60">
              {state.calendarEvents.map((ev) => (
                <div key={ev.id} className="p-4 sm:p-5 flex justify-between items-center hover:bg-slate-950/20 transition-all">
                  
                  <div className="flex items-center space-x-4">
                    {/* Circle indicators */}
                    <div className={`w-3 h-3 rounded-full shrink-0 ${
                      ev.isPaid ? 'bg-emerald-400' : 'bg-red-400 animate-pulse'
                    }`} />
                    
                    <div>
                      <span className={`text-xs font-semibold block ${ev.isPaid ? 'text-slate-400 line-through' : 'text-slate-200'}`}>
                        {ev.title}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                        Vence el {ev.date} • Categoría: {ev.category}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <span className="text-xs font-bold font-mono text-slate-300">
                      -{formatCurrency(ev.amount, profile.currency)}
                    </span>

                    {ev.isPaid ? (
                      <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-lg">
                        Pagado
                      </span>
                    ) : (
                      <button
                        onClick={() => onPayEvent(ev.id)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-slate-400 transition-all"
                        title="Marcar como pagado"
                      >
                        <Check size={14} />
                      </button>
                    )}
                  </div>

                </div>
              ))}

              {state.calendarEvents.length === 0 && (
                <div className="text-center py-12">
                  <span className="text-xs text-slate-500 font-mono">No hay eventos ni suscripciones registradas en la agenda.</span>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right column: Notification hub info & alert caps */}
        <div className="space-y-6">
          
          <div className="card-hover bg-[#0E0E10] border border-white/[0.06] p-6 rounded-[28px] space-y-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-1.5 font-mono uppercase tracking-wider">
              <BellRing size={16} className="text-red-400" />
              Notificaciones de Cobro
            </h3>

            <div className="space-y-3 text-xs leading-relaxed text-slate-400">
              <div className="flex items-start space-x-2 text-slate-300">
                <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
                <p>
                  Tienes <strong>{state.calendarEvents.filter(e => !e.isPaid).length} recibos pendientes</strong> de liquidar esta semana por valor total de{' '}
                  <strong className="text-red-300">
                    {formatCurrency(state.calendarEvents.filter(e => !e.isPaid).reduce((sum, e) => sum + e.amount, 0), profile.currency)}
                  </strong>.
                </p>
              </div>

              <p>
                Al confirmar el abono puntual de tus obligaciones de forma recurrente, mantienes tus historiales impolutos e incrementas tu nivel financiero en la plataforma (+150 XP de bonificación por abono de recibo).
              </p>
            </div>
          </div>

          {/* AI advice box on subscriptions */}
          <div className="bg-gradient-to-r from-slate-900 to-emerald-950/10 border border-emerald-500/20 p-5 rounded-[28px] space-y-3">
            <div className="flex items-center space-x-1.5 text-emerald-400 font-mono text-xs uppercase tracking-wider">
              <Sparkles size={14} />
              <span>Optimización de Suscripciones</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              "¿Sabías que un usuario medio gasta más de 450 € anuales en suscripciones pasivas que no utiliza? Te sugerimos auditar tus recibos mensuales y configurar una prueba de cancelación de 30 días para suscripciones inactivas."
            </p>
          </div>

        </div>

      </div>

      {/* Add Event Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg bg-[#0E0E10] border border-white/[0.06] rounded-[28px] p-6 shadow-2xl space-y-6 relative"
          >
            <button 
              onClick={() => setShowAddModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            <div>
              <h2 className="text-xl font-bold tracking-tight text-white">Añadir Vencimiento de Pago</h2>
              <p className="text-xs text-slate-500">Registra un recibo periódico o suscripción para programar alertas preventivas.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1.5">Nombre o Proveedor</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Alquiler Piso, Factura Luz, Spotify Family"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1.5">Importe Recibo ({profile.currency})</label>
                  <input
                    type="number"
                    required
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1.5">Fecha de Vencimiento</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1.5">Categoría</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="Suscripciones">Suscripciones y Software</option>
                  <option value="Vivienda">Vivienda (Alquiler/Hipoteca)</option>
                  <option value="Suministros">Suministros (Luz, Agua, Internet)</option>
                  <option value="Impuestos">Impuestos (IVA, IRPF, Tasas)</option>
                  <option value="Seguros">Seguros y Salud</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-white hover:bg-[#E5E5EA] font-semibold text-black text-xs transition-all shadow-md mt-4"
              >
                Programar en Agenda
              </button>

            </form>
          </motion.div>
        </div>
      )}

    </div>
  );
}
