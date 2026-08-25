'use client';
import type { HTMLAttributes, ReactNode } from 'react';
import PetIcon from './PetIcon';
import { relativeTime } from '../lib/relativeTime';
import { maskPhone, formatPhone } from '../lib/utils';
import type { SittingPetType } from '../lib/types';

export interface SittingCardViewProps extends HTMLAttributes<HTMLDivElement> {
  badgeLabel: string;
  petType: SittingPetType;
  description: string;
  district: string;
  place: string;
  experience: string;
  availability: string;
  price: number | null;
  phone: string;
  imageNode?: ReactNode;
  createdAt?: string;
  revealed?: boolean;
  onRevealPhone?: () => void;
  interactive?: boolean;
}

export default function SittingCardView({
  badgeLabel, petType, description, district, place, experience, availability,
  price, phone, imageNode, createdAt, revealed = true, onRevealPhone, interactive = true,
  ...containerProps
}: SittingCardViewProps) {
  const showMasked = !!phone && !revealed && !!onRevealPhone;
  const staticClass = interactive
    ? 'group cursor-pointer hover:-translate-y-1.5 hover:border-transparent hover:shadow-[var(--shadow-lift)]'
    : 'cursor-default';
  const iconType = petType === 'Бүгд' ? 'Бусад' : petType;

  const PhoneIcon = (
    <svg className="shrink-0 opacity-85" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" />
    </svg>
  );

  return (
    <div className={`flex h-full flex-col overflow-hidden rounded-[var(--r-lg)] border border-[var(--line)] bg-[var(--card)] shadow-[var(--shadow-sm)] transition-[transform,box-shadow,border-color] duration-[var(--dur-base)] ease-[var(--ease-out)] focus-visible:outline-[2.5px] focus-visible:outline-offset-2 focus-visible:outline-[var(--border-focus)] max-sm:rounded-[var(--r-md)] min-[1025px]:rounded-[var(--r-xl)] ${staticClass}`} {...containerProps}>
      <div className="relative flex h-[152px] shrink-0 items-center justify-center overflow-hidden bg-[var(--thumb-bg)] after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:z-1 after:h-1/2 after:bg-gradient-to-t after:from-black/45 after:to-transparent max-sm:h-[180px] max-[400px]:h-40 min-[1025px]:h-[200px] [&>img]:h-full [&>img]:w-full [&>img]:object-cover [&>img]:transition-transform [&>img]:duration-400 group-hover:[&>img]:scale-[1.08]">
        <span className="absolute bottom-2.5 left-2.5 z-2 rounded-[var(--r-pill)] border border-transparent bg-[var(--primary)] px-2.5 py-[5px] font-[family-name:var(--font-mono)] text-[9.5px] font-bold tracking-[0.03em] text-[var(--text-on-accent)] shadow-[var(--shadow-xs)] backdrop-blur-lg max-[480px]:bottom-3 max-[480px]:left-3 max-[480px]:px-[11px] max-[480px]:text-[10px] min-[1025px]:bottom-3.5 min-[1025px]:left-3.5 min-[1025px]:px-3 min-[1025px]:py-1.5 min-[1025px]:text-[10.5px]">{badgeLabel}</span>
        {imageNode ?? (
          <span className="flex size-20 items-center justify-center rounded-full border border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--primary)] shadow-[var(--shadow-sm)] min-[1025px]:size-24" aria-hidden="true"><PetIcon type={iconType} size={56} /></span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-0.5 px-[15px] py-3.5 max-[480px]:px-3.5 max-[480px]:py-3 min-[1025px]:gap-[3px] min-[1025px]:px-[18px] min-[1025px]:py-4">
        <h4 className="mb-0.5 font-[family-name:var(--font-display)] text-[length:var(--text-lg)] font-bold leading-[var(--lh-tight)] text-[var(--text-primary)] max-[480px]:text-[15px] min-[1025px]:mb-1 min-[1025px]:text-[length:var(--text-xl)]">{description.slice(0, 60) || petType}</h4>
        <p className="my-0.5 text-[12.5px] text-[var(--muted)]">{petType}</p>
        {experience && <p className="my-0.5 text-xs text-[var(--muted)]">{experience}</p>}
        {availability && <p className="my-0.5 text-xs text-[var(--muted)]">{availability}</p>}
        <p className="my-[3px] flex items-center gap-[5px] text-[12.5px] leading-[1.4] text-[var(--muted)]">
          <svg className="shrink-0 opacity-85" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z" /><circle cx="12" cy="10" r="3" />
          </svg>
          <span>{district} — {place}</span>
        </p>
        {price != null ? (
          <p className="my-1 text-sm font-semibold text-[var(--accent)]">₮ {price.toLocaleString()} <span className="text-[11px] font-normal text-[var(--muted)]">/ өдөр</span></p>
        ) : (
          <p className="my-1 text-sm font-semibold text-[var(--success)]">Үнэгүй</p>
        )}
        {createdAt && <p className="mt-auto flex items-center gap-[5px] text-[11px] text-[var(--muted)]">
          <svg className="shrink-0 opacity-85" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
            <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
          </svg>
          <span>{relativeTime(createdAt)}</span>
        </p>}
        {showMasked ? (
          <button
            className="mt-2 inline-flex min-h-[var(--touch-target)] w-full cursor-pointer items-center gap-[5px] rounded-[var(--r-pill)] border-0 bg-[var(--eyebrow-bg)] px-3 py-1.5 text-left font-[family-name:inherit] text-[13px] font-semibold text-[var(--primary)] transition-colors hover:bg-[var(--primary)] hover:text-[var(--text-on-accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--border-focus)]"
            onClick={(e) => { e.stopPropagation(); onRevealPhone!(); }}
            aria-label="Утасны дугаарыг харуулах"
          >
            {PhoneIcon} <span>{maskPhone(phone)} · Дугаар харах</span>
          </button>
        ) : phone ? (
          <a className="mt-2 inline-flex min-h-[var(--touch-target)] items-center gap-[5px] rounded-[var(--r-pill)] bg-[var(--eyebrow-bg)] px-3 py-1.5 text-[13px] font-semibold text-[var(--primary)] no-underline transition-colors hover:bg-[var(--primary)] hover:text-[var(--text-on-accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--border-focus)]" href={`tel:${phone}`} onClick={(e) => e.stopPropagation()} aria-label={`Утсаар холбогдох: ${formatPhone(phone)}`}>
            {PhoneIcon} <span>{formatPhone(phone)}</span>
          </a>
        ) : null}
      </div>

    </div>
  );
}
