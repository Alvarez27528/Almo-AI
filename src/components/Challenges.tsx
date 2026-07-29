/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { AppState, Challenge } from '../types';
import { getDailyChallengeIds } from '../utils/challenges';
import {
  Award, 
  Sparkles, 
  CheckCircle, 
  Trophy, 
  Zap, 
  Star,
  Clock,
  Lock
} from 'lucide-react';

interface ChallengesProps {
  state: AppState;
  onClaimChallenge: (id: string, xpReward: number) => void;
}

export default function Challenges({ state, onClaimChallenge }: ChallengesProps) {
  const [completedChallenge, setCompletedChallenge] = React.useState<Challenge | null>(null);

  // Determine which challenges are active for today
  const activeIds = getDailyChallengeIds();
  const activeChallenges = state.challenges.filter(ch => activeIds.includes(ch.id));
  
  const totalCompleted = state.challenges.filter(ch => ch.isCompleted).length;
  const isMaxLevelReached = totalCompleted >= 24;

  const handleClaim = (ch: Challenge) => {
    onClaimChallenge(ch.id, ch.rewardXP);
    setCompletedChallenge(ch);
  };

  const getCategorySection = (category: string) => {
    switch (category) {
      case 'Ahorro': return 'Movimientos / Panel Principal';
      case 'IA': return 'ALMO AI Chat IA / Escáner';
      case 'Planificación': return 'Planes Estratégicos';
      case 'Inversión': return 'Cartera Inversión';
      default: return 'Varias secciones';
    }
  };

  // If for some reason our synchronization hasn't run yet, fallback to what we have or show those ids
  const badges = [
    { name: 'Ahorrador Frugal', desc: 'Sostuvo una tasa de ahorro mayor al 25%.', icon: '🌱', unlocked: state.userLevel >= 1 },
    { name: 'León de la Inversión', desc: 'Registró su primer activo de renta variable.', icon: '🦁', unlocked: state.investments.length > 0 },
    { name: 'Escáner Implacable', desc: 'Completó lecturas de tickets o facturas con IA.', icon: '⚡', unlocked: state.userLevel >= 2 },
    { name: 'Planificador Consecuente', desc: 'Estructuró un plan financiero viable de futuro.', icon: '🎯', unlocked: state.financialPlans.length > 0 }
  ];

  // Calculate hours remaining until the next 24h midnight reset
  const getHoursToMidnight = () => {
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
    const diffMs = midnight.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffHours}h ${diffMins}m`;
  };

  return (
    <div id="challenges-view" className="space-y-6 font-sans">
      
      {/* View Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Trophy className="text-amber-400 animate-pulse" size={24} />
            Misiones y Retos de Ahorro Diarios
          </h1>
          <p className="text-xs text-slate-400 max-w-2xl mt-1 leading-relaxed">
            Supera misiones financieras reales para habituarte al control de gastos y subir tu estatus. En ALMO AI, los retos se autocompletan al realizar las acciones de la aplicación, garantizando una disciplina de acero y sin trampas.
          </p>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center space-x-3 bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-2xl w-full md:w-auto shrink-0 shadow-lg">
          <div className="p-1.5 rounded-lg bg-amber-400/10 text-amber-400">
            <Zap size={16} className="fill-amber-400" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-mono block uppercase tracking-wider">Estatus de Disciplina</span>
            <span className="text-xs font-extrabold text-slate-200">Nivel {state.userLevel} (Premium)</span>
          </div>
        </div>
      </div>

      {/* Daily Rotation countdown and Info block */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-gradient-to-r from-[#070D19] via-[#091C14] to-[#060D0A] border border-[#00FF66]/15 p-5 rounded-3xl flex items-center gap-4 shadow-xl">
          <div className="p-3 bg-[#00FF66]/10 text-[#00FF66] rounded-2xl border border-[#00FF66]/20 shadow-[0_0_15px_rgba(0,255,102,0.1)] shrink-0">
            <Sparkles size={22} className="animate-pulse" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-extrabold text-white">
              ¡Misiones de Acción Automáticas!
            </h3>
            <p className="text-xs text-slate-300 leading-normal font-sans">
              No puedes añadir retos manualmente ni ajustar tu progreso. El sistema detecta tus acciones de forma transparente (registrar gastos, consultar al asesor de IA, planificar ahorros, etc.) para que ganes tus recompensas con disciplina real.
            </p>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-3xl flex items-center gap-4">
          <div className="p-3 bg-amber-400/10 text-amber-400 rounded-2xl border border-amber-400/20 shrink-0">
            <Clock size={20} className="animate-spin-slow" />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 font-mono uppercase block tracking-wider">Próximo Reinicio</span>
            <span className="text-sm font-extrabold text-white block">{getHoursToMidnight()}</span>
            <span className="text-[10px] text-amber-400 font-medium block">Nuevas misiones en 24h</span>
          </div>
        </div>
      </div>

      {/* Challenge board Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: 2 daily active quests */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-mono text-slate-500 uppercase tracking-widest block font-bold">Misiones Activas de Hoy (Únicamente 2)</h2>
            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-[#00FF66]/10 text-[#00FF66] border border-[#00FF66]/20 select-none">ACTIVO</span>
          </div>

          <div className="space-y-4">
            {isMaxLevelReached ? (
              <div className="p-10 text-center bg-gradient-to-tr from-amber-500/10 to-amber-900/20 border border-amber-500/30 rounded-3xl">
                <Trophy className="mx-auto text-amber-400 mb-3 animate-bounce" size={32} />
                <h3 className="text-lg font-bold text-white mb-2">¡Nivel Máximo Completado!</h3>
                <p className="text-sm text-slate-300 font-sans">
                  Has agotado y completado exitosamente todas las 24 misiones disponibles. Tu rango ha subido y se han desbloqueado todas las funciones premium para ti.
                </p>
              </div>
            ) : activeChallenges.length === 0 ? (
              <div className="p-10 text-center bg-slate-900 border border-slate-850 rounded-3xl">
                <Clock className="mx-auto text-slate-600 mb-2.5 animate-pulse" size={28} />
                <p className="text-xs text-slate-400 font-sans">Sincronizando tus dos misiones diarias. Espera un instante...</p>
              </div>
            ) : (
              activeChallenges.map((ch) => {
                const progressVal = Math.min(100, Math.round((ch.currentAmount / (ch.targetAmount || 1)) * 100));
                const xpVal = ch.rewardXP;
                const isReadyToClaim = progressVal >= 100 && !ch.isCompleted;
                return (
                  <div 
                    key={ch.id} 
                    className={`p-5.5 rounded-3xl border transition-all flex flex-col justify-between ${
                      ch.isCompleted 
                        ? 'bg-slate-950/20 border-slate-900/40 opacity-60' 
                        : isReadyToClaim
                        ? 'bg-gradient-to-tr from-amber-500/5 to-amber-500/10 border-amber-500/30 shadow-lg shadow-amber-500/5'
                        : 'bg-slate-900 border-slate-800'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                      <div className="flex items-start space-x-3.5">
                        <div className={`p-3 rounded-2xl border shrink-0 ${
                          ch.isCompleted 
                            ? 'bg-slate-900 text-slate-500 border-slate-800' 
                            : 'bg-slate-950 text-amber-400 border-slate-850'
                        }`}>
                          <Star size={18} className={!ch.isCompleted ? 'fill-amber-400 animate-pulse' : ''} />
                        </div>
                        <div>
                          <h3 className={`text-sm font-bold text-slate-200 ${ch.isCompleted ? 'line-through text-slate-400' : ''}`}>
                            {ch.title}
                          </h3>
                          <p className="text-xs text-slate-400 mt-1.5 font-sans leading-relaxed">
                            {ch.description}
                          </p>
                          <div className="mt-2 flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-mono text-slate-500 uppercase">Categoría:</span>
                              <span className="text-[10px] font-mono font-bold bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-850 text-slate-400 uppercase">
                                {ch.category}
                              </span>
                            </div>
                            {!ch.isCompleted && (
                              <div className="flex items-center gap-1.5 border-l border-slate-800 pl-3">
                                <span className="text-[10px] font-mono text-slate-500 uppercase">Sección:</span>
                                <span className="text-[10px] font-mono font-bold text-[#00FF66] uppercase tracking-wide">
                                  {getCategorySection(ch.category)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Reward badge */}
                      <div className="flex items-center gap-2">
                          <div className="flex items-center space-x-1.5 bg-slate-950 border border-slate-850 px-3 py-1.5 rounded-xl text-[10px] font-mono text-amber-400 font-bold shrink-0 self-start">
                            <Zap size={11} className="fill-amber-400" />
                            <span>+{xpVal} XP</span>
                          </div>
                      </div>
                    </div>

                    {/* Progress segment */}
                    <div className="mt-5 space-y-2">
                      <div className="flex justify-between text-[10px] font-mono text-slate-500">
                        <span>Progreso de la misión</span>
                        <span>{ch.currentAmount} / {ch.targetAmount} ({progressVal}%)</span>
                      </div>
                      <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-[#ffffff03]">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${
                            ch.isCompleted 
                              ? 'bg-slate-700' 
                              : 'bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500'
                          }`} 
                          style={{ width: `${progressVal}%` }}
                        />
                      </div>
                    </div>

                    {/* Action or claim buttons */}
                    {isReadyToClaim && (
                      <div className="mt-4 pt-3.5 border-t border-slate-850/60 flex justify-end">
                        <button
                          onClick={() => handleClaim(ch)}
                          className="flex items-center space-x-1.5 px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition-all shadow-lg animate-bounce cursor-pointer select-none"
                        >
                          <Trophy size={13} />
                          <span>Reclamar Recompensa</span>
                        </button>
                      </div>
                    )}

                    {ch.isCompleted && (
                      <div className="mt-4 pt-3.5 border-t border-slate-950 flex justify-end items-center text-emerald-400 text-[10px] font-mono font-bold gap-1 select-none">
                        <CheckCircle size={12} />
                        <span>Misión Completada y Reclamada</span>
                      </div>
                    )}

                  </div>
                );
              })
            )}
          </div>
          
          {/* Animation Overlay */}
          {completedChallenge && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
              onClick={() => setCompletedChallenge(null)}
            >
              <motion.div 
                initial={{ scale: 0.8, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-slate-900 border border-amber-500/30 p-8 rounded-3xl text-center shadow-2xl max-w-sm w-full"
              >
                <div className="mx-auto w-16 h-16 bg-amber-400/20 rounded-full flex items-center justify-center mb-6">
                  <Trophy className="text-amber-400" size={32} />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">¡Misión Completada!</h2>
                <p className="text-slate-400 mb-6 font-sans">Has ganado <span className="text-amber-400 font-bold">+{completedChallenge.rewardXP} XP</span></p>
                <button 
                  onClick={() => setCompletedChallenge(null)}
                  className="w-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold py-3 rounded-xl transition-colors"
                >
                  Genial
                </button>
              </motion.div>
            </motion.div>
          )}

        </div>

        {/* Right column: Insignias de estatus (Unlocked Badges) */}
        <div className="space-y-5">
          <h2 className="text-xs font-mono text-slate-500 uppercase tracking-widest block font-bold">Insignias de Estatus Financiero</h2>

          <div className="bg-slate-900 border border-slate-800 p-5.5 rounded-3xl space-y-4 shadow-xl">
            
            <div className="space-y-3.5">
              {badges.map((b, idx) => (
                <div 
                  key={idx} 
                  className={`p-3.5 rounded-2xl border transition-all flex items-center space-x-3.5 ${
                    b.unlocked 
                      ? 'bg-slate-950/40 border-amber-500/20 text-slate-200' 
                      : 'bg-slate-950/10 border-slate-900/40 opacity-45 text-slate-500'
                  }`}
                >
                  <div className="text-2xl shrink-0">
                    {b.unlocked ? b.icon : <Lock size={16} className="text-slate-600 mx-1" />}
                  </div>
                  <div>
                    <span className="text-xs font-bold block">{b.name}</span>
                    <span className="text-[10px] text-slate-500 mt-0.5 block leading-normal">{b.desc}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-850/60 text-center">
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block mb-1">Rango Actual de Estatus</span>
              <span className="text-xs font-extrabold text-amber-400 flex items-center justify-center gap-1">
                <Award size={13} className="text-amber-400 fill-amber-400" />
                Inversor Inteligente Certificado
              </span>
            </div>

          </div>

          {/* Gamification philosophy card */}
          <div className="bg-gradient-to-r from-slate-900 to-amber-950/5 border border-slate-850 p-5 rounded-3xl space-y-3">
            <div className="flex items-center space-x-1.5 text-amber-400 font-mono text-xs uppercase tracking-wider font-bold">
              <Star size={13} className="fill-amber-400" />
              <span>CONSTANCIA ALMO AI</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed font-sans font-medium">
              "El control de tus finanzas consiste en alinear tus recursos cotidianos con tus objetivos de futuro. Cumple tus misiones, acumula estatus y amplía tu salud fiduciaria paso a paso."
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
