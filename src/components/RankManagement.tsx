/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import { AppState } from '../types';
import PremiumPricingCard from './PremiumPricingCard';
import TermsModal from './TermsModal';
import { 
  Award, 
  ShieldCheck, 
  ChevronRight,
  UserCheck,
  MessageSquare,
  Compass,
  LineChart,
  ShoppingBag,
  Scale
} from 'lucide-react';

interface RankManagementProps {
  state: AppState;
  onSetUserRank: (rank: 'Normal' | 'VIP') => void;
}

export default function RankManagement({ state, onSetUserRank }: RankManagementProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const currentRank = state.userRank || 'Normal';
  const tokensUsed = state.aiTokensUsed || 0;
  
  // Base 5 + 5 per completed challenge + 3 per level above 1
  const completedChallengesCount = state.challenges ? state.challenges.filter(ch => ch.isCompleted).length : 0;
  const maxNormalTokens = 5 + (completedChallengesCount * 5) + ((state.userLevel - 1) * 3);

  const normalBenefits = [
    { title: 'Límite de Consultas IA', value: `${maxNormalTokens} consultas`, desc: `Base de 5. +5 por reto completado y +3 por nivel. Usado: ${tokensUsed}/${maxNormalTokens}` },
    { title: 'Movimientos Manuales', value: 'Ilimitados', desc: 'Registro detallado de ingresos y gastos.' },
    { title: 'Estadísticas Básicas', value: 'Acceso Estándar', desc: 'Resumen mensual de balances de caja.' },
    { title: 'Retos de Ahorro', value: 'Amplía tu IA', desc: 'Acumula XP y desbloquea más consultas gratuitas permanentes.' }
  ];

  const vipBenefits = [
    { 
      title: 'ALMO AI Chat IA Ilimitado', 
      icon: <MessageSquare size={16} className="text-[#00FF66]" />, 
      desc: 'Preguntas ilimitadas sobre tus gastos, consejos personalizados y análisis de presupuestos instantáneos.' 
    },
    { 
      title: 'Planes Estratégicos', 
      icon: <Compass size={16} className="text-[#00FF66]" />, 
      desc: 'Optimización de liquidez a corto, medio y largo plazo adaptada a tus objetivos de vida.' 
    },
    { 
      title: 'Simulador Futuro Financiero', 
      icon: <LineChart size={16} className="text-[#00FF66]" />, 
      desc: 'Proyecciones de interés compuesto, amortización de hipotecas e impacto de grandes inversiones.' 
    },
    { 
      title: 'Modo Vinted Autónomo', 
      icon: <ShoppingBag size={16} className="text-[#00FF66]" />, 
      desc: 'Control especializado de comisiones de venta, costes de envío, anuncios y margen de beneficio real.' 
    }
  ];

  const handleVIPPayment = async (code?: string) => {
    if (code?.trim() === 'Golfo2805') {
      setIsLoading(true);
      // Simulate activation delay for better UX
      setTimeout(() => {
        onSetUserRank('VIP');
        setIsLoading(false);
        alert('¡Código Golfo2805 canjeado con éxito! Ahora eres VIP.');
      }, 1500);
      return;
    }

    setIsLoading(true);
    console.log('Initiating VIP payment...');
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
      });
      console.log('Response status:', response.status);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Payment initiation failed');
      }
      
      console.log('Session data:', data);
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No session URL in response');
      }
    } catch (e) {
      console.error('Error initiating payment', e);
      alert('Error al iniciar el pago: ' + e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="rank-management-view" className="space-y-8 pb-12">
      
      {/* Banner Superior con efecto Cyberpunk */}
      <div className="relative bg-[#0B0F19] border border-white/[0.08] rounded-[28px] p-6 sm:p-8 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-[#00FF66]/10 to-transparent pointer-events-none rounded-bl-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-gradient-to-tr from-amber-500/5 to-transparent pointer-events-none rounded-tr-full blur-3xl" />

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <span className="text-[10px] font-mono text-[#00FF66] uppercase tracking-widest bg-[#00FF66]/10 px-3 py-1 rounded-full border border-[#00FF66]/20 inline-block">
              ALMO AI VIP Program
            </span>
            <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
              Gestión de Rango de Cuenta
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 font-sans max-w-xl">
              Personaliza el motor de inteligencia de tu applet. Desbloquea herramientas de simulación interactiva y consultas ilimitadas de IA de manera completamente gratuita.
            </p>
          </div>

          <div className="flex items-center space-x-3 bg-slate-950/80 border border-white/[0.08] p-4 rounded-2xl w-full md:w-auto">
            <div className={`p-3 rounded-xl shrink-0 ${
              currentRank === 'VIP' 
                ? 'bg-[#00FF66]/10 text-[#00FF66] shadow-[0_0_15px_rgba(0,255,102,0.15)] border border-[#00FF66]/20' 
                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            }`}>
              <Award size={24} />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block">Tu Rango Actual</span>
              <span className={`text-lg font-semibold tracking-tight ${
                currentRank === 'VIP' ? 'text-[#00FF66]' : 'text-amber-400'
              }`}>
                {currentRank === 'VIP' ? 'RANGO VIP PREMIUM' : 'RANGO NORMAL'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid de Comparación de Rangos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Tarjeta de Rango Normal (Estilo Cobre/Ámbar Metalizado - No soso!) */}
        <div className="bg-gradient-to-br from-[#1A120B] via-[#0E0A06] to-[#050505] border border-amber-500/20 rounded-[28px] p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-amber-400/5 to-transparent pointer-events-none rounded-bl-full" />
          
          <div>
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest font-bold">Plan Estándar</span>
                <h3 className="text-xl font-semibold text-white mt-1">Rango Normal</h3>
              </div>
              {currentRank === 'Normal' && (
                <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold rounded-lg text-[10px] uppercase tracking-wider flex items-center gap-1">
                  <UserCheck size={11} /> Rango Activo
                </span>
              )}
            </div>

            <p className="text-xs text-slate-300 font-sans leading-relaxed mb-6">
              Pensado para un seguimiento básico de saldos e ingresos recurrentes con acceso controlado a consultas de inteligencia artificial.
            </p>

            <div className="space-y-4 mb-8">
              {normalBenefits.map((b, idx) => (
                <div key={idx} className="bg-black/30 border border-[#ffffff03] p-3 rounded-xl flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-slate-200 block">{b.title}</span>
                    <span className="text-[10px] text-slate-500 font-sans">{b.desc}</span>
                  </div>
                  <span className="font-mono font-bold text-amber-400">{b.value}</span>
                </div>
              ))}
            </div>
          </div>

          {currentRank === 'VIP' ? (
            <button
              onClick={() => onSetUserRank('Normal')}
              className="w-full py-3 rounded-xl border border-amber-500/25 hover:border-amber-500/50 hover:bg-amber-500/5 text-amber-400 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              Volver a Rango Normal
            </button>
          ) : (
            <div className="p-3 text-center bg-amber-500/5 border border-amber-500/15 rounded-xl text-[11px] text-amber-400/80 font-mono">
              ✓ Estás utilizando las funciones básicas de la cuenta estándar
            </div>
          )}
        </div>

        {/* Tarjeta de Rango Premium (Estilo Cyberpunk de Alta Gama) */}
        <div className="flex flex-col gap-8">
          <PremiumPricingCard onUpgrade={handleVIPPayment} isLoading={isLoading} isPremium={currentRank === 'VIP'} />
          
          {/* Fair Use Policy link */}
          <div className="bg-[#0B0F19]/40 border border-[#ffffff05] rounded-[28px] p-4 text-center space-y-1">
            <p className="text-[11px] text-slate-500 font-sans">
              El Plan Premium está sujeto a la política de uso justo de tokens de IA para evitar abusos automatizados.
            </p>
            <button
              onClick={() => setIsTermsOpen(true)}
              className="text-[#00FF66] hover:underline font-bold text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 mx-auto cursor-pointer bg-transparent border-none py-1"
            >
              <Scale size={12} />
              Ver Términos y Condiciones Completos
            </button>
          </div>
        </div>

      </div>

      {/* Sello de seguridad */}
      <div className="p-6 bg-slate-950/40 border border-[#ffffff05] rounded-[28px] text-center flex flex-col items-center justify-center space-y-2">
        <div className="p-2 bg-[#ffffff05] text-slate-400 rounded-full">
          <ShieldCheck size={20} className="text-[#00FF66]" />
        </div>
        <h4 className="text-xs font-bold text-white font-sans">Privacidad y Protección ALMO AI de Datos</h4>
        <p className="text-[11px] text-[#8E8E93] max-w-lg leading-relaxed font-sans">
          Activar o desactivar tu Rango VIP no interfiere con tu base de datos de movimientos, activos o metas financieras guardada en Firebase Firestore. Todos tus datos permanecen cifrados bajo la seguridad del servidor de Google Cloud con acceso exclusivo por token OAuth.
        </p>
      </div>

      {/* Terms and Conditions Modal */}
      <TermsModal isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />

    </div>
  );
}
