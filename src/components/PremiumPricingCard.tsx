import { useState } from 'react';
import { motion } from 'motion/react';
import { Zap, CheckCircle2, Ticket } from 'lucide-react';

interface PremiumPricingCardProps {
  onUpgrade: (code?: string) => void;
  isLoading: boolean;
  isPremium?: boolean;
}

export default function PremiumPricingCard({ onUpgrade, isLoading, isPremium }: PremiumPricingCardProps) {
  const [discountCode, setDiscountCode] = useState('');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#0f172a] border border-cyan-500/30 p-8 rounded-3xl shadow-2xl relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-4">
        <span className="bg-cyan-500/20 text-cyan-400 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Recomendado</span>
      </div>
      
      <h2 className="text-2xl font-bold text-white mb-2">Plan Premium</h2>
      <p className="text-slate-400 mb-6 text-sm">Todo lo que necesitas para dominar tus finanzas.</p>
      
      <div className="flex items-baseline gap-1 mb-6">
        <span className="text-4xl font-extrabold text-white">19 €</span>
        <span className="text-slate-500">/ mes</span>
      </div>
      
      <ul className="space-y-4 mb-8">
        {[
          'Uso ilimitado* (Fair Use)',
          'Chat prioritario más rápido',
          'Acceso a herramientas avanzadas',
          'Historial de chat permanente'
        ].map((feature, i) => (
          <li key={i} className="flex items-center gap-3 text-slate-300">
            <CheckCircle2 size={18} className="text-[#00FF66]" />
            <span className="text-sm">{feature}</span>
          </li>
        ))}
      </ul>

      <div className="mb-6">
        <div className="relative">
          <Ticket size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder={isPremium ? "Ya eres usuario Premium" : "Código de descuento"}
            value={discountCode}
            onChange={(e) => setDiscountCode(e.target.value)}
            disabled={isLoading || isPremium}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-9 pr-4 text-xs text-white placeholder:text-slate-600 focus:border-cyan-500/50 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
      </div>
      
      <button
        onClick={() => {
          if (!isPremium) {
            onUpgrade(discountCode);
          }
        }}
        disabled={isLoading || isPremium}
        className="w-full py-4 rounded-xl bg-gradient-to-r from-[#00FF66] to-[#10B981] text-black font-extrabold text-sm uppercase tracking-wider enabled:hover:scale-[1.02] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isPremium ? (
          <CheckCircle2 size={16} className="text-black" />
        ) : (
          <Zap size={16} className="fill-black" />
        )}
        {isLoading 
          ? 'Procesando...' 
          : isPremium 
            ? 'Plan Premium Activo ✓' 
            : discountCode.trim() === 'Golfo2805' 
              ? 'Canjear Código Gratis' 
              : 'Activar Plan Premium'}
      </button>
      
      <p className="mt-4 text-[10px] text-slate-500 text-center">
        *Sujeto a Política de Uso Justo (3M tokens/mes).
      </p>
    </motion.div>
  );
}
