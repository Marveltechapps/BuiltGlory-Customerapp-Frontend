import React, { useEffect, useState } from 'react';
import { groupIN } from '../../utils/format';
import { T, type TProps } from './T';

/** Animated numerals: counts from 0 to `to` with an ease-out cubic. */
export function useCountUp(to: number, dur = 1100): number {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf = 0;
    let t0 = 0;
    const tick = (t: number) => {
      if (!t0) t0 = t;
      const p = Math.min(1, (t - t0) / dur);
      setN(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to, dur]);
  return n;
}

export function CountUp({ to, dur = 1100, prefix = '', suffix = '', format, ...text }: { to: number; dur?: number; prefix?: string; suffix?: string; format?: (n: number) => string } & TProps) {
  const n = useCountUp(to, dur);
  const v = format ? format(n) : groupIN(Math.round(n));
  return <T num {...text}>{prefix}{v}{suffix}</T>;
}

/** Money that counts up, e.g. ₹ 82.5 L. */
export function MoneyUp({ value, decimals = 1, prefix = '₹ ', suffix = ' L', dur = 1200, ...text }: { value: number; decimals?: number; prefix?: string; suffix?: string; dur?: number } & TProps) {
  return <CountUp to={value} dur={dur} format={n => prefix + n.toFixed(decimals) + suffix} {...text} />;
}
