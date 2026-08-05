'use client';
import type { HTMLAttributes, ReactNode } from 'react';
import PetIcon from './PetIcon';
import { relativeTime } from '../lib/relativeTime';
import { maskPhone, formatReward } from '../lib/utils';
import type { PetStatus, PetType } from '../lib/types';

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
  color: string;
  district: string;
  place: string;
  phone: string;
  /** Зурган node (next/image эсвэл img); өгөхгүй бол PetIcon дүрс харагдана */
  imageNode?: ReactNode;
  createdAt?: string;
  similarity?: number | null;
  /** Шагналын дүн (₮) — байгаа үед карт дээр харуулна */
  reward?: number | null;
  rewardLabel?: string;
  /** false + onRevealPhone = утас далд (masked) эхэлнэ */
  revealed?: boolean;
  onRevealPhone?: () => void;
  /** false бол hover lift / pointer-г унтраана (жишээ: preview карт) */
  interactive?: boolean;
}

export default function PetCardView({
  status, badgeLabel, name, type, color, district, place, phone,
  imageNode, createdAt, similarity, reward, rewardLabel = 'Шагнал',
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
          <span className="emoji" aria-hidden="true"><PetIcon type={type} size={44} /></span>
        )}
        {similarity != null && <span className="similarity">{similarity}% төстэй</span>}
      </div>
      <div className="info">
        <h4>{name || type}</h4>
        <p>{type}{color ? `, ${color}` : ''}</p>
        <p className="place"><span aria-hidden="true">📍</span> {district} — {place}</p>
        {reward ? <p className="reward"><span aria-hidden="true">🎁</span> {rewardLabel}: {formatReward(reward)}</p> : null}
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
            aria-label={`Утсаар холбогдох: ${phone}`}
          >
            <span aria-hidden="true">☎</span> {phone}
          </a>
        ) : null}
      </div>

      <style jsx>{`
        .pet-card {
          background: var(--card); border: 1px solid var(--line); border-radius: var(--r-lg);
          overflow: hidden; cursor: pointer; box-shadow: var(--shadow-sm);
          transition: box-shadow .22s ease, transform .22s ease, border-color .22s ease;
        }
        .pet-card:hover { box-shadow: var(--shadow-lift); transform: translateY(-3px); border-color: transparent; }
        .pet-card:focus-visible {
          outline: 2.5px solid var(--accent); outline-offset: 2px;
        }
        .pet-card.static { cursor: default; }
        .pet-card.static:hover { transform: none; box-shadow: var(--shadow-sm); border-color: var(--line); }
        .thumb {
          height: 152px; background: var(--thumb-bg); position: relative;
          display: flex; align-items: center; justify-content: center; overflow: hidden;
        }
        .thumb :global(img) { transition: transform .35s cubic-bezier(.16,1,.3,1); }
        .pet-card:hover .thumb :global(img) { transform: scale(1.06); }
        .emoji { color: var(--muted); display: flex; opacity: 0.55; }
        .badge {
          position: absolute; top: 10px; left: 10px; font-family: var(--font-mono); font-size: 9.5px;
          padding: 4px 9px; border-radius: var(--r-pill); color: #fff; font-weight: 700; letter-spacing: 0.03em;
          box-shadow: 0 1px 4px rgba(0,0,0,0.2);
        }
        .badge.lost { background: var(--alert); }
        .badge.found { background: var(--success); }
        .similarity {
          position: absolute; bottom: 10px; right: 10px; font-family: var(--font-mono); font-size: 10.5px; font-weight: 600;
          background: rgba(23,34,39,0.8); color: var(--accent); padding: 3px 9px; border-radius: var(--r-pill);
          -webkit-backdrop-filter: blur(4px); backdrop-filter: blur(4px);
        }
        .info { padding: 14px 15px; }
        h4 { font-family: var(--font-display); font-size: 14.5px; font-weight: 600; margin-bottom: 3px; color: var(--primary); }
        p { font-size: 12.5px; color: var(--muted); margin: 3px 0; line-height: 1.4; }
        .reward { display: block; margin-top: 6px; font-size: 12.5px; color: var(--accent); font-weight: 600; }
        .phone { display: block; margin-top: 8px; font-size: 13px; color: var(--primary); font-weight: 600; text-decoration: none; }
        .reveal-btn { background: none; border: none; padding: 0; cursor: pointer; font-family: inherit; text-align: left; }
        .reveal-btn:focus-visible, .phone:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
      `}</style>
    </div>
  );
}
