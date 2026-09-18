/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { AppState } from '../types';
import { 
  Award, 
  Flag, 
  TrendingUp, 
  Scan, 
  Briefcase, 
  Trophy, 
  Compass, 
  ShoppingBag, 
  Lock, 
  ShieldCheck, 
  LineChart, 
  Gem, 
  Crown, 
  Star, 
  Sparkles,
  CheckCircle,
  HelpCircle,
  Zap,
  Flame
} from 'lucide-react';

interface BadgesViewProps {
  state: AppState;
  onClaimBadge: (badgeId: string, xpReward: number) => void;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  criteria: string;
  icon: React.ReactNode;
  levelRequired: number;
  unlocked: boolean;
  category: 'básico' | 'ahorro' | 'inversión' | 'avanzado' | 'leyenda';
  xpReward: number;
}

export default function BadgesView({ state, onClaimBadge }: BadgesViewProps) {
  const [activeFilter, setActiveFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);

  const profile = state.userProfile;
  const currentLevel = state.userLevel || 1;

  // Define badges with custom unlock logic
  const badges: Badge[] = useMemo(() => [
    {
      id: 'pioneer',
      name: 'Pionero de ALMO',
      description: 'El comienzo de un emocionante viaje hacia la maestría y la libertad de tus finanzas personales.',
      criteria: 'Disponible desde el Nivel 1',
      icon: <Flag className="w-6 h-6 sm:w-8 sm:h-8" />,
      levelRequired: 1,
      unlocked: currentLevel >= 1,
      category: 'básico',
      xpReward: 100
    },
    {
      id: 'frugal_saver',
      name: 'Ahorrador Consciente',
      description: 'Demuestra control total estructurando tus topes de consumo y presupuestos mensuales.',
      criteria: 'Alcanzar el Nivel 2 o definir un presupuesto activo',
      icon: <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8" />,
      levelRequired: 2,
      unlocked: currentLevel >= 2 || (state.budgets && state.budgets.length > 0),
      category: 'ahorro',
      xpReward: 250
    },
    {
      id: 'ai_scanner',
      name: 'Escaneador de Tickets',
      description: 'Sube un ticket de compra físico y utiliza el motor de Inteligencia Artificial para extraer datos.',
      criteria: 'Alcanzar el Nivel 3 o realizar tu primer escaneo',
      icon: <Scan className="w-6 h-6 sm:w-8 sm:h-8" />,
      levelRequired: 3,
      unlocked: currentLevel >= 3 || state.transactions.some(t => t.notes?.toLowerCase().includes('escan') || t.notes?.toLowerCase().includes('ticket')),
      category: 'básico',
      xpReward: 300
    },
    {
      id: 'investor_apprentice',
      name: 'Inversor Aprendiz',
      description: 'Empieza a construir tu patrimonio añadiendo activos en tu Cartera de Inversión inteligente.',
      criteria: 'Alcanzar el Nivel 5 o registrar tu primera inversión',
      icon: <Briefcase className="w-6 h-6 sm:w-8 sm:h-8" />,
      levelRequired: 5,
      unlocked: currentLevel >= 5 || (state.investments && state.investments.length > 0),
      category: 'inversión',
      xpReward: 400
    },
    {
      id: 'challenge_master',
      name: 'Cazador de Retos',
      description: 'Súmate a la gamificación financiera completando retos de ahorro que potencien tu hucha.',
      criteria: 'Alcanzar el Nivel 7 o completar un reto de ahorro',
      icon: <Trophy className="w-6 h-6 sm:w-8 sm:h-8" />,
      levelRequired: 7,
      unlocked: currentLevel >= 7 || state.challenges.some(c => c.isCompleted),
      category: 'ahorro',
      xpReward: 500
    },
    {
      id: 'strategic_planner',
      name: 'Planificador Estratégico',
      description: 'Crea planes financieros premium proyectados a largo plazo adaptados a tu estilo de vida.',
      criteria: 'Alcanzar el Nivel 10 o diseñar un plan estratégico',
      icon: <Compass className="w-6 h-6 sm:w-8 sm:h-8" />,
      levelRequired: 10,
      unlocked: currentLevel >= 10 || (state.financialPlans && state.financialPlans.length > 0),
      category: 'avanzado',
      xpReward: 600
    },
    {
      id: 'vinted_active',
      name: 'Modo Vinted',
      description: 'Lanza ventas de segunda mano o haz un seguimiento de tus listados activos en la app.',
      criteria: 'Alcanzar el Nivel 12 o listar un producto de segunda mano',
      icon: <ShoppingBag className="w-6 h-6 sm:w-8 sm:h-8" />,
      levelRequired: 12,
      unlocked: currentLevel >= 12 || (state.vintedListings && state.vintedListings.length > 0),
      category: 'ahorro',
      xpReward: 650
    },
    {
      id: 'vault_shield',
      name: 'Blindaje de Cuenta',
      description: 'Protege las pestañas confidenciales y tus activos mediante tu código PIN de seguridad exclusivo.',
      criteria: 'Alcanzar el Nivel 15 o configurar un PIN de seguridad',
      icon: <Lock className="w-6 h-6 sm:w-8 sm:h-8" />,
      levelRequired: 15,
      unlocked: currentLevel >= 15 || !!profile?.securityPin,
      category: 'avanzado',
      xpReward: 800
    },
    {
      id: 'advanced_investor',
      name: 'Inversor Avanzado',
      description: 'Consolida tu portafolio diversificando en fondos indexados, criptoactivos o materias primas.',
      criteria: 'Alcanzar el Nivel 20',
      icon: <LineChart className="w-6 h-6 sm:w-8 sm:h-8" />,
      levelRequired: 20,
      unlocked: currentLevel >= 20,
      category: 'inversión',
      xpReward: 1000
    },
    {
      id: 'budget_master',
      name: 'Acróbata del Presupuesto',
      description: 'Fija múltiples límites de gasto equilibrados por categorías sin superar tus topes previstos.',
      criteria: 'Alcanzar el Nivel 30 o configurar 3 o más presupuestos distintos',
      icon: <Flame className="w-6 h-6 sm:w-8 sm:h-8" />,
      levelRequired: 30,
      unlocked: currentLevel >= 30 || (state.budgets && state.budgets.length >= 3),
      category: 'ahorro',
      xpReward: 1500
    },
    {
      id: 'elite_rank',
      name: 'Elite de la Alianza',
      description: 'Forma parte del exclusivo club de inversores de élite con estatus VIP o Nivel 50 alcanzado.',
      criteria: 'Alcanzar el Nivel 50 o el rango de Usuario VIP',
      icon: <Gem className="w-6 h-6 sm:w-8 sm:h-8" />,
      levelRequired: 50,
      unlocked: currentLevel >= 50 || state.userRank === 'VIP',
      category: 'avanzado',
      xpReward: 2500
    },
    {
      id: 'legend_rank',
      name: 'Leyenda Viviente',
      description: 'El logro supremo. Has demostrado una constancia e inteligencia financiera insuperable.',
      criteria: 'Alcanzar el prestigioso Nivel 100',
      icon: <Crown className="w-6 h-6 sm:w-8 sm:h-8" />,
      levelRequired: 100,
      unlocked: currentLevel >= 100,
      category: 'leyenda',
      xpReward: 5000
    }
  ], [currentLevel, state.budgets, state.transactions, state.investments, state.challenges, state.financialPlans, state.vintedListings, state.userRank, profile]);

  // Compute stats
  const unlockedCount = useMemo(() => badges.filter(b => b.unlocked).length, [badges]);
  const totalXPBonus = useMemo(() => {
    return badges
      .filter(b => state.badges?.includes(b.id))
      .reduce((sum, b) => sum + b.xpReward, 0);
  }, [badges, state.badges]);

  // Filter badges
  const filteredBadges = useMemo(() => {
    return badges.filter(badge => {
      // 1. Unlocked filter
      if (activeFilter === 'unlocked' && !badge.unlocked) return false;
      if (activeFilter === 'locked' && badge.unlocked) return false;

      // 2. Category filter
      if (selectedCategory !== 'all' && badge.category !== selectedCategory) return false;

      return true;
    });
  }, [badges, activeFilter, selectedCategory]);

  return (
    <div id="badges-view-container" className="space-y-8 sm:space-y-10 px-1 sm:px-4">
      
      {/* Header section */}
      <div className="border-b border-white/[0.08] pb-6">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 rounded-full border bg-[#00FF66]/10 text-[#00FF66] border-[#00FF66]/20 font-bold">
            LOGROS Y RECONOCIMIENTOS
          </span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-semibold tracking-tight text-white flex items-center gap-2 mt-3">
          <span>Insignias de Rango</span> 
          <Award className="text-[#00FF66] animate-pulse shrink-0" size={24} />
        </h1>
        <p className="text-xs sm:text-sm text-[#8E8E93] mt-2 max-w-2xl leading-relaxed">
          Desbloquea insignias exclusivas a medida que aumentas tu nivel financiero en ALMO y registras más actividades de cartera.
        </p>
      </div>

      {/* Gamification Level Summary bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Unlocked badges card */}
        <div className="bg-[#0E0E10] border border-white/[0.06] p-4 sm:p-5 rounded-2xl sm:rounded-[28px] flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl sm:rounded-2xl bg-[#00FF66]/10 text-[#00FF66] flex items-center justify-center font-semibold text-lg shrink-0">
            {unlockedCount} / {badges.length}
          </div>
          <div>
            <h3 className="text-[10px] sm:text-xs font-mono uppercase tracking-widest text-[#8E8E93] font-bold">Insignias</h3>
            <p className="text-base sm:text-lg font-semibold text-white mt-0.5">
              {Math.round((unlockedCount / badges.length) * 100)}% Conseguido
            </p>
          </div>
        </div>

        {/* Current User Level card */}
        <div className="bg-[#0E0E10] border border-white/[0.06] p-4 sm:p-5 rounded-2xl sm:rounded-[28px] flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl sm:rounded-2xl bg-amber-400/10 text-amber-400 flex items-center justify-center text-xl shrink-0">
            ⚡
          </div>
          <div>
            <h3 className="text-[10px] sm:text-xs font-mono uppercase tracking-widest text-[#8E8E93] font-bold">Nivel Actual</h3>
            <p className="text-base sm:text-lg font-semibold text-white mt-0.5">
              Nivel {currentLevel}
            </p>
          </div>
        </div>

        {/* XP bonuses earned card */}
        <div className="bg-[#0E0E10] border border-white/[0.06] p-4 sm:p-5 rounded-2xl sm:rounded-[28px] flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl sm:rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center text-xl shrink-0">
            💎
          </div>
          <div>
            <h3 className="text-[10px] sm:text-xs font-mono uppercase tracking-widest text-[#8E8E93] font-bold">Bonus Acumulado</h3>
            <p className="text-base sm:text-lg font-semibold text-white mt-0.5">
              +{totalXPBonus} XP
            </p>
          </div>
        </div>

      </div>

      {/* Filter and Search Bar Controls - Scrollable & Responsive */}
      <div className="flex flex-col gap-4 bg-[#121214] p-4 rounded-2xl border border-[#ffffff08]">
        
        {/* State filters (All, Unlocked, Locked) */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="text-xs font-mono text-[#8E8E93] uppercase font-bold">Filtrar por estado:</div>
          <div className="flex gap-1 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {[
              { key: 'all', label: 'Todas' },
              { key: 'unlocked', label: 'Desbloqueadas' },
              { key: 'locked', label: 'Bloqueadas' }
            ].map(btn => (
              <button
                key={btn.key}
                onClick={() => setActiveFilter(btn.key as any)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border transition-all whitespace-nowrap cursor-pointer ${
                  activeFilter === btn.key
                    ? 'bg-[#00FF66] text-black border-[#00FF66] font-bold shadow-sm shadow-[#00FF66]/20'
                    : 'bg-[#050505] border-white/[0.08] text-[#8E8E93] hover:border-white/20'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        <div className="h-[1px] bg-[#ffffff05] w-full" />

        {/* Category filters */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="text-xs font-mono text-[#8E8E93] uppercase font-bold">Categorías:</div>
          <div className="flex gap-1 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {[
              { key: 'all', label: 'Todas las categorías' },
              { key: 'básico', label: 'Básico' },
              { key: 'ahorro', label: 'Ahorro' },
              { key: 'inversión', label: 'Inversión' },
              { key: 'avanzado', label: 'Avanzado' },
              { key: 'leyenda', label: 'Leyenda' }
            ].map(cat => (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat.key
                    ? 'bg-[#1C1C1E] text-[#00FF66] border-[#00FF66]/30 font-bold'
                    : 'bg-[#050505] border-[#ffffff05] text-[#8E8E93] hover:border-white/10 text-[11px]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Grid listing the badges - Completely responsive min-h card layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filteredBadges.map((badge) => {
          const isLevelProgressNear = currentLevel < badge.levelRequired && badge.levelRequired - currentLevel <= 5;
          const levelProgressPercent = Math.min(100, Math.round((currentLevel / badge.levelRequired) * 100));
          const isClaimed = state.badges?.includes(badge.id);

          return (
            <div 
              key={badge.id}
              onClick={() => setSelectedBadge(badge)}
              className={`p-5 sm:p-6 rounded-2xl sm:rounded-[28px] border flex flex-col justify-between transition-all duration-300 relative overflow-hidden min-h-[240px] sm:min-h-[260px] group cursor-pointer ${
                badge.unlocked
                  ? isClaimed
                    ? 'bg-gradient-to-br from-[#121214] to-[#141416] border-[#00FF66]/10 shadow-sm opacity-90'
                    : 'bg-gradient-to-br from-[#121214] to-[#18181b] border-[#00FF66]/25 hover:border-[#00FF66]/50 shadow-sm hover:shadow-[0_4px_30px_rgba(0,255,102,0.08)]'
                  : 'bg-[#121214]/60 border-[#ffffff05] opacity-50 hover:opacity-80'
              }`}
            >
              {/* Background accent glow when unlocked but not claimed */}
              {badge.unlocked && !isClaimed && (
                <div className="absolute top-0 right-0 w-28 h-28 bg-[#00FF66]/5 blur-[40px] pointer-events-none rounded-full group-hover:bg-[#00FF66]/10 transition-all duration-500" />
              )}

              {/* Top Row: Badge Icon and Unlock status */}
              <div className="flex justify-between items-start gap-3">
                <div className={`p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border transition-all duration-300 shrink-0 ${
                  badge.unlocked
                    ? 'bg-[#00FF66]/10 text-[#00FF66] border-[#00FF66]/20 group-hover:scale-105 group-hover:rotate-3'
                    : 'bg-slate-950 text-slate-700 border-slate-900'
                }`}>
                  {badge.icon}
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className={`text-[9px] font-mono uppercase tracking-widest font-semibold px-2 py-0.5 rounded ${
                    badge.unlocked
                      ? isClaimed 
                        ? 'bg-slate-900 text-slate-400 border border-[#ffffff05]'
                        : 'bg-[#00FF66]/15 text-[#00FF66]'
                      : 'bg-[#1c1c1e] text-[#8e8e93]'
                  }`}>
                    {badge.unlocked ? isClaimed ? 'Reclamado' : 'Disponible' : 'Bloqueado'}
                  </span>
                  
                  <span className="text-[9px] font-mono text-slate-400 font-bold bg-[#1c1c1e]/40 px-1.5 py-0.5 rounded">
                    +{badge.xpReward} XP
                  </span>
                </div>
              </div>

              {/* Badge Details */}
              <div className="space-y-1 mt-4 flex-1">
                <h3 className="text-sm sm:text-base font-semibold text-white tracking-tight flex items-center gap-1.5">
                  {badge.name}
                  {badge.category === 'leyenda' && <Crown className="text-amber-400 w-4 h-4 shrink-0" />}
                </h3>
                <p className="text-xs text-[#8E8E93] leading-relaxed line-clamp-3">
                  {badge.description}
                </p>
              </div>

              {/* Footer: Criteria / Progress */}
              <div className="pt-3 border-t border-[#ffffff05] mt-3">
                {badge.unlocked && !isClaimed ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onClaimBadge(badge.id, badge.xpReward);
                    }}
                    className="w-full py-2 rounded-xl bg-[#00FF66] hover:bg-[#00CC52] text-black font-semibold text-[10px] uppercase tracking-wider transition-all cursor-pointer text-center animate-pulse shadow-lg shadow-[#00FF66]/10"
                  >
                    Reclamar +{badge.xpReward} XP 💎
                  </button>
                ) : (
                  <>
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-slate-500 font-medium">Requisito:</span>
                      <span className={`font-bold text-right truncate pl-2 ${badge.unlocked ? 'text-[#00FF66]' : 'text-slate-300'}`}>
                        {badge.unlocked ? '✓ Conseguido' : badge.criteria}
                      </span>
                    </div>

                    {/* Progress bar if locked and close to unlocking */}
                    {!badge.unlocked && badge.levelRequired > 1 && (
                      <div className="mt-2 space-y-1">
                        <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-slate-700 rounded-full transition-all duration-500"
                            style={{ width: `${levelProgressPercent}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[8px] font-mono text-slate-500">
                          <span>Progreso Nivel</span>
                          <span>{currentLevel}/{badge.levelRequired} ({levelProgressPercent}%)</span>
                        </div>
                      </div>
                    )}

                    {badge.unlocked && isClaimed && (
                      <div className="mt-1 text-center text-[10px] font-bold text-[#00FF66]/60 flex items-center justify-center gap-1">
                        <span>✓ Recompensa cobrada (+{badge.xpReward} XP)</span>
                      </div>
                    )}
                  </>
                )}
              </div>

            </div>
          );
        })}

        {filteredBadges.length === 0 && (
          <div className="col-span-full text-center py-16 bg-[#0E0E10] border border-white/[0.06] rounded-[28px] space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-900/60 text-slate-600 flex items-center justify-center mx-auto text-xl">
              🔍
            </div>
            <div>
              <p className="text-sm text-slate-300 font-bold">No se encontraron insignias con estos filtros.</p>
              <p className="text-xs text-[#8E8E93] mt-1">Prueba a cambiar tus filtros de estado o categoría.</p>
            </div>
          </div>
        )}
      </div>

      {/* Badge Details Modal overlay */}
      {selectedBadge && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedBadge(null)}
        >
          <div 
            className="bg-[#121214] border border-white/[0.08] rounded-[28px] max-w-md w-full overflow-hidden shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top color strip */}
            <div className={`h-2 w-full ${selectedBadge.unlocked ? 'bg-[#00FF66]' : 'bg-slate-700'}`} />
            
            <div className="p-6 sm:p-8 space-y-6">
              
              {/* Badge Icon bubble */}
              <div className="flex justify-center">
                <div className={`p-6 rounded-[28px] border ${
                  selectedBadge.unlocked
                    ? 'bg-[#00FF66]/10 text-[#00FF66] border-[#00FF66]/30 shadow-lg shadow-[#00FF66]/5 animate-bounce'
                    : 'bg-slate-950 text-slate-700 border-slate-900'
                }`}>
                  {selectedBadge.icon}
                </div>
              </div>

              {/* Title & Category */}
              <div className="text-center space-y-1.5">
                <div className="flex justify-center gap-2 items-center">
                  <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-slate-900 text-[#8E8E93] font-bold">
                    Categoría: {selectedBadge.category}
                  </span>
                  <span className={`text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded font-bold ${
                    selectedBadge.unlocked ? 'bg-[#00FF66]/20 text-[#00FF66]' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {selectedBadge.unlocked ? 'Desbloqueado 🔓' : 'Bloqueado 🔒'}
                  </span>
                </div>
                <h3 className="text-2xl font-semibold text-white tracking-tight flex items-center justify-center gap-2">
                  {selectedBadge.name}
                </h3>
                <p className="text-xs font-mono text-[#8E8E93] font-bold">
                  Recompensa: <span className="text-[#00FF66]">+{selectedBadge.xpReward} XP</span>
                </p>
              </div>

              {/* Description */}
              <div className="bg-[#050505] p-4 rounded-2xl border border-[#ffffff05]">
                <h4 className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold mb-1">Descripción del logro</h4>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {selectedBadge.description}
                </p>
              </div>

              {/* Lock / Requirements Detail */}
              <div className="space-y-1">
                <h4 className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold">Requisito para conseguirlo</h4>
                <div className={`p-4 rounded-xl border text-xs sm:text-sm font-semibold flex items-center space-x-2 ${
                  selectedBadge.unlocked 
                    ? 'bg-[#00FF66]/5 border-[#00FF66]/20 text-[#00FF66]' 
                    : 'bg-slate-950 border-slate-900 text-slate-300'
                }`}>
                  <span>{selectedBadge.unlocked ? '✓ Requisito cumplido: ' : '𐄂 Requisito: '}</span>
                  <span className="font-bold">{selectedBadge.criteria}</span>
                </div>
              </div>

              {/* Close Button / Claim Button */}
              {selectedBadge.unlocked && !state.badges?.includes(selectedBadge.id) ? (
                <button 
                  onClick={() => {
                    onClaimBadge(selectedBadge.id, selectedBadge.xpReward);
                    setSelectedBadge(null);
                  }}
                  className="w-full py-3.5 rounded-xl bg-[#00FF66] hover:bg-[#00CC52] text-black font-semibold text-xs uppercase tracking-widest transition-all cursor-pointer text-center animate-pulse"
                >
                  Reclamar Recompensa +{selectedBadge.xpReward} XP 💎
                </button>
              ) : (
                <button 
                  onClick={() => setSelectedBadge(null)}
                  className="w-full py-3.5 rounded-xl bg-white hover:bg-slate-200 text-black font-semibold text-xs uppercase tracking-widest transition-all cursor-pointer"
                >
                  Cerrar Detalle {selectedBadge.unlocked ? '(Recompensa Cobrada)' : ''}
                </button>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
