'use client';
import { useEffect, useState } from 'react';
import { createSighting, fetchSightings } from '../lib/sightingService';
import { relativeTime } from '../lib/relativeTime';
import { useToast } from './Toast';
import Button from './ui/Button';
import { useLanguage } from '../lib/i18n';
import type { Sighting } from '../lib/types';
import { getErrorMessage } from '../lib/utils';
import { useAuth } from '../lib/useAuth';
import Icon from './ui/icons';

export default function SightingsList({ petId }: { petId: string }) {
  const showToast = useToast();
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const [sightings, setSightings] = useState<Sighting[]>([]);
  const [message, setMessage] = useState('');
  const [place, setPlace] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    void Promise.resolve().then(load);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [petId]);

  async function load() {
    try {
      setLoadError('');
      setSightings(await fetchSightings(petId));
    } catch (err) {
      setLoadError(getErrorMessage(err));
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
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
      showToast(getErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="sightings-section" aria-labelledby="sightings-heading">
      <div className="sightings-header">
        <h2 id="sightings-heading">
          {t('sightings_title')} ({sightings.length})
        </h2>
        <button
          onClick={() => user ? setShowForm((s) => !s) : showToast(t('sightings_login'), 'error')}
          className="sighting-toggle"
          aria-expanded={showForm}
          aria-controls="sighting-form"
        >
          {showForm ? t('sightings_close') : t('sightings_add')}
        </button>
      </div>

      {loadError && <div role="alert" className="sighting-error"><Icon name="alert" size={16} aria-hidden="true" /><span>{loadError || t('sightings_load_error')}</span><button type="button" onClick={() => void load()}>{t('sightings_retry')}</button></div>}

      {showForm && (
        <form id="sighting-form" onSubmit={handleSubmit} className="sighting-form">
          <label htmlFor="sighting-message">{t('sightings_message_label')}</label>
          <textarea id="sighting-message" className="field" value={message} onChange={(e) => setMessage(e.target.value)} placeholder={t('sightings_placeholder')} required maxLength={1000} rows={4} />
          <label htmlFor="sighting-place">{t('sightings_place_label')}</label>
          <input id="sighting-place" className="field" value={place} onChange={(e) => setPlace(e.target.value)} placeholder={t('sightings_place_placeholder')} maxLength={300} />
          <Button type="submit" disabled={submitting} aria-busy={submitting} variant="primary">
            {submitting ? t('sightings_submitting') : t('sightings_submit')}
          </Button>
        </form>
      )}

      {sightings.length === 0 ? (
        <p className="sightings-empty">{t('sightings_none')}</p>
      ) : (
        <div className="sighting-list">
          {sightings.map((s) => (
            <article key={s.id} className="sighting-item">
              <p>{s.message}</p>
              <p className="sighting-meta">
                {s.place && <span><Icon name="pin" size={12} aria-hidden="true" /> {s.place}</span>}
                <span><Icon name="calendar" size={12} aria-hidden="true" /> {relativeTime(s.createdAt, lang)}</span>
              </p>
            </article>
          ))}
        </div>
      )}
      <style jsx>{`
        .sightings-section { margin-top:var(--sp-5); padding:var(--sp-4); background:var(--surface-2); border:1px solid var(--border-subtle); border-radius:var(--r-lg); box-shadow:var(--shadow-sm); }
        .sightings-header { display:flex; align-items:center; justify-content:space-between; gap:var(--sp-3); margin-bottom:var(--sp-3); }
        .sightings-header h2 { font-size:var(--text-lg); }
        .sighting-toggle { min-height:40px; padding:var(--sp-1) var(--sp-3); color:var(--primary); background:var(--eyebrow-bg); border:1px solid var(--glass-border); border-radius:var(--r-md); font:650 var(--text-xs) var(--font-body); cursor:pointer; }
        .sighting-toggle:hover { border-color:var(--primary-light); }
        .sighting-error { display:flex; align-items:center; gap:var(--sp-2); margin-bottom:var(--sp-3); padding:var(--sp-2) var(--sp-3); color:var(--alert); background:color-mix(in srgb,var(--alert) 8%,var(--surface-2)); border-radius:var(--r-md); font-size:var(--text-xs); }
        .sighting-error span { flex:1; }
        .sighting-error button { color:var(--alert); background:none; border:0; font:650 inherit; text-decoration:underline; cursor:pointer; }
        .sighting-form { display:grid; gap:var(--sp-2); margin-bottom:var(--sp-4); padding:var(--sp-3); background:var(--card); border:1px solid var(--border-subtle); border-radius:var(--r-md); }
        .sighting-form label { color:var(--text-secondary); font-size:var(--text-xs); font-weight:650; }
        .sighting-form textarea { min-height:110px; }
        .sightings-empty { padding:var(--sp-4); color:var(--text-secondary); background:var(--card); border:1px dashed var(--border-subtle); border-radius:var(--r-md); text-align:center; font-size:var(--text-sm); }
        .sighting-list { display:grid; gap:var(--sp-2); }
        .sighting-item { padding:var(--sp-3); background:var(--card); border:1px solid var(--border-subtle); border-radius:var(--r-md); }
        .sighting-item > p:first-child { color:var(--text-primary); font-size:var(--text-sm); line-height:1.6; white-space:pre-wrap; }
        .sighting-meta { display:flex; align-items:center; gap:var(--sp-3); flex-wrap:wrap; margin-top:var(--sp-2); color:var(--text-tertiary); font-size:var(--text-xs); }
        .sighting-meta span { display:inline-flex; align-items:center; gap:var(--sp-1); }
        @media(max-width:560px){.sightings-section{margin-top:var(--sp-4);padding:var(--sp-3);border-radius:var(--r-md)}.sightings-header{align-items:stretch;flex-direction:column}.sighting-toggle{width:100%}.sighting-form{padding:var(--sp-2)}}
      `}</style>
    </section>
  );
}
