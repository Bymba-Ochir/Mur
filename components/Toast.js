'use client';
import { createContext, useCallback, useContext, useState } from 'react';

const ToastContext = createContext(null);

let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info') => {
    const id = ++idCounter;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  }, []);

  const dismiss = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

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
            {t.type === 'error' ? '⚠️' : t.type === 'success' ? '✅' : 'ℹ️'} {t.message}
          </div>
        ))}
      </div>

      <style jsx>{`
        .toast-stack {
          position: fixed; bottom: 90px; left: 50%; transform: translateX(-50%);
          z-index: 300; display: flex; flex-direction: column; gap: 8px;
          width: 92%; max-width: 380px; pointer-events: none;
        }
        .toast {
          background: var(--ink); color: #fff; padding: 12px 16px; border-radius: var(--r-sm);
          font-size: 13.5px; box-shadow: 0 6px 20px rgba(0,0,0,0.2); cursor: pointer;
          pointer-events: auto; animation: slideUp 0.25s ease-out;
        }
        .toast:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
        .toast-error { background: var(--alert); }
        .toast-success { background: var(--success-text); animation: slideUpBounce 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
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
