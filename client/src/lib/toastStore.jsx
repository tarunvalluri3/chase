import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

// One-at-a-time toast queue (DESIGN.md §7: bottom, above the nav, 3.2s,
// aria-live="polite"). A second showToast() call while one is visible
// queues rather than replacing it, so a rollback toast never clobbers a
// success toast that just fired.
const TOAST_DURATION_MS = 3200;

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const queueRef = useRef([]);
  const timerRef = useRef(null);

  const advance = useCallback(() => {
    const next = queueRef.current.shift();
    setToast(next ?? null);
    timerRef.current = next ? setTimeout(advance, TOAST_DURATION_MS) : null;
  }, []);

  const showToast = useCallback(
    (message) => {
      queueRef.current.push({ id: `${Date.now()}-${Math.random()}`, message });
      if (!timerRef.current) advance();
    },
    [advance],
  );

  useEffect(() => () => clearTimeout(timerRef.current), []);

  return <ToastContext.Provider value={{ toast, showToast }}>{children}</ToastContext.Provider>;
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
