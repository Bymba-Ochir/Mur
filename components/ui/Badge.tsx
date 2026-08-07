'use client';
import type { ReactNode } from 'react';

export type BadgeTone = 'default' | 'primary' | 'accent' | 'success' | 'alert' | 'neutral';

interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
  [key: string]: unknown;
}

const TONES: Record<BadgeTone, string> = {
  default: `background: var(--surface-3); color: var(--primary);`,
  primary: `background: var(--primary); color: #fff;`,
  accent: `background: var(--accent); color: var(--accent-ink);`,
  success: `background: var(--success); color: #fff;`,
  alert: `background: var(--alert); color: #fff;`,
  neutral: `background: var(--border-subtle); color: var(--text-secondary);`,
};

export default function Badge({ tone = 'default', children, className = '', ...rest }: BadgeProps) {
  return (
    <span className={`badge ${className}`} data-tone={tone} {...rest}>
      {children}
      <style jsx>{`
        .badge {
          display: inline-flex;
          align-items: center;
          gap: var(--sp-1);
          font-family: var(--font-mono);
          font-size: var(--text-2xs);
          font-weight: 600;
          letter-spacing: 0.02em;
          padding: 4px 10px;
          border-radius: var(--r-pill);
          white-space: nowrap;
        }
        :global([data-tone='default']) { ${TONES.default} }
        :global([data-tone='primary']) { ${TONES.primary} }
        :global([data-tone='accent']) { ${TONES.accent} }
        :global([data-tone='success']) { ${TONES.success} }
        :global([data-tone='alert']) { ${TONES.alert} }
        :global([data-tone='neutral']) { ${TONES.neutral} }
      `}</style>
    </span>
  );
}
