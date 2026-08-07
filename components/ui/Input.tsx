'use client';
import { forwardRef, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';

interface FieldProps {
  label?: string;
  error?: string;
  hint?: string;
  id?: string;
}

/* ── Text Input ── */
export interface InputProps extends InputHTMLAttributes<HTMLInputElement>, FieldProps {}
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, id, className = '', ...rest },
  ref,
) {
  return (
    <div className="field-wrap">
      {label && <label htmlFor={id}>{label}</label>}
      <input id={id} ref={ref} className={`field-base ${error ? 'has-error' : ''} ${className}`} aria-invalid={!!error} aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined} {...rest} />
      {hint && !error && <span className="hint" id={`${id}-hint`}>{hint}</span>}
      {error && <span className="error" id={`${id}-error`} role="alert">{error}</span>}
      <style jsx>{`
        .field-wrap { display: flex; flex-direction: column; gap: var(--sp-1); width: 100%; }
        label { font-size: var(--text-xs); font-weight: 600; color: var(--primary); }
        .field-base {
          width: 100%; min-height: var(--touch-target);
          padding: var(--sp-2) var(--sp-3);
          font-family: var(--font-body); font-size: var(--text-base);
          color: var(--text-primary); background: var(--surface-2);
          border: 1.5px solid var(--border-subtle); border-radius: var(--r-md);
          transition: border-color ${'var(--dur-fast)'} ${'var(--ease-out)'}, box-shadow ${'var(--dur-fast)'} ${'var(--ease-out)'};
        }
        .field-base:hover { border-color: var(--text-secondary); }
        .field-base:focus-visible {
          outline: none;
          border-color: var(--border-focus);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 18%, transparent);
        }
        .field-base.has-error { border-color: var(--alert); }
        .field-base.has-error:focus-visible { box-shadow: 0 0 0 3px color-mix(in srgb, var(--alert) 18%, transparent); }
        .hint { font-size: var(--text-xs); color: var(--text-tertiary); }
        .error { font-size: var(--text-xs); color: var(--alert); font-weight: 500; }
      `}</style>
    </div>
  );
});

/* ── Select ── */
export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement>, FieldProps {}
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, hint, id, className = '', children, ...rest },
  ref,
) {
  return (
    <div className="field-wrap">
      {label && <label htmlFor={id}>{label}</label>}
      <select id={id} ref={ref} className={`field-base ${error ? 'has-error' : ''} ${className}`} aria-invalid={!!error} aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined} {...rest}>
        {children}
      </select>
      {hint && !error && <span className="hint" id={`${id}-hint`}>{hint}</span>}
      {error && <span className="error" id={`${id}-error`} role="alert">{error}</span>}
      <style jsx>{`
        .field-wrap { display: flex; flex-direction: column; gap: var(--sp-1); width: 100%; }
        label { font-size: var(--text-xs); font-weight: 600; color: var(--primary); }
        .field-base {
          width: 100%; min-height: var(--touch-target);
          padding: var(--sp-2) var(--sp-3);
          font-family: var(--font-body); font-size: var(--text-base);
          color: var(--text-primary); background: var(--surface-2);
          border: 1.5px solid var(--border-subtle); border-radius: var(--r-md);
          transition: border-color ${'var(--dur-fast)'} ${'var(--ease-out)'}, box-shadow ${'var(--dur-fast)'} ${'var(--ease-out)'};
        }
        .field-base:hover { border-color: var(--text-secondary); }
        .field-base:focus-visible {
          outline: none; border-color: var(--border-focus);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 18%, transparent);
        }
        .field-base.has-error { border-color: var(--alert); }
        .hint { font-size: var(--text-xs); color: var(--text-tertiary); }
        .error { font-size: var(--text-xs); color: var(--alert); font-weight: 500; }
      `}</style>
    </div>
  );
});

/* ── Textarea ── */
export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement>, FieldProps {}
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, hint, id, className = '', ...rest },
  ref,
) {
  return (
    <div className="field-wrap">
      {label && <label htmlFor={id}>{label}</label>}
      <textarea id={id} ref={ref} className={`field-base ${error ? 'has-error' : ''} ${className}`} aria-invalid={!!error} aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined} {...rest} />
      {hint && !error && <span className="hint" id={`${id}-hint`}>{hint}</span>}
      {error && <span className="error" id={`${id}-error`} role="alert">{error}</span>}
      <style jsx>{`
        .field-wrap { display: flex; flex-direction: column; gap: var(--sp-1); width: 100%; }
        label { font-size: var(--text-xs); font-weight: 600; color: var(--primary); }
        .field-base {
          width: 100%; min-height: 90px; resize: vertical;
          padding: var(--sp-2) var(--sp-3);
          font-family: var(--font-body); font-size: var(--text-base);
          color: var(--text-primary); background: var(--surface-2);
          border: 1.5px solid var(--border-subtle); border-radius: var(--r-md);
          transition: border-color ${'var(--dur-fast)'} ${'var(--ease-out)'}, box-shadow ${'var(--dur-fast)'} ${'var(--ease-out)'};
        }
        .field-base:hover { border-color: var(--text-secondary); }
        .field-base:focus-visible {
          outline: none; border-color: var(--border-focus);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 18%, transparent);
        }
        .field-base.has-error { border-color: var(--alert); }
        .hint { font-size: var(--text-xs); color: var(--text-tertiary); }
        .error { font-size: var(--text-xs); color: var(--alert); font-weight: 500; }
      `}</style>
    </div>
  );
});
