'use client';
import type { HTMLAttributes, ReactNode } from 'react';
import ListingCardLink from './ListingCardLink';
import PetIcon from './PetIcon';
import { relativeTime } from '../lib/relativeTime';
import { maskPhone, formatPhone } from '../lib/utils';
import type { PetStatus, PetType } from '../lib/types';
import Icon from './ui/icons';

/**
 * Нийтлэг pet карт (presentational) — PetCard (жагсаалт) болон PetPreviewCard
 * (форм preview) хоёуланд ашиглана. Утасны reveal логик дотоодод: onRevealPhone
 * өгвөл эхлээд далд (masked), дарсны дараа бүтэн дугаар харагдана.
 * Картын бүх стиль (.pet-card/.thumb/.badge/.info/.phone) энд төвлөрсөн.
 */
export interface PetCardViewProps extends HTMLAttributes<HTMLDivElement> {
  status: PetStatus;
  badgeLabel: string;
  name: string;
  type: PetType;
  typeLabel?: string;
  breed?: string;
  color: string;
  district: string;
  place: string;
  phone: string;
  /** Зурган node (next/image эсвэл img); өгөхгүй бол PetIcon дүрс харагдана */
  imageNode?: ReactNode;
  createdAt?: string;
  photoMatchLabel?: string;
  /** "Шагналтай" гэж харуулах (дүнг нууц — зөвхөн тэмдэг харагдана) */
  hasReward?: boolean;
  rewardLabel?: string;
  showPhoneLabel?: string;
  callPhoneLabel?: string;
  detailHref?: string;
  detailLabel?: string;
  language?: 'mn' | 'en';
  /** false + onRevealPhone = утас далд (masked) эхэлнэ */
  revealed?: boolean;
  onRevealPhone?: () => void;
  /** false бол preview картын холбоос болон hover өнгийг унтраана. */
  interactive?: boolean;
}

