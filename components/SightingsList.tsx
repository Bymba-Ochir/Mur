'use client';
import { useEffect, useState } from 'react';
import { createSighting, fetchSightings } from '../lib/sightingService';
import { relativeTime } from '../lib/relativeTime';
import { useToast } from './Toast';
import Button from './ui/Button';
import { useLanguage } from '../lib/i18n';
import type { Sighting } from '../lib/types';
import { getErrorMessage } from '../lib/utils';
import { MapPin } from 'lucide-react';

export default function SightingsList({ petId }: { petId: string }) {
  const showToast = useToast();
  const { t } = useLanguage();
  const [sightings, setSightings] = useState<Sighting[]>([]);
  const [message, setMessage] = useState('');
  const [place, setPlace] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [petId]);

  async function load() {
    setLoadError(false);
    try {
      setSightings(await fetchSightings(petId));
    } catch (err) {
      console.error(err);
      setLoadError(true);
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
      showToast('Алдаа гарлаа: ' + getErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-[var(--sp-4)]">
      <div className="mb-[var(--sp-2)] flex items-center justify-between">
        <p className="text-[13px] font-semibold text-[var(--primary)]">
          {t('sightings_title')} ({sightings.length})
        </p>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="cursor-pointer border-0 bg-transparent text-[12.5px] font-semibold text-[var(--accent)]"
        >
          {showForm ? t('sightings_close') : t('sightings_add')}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-[var(--sp-3)] flex flex-col gap-[var(--sp-2)]">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t('sightings_placeholder')}
            required
            rows={3}
            aria-label="Харсан тухай мэдээлэл"
            className="resize-y rounded-[var(--r-sm)] border-[1.5px] border-[var(--line)] bg-[var(--card)] p-[var(--sp-2)] font-[family-name:inherit] text-[13.5px] text-[var(--ink)]"
          />
          <input
            value={place}
            onChange={(e) => setPlace(e.target.value)}
            placeholder={t('sightings_place_placeholder')}
            aria-label="Харсан байршил"
            className="rounded-[var(--r-sm)] border-[1.5px] border-[var(--line)] bg-[var(--card)] p-[var(--sp-2)] text-[13.5px] text-[var(--ink)]"
          />
          <Button type="submit" disabled={submitting} variant="primary" className="text-[13px]">
            {submitting ? t('sightings_submitting') : t('sightings_submit')}
          </Button>
        </form>
      )}

      {loadError ? (
        <button type="button" onClick={load} className="cursor-pointer border-0 bg-transparent text-[12.5px] font-semibold text-[var(--alert)] underline">Ачаалж чадсангүй. Дахин оролдох</button>
      ) : sightings.length === 0 ? (
        <p className="text-[12.5px] text-[var(--muted)]">{t('sightings_none')}</p>
      ) : (
        <div className="flex flex-col gap-[var(--sp-2)]">
          {sightings.map((s) => (
            <div key={s.id} className="rounded-[var(--r-sm)] border border-[var(--line)] bg-[var(--card)] px-3 py-2.5">
              <p className="text-[13.5px] text-[var(--ink)]">{s.message}</p>
              <p className="mt-[var(--sp-1)] text-[11.5px] text-[var(--muted)]">
                {s.place && <><MapPin size={12} className="mr-1 inline" aria-hidden="true" />{s.place} · </>}{relativeTime(s.createdAt)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
