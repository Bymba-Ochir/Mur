'use client';
import { useEffect, useState } from 'react';
import { fetchPetById, markResolved } from '../../../lib/petService';
import { useAuth } from '../../../lib/useAuth';
import ShareButtons from '../../../components/ShareButtons';
import LocationMap from '../../../components/LocationMap';
import ReportButton from '../../../components/ReportButton';

export default function PetDetailClient({ id }) {
  const { user } = useAuth();
  const [pet, setPet] = useState(null);
  const [error, setError] = useState(null);
  const [url, setUrl] = useState('');
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    setUrl(window.location.href);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function load() {
    try {
      setPet(await fetchPetById(id));
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleResolve() {
    if (!confirm('Амьтан олдсон гэж тэмдэглэх үү? Энэ бичлэг жагсаалтаас далд болно.')) return;
    setResolving(true);
    try {
      await markResolved(id);
      await load();
    } catch (err) {
      alert('Алдаа гарлаа: ' + err.message);
    } finally {
      setResolving(false);
    }
  }

  if (error) return <p style={{ color: '#C6473B' }}>Бичлэг олдсонгүй эсвэл устсан байна.</p>;
  if (!pet) return <p style={{ color: '#6B7680' }}>Ачааллаж байна...</p>;

  const title = `${pet.status === 'lost' ? 'Алдсан' : 'Олдсон'} ${pet.type}${pet.name ? ' — ' + pet.name : ''}`;
  const isOwner = user && pet.createdBy && user.id === pet.createdBy;

  return (
    <div style={{ maxWidth: 480 }}>
      <div className="eyebrow">{pet.status === 'lost' ? '🚨 Алдсан амьтан' : '👀 Олдсон амьтан'}</div>
      <h1 style={{ fontSize: 24, marginBottom: 12 }}>{title}</h1>

      {pet.resolved && (
        <div style={{ background: '#F0F6F1', border: '1.5px solid #4C8C6B', borderRadius: 10, padding: '8px 14px', marginBottom: 14, color: '#2F6B4A', fontSize: 13.5, fontWeight: 600 }}>
          ✅ Энэ амьтан олдсон гэж тэмдэглэгдсэн байна
        </div>
      )}

      <div style={{
        borderRadius: 14, overflow: 'hidden', background: '#DCE4DD', height: 260,
        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
        opacity: pet.resolved ? 0.6 : 1,
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

      {isOwner && !pet.resolved && (
        <button
          onClick={handleResolve}
          disabled={resolving}
          className="btn"
          style={{ marginTop: 14, background: '#4C8C6B', color: '#fff', width: '100%', justifyContent: 'center' }}
        >
          {resolving ? 'Тэмдэглэж байна...' : '✅ Амьтан олдлоо'}
        </button>
      )}

      {pet.lat != null && pet.lng != null && (
        <div style={{ marginTop: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#1F4B5C', marginBottom: 8 }}>
            📍 Сүүлд харагдсан байршил
          </p>
          <LocationMap lat={pet.lat} lng={pet.lng} />
        </div>
      )}

      <ShareButtons url={url} title={title} />

      <p style={{ fontSize: 12, color: '#6B7680', marginTop: 12 }}>
        📱 Messenger, Viber зэрэгт шууд хуваалцахын тулд "Хуваалцах" товчийг ашиглана уу
        (гар утсан дээр систем өөрөө боломжит апп-уудыг жагсаана).
      </p>

      <ReportButton petId={pet.id} />
    </div>
  );
}
