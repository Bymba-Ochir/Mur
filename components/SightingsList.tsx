'use client';
import { useEffect, useImperativeHandle, useRef, useState, useSyncExternalStore } from 'react';
import type { ReactNode, Ref } from 'react';
import Image from 'next/image';
import { compressImage } from '../lib/imageCompress';
import { SIGHTING_PHOTO_LIMIT, SIGHTING_PHOTO_TYPES } from '../lib/sightingPhoto';
import { createGuestSighting, createSighting } from '../lib/sightingService';
import { getConsentStatus } from '../lib/analyticsConsent';
import GuestSightingChallenge from './GuestSightingChallenge';
import type { SightingFeed } from '../lib/useSightingFeed';
import { sightingMapPinId } from '../lib/sightingPresentation';
import { dateTimeFormat, EMPTY_DATE_TIME, parseDateTimeInput } from '../lib/dateTime';
import { relativeTime } from '../lib/relativeTime';
import { useToast } from './Toast';
import Button from './ui/Button';
import DateTimeField from './ui/DateTimeField';
import LocationMap from './LocationMap';
import { useLanguage } from '../lib/i18n';
import { getErrorMessage } from '../lib/utils';
import { useAuth } from '../lib/useAuth';
import Icon from './ui/icons';
import { createIdempotencyKey } from '../lib/idempotency';

export type SightingsFormHandle = { open: () => void };

type MapPoint = { lat: number; lng: number };
type SightingFeedProps = {
  petId: string;
  guestSiteKey?: string;
  initialCenter?: MapPoint | null;
  feed: SightingFeed;
  onShowOnMap: (pinId: string) => void;
  ownerPanel?: ReactNode;
  ref?: Ref<SightingsFormHandle>;
};

function subscribeToHash(change: () => void) {
  window.addEventListener('hashchange', change);
  return () => window.removeEventListener('hashchange', change);
}

function isGuestInboxLink() {
  return window.location.hash === '#guest-sightings';
}

export default function SightingsList(props: SightingFeedProps) {
  return <SightingFormAndList key={props.petId} {...props} />;
}

