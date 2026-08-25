'use client';
import { createContext, useCallback, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { ShowToast, ToastType } from '../lib/types';

const ToastContext = createContext<ShowToast | null>(null);

let idCounter = 0;

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback<ShowToast>((message, type = 'info') => {
    const id = ++idCounter;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  }, []);

  const dismiss = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div className="pointer-events-none fixed bottom-[calc(76px+var(--safe-bottom))] left-1/2 z-[300] flex w-[92%] max-w-[380px] -translate-x-1/2 flex-col gap-[var(--sp-2)]" role="status" aria-live="polite" aria-atomic="false">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex cursor-pointer items-center gap-[var(--sp-2)] rounded-[var(--r-sm)] px-[var(--sp-4)] py-[var(--sp-3)] text-[length:var(--text-sm)] text-[var(--text-on-accent)] shadow-[var(--shadow-md)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--text-on-accent)] ${t.type === 'error' ? 'bg-[var(--alert)] animate-[toast-slide-up_250ms_ease-out]' : t.type === 'success' ? 'bg-[var(--toast-success-bg)] animate-[toast-slide-bounce_400ms_cubic-bezier(0.34,1.56,0.64,1)]' : 'bg-[var(--brand)] animate-[toast-slide-up_250ms_ease-out]'}`}
            onClick={() => dismiss(t.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') dismiss(t.id); }}
            aria-label="Мэдэгдлийг хаах"
          >
            <span className="inline-flex shrink-0" aria-hidden="true">
              {t.type === 'error' ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" focusable="false">
                  <circle cx="12" cy="12" r="9" /><path d="M15 9l-6 6M9 9l6 6" />
                </svg>
              ) : t.type === 'success' ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" focusable="false">
                  <circle cx="12" cy="12" r="9" /><path d="M8.5 12.5l2.5 2.5 4.5-5" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" focusable="false">
                  <circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" />
                </svg>
              )}
            </span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast нь ToastProvider дотор ашиглагдах ёстой');
  return ctx;
}
