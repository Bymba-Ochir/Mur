'use client';
import Link from 'next/link';
import styles from './Button.module.css';
import type { AriaAttributes, CSSProperties, MouseEventHandler, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type ButtonAs = 'button' | 'link' | 'anchor' | 'label';

export interface ButtonProps extends AriaAttributes {
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
  ...ariaProps
}: ButtonProps) {
  const cls = `btn-base ${styles.root} ${className}`.trim();
  const mergedStyle: CSSProperties | undefined = fullWidth ? { ...style, width: '100%' } : style;

  const handleClick: MouseEventHandler<HTMLElement> = (event) => {
    if (disabled) { event.preventDefault(); event.stopPropagation(); return; }
    onClick?.(event);
  };
  const shared = {
    ...ariaProps,
    className: cls,
    style: mergedStyle,
    onClick: handleClick,
    'data-variant': variant,
    'data-size': size,
    'aria-disabled': disabled || undefined,
    'aria-busy': ariaBusy,
    'aria-label': ariaLabel,
    id,
    title,
  };

  if ((as === 'link' || as === 'anchor') && disabled) {
    return <a {...shared} role="link" tabIndex={-1}>{children}</a>;
  }
  if (as === 'link' && href) {
    return (
      <Link href={href} {...shared}>
        {children}
      </Link>
    );
  }
  if (as === 'anchor' && href) {
    return (
      <a href={href} {...shared}>
        {children}
      </a>
    );
  }
  if (as === 'label') {
    return (
      <label htmlFor={disabled ? undefined : htmlFor} {...shared}>
        {children}
      </label>
    );
  }
  return (
    <button type={type} disabled={disabled} {...shared}>
      {children}
    </button>
  );
}
