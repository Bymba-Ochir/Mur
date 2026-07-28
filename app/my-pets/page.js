'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/useAuth';
import {
  createMyPet, fetchMyPets, updateVaccineDate, deleteMyPet, vaccineStatus,
} from '../../lib/vaccineService';
import { subscribeToVaccineReminders, isSubscribed } from '../../lib/push';
import { useToast } from '../../components/Toast';

const STATUS_LABEL = {
  overdue: { text: '⚠️ Хугацаа хэтэрсэн', color: 'var(--alert)' },
  soon: { text: '🔔 Удахгүй болно', color: 'var(--accent)' },
  ok: { text: '✅ Хэвийн', color: 'var(--success)' },
  none: { text: 'Огноо тохируулаагүй', color: 'var(--muted)' },
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

  if (loading) return <p style={{ color: 'var(--muted)' }}>Ачааллаж байна...</p>;

  if (!user) {
    return (
      <div>
        <div className="eyebrow">💉 Миний амьтад</div>
        <h1 style={{ fontSize: 24, marginBottom: 12 }}>Вакцины сануулга</h1>
        <p style={{ color: 'var(--muted)' }}>
          Энэ функцийг ашиглахын тулд эхлээд навигац дээрх "Нэвтрэх" товчоор нэвтэрнэ үү.
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 520 }}>
      <div className="eyebrow">💉 Миний амьтад</div>
      <h1 style={{ fontSize: 24, marginBottom: 8 }}>Вакцины сануулга</h1>
      <p style={{ color: 'var(--muted)', marginBottom: 16, fontSize: 13.5 }}>
        Амьтныхаа дараагийн вакцины огноог тэмдэглэ — хугацаа дөхөхөд push мэдэгдэл авна.
      </p>

      {!subscribed ? (
        <div style={{ background: 'var(--success-bg)', padding: 14, borderRadius: 12, marginBottom: 20 }}>
          <button onClick={handleSubscribe} className="btn" style={{ background: 'var(--brand)', color: '#fff' }}>
            🔔 Сануулгын мэдэгдэл идэвхжүүлэх
          </button>
          {notifyError && <p style={{ color: 'var(--alert)', fontSize: 12, marginTop: 6 }}>{notifyError}</p>}
        </div>
      ) : (
        <p style={{ fontSize: 13, color: 'var(--success)', marginBottom: 16 }}>🔔 Сануулгын мэдэгдэл идэвхтэй</p>
      )}

      <form onSubmit={handleAdd} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }} aria-label="Шинэ амьтан нэмэх">
        <input
          value={name} onChange={(e) => setName(e.target.value)}
          placeholder="Амьтны нэр" required
          aria-label="Амьтны нэр"
          style={{ flex: '1 1 140px', padding: 10, borderRadius: 9, border: '1.5px solid var(--line)' }}
        />
        <select value={type} onChange={(e) => setType(e.target.value)}
          aria-label="Амьтны төрөл"
          style={{ padding: 10, borderRadius: 9, border: '1.5px solid var(--line)' }}>
          <option>Нохой</option>
          <option>Муур</option>
        </select>
        <input
          type="date" value={date} onChange={(e) => setDate(e.target.value)}
          aria-label="Дараагийн вакцины огноо"
          style={{ padding: 10, borderRadius: 9, border: '1.5px solid var(--line)' }}
        />
        <button type="submit" disabled={busy} className="btn" style={{ background: 'var(--accent)', color: 'var(--primary)' }}>
          + Нэмэх
        </button>
      </form>

      {pets.length === 0 ? (
        <p style={{ color: 'var(--muted)' }}>Одоогоор амьтан бүртгээгүй байна.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {pets.map((p) => {
            const st = vaccineStatus(p.nextVaccineDate);
            const label = STATUS_LABEL[st];
            return (
              <div key={p.id} style={{
                background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 12,
                padding: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap',
              }}>
                <div>
                  <b style={{ color: 'var(--primary)' }}>{p.name}</b>
                  <span style={{ color: 'var(--muted)', fontSize: 13 }}> — {p.type}</span>
                  <div style={{ fontSize: 12.5, color: label.color, marginTop: 2 }}>{label.text}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="date"
                    defaultValue={p.nextVaccineDate || ''}
                    onChange={(e) => handleDateChange(p.id, e.target.value)}
                    aria-label={`${p.name}-ийн дараагийн вакцины огноо`}
                    style={{ padding: 6, borderRadius: 8, border: '1.5px solid var(--line)', fontSize: 13 }}
                  />
                  <button onClick={() => handleDelete(p.id)} aria-label={`${p.name}-ийг устгах`} style={{
                    background: 'none', border: 'none', color: 'var(--alert)', cursor: 'pointer', fontSize: 13,
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
