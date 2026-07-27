'use client';
import { useEffect, useState } from 'react';
import { fetchPetById, markResolved, updatePet, deletePet } from '../../../lib/petService';
import { useAuth } from '../../../lib/useAuth';
import { maskPhone } from '../../../lib/utils';
import { DISTRICTS } from '../../../lib/districts';
import { useRouter } from 'next/navigation';
import ShareButtons from '../../../components/ShareButtons';
import LocationMap from '../../../components/LocationMap';
import ReportButton from '../../../components/ReportButton';
import { useToast } from '../../../components/Toast';

export default function PetDetailClient({ id }) {
  const { user } = useAuth();
  const router = useRouter();
  const showToast = useToast();
  const [pet, setPet] = useState(null);
  const [error, setError] = useState(null);
  const [url, setUrl] = useState('');
  const [resolving, setResolving] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setUrl(window.location.href);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function load() {
    try {
      const p = await fetchPetById(id);
      setPet(p);
      setEditForm({ name: p.name, color: p.color, place: p.place, district: p.district, phone: p.phone });
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
      showToast('Алдаа гарлаа: ' + err.message, 'error');
    } finally {
      setResolving(false);
    }
  }

  async function handleSaveEdit() {
    setSaving(true);
    try {
      await updatePet(id, editForm);
      setEditing(false);
      await load();
      showToast('Мэдээлэл хадгалагдлаа', 'success');
    } catch (err) {
      showToast('Алдаа гарлаа: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Энэ бичлэгийг бүрмөсөн устгах уу? Энэ үйлдлийг буцаах боломжгүй.')) return;
    setDeleting(true);
    try {
      await deletePet(id);
      router.push('/listings');
    } catch (err) {
      showToast('Алдаа гарлаа: ' + err.message, 'error');
      setDeleting(false);
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

      {!editing ? (
        <div style={{ background: '#fff', border: '1px solid #E1E4DF', borderRadius: 14, padding: 18 }}>
          <p style={{ marginBottom: 6 }}><b>Төрөл:</b> {pet.type}{pet.color ? `, ${pet.color}` : ''}</p>
          <p style={{ marginBottom: 6 }}><b>Дүүрэг:</b> {pet.district}</p>
          <p style={{ marginBottom: 6 }}><b>Байршил:</b> {pet.place}</p>
          {revealed ? (
            <a href={`tel:${pet.phone}`} style={{ display: 'inline-block', marginTop: 8, fontWeight: 700, color: '#1F4B5C' }}>
              ☎ {pet.phone}
            </a>
          ) : (
            <button
              onClick={() => setRevealed(true)}
              style={{ display: 'inline-block', marginTop: 8, fontWeight: 700, color: '#1F4B5C', background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, padding: 0 }}
            >
              ☎ {maskPhone(pet.phone)} · Дугаар харах
            </button>
          )}
        </div>
      ) : (
        <div style={{ background: '#fff', border: '1px solid #E1E4DF', borderRadius: 14, padding: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ fontSize: 12.5, fontWeight: 600, color: '#1F4B5C' }}>Нэр</label>
          <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            style={{ padding: 9, borderRadius: 8, border: '1.5px solid #E1E4DF' }} />
          <label style={{ fontSize: 12.5, fontWeight: 600, color: '#1F4B5C' }}>Өнгө</label>
          <input value={editForm.color} onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
            style={{ padding: 9, borderRadius: 8, border: '1.5px solid #E1E4DF' }} />
          <label style={{ fontSize: 12.5, fontWeight: 600, color: '#1F4B5C' }}>Дүүрэг</label>
          <select value={editForm.district} onChange={(e) => setEditForm({ ...editForm, district: e.target.value })}
            style={{ padding: 9, borderRadius: 8, border: '1.5px solid #E1E4DF' }}>
            {DISTRICTS.map((d) => <option key={d}>{d}</option>)}
          </select>
          <label style={{ fontSize: 12.5, fontWeight: 600, color: '#1F4B5C' }}>Байршил</label>
          <input value={editForm.place} onChange={(e) => setEditForm({ ...editForm, place: e.target.value })}
            style={{ padding: 9, borderRadius: 8, border: '1.5px solid #E1E4DF' }} />
          <label style={{ fontSize: 12.5, fontWeight: 600, color: '#1F4B5C' }}>Утас</label>
          <input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
            style={{ padding: 9, borderRadius: 8, border: '1.5px solid #E1E4DF' }} />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button onClick={handleSaveEdit} disabled={saving} className="btn"
              style={{ background: '#1F4B5C', color: '#fff', flex: 1, justifyContent: 'center' }}>
              {saving ? 'Хадгалж байна...' : 'Хадгалах'}
            </button>
            <button onClick={() => setEditing(false)} className="btn"
              style={{ background: '#E9EFE9', color: '#1F4B5C', flex: 1, justifyContent: 'center' }}>
              Цуцлах
            </button>
          </div>
        </div>
      )}

      {isOwner && !editing && (
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <button onClick={() => setEditing(true)} className="btn"
            style={{ background: '#E9EFE9', color: '#1F4B5C', flex: 1, justifyContent: 'center', fontSize: 13 }}>
            ✏️ Засах
          </button>
          <button onClick={handleDelete} disabled={deleting} className="btn"
            style={{ background: '#fff', color: '#C6473B', border: '1.5px solid #C6473B', flex: 1, justifyContent: 'center', fontSize: 13 }}>
            {deleting ? 'Устгаж байна...' : '🗑 Устгах'}
          </button>
        </div>
      )}

      {isOwner && !pet.resolved && !editing && (
        <button
          onClick={handleResolve}
          disabled={resolving}
          className="btn"
          style={{ marginTop: 10, background: '#4C8C6B', color: '#fff', width: '100%', justifyContent: 'center' }}
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
