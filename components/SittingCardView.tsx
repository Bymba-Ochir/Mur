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

  const PhoneIcon = (
    <svg className="icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" />
    </svg>
  );

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
        <p className="place">
          <svg className="icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z" /><circle cx="12" cy="10" r="3" />
          </svg>
          <span>{district} — {place}</span>
        </p>
        {price != null ? (
          <p className="price">₮ {price.toLocaleString()} <span className="per-day">/ өдөр</span></p>
        ) : (
          <p className="price free">Үнэгүй</p>
        )}
        {createdAt && <p className="time">
          <svg className="icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
            <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
          </svg>
          <span>{relativeTime(createdAt)}</span>
        </p>}
        {showMasked ? (
          <button
            className="phone reveal-btn"
            onClick={(e) => { e.stopPropagation(); onRevealPhone!(); }}
            aria-label="Утасны дугаарыг харуулах"
          >
            {PhoneIcon} <span>{maskPhone(phone)} · Дугаар харах</span>
          </button>
        ) : phone ? (
          <a className="phone" href={`tel:${phone}`} onClick={(e) => e.stopPropagation()} aria-label={`Утсаар холбогдох: ${formatPhone(phone)}`}>
            {PhoneIcon} <span>{formatPhone(phone)}</span>
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
        .pet-card:focus-visible { outline: 2.5px solid var(--accent); outline-offset: 2px; }
        .pet-card.static { cursor: default; }
        .pet-card.static:hover { transform: none; box-shadow: var(--shadow-sm); border-color: var(--line); }
        .thumb {
          height: 152px; background: var(--thumb-bg); position: relative;
          display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0;
        }
        @media (min-width: 1025px) { .thumb { height: 200px; } }
        @media (max-width: 640px) { .thumb { height: 180px; } }
        @media (max-width: 400px) { .thumb { height: 160px; } }
        .thumb :global(img) { transition: transform .35s cubic-bezier(.16,1,.3,1); object-fit: cover; width: 100%; height: 100%; }
        .pet-card:hover .thumb :global(img) { transform: scale(1.06); }
        .emoji {
          color: var(--primary); display: flex; align-items: center; justify-content: center;
          width: 80px; height: 80px;
          background: var(--glass-bg); border: 1px solid var(--glass-border);
          border-radius: 50%; box-shadow: var(--shadow-sm);
        }
        @media (min-width: 1025px) { .emoji { width: 96px; height: 96px; } }
        .badge {
          position: absolute; top: 10px; left: 10px; font-family: var(--font-mono); font-size: 9.5px;
          padding: 4px 9px; border-radius: var(--r-pill); color: #fff; font-weight: 700; letter-spacing: 0.03em;
          box-shadow: 0 1px 4px rgba(0,0,0,0.2);
        }
        @media (max-width: 480px) {
          .badge { font-size: 10px; padding: 5px 10px; top: 12px; left: 12px; }
        }
        @media (min-width: 1025px) {
          .badge { font-size: 10.5px; padding: 5px 12px; top: 14px; left: 14px; }
        }
        .badge.sitting { background: var(--primary-light); }
        .info { padding: 14px 15px; flex: 1; display: flex; flex-direction: column; }
        @media (max-width: 480px) { .info { padding: 12px 14px; } }
        @media (min-width: 1025px) { .info { padding: 16px 18px; } }
        h4 { font-family: var(--font-display); font-size: 14.5px; font-weight: 600; margin-bottom: 3px; color: var(--primary); }
        .pet-type { font-size: 12.5px; color: var(--muted); margin: 2px 0; }
        .exp, .avail { font-size: 12px; color: var(--muted); margin: 2px 0; }
        .place { display: flex; align-items: center; gap: 5px; font-size: 12.5px; color: var(--muted); margin: 3px 0; line-height: 1.4; }
        .place .icon { flex-shrink: 0; opacity: 0.85; }
        .price { font-size: 14px; font-weight: 600; color: var(--accent); margin: 4px 0; }
        .price.free { color: var(--success); }
        .per-day { font-size: 11px; font-weight: 400; color: var(--muted); }
        .time { display: flex; align-items: center; gap: 5px; font-size: 11px; color: var(--muted); margin-top: auto; }
        .time .icon { flex-shrink: 0; opacity: 0.85; }
        .phone {
          display: inline-flex; align-items: center; gap: 5px; margin-top: 8px; font-size: 13px;
          color: var(--primary); font-weight: 600; text-decoration: none; min-height: var(--touch-target);
        }
        .phone .icon { flex-shrink: 0; opacity: 0.85; }
        .reveal-btn { background: none; border: none; padding: 0; cursor: pointer; font-family: inherit; text-align: left; width: 100%; }
        .reveal-btn:focus-visible, .phone:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
      `}</style>
    </div>
  );
}
