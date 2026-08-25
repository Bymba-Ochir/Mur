'use client';
import type { HTMLAttributes, ReactNode } from 'react';
import PetIcon from './PetIcon';
import { relativeTime } from '../lib/relativeTime';
import { maskPhone, formatPhone } from '../lib/utils';
import type { PetType } from '../lib/types';

/**
 * Үрчлүүлэх карт — AdoptionCard (жагсаалт) болон AdoptionPreviewCard (форм preview)
 * хоёуланд ашиглана.
 */
export interface AdoptionCardViewProps extends HTMLAttributes<HTMLDivElement> {
  badgeLabel: string;
  name: string;
  type: PetType;
  age: string;
  gender: string;
  breed: string;
  district: string;
  place: string;
  phone: string;
  imageNode?: ReactNode;
  createdAt?: string;
  revealed?: boolean;
  onRevealPhone?: () => void;
  interactive?: boolean;
}

export default function AdoptionCardView({
  badgeLabel, name, type, age, gender, breed, district, place, phone,
  imageNode, createdAt, revealed = true, onRevealPhone, interactive = true,
  ...containerProps
}: AdoptionCardViewProps) {
  const showMasked = !!phone && !revealed && !!onRevealPhone;
  const staticClass = interactive ? 'group cursor-pointer hover:-translate-y-1.5 hover:border-transparent hover:shadow-[var(--shadow-lift)]' : 'cursor-default';

  return (
    <div className={`flex h-full flex-col overflow-hidden rounded-[var(--r-lg)] border border-[var(--line)] bg-[var(--card)] shadow-[var(--shadow-sm)] transition-[transform,box-shadow,border-color] duration-[var(--dur-base)] ease-[var(--ease-out)] focus-visible:outline-[2.5px] focus-visible:outline-offset-2 focus-visible:outline-[var(--border-focus)] max-sm:rounded-[var(--r-md)] min-[1025px]:rounded-[var(--r-xl)] ${staticClass}`} {...containerProps}>
      <div className="relative flex h-[152px] shrink-0 items-center justify-center overflow-hidden bg-[var(--thumb-bg)] after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:z-1 after:h-1/2 after:bg-gradient-to-t after:from-black/45 after:to-transparent max-sm:h-[180px] max-[400px]:h-40 min-[1025px]:h-[200px] [&>img]:h-full [&>img]:w-full [&>img]:object-cover [&>img]:transition-transform [&>img]:duration-400 group-hover:[&>img]:scale-[1.08]">
        <span className="absolute bottom-2.5 left-2.5 z-2 rounded-[var(--r-pill)] border border-transparent bg-[var(--primary-light)] px-2.5 py-[5px] font-[family-name:var(--font-mono)] text-[9.5px] font-bold tracking-[0.03em] text-[var(--text-on-accent)] shadow-[var(--shadow-xs)] backdrop-blur-lg">{badgeLabel}</span>
        {imageNode ?? (
          <span className="flex size-20 items-center justify-center rounded-full border border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--primary)] shadow-[var(--shadow-sm)] min-[1025px]:size-24" aria-hidden="true"><PetIcon type={type} size={56} /></span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-0.5 px-[15px] py-3.5 max-[480px]:px-3.5 max-[480px]:py-3 min-[1025px]:gap-[3px] min-[1025px]:px-[18px] min-[1025px]:py-4">
        <h4 className="mb-0.5 font-[family-name:var(--font-display)] text-[length:var(--text-lg)] font-bold leading-[var(--lh-tight)] text-[var(--text-primary)] max-[480px]:text-[15px] min-[1025px]:mb-1 min-[1025px]:text-[length:var(--text-xl)]">{name || type}</h4>
        <p className="my-[3px] text-[12.5px] leading-[1.4] text-[var(--muted)]">{type}{breed ? `, ${breed}` : ''}</p>
        {age && <p className="my-[3px] text-[12.5px] leading-[1.4] text-[var(--muted)]">{age}{gender && gender !== 'Тодорхойгүй' ? ` · ${gender}` : ''}</p>}
        <p className="my-[3px] text-[12.5px] leading-[1.4] text-[var(--muted)]"><span aria-hidden="true">📍</span> {district} — {place}</p>
        {createdAt && <p className="my-[3px] text-[12.5px] leading-[1.4] text-[var(--muted)]"><span aria-hidden="true">🕓</span> {relativeTime(createdAt)}</p>}
        {showMasked ? (
          <button
            className="mt-2 inline-flex min-h-[var(--touch-target)] w-full cursor-pointer items-center gap-[5px] rounded-[var(--r-pill)] border-0 bg-[var(--eyebrow-bg)] px-3 py-1.5 text-left font-[family-name:inherit] text-[13px] font-semibold text-[var(--primary)] transition-colors hover:bg-[var(--primary)] hover:text-[var(--text-on-accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--border-focus)]"
            onClick={(e) => { e.stopPropagation(); onRevealPhone!(); }}
            aria-label="Утасны дугаарыг харуулах"
          >
            <span aria-hidden="true">☎</span> {maskPhone(phone)} · Дугаар харах
          </button>
        ) : phone ? (
          <a
            className="mt-2 inline-flex min-h-[var(--touch-target)] items-center gap-[5px] rounded-[var(--r-pill)] bg-[var(--eyebrow-bg)] px-3 py-1.5 text-[13px] font-semibold text-[var(--primary)] no-underline transition-colors hover:bg-[var(--primary)] hover:text-[var(--text-on-accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--border-focus)]"
            href={`tel:${phone}`}
            onClick={(e) => e.stopPropagation()}
            aria-label={`Утсаар холбогдох: ${formatPhone(phone)}`}
          >
            <span aria-hidden="true">☎</span> {formatPhone(phone)}
          </a>
        ) : null}
      </div>
    </div>
  );
}
