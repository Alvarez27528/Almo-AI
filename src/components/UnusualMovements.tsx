/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AppState, Transaction } from '../types';
import { formatCurrency, parseLocalDate } from '../utils/finance';
import { 
  Sparkles, 
  RotateCw, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  CreditCard,
  CheckCircle,
  HelpCircle,
  AlertCircle
} from 'lucide-react';

interface UnusualMovementsProps {
  state: AppState;
}

interface AnalyzedMovement {
  transaction: Transaction;
  tag: string;
  reason: string;
  insight: string;
  score: number;
  timeAgo: string;
}

export default function UnusualMovements({ state }: UnusualMovementsProps) {
  // Store flipped card indices to manage flipping state
  const [flippedCards, setFlippedCards] = useState<{ [key: string]: boolean }>({});

  const handleCardClick = (id: string) => {
    setFlippedCards(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const movements = useMemo(() => {
    const allTxs = state.transactions || [];
    if (allTxs.length === 0) return [];

    // Reference current local time from metadata: 2026-07-12
    const currentDate = new Date(2026, 6, 12); 

    // Median transaction amount for outlier scoring
    const totalAmountSum = allTxs.reduce((sum, t) => sum + t.amount, 0);
    const averageAmount = allTxs.length > 0 ? totalAmountSum / allTxs.length : 50;

    const analyzed: AnalyzedMovement[] = allTxs.map(t => {
      let score = 0;
      let tag = 'Inusual';
      let reason = 'Movimiento fuera de los patrones estándar.';
      let insight = 'Te aconsejamos revisar periódicamente para asegurar el control de tu balance mensual.';

      // Heuristic 1: Large transaction amount (outlier)
      if (t.amount > averageAmount * 3.5) {
        score += 350;
        tag = t.type === 'income' ? 'Ingreso Excepcional' : 'Desembolso Crítico';
        reason = t.type === 'income'
          ? `Ingreso significativamente superior a la media de cobros registrados.`
          : `Gasto de gran volumen respecto a tu media transaccional de ${formatCurrency(averageAmount, state.userProfile?.currency)}.`;
        insight = t.type === 'income'
          ? '¡Excelente! Considera destinar al menos un 30% de esta entrada extra a tu fondo de inversión o de emergencia.'
          : 'Gasto de alto impacto detectado. Te aconsejamos posponer otros consumos secundarios esta semana.';
      } else if (t.amount > 150) {
        score += 150;
        tag = t.type === 'income' ? 'Ingreso Elevado' : 'Gasto Elevado';
        reason = 'Movimiento de importe por encima del promedio diario.';
        insight = t.type === 'income'
          ? 'Buen empujón de liquidez. Ideal para completar metas de ahorro que tengas pendientes.'
          : 'Revisa si este gasto estaba planificado. Controlar importes medianos evita sorpresas a fin de mes.';
      }

      // Heuristic 2: Category scarcity (first or rare occurrence)
      const sameCatTxs = allTxs.filter(tx => tx.category.toLowerCase() === t.category.toLowerCase());
      if (sameCatTxs.length === 1) {
        score += 250;
        tag = 'Nueva Categoría';
        reason = `Primera transacción registrada en la categoría "${t.category}".`;
        insight = `Inauguras esta sección. Es recomendable asignarle un límite en la sección de "Presupuestos" para monitorizarla.`;
      }

      // Heuristic 3: Specific types
      if (t.type === 'investment') {
        score += 200;
        tag = 'Inversión Activa';
        reason = 'Aportación periódica a activos de crecimiento financiero.';
        insight = 'Invertir con regularidad es la forma más efectiva de acumular patrimonio a largo plazo. ¡Buen hábito!';
      } else if (t.type === 'loan') {
        score += 100;
        tag = 'Amortización';
        reason = 'Pago de amortización de préstamos o deudas.';
        insight = 'Cada cuota pagada reduce tu carga pasiva y libera flujo de caja neto para tus meses futuros.';
      }

      // Heuristic 4: Manual Balance adjustments
      const descLower = t.description.toLowerCase();
      if (descLower.includes('ajuste') || descLower.includes('corrección')) {
        score += 300;
        tag = 'Ajuste de Saldo';
        reason = 'Modificación manual registrada para corregir balances.';
        insight = 'Mantener el saldo real sincronizado es vital para un diagnóstico preciso de tu salud financiera.';
      }

      // Time calculation
      const txDate = parseLocalDate(t.date);
      const diffTime = Math.abs(currentDate.getTime() - txDate.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      let timeAgo = 'Reciente';
      if (diffDays === 0) {
        timeAgo = 'Hoy';
        score += 500; // Massive score boost for 48 hour window
      } else if (diffDays === 1) {
        timeAgo = 'Ayer';
        score += 450; // High score boost for 48 hour window
      } else if (diffDays === 2) {
        timeAgo = 'Hace 48 horas';
        score += 400; // Within 48 hours
      } else {
        timeAgo = `Hace ${diffDays} días`;
      }

      return {
        transaction: t,
        tag,
        reason,
        insight,
        score,
        timeAgo
      };
    });

    // Sort by score (which prioritizes last 48 hours and high-impact unusualness)
    return analyzed
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [state.transactions, state.userProfile]);

  if (movements.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-[#00FF66]/10 rounded-lg text-[#00FF66]">
            <Sparkles size={16} className="animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm font-mono uppercase tracking-widest text-slate-300 font-bold">
              Radar de Movimientos
            </h2>
            <p className="text-xs text-[#8E8E93]">
              Detecciones relevantes e inusuales en las últimas 48 horas
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#1C1C1E] border border-[#ffffff08] text-slate-400">
          Formato Flashcard
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {movements.map(({ transaction: t, tag, reason, insight, timeAgo }) => {
          const isFlipped = !!flippedCards[t.id];
          const isExpense = t.type === 'expense' || t.type === 'loan';
          const isIncome = t.type === 'income';
          const isInvestment = t.type === 'investment';

          return (
            <div 
              key={t.id}
              className="h-48 cursor-pointer group"
              style={{ perspective: '1000px' }}
              onClick={() => handleCardClick(t.id)}
            >
              <div 
                className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${
                  isFlipped ? 'rotate-y-180' : ''
                }`}
              >
                {/* FRONT OF THE FLASHCARD */}
                <div className="absolute inset-0 backface-hidden bg-[#0E0E10] border border-white/[0.06] hover:border-[#00FF66]/30 p-4 rounded-2xl flex flex-col justify-between transition-all duration-300 group-hover:shadow-lg group-hover:shadow-[#00FF66]/2">
                  <div className="flex items-start justify-between">
                    <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                      isIncome ? 'bg-[#00FF66]/10 text-[#00FF66]' :
                      isInvestment ? 'bg-blue-500/10 text-blue-400' :
                      'bg-rose-500/10 text-rose-400'
                    }`}>
                      {tag}
                    </span>
                    <span className="text-[10px] font-mono text-[#8E8E93] flex items-center gap-1">
                      <Calendar size={10} />
                      {timeAgo}
                    </span>
                  </div>

                  <div className="my-2">
                    <div className="flex items-baseline gap-1">
                      <span className={`text-2xl font-semibold ${
                        isIncome ? 'text-[#00FF66]' :
                        isInvestment ? 'text-blue-400' :
                        'text-rose-400'
                      }`}>
                        {isIncome ? '+' : isInvestment ? '→' : '-'}
                        {formatCurrency(t.amount, state.userProfile?.currency)}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-white truncate mt-1">
                      {t.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t border-[#ffffff04] pt-2 mt-1">
                    <span className="text-[10px] font-mono text-[#8E8E93] truncate max-w-[120px] flex items-center gap-1">
                      <CreditCard size={10} />
                      {t.paymentMethod || 'Otros'}
                    </span>
                    <span className="text-[10px] text-[#00FF66] font-mono flex items-center gap-1 group-hover:underline">
                      Analizar <RotateCw size={10} className="group-hover:rotate-45 transition-transform duration-300" />
                    </span>
                  </div>
                </div>

                {/* BACK OF THE FLASHCARD */}
                <div className="absolute inset-0 backface-hidden rotate-y-180 bg-[#1A1A1E] border border-[#00FF66]/20 p-4 rounded-2xl flex flex-col justify-between shadow-xl">
                  <div className="flex items-center gap-1.5 text-xs text-[#00FF66] font-bold font-mono">
                    <Sparkles size={12} className="animate-pulse" />
                    ANÁLISIS INTELIGENTE
                  </div>

                  <div className="flex-1 my-2 overflow-y-auto pr-1 space-y-1">
                    <p className="text-[11px] leading-relaxed text-slate-300">
                      <strong className="text-white">Motivo:</strong> {reason}
                    </p>
                    <p className="text-[11px] leading-relaxed text-slate-400 italic">
                      💡 {insight}
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t border-[#ffffff04] pt-2 text-[10px] text-slate-500 font-mono">
                    <span>{t.category}</span>
                    <span className="text-[#00FF66]">Volver card</span>
                  </div>
                </div>

              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
