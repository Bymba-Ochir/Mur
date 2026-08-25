'use client';
import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';

interface FieldProps { label?: string; error?: string; hint?: string; id?: string; }

const WRAP = 'flex w-full flex-col gap-[var(--sp-1)]';
const LABEL = 'text-[length:var(--text-xs)] font-semibold text-[var(--primary)]';
const CONTROL = 'w-full min-h-[var(--touch-target)] rounded-[var(--r-md)] border-[1.5px] border-[var(--border-subtle)] bg-[var(--surface-2)] px-[var(--sp-3)] py-[var(--sp-2)] font-[family-name:var(--font-body)] text-[length:var(--text-base)] text-[var(--text-primary)] transition-[border-color,box-shadow] duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:border-[var(--text-secondary)] focus-visible:border-[var(--border-focus)] focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_18%,transparent)]';
const ERROR_CONTROL = 'border-[var(--alert)] focus-visible:shadow-[0_0_0_3px_color-mix(in_srgb,var(--alert)_18%,transparent)]';
const HINT = 'text-[length:var(--text-xs)] text-[var(--text-tertiary)]';
const ERROR = 'text-[length:var(--text-xs)] font-medium text-[var(--alert)]';

function FieldMeta({ id, error, hint }: { id?: string; error?: string; hint?: string }) {
  return <>{hint && !error && <span className={HINT} id={`${id}-hint`}>{hint}</span>}{error && <span className={ERROR} id={`${id}-error`} role="alert">{error}</span>}</>;
}

function describedBy(id?: string, error?: string, hint?: string) {
  return error ? `${id}-error` : hint ? `${id}-hint` : undefined;
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement>, FieldProps {}
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ label, error, hint, id, className = '', ...rest }, ref) {
  return <div className={WRAP}>{label && <label className={LABEL} htmlFor={id}>{label}</label>}<input id={id} ref={ref} className={`${CONTROL} ${error ? ERROR_CONTROL : ''} ${className}`} aria-invalid={!!error} aria-describedby={describedBy(id, error, hint)} {...rest} /><FieldMeta id={id} error={error} hint={hint} /></div>;
});

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement>, FieldProps {}
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select({ label, error, hint, id, className = '', children, ...rest }, ref) {
  return <div className={WRAP}>{label && <label className={LABEL} htmlFor={id}>{label}</label>}<select id={id} ref={ref} className={`${CONTROL} ${error ? ERROR_CONTROL : ''} ${className}`} aria-invalid={!!error} aria-describedby={describedBy(id, error, hint)} {...rest}>{children}</select><FieldMeta id={id} error={error} hint={hint} /></div>;
});

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement>, FieldProps {}
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea({ label, error, hint, id, className = '', ...rest }, ref) {
  return <div className={WRAP}>{label && <label className={LABEL} htmlFor={id}>{label}</label>}<textarea id={id} ref={ref} className={`${CONTROL} min-h-[90px] resize-y ${error ? ERROR_CONTROL : ''} ${className}`} aria-invalid={!!error} aria-describedby={describedBy(id, error, hint)} {...rest} /><FieldMeta id={id} error={error} hint={hint} /></div>;
});
