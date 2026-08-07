'use client';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  children: ReactNode;
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary: `
    background: var(--grad-brand);
    color: var(--text-on-accent);
    box-shadow: var(--shadow-sm);
    &:hover { box-shadow: var(--shadow-md); transform: translateY(-1px); }
    &:active { transform: translateY(0); box-shadow: var(--shadow-xs); }
  `,
  accent: `
    background: var(--grad-accent);
    color: var(--accent-ink);
    box-shadow: var(--shadow-sm);
    &:hover { box-shadow: var(--shadow-md); transform: translateY(-1px); }
    &:active { transform: translateY(0); box-shadow: var(--shadow-xs); }
  `,
  secondary: `
    background: var(--surface-3);
    color: var(--primary);
    &:hover { background: var(--border-subtle); }
  `,
  ghost: `
    background: transparent;
    color: var(--primary);
    border: 1.5px solid var(--border-subtle);
    &:hover { background: var(--eyebrow-bg); border-color: var(--primary-light); }
  `,
  danger: `
    background: var(--alert);
    color: var(--text-on-accent);
    &:hover { background: #c44435; }
  `,
};

const SIZES: Record<ButtonSize, string> = {
  sm: `min-height: 36px; padding: var(--sp-1) var(--sp-3); font-size: var(--text-xs);`,
  md: `min-height: var(--touch-target); padding: var(--sp-2) var(--sp-4); font-size: var(--text-sm);`,
  lg: `min-height: 52px; padding: var(--sp-3) var(--sp-6); font-size: var(--text-base);`,
};

export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  children,
  className = '',
  ...rest
}: ButtonProps) {
  return (
    <button className={`btn-base ${className}`} data-variant={variant} data-size={size} style={fullWidth ? { width: '100%' } : undefined} {...rest}>
      {children}
      <style jsx>{`
        .btn-base {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: var(--sp-2);
          font-family: var(--font-body);
          font-weight: 600;
          border-radius: var(--r-md);
          border: none;
          cursor: pointer;
          text-decoration: none;
          white-space: nowrap;
          transition: transform ${'var(--dur-fast)'} ${'var(--ease-out)'}, box-shadow ${'var(--dur-fast)'} ${'var(--ease-out)'}, background ${'var(--dur-fast)'} ${'var(--ease-out)'}, border-color ${'var(--dur-fast)'} ${'var(--ease-out)'};
          ${SIZES[size]}
        }
        :global([data-variant='primary']) { ${VARIANTS.primary} }
        :global([data-variant='accent']) { ${VARIANTS.accent} }
        :global([data-variant='secondary']) { ${VARIANTS.secondary} }
        :global([data-variant='ghost']) { ${VARIANTS.ghost} }
        :global([data-variant='danger']) { ${VARIANTS.danger} }
        .btn-base:disabled {
          opacity: 0.55;
          cursor: not-allowed;
          transform: none !important;
          box-shadow: none !important;
        }
        .btn-base:focus-visible {
          outline: 2.5px solid var(--border-focus);
          outline-offset: 2px;
        }
      `}</style>
    </button>
  );
}
