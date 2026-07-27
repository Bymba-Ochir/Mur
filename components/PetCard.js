'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { maskPhone } from '../lib/utils';
import PetIcon from './PetIcon';
import { relativeTime } from '../lib/relativeTime';

export default function PetCard({ pet }) {
  const router = useRouter();
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="pet-card" onClick={() => router.push(`/pets/${pet.id}`)}>
      <div className="thumb">
        <span className={`badge ${pet.status}`}>
          {pet.status === 'lost' ? 'АЛДСАН' : 'ОЛДСОН'}
        </span>
        {pet.photoURL ? (
          <img src={pet.photoURL} alt={pet.name || pet.type} />
        ) : (
          <span className="emoji"><PetIcon type={pet.type} size={44} /></span>
        )}
        {pet.similarity != null && (
          <span className="similarity">{pet.similarity}% төстэй</span>
        )}
      </div>
      <div className="info">
        <h4>{pet.name || pet.type}</h4>
        <p>{pet.type}{pet.color ? `, ${pet.color}` : ''}</p>
        <p className="place">📍 {pet.district} — {pet.place}</p>
        {pet.createdAt && <p className="time">🕓 {relativeTime(pet.createdAt)}</p>}
        {revealed ? (
          <a
            href={`tel:${pet.phone}`}
            className="phone"
            onClick={(e) => e.stopPropagation()}
          >
            ☎ {pet.phone}
          </a>
        ) : (
          <button
            className="phone reveal-btn"
            onClick={(e) => { e.stopPropagation(); setRevealed(true); }}
          >
            ☎ {maskPhone(pet.phone)} · Дугаар харах
          </button>
        )}
      </div>

      <style jsx>{`
        .pet-card {
          background: var(--card); border: 1px solid var(--line); border-radius: 14px;
          overflow: hidden; cursor: pointer; transition: box-shadow .15s;
        }
        .pet-card:hover { box-shadow: 0 6px 18px rgba(0,0,0,0.08); }
        .thumb {
          height: 150px; background: var(--thumb-bg); position: relative;
          display: flex; align-items: center; justify-content: center;
        }
        .thumb img { width: 100%; height: 100%; object-fit: cover; }
        .emoji { color: var(--muted); display: flex; }
        .badge {
          position: absolute; top: 8px; left: 8px; font-size: 10px;
          padding: 3px 8px; border-radius: 6px; color: #fff; font-weight: 600;
        }
        .badge.lost { background: var(--alert); }
        .badge.found { background: var(--success); }
        .similarity {
          position: absolute; bottom: 8px; right: 8px; font-size: 11px;
          background: rgba(31,75,92,0.9); color: var(--accent); padding: 3px 8px; border-radius: 6px;
        }
        .info { padding: 12px 14px; }
        h4 { font-size: 14.5px; margin-bottom: 2px; color: var(--primary); }
        p { font-size: 12.5px; color: var(--muted); margin: 2px 0; }
        .phone { display: block; margin-top: 6px; font-size: 13px; color: var(--primary); font-weight: 600; text-decoration: none; }
        .reveal-btn { background: none; border: none; padding: 0; cursor: pointer; font-family: inherit; text-align: left; }
      `}</style>
    </div>
  );
}
