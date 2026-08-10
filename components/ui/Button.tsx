'use client';
import Link from 'next/link';
import type { CSSProperties, MouseEventHandler, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type ButtonAs = 'button' | 'link' | 'anchor' | 'label';

export interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
  /** 'link' → Next.js <Link href>; 'anchor' → <a href>; 'label' → <label htmlFor>. Default: 'button'. */
  as?: ButtonAs;
  href?: string;
  htmlFor?: string;
  type?: 'button' | 'submit' | 'reset';
  onClick?: MouseEventHandler<HTMLElement>;
  disabled?: boolean;
  'aria-busy'?: boolean;
  'aria-label'?: string;
  id?: string;
  title?: string;
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
    background: linear-gradient(135deg, #7DD8F0, var(--found));
    color: #103B47;
    box-shadow: var(--shadow-sm);
    &:hover { background: linear-gradient(135deg, var(--found), var(--found-deep)); box-shadow: var(--shadow-md); transform: translateY(-1px); }
    &:active { transform: translateY(0); box-shadow: var(--shadow-xs); }
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
    &:hover { background: var(--alert-deep); }
  `,
};

const SIZES: Record<ButtonSize, string> = {
  sm: `min-height: 36px; padding: var(--sp-1) var(--sp-3); font-size: var(--text-xs);`,
  md: `min-height: var(--touch-target); padding: var(--sp-2) var(--sp-4); font-size: var(--text-sm);`,
  lg: `min-height: 52px; padding: var(--sp-3) var(--sp-6); font-size: var(--text-base);`,
};

const BUTTON_STYLES = (
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
      transition: transform var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out), background var(--dur-fast) var(--ease-out), border-color var(--dur-fast) var(--ease-out);
      ${SIZES.md}
    }
    :global([data-variant='primary']) { ${VARIANTS.primary} }
    :global([data-variant='accent']) { ${VARIANTS.accent} }
    :global([data-variant='secondary']) { ${VARIANTS.secondary} }
    :global([data-variant='ghost']) { ${VARIANTS.ghost} }
    :global([data-variant='danger']) { ${VARIANTS.danger} }
    :global([data-size='sm'].btn-base) { ${SIZES.sm} }
    :global([data-size='lg'].btn-base) { ${SIZES.lg} }
    :global(.btn-base:disabled) {
      opacity: 0.55;
      cursor: not-allowed;
      transform: none !important;
      box-shadow: none !important;
    }
    :global(.btn-base:focus-visible) {
      outline: 2.5px solid var(--border-focus);
      outline-offset: 2px;
    }
  `}</style>
);

export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  style,
  children,
  as = 'button',
  href,
  htmlFor,
  type = 'button',
  onClick,
  disabled = false,
  'aria-busy': ariaBusy,
  'aria-label': ariaLabel,
  id,
  title,
}: ButtonProps) {
  const cls = `btn-base ${className}`.trim();
  const mergedStyle: CSSProperties | undefined = fullWidth ? { ...style, width: '100%' } : style;

  const shared = {
    className: cls,
    style: mergedStyle,
    onClick,
    'data-variant': variant,
    'data-size': size,
    'aria-busy': ariaBusy,
    'aria-label': ariaLabel,
    id,
    title,
  };

  if (as === 'link' && href) {
    return (
      <Link href={href} {...shared}>
        {children}
        {BUTTON_STYLES}
      </Link>
    );
  }
  if (as === 'anchor' && href) {
    return (
      <a href={href} {...shared}>
        {children}
        {BUTTON_STYLES}
      </a>
    );
  }
  if (as === 'label') {
    return (
      <label htmlFor={htmlFor} {...shared}>
        {children}
        {BUTTON_STYLES}
      </label>
    );
  }
  return (
    <button type={type} disabled={disabled} {...shared}>
      {children}
      {BUTTON_STYLES}
    </button>
  );
}
