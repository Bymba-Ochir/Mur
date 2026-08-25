'use client';
import type { HTMLAttributes, ReactNode } from 'react';

export type CardTone = 'default' | 'elevated' | 'interactive';
interface CardProps extends HTMLAttributes<HTMLDivElement> { tone?: CardTone; children: ReactNode; }

const TONES: Record<CardTone, string> = {
  default: '',
  elevated: 'shadow-[var(--shadow-md)]',
  interactive: 'cursor-pointer hover:-translate-y-1 hover:border-transparent hover:shadow-[var(--shadow-lg)]',
};

export default function Card({ tone = 'default', children, className = '', ...rest }: CardProps) {
  return (
    <div className={`rounded-[var(--r-lg)] border border-[var(--border-subtle)] bg-[var(--surface-2)] shadow-[var(--shadow-sm)] transition-[transform,box-shadow,border-color] duration-[var(--dur-base)] ease-[var(--ease-out)] max-sm:rounded-[var(--r-md)] ${TONES[tone]} ${className}`} data-tone={tone} {...rest}>
      {children}
    </div>
  );
}