export default function PetCardView({
  status, badgeLabel, name, type, typeLabel, breed, color, district, place, phone,
  imageNode, createdAt, photoMatchLabel, hasReward, rewardLabel = 'Шагналтай',
  showPhoneLabel = 'Дугаар харах', callPhoneLabel = 'Утсаар холбогдох',
  detailHref, detailLabel = 'Дэлгэрэнгүй үзэх', language = 'mn',
  revealed = true, onRevealPhone, interactive = true,
  ...containerProps
}: PetCardViewProps) {
  const showMasked = !!phone && !revealed && !!onRevealPhone;
  const staticClass = interactive ? '' : ' static';

  return (
    <div className={`pet-card${staticClass}${interactive && detailHref ? ' listing-card--linked' : ''}`} {...containerProps}>
      <div className="thumb listing-media">
        <span className={`badge ${status}`}>{badgeLabel}</span>
        {imageNode ?? (
          <span className="emoji" aria-hidden="true"><PetIcon type={type} size={56} /></span>
        )}
        {photoMatchLabel && <span className="similarity">{photoMatchLabel}</span>}
      </div>
      <div className="info">
        <h3><ListingCardLink href={interactive ? detailHref : undefined} label={detailLabel}>{name || typeLabel || type}</ListingCardLink></h3>
        <p>{typeLabel || type}{breed ? `, ${breed}` : ''}{color ? `, ${color}` : ''}</p>
        <p className="place"><Icon name="pin" size={14} aria-hidden="true" /> {district} — {place}</p>
        {(hasReward || createdAt) && <div className="card-meta">
          {hasReward ? <p className="reward"><Icon name="sparkles" size={14} aria-hidden="true" /> {rewardLabel}</p> : null}
          {createdAt && <p className="time"><Icon name="calendar" size={14} aria-hidden="true" /> {relativeTime(createdAt, language)}</p>}
        </div>}
        {phone && <div className="card-actions">
        {showMasked ? (
          <button
            type="button"
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
        </div>}
      </div>

      <style jsx>{`
        .pet-card {
          background: var(--surface-2); border: 1px solid var(--border-subtle); border-radius: 16px;
          overflow: hidden; transition: border-color var(--dur-fast) var(--ease-out);
          display: flex; flex-direction: column; min-width: 0; align-self: start;
        }
        @media (hover: hover) and (pointer: fine) {
          .pet-card:not(.static):hover { border-color: var(--border-strong); }
        }
        .pet-card:focus-within { border-color: var(--border-focus); }
        .thumb {
          background: var(--thumb-bg); position: relative;
          display: flex; align-items: center; justify-content: center; overflow: hidden;
          flex-shrink: 0;
        }
        .thumb :global(img) { object-fit: cover; width: 100%; height: 100%; }
        .emoji {
          color: var(--primary);
          display: flex;
          align-items: center;
          justify-content: center;
          width: 80px; height: 80px;
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: 50%;
          box-shadow: var(--shadow-sm);
        }
        @media (min-width: 1025px) {
          .emoji { width: 96px; height: 96px; }
        }
        .badge, .similarity {
          position: absolute; z-index: 2; font-size: var(--text-xs); font-weight: 600;
          padding: 4px 8px; border-radius: 6px; background: var(--surface-2); color: var(--text-primary);
          border: 1px solid var(--border-subtle);
        }
        .badge { bottom: 12px; left: 12px; display: inline-flex; align-items: center; gap: 6px; }
        .badge::before { content: ''; width: 6px; height: 6px; border-radius: 50%; }
        .badge.lost::before { background: var(--alert); }
        .badge.found::before { background: var(--found-deep); }
        .similarity { top: 12px; right: 12px; max-width: 60%; text-align: end; }
        .info { padding: 14px 15px; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
        @media (max-width: 480px) {
          .info { padding: 12px 14px; }
        }
        @media (min-width: 1025px) {
          .info { padding: 16px 18px; gap: 3px; }
        }
        h3 { font-family: var(--font-display); font-size: var(--text-lg); font-weight: 700; margin-bottom: 2px; color: var(--text-primary); line-height: var(--lh-tight); }
        @media (max-width: 480px) {
          h3 { font-size: 15px; }
        }
        @media (min-width: 1025px) {
          h3 { font-size: var(--text-xl); margin-bottom: 4px; }
        }
        p { font-size: 12.5px; color: var(--muted); margin: 3px 0; line-height: 1.4; }
        @media (max-width: 480px) {
          p { font-size: 13px; margin: 4px 0; }
        }
        @media (min-width: 1025px) {
          p { font-size: 13.5px; margin: 4px 0; line-height: 1.5; }
        }
        h3, p { overflow-wrap: anywhere; }
        .card-meta { display: flex; flex-wrap: wrap; gap: 6px 14px; margin-top: 4px; }
        .card-meta p { margin: 0; }
        .place,.reward,.time { display:flex; align-items:center; gap:6px; }
        .place :global(svg),.reward :global(svg),.time :global(svg) { flex:0 0 auto; }
        .reward { margin-top: 6px; font-size: 12.5px; color: var(--accent); font-weight: 600; }
        @media (max-width: 480px) {
          .reward { margin-top: 8px; font-size: 13px; }
        }
        @media (min-width: 1025px) {
          .reward { margin-top: 8px; font-size: 13.5px; }
        }
        .card-actions {
          display: grid; grid-template-columns: minmax(0, 1fr); gap: var(--sp-2);
          margin-top: var(--sp-3);
        }
        .phone {
          display: inline-flex; align-items: center; justify-content: center; gap: 5px; min-height: var(--touch-target);
          color: var(--primary); font-size: 13px; font-weight: 650; text-decoration: none;
          background: var(--eyebrow-bg); border: 1px solid transparent; padding: 6px 12px; border-radius: var(--r-md);
          transition: background var(--dur-fast) ease, color var(--dur-fast) ease, border-color var(--dur-fast) ease;
        }
        .phone:hover { background: var(--primary); color: var(--text-on-accent); border-color: var(--primary); }
        @media (max-width: 480px) {
          .phone { font-size: 14px; }
        }
        @media (min-width: 1025px) {
          .phone { font-size: 14px; }
        }
        .reveal-btn { cursor: pointer; font-family: inherit; width: 100%; }
        .reveal-btn:focus-visible, .phone:focus-visible { outline: 2px solid var(--border-focus); outline-offset: 2px; }
        @media (prefers-reduced-motion: reduce) {
          .pet-card { transition: none; }
        }
      `}</style>
    </div>
  );
}