function SightingFormAndList({ petId, guestSiteKey, initialCenter, feed, onShowOnMap, ownerPanel, ref }: SightingFeedProps) {
  const showToast = useToast();
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const { sightings, load, loadMore, loadError, hasMore, loadingMore } = feed;
  const [message, setMessage] = useState('');
  const [place, setPlace] = useState('');
  const [observedAt, setObservedAt] = useState(EMPTY_DATE_TIME);
  const [pin, setPin] = useState<MapPoint | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const submitKey = useRef<string | null>(null);
  const countedGuestOpen = useRef(false);
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [challengeAttempt, setChallengeAttempt] = useState(0);
  const guest = !user && Boolean(guestSiteKey);
  const [ownerView, setOwnerView] = useState<boolean | null>(null);
  const notificationLink = useSyncExternalStore(subscribeToHash, isGuestInboxLink, () => false);
  const showInbox = Boolean(ownerPanel && (ownerView ?? notificationLink));

  const formRef = useRef<HTMLFormElement>(null);

  function openForm() {
    if (!user && !guest) {
      showToast(t('sightings_login'), 'error');
      return false;
    }
    if (!showForm && guest && !countedGuestOpen.current && getConsentStatus() === 'accepted') {
      countedGuestOpen.current = true;
      void fetch('/api/sightings/guest', { method: 'PATCH', keepalive: true }).catch(() => undefined);
    }
    setOwnerView(false);
    setShowForm(true);
    return true;
  }

  function toggleForm() {
    if (showForm && !showInbox) {
      setChallengeToken(null);
      setShowForm(false);
    } else {
      openForm();
    }
  }

  useImperativeHandle(ref, () => ({
    open() {
      if (!openForm()) return;
      requestAnimationFrame(() => {
        formRef.current?.scrollIntoView({ block: 'start' });
        formRef.current?.focus({ preventScroll: true });
      });
    },
  }));
  const [photo, setPhoto] = useState<{ file: File; preview: string } | null>(null);
  const [preparingPhoto, setPreparingPhoto] = useState(false);
  const [allowPublicPhoto, setAllowPublicPhoto] = useState(false);
  const previewUrl = photo?.preview;

  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  async function selectPhoto(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file || preparingPhoto || submitting) return;
    if (!SIGHTING_PHOTO_TYPES.some(type => type === file.type) || !file.size || file.size > 10 * 1024 * 1024) {
      showToast(t('sightings_photo_invalid'), 'error');
      return;
    }
    setPreparingPhoto(true);
    try {
      const prepared = await compressImage(file);
      if (prepared.size > SIGHTING_PHOTO_LIMIT) throw new Error('Photo too large after compression');
      submitKey.current = null;
      setAllowPublicPhoto(false);
      setPhoto({ file: prepared, preview: URL.createObjectURL(prepared) });
    } catch {
      showToast(t('sightings_photo_invalid'), 'error');
    } finally {
      setPreparingPhoto(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting || preparingPhoto || !message.trim() || (!user && (!guest || !challengeToken))) return;
    if (Boolean(observedAt.date) !== Boolean(observedAt.time)) {
      showToast(t('date_time_incomplete'), 'error');
      return;
    }
    const observed = parseDateTimeInput(observedAt);
    if (observed && (!Number.isFinite(observed.getTime()) || observed.getTime() > Date.now())) {
      showToast(t('sightings_time_invalid'), 'error');
      return;
    }
    setSubmitting(true);
    try {
      const key = submitKey.current ?? createIdempotencyKey();
      submitKey.current = key;
      const details = {
        message, place, lat: pin?.lat ?? null, lng: pin?.lng ?? null,
        sightedAt: observed?.toISOString() ?? null,
      };
      if (guest && challengeToken) await createGuestSighting(petId, details, key, challengeToken, photo?.file, allowPublicPhoto);
      else await createSighting(petId, details, key, photo?.file);
      submitKey.current = null;
      setMessage('');
      setPlace('');
      setObservedAt(EMPTY_DATE_TIME);
      setPin(null);
      setPhoto(null);
      setAllowPublicPhoto(false);
      setShowPicker(false);
      setShowForm(false);
      if (!guest) await load();
      showToast(t(guest ? 'guest_sighting_thanks' : 'sightings_thanks'), 'success');
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      if (guest) {
        setChallengeToken(null);
        setChallengeAttempt(current => current + 1);
      }
      setSubmitting(false);
    }
  }

  function pickLocation(value: MapPoint | null) {
    submitKey.current = null;
    setPin(value);
  }

  const formatSeenTime = dateTimeFormat(lang);

  return (
    <section className="sightings-section" aria-labelledby="sightings-heading">
      <div className="sightings-header">
        <h2 id="sightings-heading">
          {t('sightings_title')} ({sightings.length}{hasMore ? '+' : ''})
        </h2>
        <button
          onClick={toggleForm}
          className="sighting-toggle"
          aria-expanded={showForm && !showInbox}
          aria-controls="sighting-form"
        >
          {showForm && !showInbox ? t('sightings_close') : t('sightings_add')}
        </button>
      </div>

      {ownerPanel && <div className="sighting-views" role="group" aria-label={t('sightings_views_label')}>
        <Button variant={showInbox ? 'ghost' : 'secondary'} size="sm" aria-pressed={!showInbox}
          aria-controls="sightings-public-panel" onClick={() => setOwnerView(false)}>{t('sightings_public_tab')}</Button>
        <Button variant={showInbox ? 'secondary' : 'ghost'} size="sm" aria-pressed={showInbox}
          aria-controls="sightings-owner-panel" onClick={() => setOwnerView(true)}>{t('guest_sighting_inbox')}</Button>
      </div>}
      {ownerPanel && <div id="sightings-owner-panel" hidden={!showInbox}>{showInbox && ownerPanel}</div>}
      <div id="sightings-public-panel" hidden={showInbox}>

      {loadError && <div role="alert" className="sighting-error"><Icon name="alert" size={16} aria-hidden="true" /><span>{loadError || t('sightings_load_error')}</span><button type="button" onClick={() => void load()}>{t('sightings_retry')}</button></div>}

      {showForm && (
        <form id="sighting-form" ref={formRef} tabIndex={-1} aria-label={t('sightings_message_label')} onSubmit={handleSubmit} className="sighting-form">
          {guest && <p className="sighting-hint">{t('guest_sighting_privacy')}</p>}
          <label htmlFor="sighting-message">{t('sightings_message_label')}</label>
          <textarea id="sighting-message" className="field" value={message} onChange={(e) => { submitKey.current = null; setMessage(e.target.value); }} placeholder={t('sightings_placeholder')} required maxLength={1000} rows={3} />
          <DateTimeField id="sighting" label={t('sightings_time_label')} value={observedAt}
            onChange={value => { submitKey.current = null; setObservedAt(value); }} />
          <label htmlFor="sighting-place">{t('sightings_place_label')} {t('map_optional')}</label>
          <input id="sighting-place" className="field" value={place} onChange={(e) => { submitKey.current = null; setPlace(e.target.value); }} placeholder={t('sightings_place_placeholder')} maxLength={300} />
          <div className="sighting-tools">
            <Button variant="ghost" size="sm" aria-expanded={showPicker} aria-controls="sighting-picker" onClick={() => setShowPicker(value => !value)}>
              <Icon name="pin" size={16} aria-hidden="true" />
              {showPicker ? t('sightings_map_hide') : t('sightings_map_pick')}
            </Button>
            <label className="sighting-photo-picker">
              <input id="sighting-photo" type="file" accept={SIGHTING_PHOTO_TYPES.join(',')}
                aria-label={t('sightings_photo_optional')} disabled={submitting || preparingPhoto} onChange={selectPhoto} />
              <Icon name="camera" size={16} aria-hidden="true" />{t('sightings_photo_add')}
            </label>
            {pin && <>
              <span className="sighting-hint" role="status">{t('sightings_map_selected')}</span>
              <Button variant="ghost" size="sm" onClick={() => pickLocation(null)}>{t('sightings_map_clear')}</Button>
            </>}
          </div>
          <div id="sighting-picker" hidden={!showPicker}>
            {showPicker && <>
              <p className="sighting-hint map-hint">{t(guest ? 'guest_sighting_map_hint' : 'sightings_map_hint')}</p>
              <LocationMap lat={pin?.lat} lng={pin?.lng} initialCenter={initialCenter} editable markerVariant="sighting" onPick={pickLocation} label={t('map_label')} />
            </>}
          </div>
          {preparingPhoto && <p className="sighting-hint" role="status">{t('photo_optimizing')}</p>}
          {photo && <div className="sighting-photo-preview">
            <Image src={photo.preview} alt={t('sightings_photo_alt')} width={112} height={84} unoptimized />
            <Button variant="ghost" size="sm" disabled={submitting || preparingPhoto}
              onClick={() => { submitKey.current = null; setPhoto(null); setAllowPublicPhoto(false); }}>{t('photo_remove')}</Button>
          </div>}
          {guest && photo && <label className="sighting-photo-consent">
            <input type="checkbox" checked={allowPublicPhoto} disabled={submitting} onChange={event => {
              submitKey.current = null;
              setAllowPublicPhoto(event.currentTarget.checked);
            }} />
            {t('guest_sighting_photo_consent')}
          </label>}
          {guest && guestSiteKey && <GuestSightingChallenge key={challengeAttempt} siteKey={guestSiteKey} onToken={setChallengeToken} />}
          <div className="sighting-submit">
            <Button type="submit" disabled={submitting || preparingPhoto || (guest && !challengeToken)} aria-busy={submitting} variant="primary">
              {submitting ? t('sightings_submitting') : t('sightings_submit')}
            </Button>
          </div>
        </form>
      )}

      {sightings.length === 0 ? (
        <p className="sightings-empty">{t('sightings_none')}</p>
      ) : (
        <div className="sighting-list">
          {sightings.map((s) => {
            const pinId = sightingMapPinId(s);
            return (
              <article key={s.id} className="sighting-item">
                <div className="sighting-copy">
                  <p>{s.guestReport ? t('guest_sighting_public') : s.message}</p>
                  <p className="sighting-meta">
                    {s.place && <span><Icon name="pin" size={12} aria-hidden="true" /> {s.place}</span>}
                    {s.sightedAt && <span><Icon name="calendar" size={12} aria-hidden="true" /> {t('sightings_time_seen')} <time dateTime={s.sightedAt}>{formatSeenTime.format(new Date(s.sightedAt))}</time></span>}
                    <span>{t('sightings_time_posted')} <time dateTime={s.createdAt}>{relativeTime(s.createdAt, lang)}</time></span>
                  </p>
                  {pinId && <div className="sighting-item-map">
                    <Button size="sm" variant="ghost" onClick={() => onShowOnMap(pinId)}>
                      <Icon name="pin" size={16} aria-hidden="true" /> {t('sightings_map_show')}
                    </Button>
                  </div>}
                </div>
                {s.photoUrl && <a className="sighting-photo" href={s.photoUrl} target="_blank" rel="noopener noreferrer">
                  <Image src={s.photoUrl} alt={t('sightings_photo_alt')} width={132} height={99} loading="lazy" unoptimized />
                </a>}
              </article>
            );
          })}
        </div>
      )}
      {hasMore && <Button type="button" variant="ghost" onClick={() => void loadMore()} disabled={loadingMore} aria-busy={loadingMore}>
        {loadingMore ? t('sightings_loading_more') : t('sightings_load_more')}
      </Button>}
      </div>
      <style jsx>{`
        .sightings-section { margin-top:var(--sp-5); padding:var(--sp-4); background:var(--surface-2); border:1px solid var(--border-subtle); border-radius:var(--r-lg); box-shadow:var(--shadow-sm); }
        .sightings-header { display:flex; align-items:center; justify-content:space-between; gap:var(--sp-3); margin-bottom:var(--sp-3); }
        .sightings-header h2 { font-size:var(--text-lg); }
        .sighting-views { display:flex; flex-wrap:wrap; gap:var(--sp-2); margin-bottom:var(--sp-3); padding-bottom:var(--sp-3); border-bottom:1px solid var(--border-subtle); }
        .sighting-toggle { min-height:40px; padding:var(--sp-1) var(--sp-3); color:var(--primary); background:var(--eyebrow-bg); border:1px solid var(--glass-border); border-radius:var(--r-md); font:650 var(--text-xs) var(--font-body); cursor:pointer; }
        .sighting-toggle:hover { border-color:var(--primary-light); }
        .sighting-error { display:flex; align-items:center; gap:var(--sp-2); margin-bottom:var(--sp-3); padding:var(--sp-2) var(--sp-3); color:var(--alert); background:color-mix(in srgb,var(--alert) 8%,var(--surface-2)); border-radius:var(--r-md); font-size:var(--text-xs); }
        .sighting-error span { flex:1; }
        .sighting-error button { color:var(--alert); background:none; border:0; font:650 inherit; text-decoration:underline; cursor:pointer; }
        .sighting-photo-consent { display:flex; align-items:flex-start; gap:var(--sp-2); cursor:pointer; }
        .sighting-photo-consent input { flex:none; margin-top:3px; }
        .sighting-form { scroll-margin-top:calc(var(--nav-h) + 24px); display:grid; gap:var(--sp-2); margin-bottom:var(--sp-3); padding-bottom:var(--sp-3); border-bottom:1px solid var(--border-subtle); }
        .sighting-form .sighting-photo-picker { position:relative; display:inline-flex; align-items:center; justify-content:center; gap:var(--sp-2); min-height:36px; padding:var(--sp-1) var(--sp-3); color:var(--primary); border:1.5px solid var(--border-subtle); border-radius:var(--r-md); cursor:pointer; }
        .sighting-photo-picker input { position:absolute; width:1px; height:1px; overflow:hidden; clip-path:inset(50%); }
        .sighting-photo-picker:focus-within { outline:2px solid var(--border-focus); outline-offset:2px; }
        .sighting-photo-picker:has(input:disabled) { opacity:.55; cursor:not-allowed; }
        .sighting-submit { display:flex; justify-content:flex-end; margin-top:var(--sp-1); }
        @media(pointer:coarse) { .sighting-photo-picker { min-height:44px; } }
        .sighting-form label { color:var(--text-secondary); font-size:var(--text-xs); font-weight:650; }
        .sighting-form textarea { min-height:84px; resize:vertical; }
        .sighting-form input { min-width:0; }
        .sighting-tools { display:flex; align-items:center; flex-wrap:wrap; gap:var(--sp-2); }
        .sighting-hint { color:var(--text-secondary); font-size:var(--text-xs); }
        .map-hint { margin-bottom:var(--sp-2); }
        .sighting-item-map { margin-top:var(--sp-2); }
        .sighting-photo-preview { display:flex; flex-wrap:wrap; gap:var(--sp-2); align-items:center; }
        .sighting-photo { display:block; width:clamp(72px, 16vw, 132px); }
        .sighting-photo :global(img) { display:block; width:100%; height:auto; aspect-ratio:4/3; object-fit:cover; border-radius:var(--r-sm); }
        .sighting-photo-preview :global(img) { display:block; max-width:100%; height:auto; border-radius:var(--r-sm); }
        .sightings-empty { margin:0; padding:var(--sp-2) 0; color:var(--text-secondary); font-size:var(--text-sm); }
        .sighting-list { display:grid; gap:var(--sp-2); }
        .sighting-item { display:grid; grid-template-columns:minmax(0,1fr) auto; align-items:start; gap:var(--sp-3); padding:var(--sp-3); border:1px solid var(--border-subtle); border-radius:var(--r-md); }
        .sighting-copy > p:first-child { color:var(--text-primary); font-size:var(--text-sm); line-height:1.6; white-space:pre-wrap; overflow-wrap:anywhere; }
        .sighting-meta { display:flex; align-items:center; gap:var(--sp-3); flex-wrap:wrap; margin-top:var(--sp-2); color:var(--text-tertiary); font-size:var(--text-xs); }
        .sighting-meta span { display:inline-flex; align-items:center; gap:var(--sp-1); }
        @media(max-width:560px){.sightings-section{margin-top:var(--sp-4);padding:var(--sp-3);border-radius:var(--r-md)}.sightings-header{gap:var(--sp-2)}.sighting-toggle{flex-shrink:0}}
      `}</style>
    </section>
  );
}
