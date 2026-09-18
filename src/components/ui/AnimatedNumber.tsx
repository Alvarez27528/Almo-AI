import { useEffect, useRef, useState } from 'react';

/**
 * Smoothly counts from the previous value to the new one (Apple Wallet style).
 * Respects prefers-reduced-motion.
 */
export default function AnimatedNumber({
  value,
  format,
  duration = 900,
}: {
  value: number;
  format: (v: number) => string;
  duration?: number;
}) {
  const [display, setDisplay] = useState(value);
  const currentRef = useRef(value);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { setDisplay(value); currentRef.current = value; return; }

    const from = currentRef.current;
    const to = value;
    if (from === to) return;
    const start = performance.now();
    const ease = (t: number) => 1 - Math.pow(1 - t, 4); // easeOutQuart

    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const v = from + (to - from) * ease(p);
      currentRef.current = v;
      setDisplay(v);
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [value, duration]);

  return <span className="tabular-nums">{format(display)}</span>;
}
