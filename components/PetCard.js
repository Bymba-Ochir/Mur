'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { maskPhone } from '../lib/utils';
import PetIcon from './PetIcon';
import { relativeTime } from '../lib/relativeTime';

export default function PetCard({ pet }) {
  const router = useRouter();
  const [revealed, setRevealed] = useState(false);

  const cardLabel = `${pet.status === 'lost' ? 'Алдсан' : 'Олдсон'} ${pet.type}${pet.name ? ', нэр ' + pet.name : ''}, ${pet.district}, ${pet.place}. Дэлгэрэнгүй үзэх.`;

  function goToDetail() {
    router.push(`/pets/${pet.id}`);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      goToDetail();
    }
  }

  return (
    <div
      className="pet-card"
      onClick={goToDetail}
      onKeyDown={handleKeyDown}
      role="link"
      tabIndex={0}
      aria-label={cardLabel}
    >
      <div className="thumb">
        <span className={`badge ${pet.status}`}>
          {pet.status === 'lost' ? 'АЛДСАН' : 'ОЛДСОН'}
        </span>
        {pet.photoURL ? (
          <Image
            src={pet.photoURL}
            alt={`${pet.type}${pet.name ? ' — ' + pet.name : ''}, ${pet.color || ''}`}
            fill
            sizes="(max-width: 640px) 45vw, 220px"
            style={{ objectFit: 'cover' }}
          />
        ) : (
          <span className="emoji" aria-hidden="true"><PetIcon type={pet.type} size={44} /></span>
        )}
        {pet.similarity != null && (
          <span className="similarity">{pet.similarity}% төстэй</span>
        )}
      </div>
      <div className="info">
        <h4>{pet.name || pet.type}</h4>
        <p>{pet.type}{pet.color ? `, ${pet.color}` : ''}</p>
        <p className="place"><span aria-hidden="true">📍</span> {pet.district} — {pet.place}</p>
        {pet.createdAt && (
          <p className="time"><span aria-hidden="true">🕓</span> {relativeTime(pet.createdAt)}</p>
        )}
        {revealed ? (
          <a
            href={`tel:${pet.phone}`}
            className="phone"
            onClick={(e) => e.stopPropagation()}
            aria-label={`Утсаар холбогдох: ${pet.phone}`}
          >
            <span aria-hidden="true">☎</span> {pet.phone}
          </a>
        ) : (
          <button
            className="phone reveal-btn"
            onClick={(e) => { e.stopPropagation(); setRevealed(true); }}
            aria-label="Утасны дугаарыг харуулах"
          >
            <span aria-hidden="true">☎</span> {maskPhone(pet.phone)} · Дугаар харах
          </button>
        )}
      </div>

      <style jsx>{`
        .pet-card {
          background: var(--card); border: 1px solid var(--line); border-radius: var(--r-md);
          overflow: hidden; cursor: pointer; transition: box-shadow .18s ease, transform .18s ease, border-color .18s ease;
        }
        .pet-card:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); border-color: transparent; }
        .pet-card:focus-visible {
          outline: 2.5px solid var(--accent); outline-offset: 2px;
        }
        .thumb {
          height: 152px; background: var(--thumb-bg); position: relative;
          display: flex; align-items: center; justify-content: center;
        }
        .emoji { color: var(--muted); display: flex; opacity: 0.55; }
        .badge {
          position: absolute; top: 9px; left: 9px; font-family: var(--font-mono); font-size: 9.5px;
          padding: 4px 8px; border-radius: var(--r-sm); color: #fff; font-weight: 700; letter-spacing: 0.03em;
        }
        .badge.lost { background: var(--alert); }
        .badge.found { background: var(--success); }
        .similarity {
          position: absolute; bottom: 9px; right: 9px; font-family: var(--font-mono); font-size: 10.5px; font-weight: 600;
          background: rgba(23,34,39,0.85); color: var(--accent); padding: 3px 8px; border-radius: var(--r-sm);
        }
        .info { padding: 14px 15px; }
        h4 { font-family: var(--font-display); font-size: 14.5px; font-weight: 600; margin-bottom: 3px; color: var(--primary); }
        p { font-size: 12.5px; color: var(--muted); margin: 3px 0; line-height: 1.4; }
        .phone { display: block; margin-top: 8px; font-size: 13px; color: var(--primary); font-weight: 600; text-decoration: none; }
        .reveal-btn { background: none; border: none; padding: 0; cursor: pointer; font-family: inherit; text-align: left; }
        .reveal-btn:focus-visible, .phone:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
      `}</style>
    </div>
  );
}
