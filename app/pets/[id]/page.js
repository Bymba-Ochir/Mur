'use client';
import { useEffect, useState } from 'react';
import { fetchPetById } from '../../../lib/petService';
import ShareButtons from '../../../components/ShareButtons';

export default function PetDetailPage({ params }) {
  const [pet, setPet] = useState(null);
  const [error, setError] = useState(null);
  const [url, setUrl] = useState('');

  useEffect(() => {
    setUrl(window.location.href);
    fetchPetById(params.id).then(setPet).catch((e) => setError(e.message));
  }, [params.id]);

  if (error) return <p style={{ color: '#C6473B' }}>Бичлэг олдсонгүй эсвэл устсан байна.</p>;
  if (!pet) return <p style={{ color: '#6B7680' }}>Ачааллаж байна...</p>;

  const title = `${pet.status === 'lost' ? 'Алдсан' : 'Олдсон'} ${pet.type}${pet.name ? ' — ' + pet.name : ''}`;

  return (
    <div style={{ maxWidth: 480 }}>
      <div className={`eyebrow`}>{pet.status === 'lost' ? '🚨 Алдсан амьтан' : '👀 Олдсон амьтан'}</div>
      <h1 style={{ fontSize: 24, marginBottom: 12 }}>{title}</h1>

      <div style={{
        borderRadius: 14, overflow: 'hidden', background: '#DCE4DD', height: 260,
        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
      }}>
        {pet.photoURL ? (
          <img src={pet.photoURL} alt={pet.type} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{ fontSize: 60 }}>{pet.type === 'Муур' ? '🐈' : '🐕'}</span>
        )}
      </div>

      <div style={{ background: '#fff', border: '1px solid #E1E4DF', borderRadius: 14, padding: 18 }}>
        <p style={{ marginBottom: 6 }}><b>Төрөл:</b> {pet.type}{pet.color ? `, ${pet.color}` : ''}</p>
        <p style={{ marginBottom: 6 }}><b>Дүүрэг:</b> {pet.district}</p>
        <p style={{ marginBottom: 6 }}><b>Байршил:</b> {pet.place}</p>
        <a href={`tel:${pet.phone}`} style={{ display: 'inline-block', marginTop: 8, fontWeight: 700, color: '#1F4B5C' }}>
          ☎ {pet.phone}
        </a>
      </div>

      <ShareButtons url={url} title={title} />

      <p style={{ fontSize: 12, color: '#6B7680', marginTop: 12 }}>
        📱 Messenger, Viber зэрэгт шууд хуваалцахын тулд "Хуваалцах" товчийг ашиглана уу
        (гар утсан дээр систем өөрөө боломжит апп-уудыг жагсаана).
      </p>
    </div>
  );
}
