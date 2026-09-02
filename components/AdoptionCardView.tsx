'use client';
import type { HTMLAttributes, ReactNode } from 'react';
import Link from 'next/link';
import PetIcon from './PetIcon';
import { relativeTime } from '../lib/relativeTime';
import { maskPhone, formatPhone } from '../lib/utils';
import type { PetType } from '../lib/types';
import Icon from './ui/icons';

/**
 * Үрчлүүлэх карт — AdoptionCard (жагсаалт) болон AdoptionPreviewCard (форм preview)
 * хоёуланд ашиглана.
 */
export interface AdoptionCardViewProps extends HTMLAttributes<HTMLDivElement> {
  badgeLabel: string;
  name: string;
  type: PetType;
  typeLabel?: string;
  age: string;
  gender: string;
  genderLabel?: string;
  breed: string;
  district: string;
  place: string;
  phone: string;
  imageNode?: ReactNode;
  createdAt?: string;
  revealed?: boolean;
  onRevealPhone?: () => void;
  interactive?: boolean;
  showPhoneLabel?: string;
  callPhoneLabel?: string;
  detailHref?: string;
  detailLabel?: string;
  language?: 'mn' | 'en';
}

export default function AdoptionCardView({
  badgeLabel, name, type, typeLabel, age, gender, genderLabel, breed, district, place, phone,
  imageNode, createdAt, revealed = true, onRevealPhone, interactive = true,
  showPhoneLabel = 'Дугаар харах', callPhoneLabel = 'Утсаар холбогдох', detailHref,
  detailLabel = 'Дэлгэрэнгүй', language = 'mn',
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
        <h3>{name || typeLabel || type}</h3>
        <p>{typeLabel || type}{breed ? `, ${breed}` : ''}</p>
        {age && <p>{age}{gender && gender !== 'Тодорхойгүй' ? ` · ${genderLabel || gender}` : ''}</p>}
        <p className="place"><Icon name="pin" size={14} aria-hidden="true" /> {district} — {place}</p>
        {createdAt && <p className="time"><Icon name="calendar" size={14} aria-hidden="true" /> {relativeTime(createdAt, language)}</p>}
        <div className="card-actions">
        {showMasked ? (
          <button
            className="phone reveal-btn"
            onClick={(e) => { e.stopPropagation(); onRevealPhone!(); }}
            aria-label={showPhoneLabel}
          >
            <Icon name="phone" size={14} aria-hidden="true" /> {maskPhone(phone)} · {showPhoneLabel}
          </button>
        ) : phone ? (
          <a
            className="phone"
            href={`tel:${phone}`}
            onClick={(e) => e.stopPropagation()}
            aria-label={`${callPhoneLabel}: ${formatPhone(phone)}`}
          >
            <Icon name="phone" size={14} aria-hidden="true" /> {formatPhone(phone)}
          </a>
        ) : null}
        {detailHref && <Link className="detail-link" href={detailHref}>{detailLabel}<span aria-hidden="true">→</span></Link>}
        </div>
      </div>

      <style jsx>{`
        .pet-card {
          background: var(--card); border: 1px solid var(--line); border-radius: var(--r-lg);
          overflow: hidden; cursor: pointer; box-shadow: var(--shadow-sm);
          transition: transform var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out), border-color var(--dur-base) var(--ease-out);
          display: flex; flex-direction: column; height: 100%;
        }
        @media (max-width: 640px) { .pet-card { border-radius: var(--r-md); } }
        @media (min-width: 1025px) { .pet-card { border-radius: var(--r-xl); } }
        @media (hover: hover) and (pointer: fine) { .pet-card:not(.static):hover { box-shadow: var(--shadow-lift); transform: translateY(-4px); border-color: var(--primary-light); } .pet-card:not(.static):hover .thumb :global(img) { transform: scale(1.045); } }
        .pet-card:focus-within { border-color: var(--primary-light); box-shadow: var(--shadow-md); }
        .pet-card.static { cursor: default; }
        .pet-card.static:hover { transform: none; box-shadow: var(--shadow-sm); border-color: var(--line); }
        .thumb {
          height: 152px; background: var(--thumb-bg); position: relative;
          display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0;
        }
        @media (min-width: 1025px) { .thumb { height: 200px; } }
        @media (max-width: 640px) { .thumb { height: 180px; } }
        @media (max-width: 400px) { .thumb { height: 160px; } }
        .thumb::after {
          content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 50%;
          background: linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 100%);
          pointer-events: none; z-index: 1;
        }
        .thumb :global(img) { transition: transform 0.4s cubic-bezier(.16,1,.3,1); object-fit: cover; width: 100%; height: 100%; }
        .emoji {
          color: var(--primary); display: flex; align-items: center; justify-content: center;
          width: 80px; height: 80px;
          background: var(--glass-bg); border: 1px solid var(--glass-border);
          border-radius: 50%; box-shadow: var(--shadow-sm);
        }
        @media (min-width: 1025px) { .emoji { width: 96px; height: 96px; } }
        .badge {
          position: absolute; bottom: 10px; left: 10px; z-index: 2; font-family: var(--font-mono); font-size: 9.5px;
          padding: 5px 10px; border-radius: var(--r-pill); font-weight: 700; letter-spacing: 0.03em;
          backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
          background: var(--surface-2); color: var(--text-primary);
          border: 1px solid var(--border-subtle);
          box-shadow: var(--shadow-xs);
        }
        @media (max-width: 480px) { .badge { font-size: 10px; padding: 5px 11px; bottom: 12px; left: 12px; } }
        @media (min-width: 1025px) { .badge { font-size: 10.5px; padding: 6px 12px; bottom: 14px; left: 14px; } }
        .badge.adopt { background: var(--accent); color: var(--accent-ink); border-color: transparent; }
        .info { padding: 14px 15px; flex: 1; display: flex; flex-direction: column; gap: 2px; }
        @media (max-width: 480px) { .info { padding: 12px 14px; } }
        @media (min-width: 1025px) { .info { padding: 16px 18px; gap: 3px; } }
        h3 { font-family: var(--font-display); font-size: var(--text-lg); font-weight: 700; margin-bottom: 2px; color: var(--text-primary); line-height: var(--lh-tight); }
        @media (max-width: 480px) { h3 { font-size: 15px; } }
        @media (min-width: 1025px) { h3 { font-size: var(--text-xl); margin-bottom: 4px; } }
        p { font-size: 12.5px; color: var(--muted); margin: 3px 0; line-height: 1.4; }
        .place,.time { display:flex; align-items:center; gap:6px; }
        .place :global(svg),.time :global(svg) { flex:0 0 auto; }
        @media (max-width: 480px) { p { font-size: 13px; margin: 4px 0; } }
        @media (min-width: 1025px) { p { font-size: 13.5px; margin: 4px 0; line-height: 1.5; } }
        .card-actions { display: flex; align-items: center; gap: var(--sp-2); margin-top: auto; padding-top: var(--sp-3); flex-wrap: wrap; }
        .phone {
          display: inline-flex; align-items: center; gap: 5px; margin-top: 0; font-size: 13px;
          color: var(--primary); font-weight: 600; text-decoration: none; min-height: var(--touch-target);
          background: var(--eyebrow-bg); padding: 6px 12px; border-radius: var(--r-pill);
          transition: background 0.15s ease, color 0.15s ease;
        }
        .phone:hover { background: var(--primary); color: var(--text-on-accent); }
        @media (max-width: 480px) { .phone { margin-top: 10px; font-size: 14px; } }
        @media (min-width: 1025px) { .phone { margin-top: 12px; font-size: 14px; } }
        .reveal-btn { border: none; cursor: pointer; font-family: inherit; text-align: left; }
        .detail-link { display: inline-flex; align-items: center; gap: var(--sp-1); min-height: var(--touch-target); margin-left: auto; padding: var(--sp-2); color: var(--primary); border-radius: var(--r-sm); font-size: var(--text-sm); font-weight: 750; text-decoration: none; }
        .detail-link:hover { background: var(--eyebrow-bg); }
        .reveal-btn:focus-visible, .phone:focus-visible, .detail-link:focus-visible { outline: 2px solid var(--border-focus); outline-offset: 2px; }
      `}</style>
    </div>
  );
}
