import React, { useState, useEffect } from 'react';
import { Lock, Unlock, X, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

interface PinLockProps {
  onUnlock: () => void;
  onCancel: () => void;
  savedPin: string;
}

export function PinLock({ onUnlock, onCancel, savedPin }: PinLockProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (pin.length === 4) {
      if (pin === savedPin) {
        onUnlock();
      } else {
        setError(true);
        setTimeout(() => {
          setPin('');
          setError(false);
        }, 500);
      }
    }
  }, [pin, savedPin, onUnlock]);

  const handleKeyPress = (num: string) => {
    if (pin.length < 4 && !error) {
      setPin(prev => prev + num);
    }
  };

  const handleBackspace = () => {
    if (pin.length > 0 && !error) {
      setPin(prev => prev.slice(0, -1));
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl"
    >
      <div className="absolute top-4 right-4 z-50">
        <button onClick={onCancel} className="p-3 bg-white/5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-all">
          <X size={24} />
        </button>
      </div>

      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="w-full max-w-sm p-8"
      >
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 rounded-full bg-[#121214] border border-[#ffffff10] flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(0,255,102,0.1)]">
            <ShieldAlert size={28} className="text-[#00FF66]" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight mb-2">Área Protegida</h2>
          <p className="text-sm text-slate-400">Introduce tu PIN de seguridad para continuar.</p>
        </div>

        <div className={`flex justify-center gap-4 mb-10 ${error ? 'animate-shake' : ''}`}>
          {[0, 1, 2, 3].map((index) => (
            <div 
              key={index} 
              className={`w-4 h-4 rounded-full transition-all duration-300 ${
                pin.length > index 
                  ? 'bg-[#00FF66] shadow-[0_0_10px_rgba(0,255,102,0.5)]' 
                  : 'bg-[#ffffff10]'
              }`}
            />
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4 max-w-[280px] mx-auto">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleKeyPress(num.toString())}
              className="h-16 rounded-2xl bg-[#121214] border border-[#ffffff05] text-2xl font-mono text-white hover:bg-[#1a1a1c] hover:border-white/10 active:scale-95 transition-all flex items-center justify-center shadow-lg"
            >
              {num}
            </button>
          ))}
          <div />
          <button
            onClick={() => handleKeyPress('0')}
            className="h-16 rounded-2xl bg-[#121214] border border-[#ffffff05] text-2xl font-mono text-white hover:bg-[#1a1a1c] hover:border-white/10 active:scale-95 transition-all flex items-center justify-center shadow-lg"
          >
            0
          </button>
          <button
            onClick={handleBackspace}
            className="h-16 rounded-2xl bg-[#121214]/50 border border-[#ffffff05] text-white/50 hover:bg-[#1a1a1c] hover:text-white/80 active:scale-95 transition-all flex items-center justify-center"
          >
            <span className="sr-only">Borrar</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Z"/><path d="m18 9-6 6"/><path d="m12 9 6 6"/></svg>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
