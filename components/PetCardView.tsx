'use client';
import type { HTMLAttributes, ReactNode } from 'react';
import PetIcon from './PetIcon';
import { relativeTime } from '../lib/relativeTime';
import { maskPhone, formatPhone } from '../lib/utils';
import type { PetStatus, PetType } from '../lib/types';

export interface PetCardViewProps extends HTMLAttributes<HTMLDivElement> {
  status: PetStatus; badgeLabel: string; name: string; type: PetType; breed?: string;
  color: string; district: string; place: string; phone: string; imageNode?: ReactNode;
  createdAt?: string; similarity?: number | null; hybridScore?: number | null;
  hasReward?: boolean; rewardLabel?: string; revealed?: boolean;
  onRevealPhone?: () => void; interactive?: boolean;
}

const TEXT = 'my-[3px] text-[12.5px] leading-[1.4] text-[var(--muted)] max-[480px]:my-1 max-[480px]:text-[13px] min-[1025px]:my-1 min-[1025px]:text-[13.5px] min-[1025px]:leading-[1.5]';
const PHONE = 'mt-2 inline-flex min-h-[var(--touch-target)] items-center gap-[5px] rounded-[var(--r-pill)] bg-[var(--eyebrow-bg)] px-3 py-1.5 text-[13px] font-semibold text-[var(--primary)] no-underline transition-colors duration-150 hover:bg-[var(--primary)] hover:text-[var(--text-on-accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--border-focus)] max-[480px]:mt-2.5 max-[480px]:text-sm min-[1025px]:mt-3 min-[1025px]:text-sm';

export default function PetCardView({
  status, badgeLabel, name, type, breed, color, district, place, phone, imageNode,
  createdAt, similarity, hybridScore, hasReward, rewardLabel = 'Шагналтай',
  revealed = true, onRevealPhone, interactive = true, ...containerProps
}: PetCardViewProps) {
  const showMasked = !!phone && !revealed && !!onRevealPhone;
  const interactiveClass = interactive
    ? 'group cursor-pointer hover:-translate-y-1.5 hover:border-transparent hover:shadow-[var(--shadow-lift)]'
    : 'cursor-default';
  const badgeTone = status === 'lost' ? 'bg-[var(--accent)]' : 'bg-[var(--success)]';

  return (
    <div className={`flex h-full flex-col overflow-hidden rounded-[var(--r-lg)] border border-[var(--line)] bg-[var(--card)] shadow-[var(--shadow-sm)] transition-[transform,box-shadow,border-color] duration-[var(--dur-base)] ease-[var(--ease-out)] focus-visible:outline-[2.5px] focus-visible:outline-offset-2 focus-visible:outline-[var(--border-focus)] max-sm:rounded-[var(--r-md)] min-[1025px]:rounded-[var(--r-xl)] ${interactiveClass}`} {...containerProps}>
      <div className="relative flex h-[152px] shrink-0 items-center justify-center overflow-hidden bg-[var(--thumb-bg)] after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:z-1 after:h-1/2 after:bg-gradient-to-t after:from-black/45 after:to-transparent max-sm:h-[180px] max-[400px]:h-40 min-[1025px]:h-[200px] [&>img]:h-full [&>img]:w-full [&>img]:object-cover [&>img]:transition-transform [&>img]:duration-400 group-hover:[&>img]:scale-[1.08]">
        <span className={`absolute bottom-2.5 left-2.5 z-2 rounded-[var(--r-pill)] border border-transparent px-2.5 py-[5px] font-[family-name:var(--font-mono)] text-[9.5px] font-bold tracking-[0.03em] text-[var(--text-on-accent)] shadow-[var(--shadow-xs)] backdrop-blur-lg max-[480px]:bottom-3 max-[480px]:left-3 max-[480px]:text-[10px] min-[1025px]:bottom-3.5 min-[1025px]:left-3.5 min-[1025px]:px-3 min-[1025px]:py-1.5 min-[1025px]:text-[10.5px] ${badgeTone}`}>{badgeLabel}</span>
        {imageNode ?? <span className="flex size-20 items-center justify-center rounded-full border border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--primary)] shadow-[var(--shadow-sm)] min-[1025px]:size-24" aria-hidden="true"><PetIcon type={type} size={56} /></span>}
        {(hybridScore ?? similarity) != null && <span className="absolute bottom-2.5 right-2.5 z-2 rounded-[var(--r-pill)] border border-[var(--border-subtle)] bg-[var(--surface-3)] px-[9px] py-[3px] font-[family-name:var(--font-mono)] text-[10.5px] font-semibold text-[var(--accent)] backdrop-blur-sm">{hybridScore ?? similarity}% тохирол</span>}
      </div>
      <div className="flex flex-1 flex-col gap-0.5 px-[15px] py-3.5 max-[480px]:px-3.5 max-[480px]:py-3 min-[1025px]:gap-[3px] min-[1025px]:px-[18px] min-[1025px]:py-4">
        <h4 className="mb-0.5 font-[family-name:var(--font-display)] text-[length:var(--text-lg)] font-bold leading-[var(--lh-tight)] text-[var(--text-primary)] max-[480px]:text-[15px] min-[1025px]:mb-1 min-[1025px]:text-[length:var(--text-xl)]">{name || type}</h4>
        <p className={TEXT}>{type}{breed ? `, ${breed}` : ''}{color ? `, ${color}` : ''}</p>
        <p className={TEXT}><span aria-hidden="true">📍</span> {district} — {place}</p>
        {hasReward && <p className="mt-1.5 text-[12.5px] font-semibold text-[var(--accent)] max-[480px]:mt-2 max-[480px]:text-[13px] min-[1025px]:mt-2 min-[1025px]:text-[13.5px]"><span aria-hidden="true">🎁</span> {rewardLabel}</p>}
        {createdAt && <p className={TEXT}><span aria-hidden="true">🕓</span> {relativeTime(createdAt)}</p>}
        {showMasked ? <button className={`${PHONE} w-full border-0 text-left font-[family-name:inherit]`} onClick={(event) => { event.stopPropagation(); onRevealPhone!(); }} aria-label="Утасны дугаарыг харуулах"><span aria-hidden="true">☎</span> {maskPhone(phone)} · Дугаар харах</button> : phone ? <a className={PHONE} href={`tel:${phone}`} onClick={(event) => event.stopPropagation()} aria-label={`Утасаар холбогдох: ${formatPhone(phone)}`}><span aria-hidden="true">☎</span> {formatPhone(phone)}</a> : null}
      </div>
    </div>
  );
}
