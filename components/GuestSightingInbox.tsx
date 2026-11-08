'use client';

import { useCallback, useEffect, useState } from 'react';
import GuestSightingPhoto from './GuestSightingPhoto';
import { dateTimeFormat } from '../lib/dateTime';
import type { GuestSightingAction, GuestSightingDetails, GuestSightingSummary } from '../lib/guestSightings';
import { useLanguage } from '../lib/i18n';
import { fetchGuestSightings, reviewGuestSighting } from '../lib/sightingService';
import { getErrorMessage } from '../lib/utils';
import Icon from './ui/icons';
import { useToast } from './Toast';
import Button from './ui/Button';

export default function GuestSightingInbox({ petId, resolved, onPublicChange, onShowOnMap }: {
  petId: string;
  resolved: boolean;
  onPublicChange: () => Promise<void>;
  onShowOnMap: (report: GuestSightingDetails) => void;
}) {
  const { t, lang } = useLanguage();
  const toast = useToast();
  const [items, setItems] = useState<GuestSightingSummary[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [busy, setBusy] = useState(true);
  const [details, setDetails] = useState<GuestSightingDetails | null>(null);
  const format = dateTimeFormat(lang);

  const load = useCallback(async (before?: GuestSightingSummary) => {
    setBusy(true);
    try {
      const page = await fetchGuestSightings(petId, before);
      setItems(current => before ? [...current, ...page.items] : page.items);
      setHasMore(page.hasMore);
    } catch (error) {
      toast(getErrorMessage(error), 'error');
    } finally {
      setBusy(false);
    }
  }, [petId, toast]);

  useEffect(() => {
    void Promise.resolve().then(() => load());
  }, [load]);

  useEffect(() => {
    if (window.location.hash === '#guest-sightings') document.getElementById('guest-sightings')?.scrollIntoView();
  }, []);

  async function act(id: string, action: GuestSightingAction) {
    if (busy) return;
    setBusy(true);
    try {
      const row = await reviewGuestSighting(petId, id, action);
      setDetails(row);
      setItems(current => current.map(item => item.id === id ? row : item));
      if (action !== 'view' && action !== 'useful') await onPublicChange();
    } catch (error) {
      toast(getErrorMessage(error), 'error');
    } finally {
      setBusy(false);
    }
  }

  return <section id="guest-sightings" className="guest-inbox" aria-label={t('guest_sighting_inbox')} aria-busy={busy}>
    <div className="guest-inbox-header">
      <p>{t('guest_sighting_inbox_hint')}</p>
      <Button variant="ghost" size="sm" disabled={busy} onClick={() => void load()}>
        {t('guest_sighting_refresh')}
      </Button>
    </div>
    {busy && items.length === 0 && <p role="status">{t('detail_loading')}</p>}
    {!busy && items.length === 0 && <p>{t('guest_sighting_empty')}</p>}
    {items.map(item => <article key={item.id} className="guest-inbox-item">
      <div className="guest-inbox-meta">
        <strong>{t(`guest_sighting_${item.state}`)}</strong>
        <time dateTime={item.created_at}>{format.format(new Date(item.created_at))}</time>
      </div>
      {details?.id === item.id ? <>
        <p className="guest-message">{details.message}</p>
        {details.hasPhoto && <GuestSightingPhoto key={details.id} petId={petId} reportId={details.id} />}
        {details.place && <p>{details.place}</p>}
        {details.sighted_at && <p>{t('sightings_time_seen')} <time dateTime={details.sighted_at}>{format.format(new Date(details.sighted_at))}</time></p>}
        <div className="guest-inbox-actions">
          {details.lat != null && details.lng != null && <Button variant="ghost" size="sm" onClick={() => onShowOnMap(details)}>
            <Icon name="pin" size={16} aria-hidden="true" /> {t('sightings_map_show')}
          </Button>}
          <Button variant="ghost" size="sm" disabled={busy || Boolean(item.useful_at)} onClick={() => void act(item.id, 'useful')}>
            {t(item.useful_at ? 'guest_sighting_useful_done' : 'guest_sighting_useful')}
          </Button>
          {item.state !== 'published' && !resolved && <Button variant="ghost" size="sm" disabled={busy} onClick={() => void act(item.id, 'publish')}>
            {t('guest_sighting_publish')}
          </Button>}
          {details.photo_share_allowed && !details.photoPublic && !resolved && <Button variant="secondary" size="sm" disabled={busy}
            onClick={() => void act(item.id, 'publish_photo')}>{t('guest_sighting_publish_photo')}</Button>}
          {details.photoPublic && <Button variant="ghost" size="sm" disabled={busy}
            onClick={() => void act(item.id, 'hide_photo')}>{t('guest_sighting_hide_photo')}</Button>}
          {item.state !== 'hidden' && <Button variant="ghost" size="sm" disabled={busy} onClick={() => void act(item.id, 'hide')}>
            {t('guest_sighting_hide')}
          </Button>}
          <Button variant="ghost" size="sm" disabled={busy} onClick={() => setDetails(null)}>{t('sightings_close')}</Button>
        </div>
      </> : <Button variant="ghost" size="sm" disabled={busy} onClick={() => void act(item.id, 'view')}>
        {t(item.first_viewed_at ? 'guest_sighting_view' : 'guest_sighting_view_new')}
      </Button>}
    </article>)}
    {hasMore && <Button variant="ghost" size="sm" disabled={busy} onClick={() => void load(items.at(-1))}>{t('sightings_load_more')}</Button>}
    <style jsx>{`
      .guest-inbox { scroll-margin-top:7rem; display:grid; gap:var(--sp-3); }
      .guest-inbox p { color:var(--text-secondary); font-size:var(--text-sm); }
      .guest-inbox-header { display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:var(--sp-2); }
      .guest-inbox-header p { flex:1 1 16rem; }
      .guest-inbox-item { display:grid; justify-items:start; gap:var(--sp-2); padding:var(--sp-3); border:1px solid var(--border-subtle); border-radius:var(--r-md); min-width:0; }
      .guest-inbox-meta { width:100%; display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:var(--sp-2); font-size:var(--text-xs); color:var(--text-secondary); }
      .guest-inbox-meta strong { padding:3px 8px; border-radius:var(--r-sm); background:var(--eyebrow-bg); color:var(--primary); }
      .guest-inbox > :global(button) { justify-self:start; }
      .guest-message { white-space:pre-wrap; overflow-wrap:anywhere; }
      .guest-inbox-actions { display:flex; flex-wrap:wrap; gap:var(--sp-2); margin-top:var(--sp-2); }
    `}</style>
  </section>;
}


