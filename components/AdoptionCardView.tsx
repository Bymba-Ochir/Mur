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
  const staticClass = interactive ? '' : ' static';

  return (
    <div className={`pet-card${staticClass}`} {...containerProps}>
      <div className="thumb">
        <span className="badge adopt">{badgeLabel}</span>
        {imageNode ?? (
          <span className="emoji" aria-hidden="true"><PetIcon type={type} size={56} /></span>
        )}
      </div>
      <div className="info">
        <h4>{name || type}</h4>
        <p>{type}{breed ? `, ${breed}` : ''}</p>
        {age && <p>{age}{gender && gender !== 'Тодорхойгүй' ? ` · ${gender}` : ''}</p>}
        <p className="place"><span aria-hidden="true">📍</span> {district} — {place}</p>
        {createdAt && <p className="time"><span aria-hidden="true">🕓</span> {relativeTime(createdAt)}</p>}
        {showMasked ? (
          <button
            className="phone reveal-btn"
            onClick={(e) => { e.stopPropagation(); onRevealPhone!(); }}
            aria-label="Утасны дугаарыг харуулах"
          >
            <span aria-hidden="true">☎</span> {maskPhone(phone)} · Дугаар харах
          </button>
        ) : phone ? (
          <a
            className="phone"
            href={`tel:${phone}`}
            onClick={(e) => e.stopPropagation()}
            aria-label={`Утсаар холбогдох: ${formatPhone(phone)}`}
          >
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
        @media (max-width: 480px) { .badge { font-size: 10px; padding: 5px 10px; top: 12px; left: 12px; } }
        @media (min-width: 1025px) { .badge { font-size: 10.5px; padding: 5px 12px; top: 14px; left: 14px; } }
        .badge.adopt { background: var(--accent); }
        .info { padding: 14px 15px; flex: 1; display: flex; flex-direction: column; }
        @media (max-width: 480px) { .info { padding: 12px 14px; } }
        @media (min-width: 1025px) { .info { padding: 16px 18px; } }
        h4 { font-family: var(--font-display); font-size: 14.5px; font-weight: 600; margin-bottom: 3px; color: var(--primary); }
        @media (max-width: 480px) { h4 { font-size: 15px; margin-bottom: 4px; } }
        @media (min-width: 1025px) { h4 { font-size: 15.5px; margin-bottom: 6px; } }
        p { font-size: 12.5px; color: var(--muted); margin: 3px 0; line-height: 1.4; }
        @media (max-width: 480px) { p { font-size: 13px; margin: 4px 0; } }
        @media (min-width: 1025px) { p { font-size: 13.5px; margin: 4px 0; line-height: 1.5; } }
        .phone { display: inline-flex; margin-top: 8px; font-size: 13px; color: var(--primary); font-weight: 600; text-decoration: none; min-height: var(--touch-target); align-items: center; }
        @media (max-width: 480px) { .phone { margin-top: 10px; font-size: 14px; } }
        @media (min-width: 1025px) { .phone { margin-top: 12px; font-size: 14px; } }
        .reveal-btn { background: none; border: none; padding: 0; cursor: pointer; font-family: inherit; text-align: left; width: 100%; }
        .reveal-btn:focus-visible, .phone:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
      `}</style>
    </div>
  );
}
