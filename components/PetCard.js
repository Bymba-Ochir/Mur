'use client';
import { useRouter } from 'next/navigation';

export default function PetCard({ pet }) {
  const router = useRouter();

  return (
    <div className="pet-card" onClick={() => router.push(`/pets/${pet.id}`)}>
      <div className="thumb">
        <span className={`badge ${pet.status}`}>
          {pet.status === 'lost' ? 'АЛДСАН' : 'ОЛДСОН'}
        </span>
        {pet.photoURL ? (
          <img src={pet.photoURL} alt={pet.name || pet.type} />
        ) : (
          <span className="emoji">{pet.type === 'Муур' ? '🐈' : '🐕'}</span>
        )}
        {pet.similarity != null && (
          <span className="similarity">{pet.similarity}% төстэй</span>
        )}
      </div>
      <div className="info">
        <h4>{pet.name || pet.type}</h4>
        <p>{pet.type}{pet.color ? `, ${pet.color}` : ''}</p>
        <p className="place">📍 {pet.district} — {pet.place}</p>
        <a
          href={`tel:${pet.phone}`}
          className="phone"
          onClick={(e) => e.stopPropagation()}
        >
          ☎ {pet.phone}
        </a>
      </div>

      <style jsx>{`
        .pet-card {
          background: #fff; border: 1px solid #E1E4DF; border-radius: 14px;
          overflow: hidden; cursor: pointer; transition: box-shadow .15s;
        }
        .pet-card:hover { box-shadow: 0 6px 18px rgba(0,0,0,0.08); }
        .thumb {
          height: 150px; background: #DCE4DD; position: relative;
          display: flex; align-items: center; justify-content: center;
        }
        .thumb img { width: 100%; height: 100%; object-fit: cover; }
        .emoji { font-size: 44px; }
        .badge {
          position: absolute; top: 8px; left: 8px; font-size: 10px;
          padding: 3px 8px; border-radius: 6px; color: #fff; font-weight: 600;
        }
        .badge.lost { background: #C6473B; }
        .badge.found { background: #4C8C6B; }
        .similarity {
          position: absolute; bottom: 8px; right: 8px; font-size: 11px;
          background: rgba(31,75,92,0.9); color: #E8A33D; padding: 3px 8px; border-radius: 6px;
        }
        .info { padding: 12px 14px; }
        h4 { font-size: 14.5px; margin-bottom: 2px; color: #1F4B5C; }
        p { font-size: 12.5px; color: #6B7680; margin: 2px 0; }
        .phone { display: block; margin-top: 6px; font-size: 13px; color: #1F4B5C; font-weight: 600; text-decoration: none; }
      `}</style>
    </div>
  );
}
