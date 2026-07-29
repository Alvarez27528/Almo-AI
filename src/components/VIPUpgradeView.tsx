/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { Zap, ShieldCheck, Cpu, ChevronRight, Lock } from 'lucide-react';

interface VIPUpgradeViewProps {
  featureName: string;
  featureDescription: string;
  onUpgrade: () => void;
}

export default function VIPUpgradeView({ featureName, featureDescription, onUpgrade }: VIPUpgradeViewProps) {
  return (
    <div className="min-h-[480px] bg-[#0B0F19] border border-[#ffffff10] rounded-3xl p-6 sm:p-10 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-2xl">
      {/* Absolute Ambient Background Glows */}
      <div className="absolute -top-24 -left-24 w-80 h-80 bg-[#00FF66]/5 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-[#10B981]/5 blur-[100px] rounded-full pointer-events-none" />

      {/* Futuristic Shield Icon with Lock */}
      <div className="relative mb-6">
        <div className="p-5 rounded-2xl bg-[#00FF66]/10 text-[#00FF66] shadow-[0_0_20px_rgba(0,255,102,0.15)] flex items-center justify-center border border-[#00FF66]/20">
          <Lock size={32} />
        </div>
        <div className="absolute -bottom-2 -right-2 p-1.5 rounded-lg bg-black border border-[#ffffff10] text-[#00FF66] animate-pulse">
          <Zap size={14} className="fill-[#00FF66]" />
        </div>
      </div>

      <span className="text-[10px] font-mono text-[#00FF66] uppercase tracking-widest bg-[#00FF66]/10 px-3 py-1 rounded-full border border-[#00FF66]/20 mb-4 inline-block">
        MÓDULO EXCLUSIVO VIP
      </span>

      <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-2 max-w-lg">
        Desbloquea {featureName}
      </h2>
      
      <p className="text-xs sm:text-sm text-slate-400 font-sans max-w-md leading-relaxed mb-8">
        {featureDescription}
      </p>

      {/* Comparison Table / Specs */}
      <div className="w-full max-w-md bg-slate-950/50 rounded-2xl p-5 border border-[#ffffff05] space-y-3 mb-8 text-left">
        <span className="text-[9px] text-[#8E8E93] font-mono block uppercase tracking-wider mb-2">Tabla de Atributos:</span>
        
        <div className="flex justify-between items-center text-xs pb-2.5 border-b border-[#ffffff05]">
          <span className="text-slate-400">Rango Normal (Tu estado)</span>
          <span className="text-amber-400 font-bold font-mono">Restringido</span>
        </div>
        
        <div className="flex justify-between items-center text-xs pt-1">
          <span className="text-slate-300 font-semibold">Rango VIP (Actualización gratuita)</span>
          <span className="text-[#00FF66] font-bold flex items-center gap-1 font-mono">
            <Zap size={11} className="fill-[#00FF66]" /> ACCESO TOTAL
          </span>
        </div>
      </div>

      {/* Call to action button */}
      <button
        onClick={onUpgrade}
        className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#00FF66] to-[#10B981] text-black font-extrabold text-xs sm:text-sm tracking-wide uppercase shadow-[0_0_20px_rgba(0,255,102,0.25)] hover:shadow-[0_0_35px_rgba(0,255,102,0.45)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer"
      >
        <Zap size={14} className="fill-black" /> Activar Rango VIP Gratis
        <ChevronRight size={14} className="stroke-[2.5]" />
      </button>

      {/* Safety subtitle */}
      <p className="text-[10px] text-[#8E8E93] mt-4 font-mono flex items-center gap-1">
        <ShieldCheck size={12} className="text-[#00FF66]" />
        Tus datos de ahorro y movimientos de Firebase se conservarán intactos
      </p>
    </div>
  );
}
