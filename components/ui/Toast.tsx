'use client';
import type { ReactNode } from 'react';

export type ToastTone = 'success' | 'error' | 'info';

interface ToastProps {
  tone?: ToastTone;
  children: ReactNode;
}

const TONES: Record<ToastTone, string> = {
  success: `background: var(--toast-success-bg);`,
  error: `background: var(--alert);`,
  info: `background: var(--primary);`,
};

export default function Toast({ tone = 'success', children }: ToastProps) {
  return (
    <div className="toast" data-tone={tone} role="status">
      {tone === 'success' && (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
          <circle cx="12" cy="12" r="9" /><path d="M8.5 12.5l2.5 2.5 4.5-5" />
        </svg>
      )}
      {tone === 'error' && (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
          <circle cx="12" cy="12" r="9" /><path d="M12 7v6M12 16.5v.5" />
        </svg>
      )}
      {tone === 'info' && (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
          <circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8v.5" />
        </svg>
      )}
      <span>{children}</span>
      <style jsx>{`
        .toast {
          display: inline-flex;
          align-items: center;
          gap: var(--sp-2);
          color: var(--text-on-accent);
          font-size: var(--text-sm);
          font-weight: 500;
          padding: var(--sp-3) var(--sp-4);
          border-radius: var(--r-md);
          box-shadow: var(--shadow-lg);
          max-width: 90vw;
        }
        :global([data-tone='success']) { ${TONES.success} }
        :global([data-tone='error']) { ${TONES.error} }
        :global([data-tone='info']) { ${TONES.info} }
      `}</style>
    </div>
  );
}
