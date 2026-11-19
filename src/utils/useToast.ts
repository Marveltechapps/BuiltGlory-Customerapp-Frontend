import { useCallback, useEffect, useRef, useState } from 'react';

/** Toast message that clears itself after `ms`. Returns [message, show]. */
export function useToast(ms = 3000): [string, (msg: string) => void] {
  const [toast, setToast] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const show = useCallback((msg: string) => {
    setToast(msg);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(''), ms);
  }, [ms]);
  return [toast, show];
}
