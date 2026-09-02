'use client';
import type { HTMLAttributes, ReactNode } from 'react';
import Link from 'next/link';
import PetIcon from './PetIcon';
import Icon from './ui/icons';
import { relativeTime } from '../lib/relativeTime';
import { maskPhone, formatPhone } from '../lib/utils';
import type { SittingPetType } from '../lib/types';

export interface SittingCardViewProps extends HTMLAttributes<HTMLElement> {
  badgeLabel: string; petType: SittingPetType; petTypeLabel?: string; description: string;
  district: string; place: string; experience: string; availability: string;
  price: number | null; phone: string; imageNode?: ReactNode; createdAt?: string;
  revealed?: boolean; onRevealPhone?: () => void; interactive?: boolean;
  showPhoneLabel?: string; callPhoneLabel?: string; freeLabel?: string; perDayLabel?: string;
  detailHref?: string; detailLabel?: string; language?: 'mn' | 'en';
}

export default function SittingCardView({
  badgeLabel, petType, petTypeLabel, description, district, place, experience, availability,
  price, phone, imageNode, createdAt, revealed = true, onRevealPhone, interactive = true,
  showPhoneLabel = 'Дугаар харах', callPhoneLabel = 'Утсаар холбогдох', freeLabel = 'Үнэгүй',
  perDayLabel = '/ өдөр', detailHref, detailLabel = 'Дэлгэрэнгүй', language = 'mn', ...containerProps
}: SittingCardViewProps) {
  const showMasked = Boolean(phone && !revealed && onRevealPhone);
  const iconType = petType === 'Бүгд' ? 'Бусад' : petType;
  const title = description.trim().slice(0, 72) || petTypeLabel || petType;
  return (
    <article className={`sitting-card${interactive ? '' : ' static'}`} {...containerProps}>
      <div className="thumb"><span className="badge">{badgeLabel}</span>{imageNode ?? <span className="pet-placeholder" aria-hidden="true"><PetIcon type={iconType} size={56} /></span>}</div>
      <div className="info">
        <h3>{title}</h3><p className="pet-type">{petTypeLabel || petType}</p>
        {experience && <p className="clamp-line">{experience}</p>}{availability && <p className="clamp-line">{availability}</p>}
        <p className="place"><Icon name="pin" size={14} aria-hidden="true" /><span>{district} — {place}</span></p>
        <p className={`price${price == null ? ' free' : ''}`}>{price != null ? <>₮ {price.toLocaleString(language === 'mn' ? 'mn-MN' : 'en-US')} <span>{perDayLabel}</span></> : freeLabel}</p>
        {createdAt && <p className="time"><Icon name="calendar" size={14} aria-hidden="true" />{relativeTime(createdAt, language)}</p>}
        <div className="card-actions">
          {showMasked ? <button className="phone" type="button" onClick={() => onRevealPhone?.()} aria-label={showPhoneLabel}><Icon name="phone" size={14} aria-hidden="true" />{maskPhone(phone)} · {showPhoneLabel}</button>
            : phone ? <a className="phone" href={`tel:${phone}`} aria-label={`${callPhoneLabel}: ${formatPhone(phone)}`}><Icon name="phone" size={14} aria-hidden="true" />{formatPhone(phone)}</a> : null}
          {detailHref && <Link className="detail-link" href={detailHref}>{detailLabel}<span aria-hidden="true">→</span></Link>}
        </div>
      </div>
      <style jsx>{`
        .sitting-card{display:flex;flex-direction:column;height:100%;overflow:hidden;background:var(--card);border:1px solid var(--line);border-radius:var(--r-xl);box-shadow:var(--shadow-sm);transition:transform var(--dur-base) var(--ease-out),box-shadow var(--dur-base) var(--ease-out),border-color var(--dur-base) var(--ease-out)}
        @media(hover:hover) and (pointer:fine){.sitting-card:not(.static):hover{transform:translateY(-4px);border-color:var(--primary-light);box-shadow:var(--shadow-lift)}.sitting-card:not(.static):hover .thumb :global(img){transform:scale(1.045)}}
        .sitting-card:focus-within{border-color:var(--primary-light);box-shadow:var(--shadow-md)}
        .thumb{position:relative;display:flex;align-items:center;justify-content:center;height:200px;overflow:hidden;background:var(--thumb-bg);flex:0 0 auto}.thumb::after{content:'';position:absolute;inset:auto 0 0;height:48%;z-index:1;background:linear-gradient(to top,rgba(0,0,0,.42),transparent);pointer-events:none}.thumb :global(img){width:100%;height:100%;object-fit:cover;transition:transform .4s cubic-bezier(.16,1,.3,1)}
        .pet-placeholder{display:flex;align-items:center;justify-content:center;width:6rem;height:6rem;color:var(--primary);background:var(--glass-bg);border:1px solid var(--glass-border);border-radius:50%;box-shadow:var(--shadow-sm)}.badge{position:absolute;bottom:var(--sp-3);left:var(--sp-3);z-index:2;padding:6px 12px;color:var(--text-on-accent);background:var(--primary);border-radius:var(--r-pill);font-family:var(--font-mono);font-size:10px;font-weight:800;letter-spacing:.05em}
        .info{display:flex;flex:1;flex-direction:column;padding:var(--sp-5)}h3{display:-webkit-box;overflow:hidden;margin:0 0 var(--sp-2);color:var(--ink);font-family:var(--font-display);font-size:var(--text-xl);line-height:var(--lh-tight);-webkit-box-orient:vertical;-webkit-line-clamp:2}p{margin:0;color:var(--muted);font-size:var(--text-sm);line-height:1.5}.pet-type{color:var(--primary);font-weight:750}.clamp-line{display:-webkit-box;overflow:hidden;margin-top:var(--sp-1);-webkit-box-orient:vertical;-webkit-line-clamp:1}
        .place,.time{display:flex;align-items:center;gap:var(--sp-2);margin-top:var(--sp-2)}.place :global(svg),.time :global(svg){flex:0 0 auto}.place span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.price{margin-top:var(--sp-3);color:var(--accent-deep);font-weight:800}.price.free{color:var(--success)}.price span{color:var(--muted);font-size:var(--text-xs);font-weight:500}.time{font-size:var(--text-xs)}
        .card-actions{display:flex;align-items:center;gap:var(--sp-2);margin-top:auto;padding-top:var(--sp-4);flex-wrap:wrap}.phone,.detail-link{display:inline-flex;align-items:center;gap:var(--sp-1);min-height:var(--touch-target);border-radius:var(--r-pill);font:inherit;font-size:var(--text-sm);font-weight:700;text-decoration:none}.phone{padding:var(--sp-2) var(--sp-3);color:var(--primary);background:var(--eyebrow-bg);border:0;cursor:pointer}.phone:hover{color:var(--text-on-accent);background:var(--primary)}.detail-link{margin-left:auto;padding:var(--sp-2);color:var(--primary);border-radius:var(--r-sm)}.detail-link:hover{background:var(--eyebrow-bg)}.phone:focus-visible,.detail-link:focus-visible{outline:2px solid var(--border-focus);outline-offset:2px}.static .card-actions{display:none}
        @media(max-width:640px){.sitting-card{border-radius:var(--r-md)}.thumb{height:180px}.info{padding:var(--sp-4)}}@media(max-width:400px){.thumb{height:160px}.card-actions{align-items:stretch;flex-direction:column}.phone,.detail-link{width:100%;justify-content:center;margin-left:0}}
      `}</style>
    </article>
  );
}
