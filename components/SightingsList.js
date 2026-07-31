'use client';
import { useEffect, useState } from 'react';
import { createSighting, fetchSightings } from '../lib/sightingService';
import { relativeTime } from '../lib/relativeTime';
import { useToast } from './Toast';
import { useLanguage } from '../lib/i18n';

export default function SightingsList({ petId }) {
  const showToast = useToast();
  const { t } = useLanguage();
  const [sightings, setSightings] = useState([]);
  const [message, setMessage] = useState('');
  const [place, setPlace] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [petId]);

  async function load() {
    try {
      setSightings(await fetchSightings(petId));
    } catch (err) {
      console.error(err);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!message.trim()) return;
    setSubmitting(true);
    try {
      await createSighting(petId, { message, place });
      setMessage('');
      setPlace('');
      setShowForm(false);
      await load();
      showToast(t('sightings_thanks'), 'success');
    } catch (err) {
      showToast('Алдаа гарлаа: ' + err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary)' }}>
          {t('sightings_title')} ({sightings.length})
        </p>
        <button
          onClick={() => setShowForm((s) => !s)}
          style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}
        >
          {showForm ? t('sightings_close') : t('sightings_add')}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t('sightings_placeholder')}
            required
            rows={3}
            aria-label="Харсан тухай мэдээлэл"
            style={{ padding: 10, borderRadius: 'var(--r-sm)', border: '1.5px solid var(--line)', fontFamily: 'inherit', fontSize: 13.5, resize: 'vertical', background: 'var(--card)', color: 'var(--ink)' }}
          />
          <input
            value={place}
            onChange={(e) => setPlace(e.target.value)}
            placeholder={t('sightings_place_placeholder')}
            aria-label="Харсан байршил"
            style={{ padding: 9, borderRadius: 'var(--r-sm)', border: '1.5px solid var(--line)', fontSize: 13.5, background: 'var(--card)', color: 'var(--ink)' }}
          />
          <button type="submit" disabled={submitting} className="btn" style={{ background: 'var(--brand)', color: '#fff', fontSize: 13 }}>
            {submitting ? t('sightings_submitting') : t('sightings_submit')}
          </button>
        </form>
      )}

      {sightings.length === 0 ? (
        <p style={{ fontSize: 12.5, color: 'var(--muted)' }}>{t('sightings_none')}</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sightings.map((s) => (
            <div key={s.id} style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 'var(--r-sm)', padding: '10px 12px' }}>
              <p style={{ fontSize: 13.5, color: 'var(--ink)' }}>{s.message}</p>
              <p style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 4 }}>
                {s.place && `📍 ${s.place} · `}{relativeTime(s.createdAt)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
