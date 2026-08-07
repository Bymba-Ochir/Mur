'use client';
import { useEffect, useRef, type ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  labelledById?: string;
  children: ReactNode;
  width?: 'sm' | 'md' | 'lg';
}

const WIDTHS = {
  sm: 'max-width: 320px;',
  md: 'max-width: 420px;',
  lg: 'max-width: 560px;',
};

export default function Modal({ open, onClose, title, labelledById, children, width = 'md' }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Focus trap: focus first focusable on open
  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    const focusable = panel?.querySelector<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    focusable?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div className="overlay" onClick={onClose}>
      <div
        ref={panelRef}
        className="modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledById}
        onClick={(e) => e.stopPropagation()}
      >
        {title && <h2 id={labelledById} className="modal-title">{title}</h2>}
        <button className="close" onClick={onClose} aria-label="Хаах">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
        {children}
        <style jsx>{`
          .overlay {
            position: fixed; inset: 0; background: var(--overlay);
            display: flex; align-items: center; justify-content: center;
            z-index: 300; padding: 16px;
            animation: fadeIn ${'var(--dur-fast)'} ${'var(--ease-out)'};
          }
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          .modal-panel {
            position: relative;
            background: var(--surface-2);
            border-radius: var(--r-lg);
            padding: var(--sp-5);
            color: var(--text-primary);
            max-height: 90vh; overflow-y: auto;
            ${WIDTHS[width]}
            animation: slideDown ${'var(--dur-base)'} ${'var(--ease-out)'};
          }
          @keyframes slideDown {
            from { opacity: 0; transform: translateY(-16px) scale(0.97); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
          .modal-title { font-family: var(--font-display); font-size: var(--text-lg); color: var(--primary); margin-bottom: var(--sp-3); padding-right: 32px; }
          .close {
            position: absolute; top: 12px; right: 12px;
            width: var(--touch-target-sm); height: var(--touch-target-sm);
            display: flex; align-items: center; justify-content: center;
            background: none; border: none; cursor: pointer;
            color: var(--text-secondary); border-radius: var(--r-sm);
          }
          .close:hover { background: var(--surface-3); }
          .close:focus-visible { outline: 2px solid var(--border-focus); outline-offset: 2px; }
        `}</style>
      </div>
    </div>
  );
}
