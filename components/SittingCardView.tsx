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
  const staticClass = interactive ? '' : ' static';
  const iconType = petType === 'Бүгд' ? 'Бусад' : petType;

  return (
    <div className={`pet-card${staticClass}`} {...containerProps}>
      <div className="thumb">
        <span className="badge sitting">{badgeLabel}</span>
        {imageNode ?? (
          <span className="emoji" aria-hidden="true"><PetIcon type={iconType} size={56} /></span>
        )}
      </div>
      <div className="info">
        <h4>{description.slice(0, 60) || petType}</h4>
        <p className="pet-type">{petType}</p>
        {experience && <p className="exp">{experience}</p>}
        {availability && <p className="avail">{availability}</p>}
        <p className="place"><span aria-hidden="true">📍</span> {district} — {place}</p>
        {price != null ? (
          <p className="price">₮ {price.toLocaleString()} <span className="per-day">/ өдөр</span></p>
        ) : (
          <p className="price free">Үнэгүй</p>
        )}
        {createdAt && <p className="time"><span aria-hidden="true">🕓</span> {relativeTime(createdAt)}</p>}
        {showMasked ? (
          <button
            className="phone reveal-btn"
            onClick={(e) => { e.stopPropagation(); onRevealPhone!(); }}
          >
            <span aria-hidden="true">☎</span> {maskPhone(phone)} · Дугаар харах
          </button>
        ) : phone ? (
          <a className="phone" href={`tel:${phone}`} onClick={(e) => e.stopPropagation()}>
            <span aria-hidden="true">☎</span> {formatPhone(phone)}
          </a>
        ) : null}
      </div>

      <style jsx>{`
        .pet-card {
          background: var(--card); border: 1px solid var(--line); border-radius: var(--r-lg);
          overflow: hidden; cursor: pointer; box-shadow: var(--shadow-sm);
          transition: box-shadow .22s ease, transform .22s ease, border-color .22s ease;
          display: flex; flex-direction: column; height: 100%;
        }
        @media (max-width: 640px) { .pet-card { border-radius: var(--r-md); } }
        @media (min-width: 1025px) { .pet-card { border-radius: var(--r-xl); } }
        .pet-card:hover { box-shadow: var(--shadow-lift); transform: translateY(-3px); border-color: transparent; }
        .pet-card.static { cursor: default; }
        .pet-card.static:hover { transform: none; box-shadow: var(--shadow-sm); border-color: var(--line); }
        .thumb {
          height: 152px; background: var(--thumb-bg); position: relative;
          display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0;
        }
        @media (min-width: 1025px) { .thumb { height: 200px; } }
        .thumb :global(img) { transition: transform .35s cubic-bezier(.16,1,.3,1); object-fit: cover; width: 100%; height: 100%; }
        .pet-card:hover .thumb :global(img) { transform: scale(1.06); }
        .emoji {
          color: var(--primary); display: flex; align-items: center; justify-content: center;
          width: 80px; height: 80px;
          background: var(--glass-bg); border: 1px solid var(--glass-border);
          border-radius: 50%; box-shadow: var(--shadow-sm);
        }
        .badge {
          position: absolute; top: 10px; left: 10px; font-family: var(--font-mono); font-size: 9.5px;
          padding: 4px 9px; border-radius: var(--r-pill); color: #fff; font-weight: 700;
          box-shadow: 0 1px 4px rgba(0,0,0,0.2);
        }
        .badge.sitting { background: #2B6575; }
        .info { padding: 14px 15px; flex: 1; display: flex; flex-direction: column; }
        h4 { font-family: var(--font-display); font-size: 14.5px; font-weight: 600; margin-bottom: 3px; color: var(--primary); }
        .pet-type { font-size: 12.5px; color: var(--muted); margin: 2px 0; }
        .exp, .avail { font-size: 12px; color: var(--muted); margin: 2px 0; }
        .place { font-size: 12.5px; color: var(--muted); margin: 3px 0; }
        .price { font-size: 14px; font-weight: 600; color: var(--accent); margin: 4px 0; }
        .price.free { color: var(--success); }
        .per-day { font-size: 11px; font-weight: 400; color: var(--muted); }
        .time { font-size: 11px; color: var(--muted); margin-top: auto; }
        .phone { display: inline-flex; margin-top: 8px; font-size: 13px; color: var(--primary); font-weight: 600; text-decoration: none; }
        .reveal-btn { background: none; border: none; padding: 0; cursor: pointer; font-family: inherit; text-align: left; width: 100%; }
      `}</style>
    </div>
  );
}
