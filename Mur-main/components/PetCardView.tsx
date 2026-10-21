'use client';
import type { HTMLAttributes, ReactNode } from 'react';
import Link from 'next/link';
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
  similarity?: number | null;
  hybridScore?: number | null;
  /** "Шагналтай" гэж харуулах (дүнг нууц — зөвхөн тэмдэг харагдана) */
  hasReward?: boolean;
  rewardLabel?: string;
  similarityLabel?: string;
  showPhoneLabel?: string;
  callPhoneLabel?: string;
  detailHref?: string;
  detailLabel?: string;
  language?: 'mn' | 'en';
  /** false + onRevealPhone = утас далд (masked) эхэлнэ */
  revealed?: boolean;
  onRevealPhone?: () => void;
  /** false бол hover lift / pointer-г унтраана (жишээ: preview карт) */
  interactive?: boolean;
}

export default function PetCardView({
  status, badgeLabel, name, type, typeLabel, breed, color, district, place, phone,
  imageNode, createdAt, similarity, hybridScore, hasReward, rewardLabel = 'Шагналтай',
  similarityLabel = 'тохирол', showPhoneLabel = 'Дугаар харах', callPhoneLabel = 'Утсаар холбогдох',
  detailHref, detailLabel = 'Дэлгэрэнгүй үзэх', language = 'mn',
  revealed = true, onRevealPhone, interactive = true,
  ...containerProps
}: PetCardViewProps) {
  const showMasked = !!phone && !revealed && !!onRevealPhone;
  const staticClass = interactive ? '' : ' static';

  return (
    <div className={`pet-card${staticClass}`} {...containerProps}>
      <div className="thumb">
        <span className={`badge ${status}`}>{badgeLabel}</span>
        {imageNode ?? (
          <span className="emoji" aria-hidden="true"><PetIcon type={type} size={56} /></span>
        )}
        {(hybridScore ?? similarity) != null && <span className="similarity">{hybridScore ?? similarity}% {similarityLabel}</span>}
      </div>
      <div className="info">
        <h3>{name || typeLabel || type}</h3>
        <p>{typeLabel || type}{breed ? `, ${breed}` : ''}{color ? `, ${color}` : ''}</p>
        <p className="place"><Icon name="pin" size={14} aria-hidden="true" /> {district} — {place}</p>
        {hasReward ? <p className="reward"><Icon name="sparkles" size={14} aria-hidden="true" /> {rewardLabel}</p> : null}
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
        {detailHref ? (
          <Link className="detail-link" href={detailHref}>
            {detailLabel}<span aria-hidden="true">→</span>
          </Link>
        ) : null}
        </div>
      </div>

      <style jsx>{`
        .pet-card {
          background: var(--card); border: 1px solid var(--line); border-radius: var(--r-lg);
          overflow: hidden; box-shadow: var(--shadow-sm);
          transition: transform var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out), border-color var(--dur-base) var(--ease-out);
          display: flex; flex-direction: column; height: 100%;
        }
        @media (max-width: 640px) {
          .pet-card { border-radius: var(--r-md); }
        }
        @media (min-width: 1025px) {
          .pet-card { border-radius: var(--r-xl); }
        }
        @media (hover: hover) and (pointer: fine) {
          .pet-card:not(.static):hover { box-shadow: var(--shadow-lift); transform: translateY(-4px); border-color: var(--primary-light); }
          .pet-card:not(.static):hover .thumb :global(img) { transform: scale(1.045); }
        }
        .pet-card:focus-within { border-color: var(--primary-light); box-shadow: var(--shadow-md); }
        .pet-card.static:hover { transform: none; box-shadow: var(--shadow-sm); border-color: var(--line); }
        .thumb {
          height: 152px; background: var(--thumb-bg); position: relative;
          display: flex; align-items: center; justify-content: center; overflow: hidden;
          flex-shrink: 0;
        }
        @media (min-width: 1025px) {
          .thumb { height: 200px; }
        }
        @media (max-width: 640px) {
          .thumb { height: 180px; }
        }
        @media (max-width: 400px) {
          .thumb { height: 160px; }
        }
        .thumb::after {
          content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 50%;
          background: linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 100%);
          pointer-events: none; z-index: 1;
        }
        .thumb :global(img) { transition: transform 0.4s cubic-bezier(.16,1,.3,1); object-fit: cover; width: 100%; height: 100%; }
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
        .badge {
          position: absolute; bottom: 10px; left: 10px; z-index: 2; font-family: var(--font-mono); font-size: 9.5px;
          padding: 5px 10px; border-radius: var(--r-pill); font-weight: 700; letter-spacing: 0.03em;
          backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
          background: var(--surface-2); color: var(--text-primary);
          border: 1px solid var(--border-subtle);
          box-shadow: var(--shadow-xs);
        }
        @media (max-width: 480px) {
          .badge { font-size: 10px; padding: 5px 11px; bottom: 12px; left: 12px; }
        }
        @media (min-width: 1025px) {
          .badge { font-size: 10.5px; padding: 6px 12px; bottom: 14px; left: 14px; }
        }
        .badge.lost { background: var(--accent); color: var(--text-on-accent); border-color: transparent; }
        .badge.found { background: var(--success); color: var(--text-on-accent); border-color: transparent; }
        .similarity {
          position: absolute; bottom: 10px; right: 10px; font-family: var(--font-mono); font-size: 10.5px; font-weight: 600;
          background: var(--surface-3); color: var(--accent); padding: 3px 9px; border-radius: var(--r-pill);
          border: 1px solid var(--border-subtle);
          -webkit-backdrop-filter: blur(4px); backdrop-filter: blur(4px);
        }
        @media (max-width: 480px) {
          .similarity { font-size: 11px; padding: 4px 10px; bottom: 12px; right: 12px; }
        }
        @media (min-width: 1025px) {
          .similarity { font-size: 11px; padding: 4px 11px; bottom: 14px; right: 14px; }
        }
        .info { padding: 14px 15px; flex: 1; display: flex; flex-direction: column; gap: 2px; }
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
          margin-top: auto; padding-top: var(--sp-3);
        }
        .phone, .detail-link {
          display: inline-flex; align-items: center; justify-content: center; gap: 5px; min-height: var(--touch-target);
          color: var(--primary); font-size: 13px; font-weight: 650; text-decoration: none;
          background: var(--eyebrow-bg); border: 1px solid transparent; padding: 6px 12px; border-radius: var(--r-md);
          transition: background var(--dur-fast) ease, color var(--dur-fast) ease, border-color var(--dur-fast) ease;
        }
        .detail-link { justify-content: space-between; background: transparent; border-color: var(--border-subtle); }
        .phone:hover, .detail-link:hover { background: var(--primary); color: var(--text-on-accent); border-color: var(--primary); }
        @media (max-width: 480px) {
          .phone, .detail-link { font-size: 14px; }
        }
        @media (min-width: 1025px) {
          .phone, .detail-link { font-size: 14px; }
        }
        .reveal-btn { cursor: pointer; font-family: inherit; width: 100%; }
        .reveal-btn:focus-visible, .phone:focus-visible, .detail-link:focus-visible { outline: 2px solid var(--border-focus); outline-offset: 2px; }
        @media (prefers-reduced-motion: reduce) {
          .pet-card, .thumb :global(img) { transition: none; }
        }
      `}</style>
    </div>
  );
}
