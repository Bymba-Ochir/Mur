'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/useAuth';
import {
  createMyPet, fetchMyPets, updateVaccineDate, deleteMyPet, vaccineStatus,
} from '../../lib/vaccineService';
import { subscribeToVaccineReminders, isSubscribed } from '../../lib/push';
import { useToast } from '../../components/Toast';

const STATUS_LABEL = {
  overdue: { text: '⚠️ Хугацаа хэтэрсэн', color: '#C6473B' },
  soon: { text: '🔔 Удахгүй болно', color: '#E8A33D' },
  ok: { text: '✅ Хэвийн', color: '#4C8C6B' },
  none: { text: 'Огноо тохируулаагүй', color: '#6B7680' },
};

export default function MyPetsPage() {
  const { user, loading } = useAuth();
  const showToast = useToast();
  const [pets, setPets] = useState([]);
  const [name, setName] = useState('');
  const [type, setType] = useState('Нохой');
  const [date, setDate] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [notifyError, setNotifyError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) load();
    isSubscribed().then(setSubscribed);
  }, [user]);

  async function load() {
    try {
      setPets(await fetchMyPets());
    } catch (err) {
      console.error(err);
    }
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!name) return;
    setBusy(true);
    try {
      await createMyPet({ name, type, nextVaccineDate: date || null });
      setName(''); setDate('');
      await load();
      showToast('Амьтан бүртгэгдлээ', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  async function handleDateChange(id, newDate) {
    await updateVaccineDate(id, newDate);
    load();
  }

  async function handleDelete(id) {
    if (!confirm('Устгах уу?')) return;
    await deleteMyPet(id);
    load();
  }

  async function handleSubscribe() {
    setNotifyError(null);
    try {
      await subscribeToVaccineReminders();
      setSubscribed(true);
    } catch (err) {
      setNotifyError(err.message);
    }
  }

  if (loading) return <p style={{ color: '#6B7680' }}>Ачааллаж байна...</p>;

  if (!user) {
    return (
      <div>
        <div className="eyebrow">💉 Миний амьтад</div>
        <h1 style={{ fontSize: 24, marginBottom: 12 }}>Вакцины сануулга</h1>
        <p style={{ color: '#6B7680' }}>
          Энэ функцийг ашиглахын тулд эхлээд навигац дээрх "Нэвтрэх" товчоор нэвтэрнэ үү.
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 520 }}>
      <div className="eyebrow">💉 Миний амьтад</div>
      <h1 style={{ fontSize: 24, marginBottom: 8 }}>Вакцины сануулга</h1>
      <p style={{ color: '#6B7680', marginBottom: 16, fontSize: 13.5 }}>
        Амьтныхаа дараагийн вакцины огноог тэмдэглэ — хугацаа дөхөхөд push мэдэгдэл авна.
      </p>

      {!subscribed ? (
        <div style={{ background: '#F0F6F1', padding: 14, borderRadius: 12, marginBottom: 20 }}>
          <button onClick={handleSubscribe} className="btn" style={{ background: '#1F4B5C', color: '#fff' }}>
            🔔 Сануулгын мэдэгдэл идэвхжүүлэх
          </button>
          {notifyError && <p style={{ color: '#C6473B', fontSize: 12, marginTop: 6 }}>{notifyError}</p>}
        </div>
      ) : (
        <p style={{ fontSize: 13, color: '#4C8C6B', marginBottom: 16 }}>🔔 Сануулгын мэдэгдэл идэвхтэй</p>
      )}

      <form onSubmit={handleAdd} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        <input
          value={name} onChange={(e) => setName(e.target.value)}
          placeholder="Амьтны нэр" required
          style={{ flex: '1 1 140px', padding: 10, borderRadius: 9, border: '1.5px solid #E1E4DF' }}
        />
        <select value={type} onChange={(e) => setType(e.target.value)}
          style={{ padding: 10, borderRadius: 9, border: '1.5px solid #E1E4DF' }}>
          <option>Нохой</option>
          <option>Муур</option>
        </select>
        <input
          type="date" value={date} onChange={(e) => setDate(e.target.value)}
          style={{ padding: 10, borderRadius: 9, border: '1.5px solid #E1E4DF' }}
        />
        <button type="submit" disabled={busy} className="btn" style={{ background: '#E8A33D', color: '#1F4B5C' }}>
          + Нэмэх
        </button>
      </form>

      {pets.length === 0 ? (
        <p style={{ color: '#6B7680' }}>Одоогоор амьтан бүртгээгүй байна.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {pets.map((p) => {
            const st = vaccineStatus(p.nextVaccineDate);
            const label = STATUS_LABEL[st];
            return (
              <div key={p.id} style={{
                background: '#fff', border: '1px solid #E1E4DF', borderRadius: 12,
                padding: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap',
              }}>
                <div>
                  <b style={{ color: '#1F4B5C' }}>{p.name}</b>
                  <span style={{ color: '#6B7680', fontSize: 13 }}> — {p.type}</span>
                  <div style={{ fontSize: 12.5, color: label.color, marginTop: 2 }}>{label.text}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="date"
                    defaultValue={p.nextVaccineDate || ''}
                    onChange={(e) => handleDateChange(p.id, e.target.value)}
                    style={{ padding: 6, borderRadius: 8, border: '1.5px solid #E1E4DF', fontSize: 13 }}
                  />
                  <button onClick={() => handleDelete(p.id)} style={{
                    background: 'none', border: 'none', color: '#C6473B', cursor: 'pointer', fontSize: 13,
                  }}>
                    Устгах
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
