'use client';
import Link from 'next/link';
import type { CSSProperties, MouseEventHandler, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type ButtonAs = 'button' | 'link' | 'anchor' | 'label';

export interface ButtonProps {
  variant?: ButtonVariant; size?: ButtonSize; fullWidth?: boolean; className?: string;
  style?: CSSProperties; children: ReactNode; as?: ButtonAs; href?: string; htmlFor?: string;
  type?: 'button' | 'submit' | 'reset'; onClick?: MouseEventHandler<HTMLElement>;
  disabled?: boolean; 'aria-busy'?: boolean; 'aria-label'?: string; id?: string; title?: string;
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-[image:var(--grad-brand)] text-[var(--text-on-accent)] shadow-[var(--shadow-sm)] hover:-translate-y-px hover:shadow-[var(--shadow-md)] active:translate-y-0 active:shadow-[var(--shadow-xs)]',
  accent: 'bg-[image:var(--grad-accent)] text-[var(--accent-ink)] shadow-[var(--shadow-sm)] hover:-translate-y-px hover:shadow-[var(--shadow-md)] active:translate-y-0 active:shadow-[var(--shadow-xs)]',
  secondary: 'bg-[linear-gradient(135deg,#7DD8F0,var(--found))] text-[#103B47] shadow-[var(--shadow-sm)] hover:-translate-y-px hover:bg-[linear-gradient(135deg,var(--found),var(--found-deep))] hover:shadow-[var(--shadow-md)] active:translate-y-0 active:shadow-[var(--shadow-xs)]',
  ghost: 'border-[1.5px] border-[var(--border-subtle)] bg-transparent text-[var(--primary)] hover:border-[var(--primary-light)] hover:bg-[var(--eyebrow-bg)]',
  danger: 'bg-[var(--alert)] text-[var(--text-on-accent)] hover:bg-[var(--alert-deep)]',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'min-h-9 px-[var(--sp-3)] py-[var(--sp-1)] text-[length:var(--text-xs)]',
  md: 'min-h-[var(--touch-target)] px-[var(--sp-4)] py-[var(--sp-2)] text-[length:var(--text-sm)]',
  lg: 'min-h-[52px] px-[var(--sp-6)] py-[var(--sp-3)] text-[length:var(--text-base)]',
};

export default function Button({ variant = 'primary', size = 'md', fullWidth = false, className = '', style, children, as = 'button', href, htmlFor, type = 'button', onClick, disabled = false, 'aria-busy': ariaBusy, 'aria-label': ariaLabel, id, title }: ButtonProps) {
  const classNames = `btn-base inline-flex cursor-pointer items-center justify-center gap-[var(--sp-2)] whitespace-nowrap rounded-[var(--r-md)] border-0 font-[family-name:var(--font-body)] font-semibold no-underline transition-[transform,box-shadow,background,border-color] duration-[var(--dur-fast)] ease-[var(--ease-out)] focus-visible:outline-[2.5px] focus-visible:outline-offset-2 focus-visible:outline-[var(--border-focus)] disabled:cursor-not-allowed disabled:opacity-55 disabled:shadow-none disabled:transform-none ${VARIANTS[variant]} ${SIZES[size]} ${fullWidth ? 'w-full' : ''} ${className}`.trim();
  const shared = { className: classNames, style, onClick, 'data-variant': variant, 'data-size': size, 'aria-busy': ariaBusy, 'aria-label': ariaLabel, id, title };

  if (as === 'link' && href) return <Link href={href} {...shared}>{children}</Link>;
  if (as === 'anchor' && href) return <a href={href} {...shared}>{children}</a>;
  if (as === 'label') return <label htmlFor={htmlFor} {...shared}>{children}</label>;
  return <button type={type} disabled={disabled} {...shared}>{children}</button>;
}
