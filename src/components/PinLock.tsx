import { useState, useEffect, useCallback, useRef } from 'react';
import { X, ShieldCheck, Delete, LockKeyhole } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { verifyPin, getPinLock, registerPinFailure, clearPinLock } from '../utils/pin';

interface PinLockProps {
  onUnlock: () => void;
  onCancel: () => void;
  savedPin: string;
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

export function PinLock({ onUnlock, onCancel, savedPin }: PinLockProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);
  const [lockedUntil, setLockedUntil] = useState<number>(() => getPinLock().until);
  const [now, setNow] = useState(Date.now());
  const checking = useRef(false);

  const isLocked = lockedUntil > now;
  const secondsLeft = Math.max(0, Math.ceil((lockedUntil - now) / 1000));

  // Tick the countdown while locked
  useEffect(() => {
    if (!isLocked) return;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [isLocked]);

  // Validate as soon as we have 4 digits
  useEffect(() => {
    if (pin.length !== 4 || checking.current) return;
    checking.current = true;
    (async () => {
      const ok = await verifyPin(pin, savedPin);
      if (ok) {
        clearPinLock();
        setSuccess(true);
        if (navigator.vibrate) navigator.vibrate(10);
        setTimeout(onUnlock, 380);
      } else {
        const st = registerPinFailure();
        setLockedUntil(st.until);
        setError(true);
        if (navigator.vibrate) navigator.vibrate([40, 30, 40]);
        setTimeout(() => {
          setPin('');
          setError(false);
          checking.current = false;
        }, 520);
      }
    })();
  }, [pin, savedPin, onUnlock]);

  const press = useCallback((d: string) => {
    if (isLocked || error || success) return;
    setPin(p => (p.length < 4 ? p + d : p));
  }, [isLocked, error, success]);

  const backspace = useCallback(() => {
    if (error || success) return;
    setPin(p => p.slice(0, -1));
  }, [error, success]);

  // Physical keyboard support
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key)) press(e.key);
      else if (e.key === 'Backspace') backspace();
      else if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [press, backspace, onCancel]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-2xl"
      role="dialog"
      aria-modal="true"
      aria-label="Área protegida por PIN"
    >
      <button
        onClick={onCancel}
        aria-label="Cancelar"
        className="absolute top-5 right-5 p-2.5 rounded-full bg-white/5 text-white/60 hover:text-white hover:bg-white/10"
      >
        <X size={20} />
      </button>

      <motion.div
        initial={{ scale: 0.94, y: 16, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        className="w-full max-w-sm px-8"
      >
        <div className="text-center mb-10">
          <motion.div
            animate={success ? { scale: [1, 1.15, 1] } : {}}
            className={`mx-auto w-16 h-16 rounded-[22px] flex items-center justify-center mb-6 transition-colors duration-500 ${
              success
                ? 'bg-[#00FF66] text-black shadow-[0_0_40px_rgba(0,255,102,0.45)]'
                : 'bg-[#121214] border border-white/8 text-[#F5F5F7]'
            }`}
          >
            {success ? <ShieldCheck size={28} strokeWidth={2.4} /> : <LockKeyhole size={26} strokeWidth={1.8} />}
          </motion.div>
          <h2 className="text-[26px] font-semibold text-white tracking-[-0.02em] mb-1.5">
            {success ? 'Desbloqueado' : 'Área protegida'}
          </h2>
          <p className="text-[13px] text-[#8E8E93]">
            {isLocked
              ? `Demasiados intentos. Espera ${secondsLeft}s.`
              : success
              ? 'Acceso concedido.'
              : 'Introduce tu PIN de 4 dígitos.'}
          </p>
        </div>

        {/* Dots */}
        <div className={`flex justify-center gap-5 mb-12 ${error ? 'animate-shake' : ''}`}>
          {[0, 1, 2, 3].map(i => {
            const filled = pin.length > i;
            return (
              <motion.div
                key={i}
                animate={{ scale: filled ? 1.15 : 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                className={`w-3.5 h-3.5 rounded-full transition-colors duration-200 ${
                  error
                    ? 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.6)]'
                    : success
                    ? 'bg-[#00FF66] shadow-[0_0_12px_rgba(0,255,102,0.6)]'
                    : filled
                    ? 'bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]'
                    : 'bg-white/10'
                }`}
              />
            );
          })}
        </div>

        {/* Keypad */}
        <div className={`grid grid-cols-3 gap-3.5 max-w-[264px] mx-auto transition-opacity ${isLocked ? 'opacity-30 pointer-events-none' : ''}`}>
          {KEYS.map(k => (
            <Key key={k} onPress={() => press(k)}>{k}</Key>
          ))}
          <div />
          <Key onPress={() => press('0')}>0</Key>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={backspace}
            aria-label="Borrar"
            className="h-[72px] rounded-full text-white/50 hover:text-white/90 hover:bg-white/5 flex items-center justify-center"
          >
            <Delete size={22} />
          </motion.button>
        </div>

        <AnimatePresence>
          {isLocked && (
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-8 text-center text-[11px] font-mono text-amber-400/90 uppercase tracking-widest"
            >
              Bloqueo temporal de seguridad
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

function Key({ children, onPress }: { children: React.ReactNode; onPress: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.88, backgroundColor: 'rgba(255,255,255,0.18)' }}
      transition={{ type: 'spring', stiffness: 600, damping: 30 }}
      onClick={onPress}
      className="h-[72px] rounded-full bg-white/[0.06] text-[28px] font-light text-white hover:bg-white/10 flex items-center justify-center select-none"
    >
      {children}
    </motion.button>
  );
}
