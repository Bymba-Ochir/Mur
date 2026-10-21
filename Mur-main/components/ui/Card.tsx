'use client';
import type { HTMLAttributes, ReactNode } from 'react';

export type CardTone = 'default' | 'elevated' | 'interactive';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  tone?: CardTone;
  children: ReactNode;
}

export default function Card({ tone = 'default', children, className = '', ...rest }: CardProps) {
  return (
    <div className={`card-ui ${className}`} data-tone={tone} {...rest}>
      {children}
      <style jsx>{`
        .card-ui {
          background: var(--surface-2);
          border: 1px solid var(--border-subtle);
          border-radius: var(--r-lg);
          box-shadow: var(--shadow-sm);
          transition: transform ${'var(--dur-base)'} ${'var(--ease-out)'}, box-shadow ${'var(--dur-base)'} ${'var(--ease-out)'}, border-color ${'var(--dur-base)'} ${'var(--ease-out)'};
        }
        :global([data-tone='elevated']) { box-shadow: var(--shadow-md); }
        :global([data-tone='interactive']) {
          cursor: pointer;
          &:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); border-color: transparent; }
        }
        @media (max-width: 640px) {
          .card-ui { border-radius: var(--r-md); }
        }
      `}</style>
    </div>
  );
}
