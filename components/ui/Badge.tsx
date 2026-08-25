'use client';
import type { HTMLAttributes, ReactNode } from 'react';

export type BadgeTone = 'default' | 'primary' | 'accent' | 'success' | 'alert' | 'neutral';
interface BadgeProps extends HTMLAttributes<HTMLSpanElement> { tone?: BadgeTone; children: ReactNode; }

const TONES: Record<BadgeTone, string> = {
  default: 'bg-[var(--surface-3)] text-[var(--primary)]',
  primary: 'bg-[var(--primary)] text-[var(--text-on-accent)]',
  accent: 'bg-[var(--accent)] text-[var(--accent-ink)]',
  success: 'bg-[var(--success)] text-[var(--text-on-accent)]',
  alert: 'bg-[var(--alert)] text-[var(--text-on-accent)]',
  neutral: 'bg-[var(--border-subtle)] text-[var(--text-secondary)]',
};

export default function Badge({ tone = 'default', children, className = '', ...rest }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-[var(--sp-1)] whitespace-nowrap rounded-[var(--r-pill)] px-2.5 py-1 font-[family-name:var(--font-mono)] text-[length:var(--text-2xs)] font-semibold tracking-[0.02em] ${TONES[tone]} ${className}`} data-tone={tone} {...rest}>
      {children}
    </span>
  );
}
