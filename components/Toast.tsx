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
      <div className="toast-stack" role="status" aria-live="polite" aria-atomic="false">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast toast-${t.type}`}
            onClick={() => dismiss(t.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') dismiss(t.id); }}
            aria-label="Мэдэгдлийг хаах"
          >
            <span className="toast-icon" aria-hidden="true">
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

      <style jsx>{`
        .toast-stack {
          position: fixed; bottom: calc(76px + var(--safe-bottom)); left: 50%; transform: translateX(-50%);
          z-index: 300; display: flex; flex-direction: column; gap: var(--sp-2);
          width: 92%; max-width: 380px; pointer-events: none;
        }
        .toast {
          display: flex; align-items: center; gap: var(--sp-2);
          background: var(--ink); color: #fff; padding: var(--sp-3) var(--sp-4); border-radius: var(--r-sm);
          font-size: var(--text-sm); box-shadow: var(--shadow-md); cursor: pointer;
          pointer-events: auto; animation: slideUp 0.25s ease-out;
        }
        .toast-icon { display: inline-flex; flex-shrink: 0; }
        .toast:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
        .toast-error { background: var(--alert); }
        .toast-success { background: var(--toast-success-bg); animation: slideUpBounce 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .toast-info { background: var(--brand); }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUpBounce {
          0% { opacity: 0; transform: translateY(14px) scale(0.9); }
          70% { opacity: 1; transform: translateY(-2px) scale(1.02); }
          100% { transform: translateY(0) scale(1); }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast нь ToastProvider дотор ашиглагдах ёстой');
  return ctx;
}
