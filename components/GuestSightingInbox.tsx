'use client';

import { useEffect, useState } from 'react';
import { dateTimeFormat } from '../lib/dateTime';
import type { GuestSightingAction, GuestSightingDetails, GuestSightingSummary } from '../lib/guestSightings';
import { useLanguage } from '../lib/i18n';
import { fetchGuestSightings, reviewGuestSighting } from '../lib/sightingService';
import { getErrorMessage } from '../lib/utils';
import LocationMap from './LocationMap';
import { useToast } from './Toast';
import Button from './ui/Button';

export default function GuestSightingInbox({ petId, resolved, onPublicChange }: {
  petId: string;
  resolved: boolean;
  onPublicChange: () => Promise<void>;
}) {
  const { t, lang } = useLanguage();
  const toast = useToast();
  const [items, setItems] = useState<GuestSightingSummary[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [busy, setBusy] = useState(false);
  const [opened, setOpened] = useState(false);
  const [details, setDetails] = useState<GuestSightingDetails | null>(null);
  const format = dateTimeFormat(lang);

  async function load(more = false) {
    if (busy) return;
    setBusy(true);
    try {
      const page = await fetchGuestSightings(petId, more ? items.at(-1) : undefined);
      setItems(current => more ? [...current, ...page.items] : page.items);
      setHasMore(page.hasMore);
      setOpened(true);
    } catch (error) {
      toast(getErrorMessage(error), 'error');
    } finally {
      setBusy(false);
    }
  }

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
      if (action === 'publish' || action === 'hide') await onPublicChange();
    } catch (error) {
      toast(getErrorMessage(error), 'error');
    } finally {
      setBusy(false);
    }
  }

  return <section id="guest-sightings" className="owner-panel guest-inbox" aria-labelledby="guest-sightings-heading">
    <h3 id="guest-sightings-heading">{t('guest_sighting_inbox')}</h3>
    <p>{t('guest_sighting_inbox_hint')}</p>
    <Button variant="ghost" size="sm" disabled={busy} onClick={() => void load()}>
      {t(opened ? 'guest_sighting_refresh' : 'guest_sighting_check')}
    </Button>
    {opened && items.length === 0 && <p>{t('guest_sighting_empty')}</p>}
    {items.map(item => <article key={item.id} className="guest-inbox-item">
      <p><strong>{t(`guest_sighting_${item.state}`)}</strong> · <time dateTime={item.created_at}>{format.format(new Date(item.created_at))}</time></p>
      {details?.id === item.id ? <>
        <p className="guest-message">{details.message}</p>
        {details.place && <p>{details.place}</p>}
        {details.sighted_at && <p>{t('sightings_time_seen')} <time dateTime={details.sighted_at}>{format.format(new Date(details.sighted_at))}</time></p>}
        {details.lat != null && details.lng != null && <LocationMap lat={details.lat} lng={details.lng} markerVariant="sighting" label={t('sightings_place_label')} />}
        <div className="guest-inbox-actions">
          <Button variant="ghost" size="sm" disabled={busy || Boolean(item.useful_at)} onClick={() => void act(item.id, 'useful')}>
            {t(item.useful_at ? 'guest_sighting_useful_done' : 'guest_sighting_useful')}
          </Button>
          {item.state !== 'published' && !resolved && <Button variant="ghost" size="sm" disabled={busy} onClick={() => void act(item.id, 'publish')}>
            {t('guest_sighting_publish')}
          </Button>}
          {item.state !== 'hidden' && <Button variant="ghost" size="sm" disabled={busy} onClick={() => void act(item.id, 'hide')}>
            {t('guest_sighting_hide')}
          </Button>}
          <Button variant="ghost" size="sm" disabled={busy} onClick={() => setDetails(null)}>{t('sightings_close')}</Button>
        </div>
      </> : <Button variant="ghost" size="sm" disabled={busy} onClick={() => void act(item.id, 'view')}>
        {t(item.first_viewed_at ? 'guest_sighting_view' : 'guest_sighting_view_new')}
      </Button>}
    </article>)}
    {hasMore && <Button variant="ghost" size="sm" disabled={busy} onClick={() => void load(true)}>{t('sightings_load_more')}</Button>}
    <style jsx>{`
      .guest-inbox { margin-top:var(--sp-4); scroll-margin-top:7rem; display:grid; gap:var(--sp-2); }
      .guest-inbox p { color:var(--text-secondary); }
      .guest-inbox-item { padding:var(--sp-2) 0; border-top:1px solid var(--border-subtle); }
      .guest-message { white-space:pre-wrap; overflow-wrap:anywhere; }
      .guest-inbox-actions { display:flex; flex-wrap:wrap; gap:var(--sp-2); margin-top:var(--sp-2); }
    `}</style>
  </section>;
}
