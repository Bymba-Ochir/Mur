'use client';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { fetchPetById, markResolved, updatePet, deletePet } from '../../../lib/petService';
import { useAuth } from '../../../lib/useAuth';
import { maskPhone, formatPhone } from '../../../lib/utils';
import { relativeTime } from '../../../lib/relativeTime';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ShareButtons from '../../../components/ShareButtons';
import LocationMap from '../../../components/LocationMap';
import ReportButton from '../../../components/ReportButton';
import MessageButton from '../../../components/MessageButton';
import SightingsList from '../../../components/SightingsList';
import PetIcon from '../../../components/PetIcon';
import Button from '../../../components/ui/Button';
import PetEditForm from '../../../components/PetEditForm';
import type { PetEditValues } from '../../../components/PetEditForm';
import { useToast } from '../../../components/Toast';
import { useLanguage } from '../../../lib/i18n';
import { fireConfetti } from '../../../lib/confetti';
import type { Pet } from '../../../lib/types';
import { getErrorMessage } from '../../../lib/utils';
import { getBreedLabel } from '../../../lib/petBreeds';
import PetImageGallery from '../../../components/PetImageGallery';
import FavoriteButton from '../../../components/FavoriteButton';
import Icon from '../../../components/ui/icons';

// URL-ийн snapshot — share холбоосын зориулалттай (useSyncExternalStore;
// effect-д setUrl хийхгүй, SSR-д хоосон string)
function subscribeLocation(cb: () => void): () => void {
  window.addEventListener('popstate', cb);
  window.addEventListener('hashchange', cb);
  return () => {
    window.removeEventListener('popstate', cb);
    window.removeEventListener('hashchange', cb);
  };
}
const getLocationSnapshot = (): string => window.location.href;
const getLocationServerSnapshot = (): string => '';

export default function PetDetailClient({ id }: { id: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const showToast = useToast();
  const { t, lang } = useLanguage();
  const [pet, setPet] = useState<Pet | null>(null);
  const [error, setError] = useState<string | null>(null);
  const url = useSyncExternalStore(subscribeLocation, getLocationSnapshot, getLocationServerSnapshot);
  const [resolving, setResolving] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<PetEditValues | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function load() {
    setError(null);
    try {
      const p = await fetchPetById(id);
      setPet(p);
      setEditForm({ name: p.name, color: p.color, place: p.place, district: p.district, phone: p.phone });
    } catch (e) {
      setError(getErrorMessage(e));
    }
  }

  async function handleResolve() {
    if (!confirm(t('detail_resolve_confirm'))) return;
    setResolving(true);
    try {
      await markResolved(id);
      await load();
      fireConfetti();
      showToast(t('detail_resolved_badge').replace('✅ ', ''), 'success');
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setResolving(false);
    }
  }

  async function handleSaveEdit(values: PetEditValues) {
    setSaving(true);
    try {
      await updatePet(id, values);
      setEditing(false);
      await load();
      showToast(t('detail_edit_success'), 'success');
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(t('detail_delete_confirm'))) return;
    setDeleting(true);
    try {
      await deletePet(id);
      router.push('/listings');
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
      setDeleting(false);
    }
  }

  if (error) return <div className="page-shell page-shell--narrow"><div className="state-panel state-panel--error" role="alert"><span className="state-panel__icon"><Icon name="alert" size={28} /></span><h2>{t('detail_not_found')}</h2><p>{error}</p><div className="detail-actions"><Button variant="secondary" onClick={() => void load()}>{t('err_retry')}</Button><Button as="link" href="/listings" variant="ghost">{t('detail_back_listings')}</Button></div></div></div>;
  if (!pet) return <div className="page-shell page-shell--detail"><div className="detail-skeleton" aria-live="polite"><span className="sr-only">{t('detail_loading')}</span><div className="skeleton-media skel-row" /><div className="skeleton-copy"><div className="skeleton-line skeleton-line--short skel-row" /><div className="skeleton-line skeleton-line--title skel-row" /><div className="skeleton-line skel-row" /><div className="skeleton-card skel-row" /></div></div></div>;

  const typeLabel = pet.type === 'Нохой' ? t('type_dog') : pet.type === 'Муур' ? t('type_cat') : t('type_other');
  const title = `${pet.status === 'lost' ? t('nav_lost') : t('nav_found')} ${typeLabel}${pet.name ? ' — ' + pet.name : ''}`;
  const isOwner = user && pet.createdBy && user.id === pet.createdBy;

  return (
    <div className="page-shell page-shell--detail">
      <div className="detail-back"><Button as="link" href="/listings" variant="ghost" size="sm">← {t('detail_back_listings')}</Button></div>
      <div className="page-header">
        <p className="eyebrow">{pet.status === 'lost' ? t('report_lost_eyebrow') : t('report_found_eyebrow')}</p>
        <h1>{title}</h1>
        {pet.createdAt && <p className="detail-meta"><Icon name="calendar" size={14} aria-hidden="true" /> {relativeTime(pet.createdAt, lang)}</p>}
      </div>

      {pet.resolved && (
        <div className="pop-in resolved-banner" role="status">
          <Icon name="check" size={18} aria-hidden="true" /> {t('detail_resolved_badge')}
        </div>
      )}

      <a className="contact-shortcut" href="#listing-contact">{t('detail_contact_heading')}</a>
      <div className="detail-grid">
        <figure className={`detail-media${pet.resolved ? ' is-resolved' : ''}`}>
          <div className="media-frame">
            {pet.photoURLs.length ? (
              <PetImageGallery images={pet.photoURLs} alt={`${typeLabel}${pet.name ? ', ' + pet.name : ''}${pet.color ? ', ' + pet.color : ''}`} />
            ) : (
              <div className="media-placeholder">
                <span className="placeholder-icon" aria-hidden="true"><PetIcon type={pet.type} size={72} /></span>
                <span>{t('detail_no_photo')}</span>
              </div>
            )}
          </div>
        </figure>

        <div className="detail-info">
          {!editing ? (
            <section className="info-card" aria-labelledby="pet-info-heading">
              <h2 id="pet-info-heading">{t('detail_info_heading')}</h2>
              <dl className="pet-facts">
                <div><dt>{t('detail_type').replace(':', '')}</dt><dd>{typeLabel}{pet.color ? `, ${pet.color}` : ''}</dd></div>
                {pet.breed && <div><dt>{t('detail_breed').replace(':', '')}</dt><dd>{getBreedLabel(pet.breed, lang)}</dd></div>}
                <div><dt>{t('detail_district').replace(':', '')}</dt><dd>{pet.district}</dd></div>
                <div><dt>{t('detail_place').replace(':', '')}</dt><dd>{pet.place}</dd></div>
                {pet.hasReward && <div className="reward-row"><dt>{t('reward_prefix')}</dt><dd><Icon name="sparkles" size={16} aria-hidden="true" /> {t('reward_prefix')}</dd></div>}
              </dl>

              <div className="contact-block" id="listing-contact" tabIndex={-1}>
                <h3>{t('detail_contact_heading')}</h3>
                {revealed ? (
                  <a href={`tel:${pet.phone}`} className="phone-action" aria-label={`${t('detail_call_phone')}: ${formatPhone(pet.phone)}`}>
                    <Icon name="phone" size={17} aria-hidden="true" /> {formatPhone(pet.phone)}
                  </a>
                ) : (
                  <button onClick={() => setRevealed(true)} className="phone-action">
                    <Icon name="phone" size={17} aria-hidden="true" /> {maskPhone(pet.phone)} · {t('detail_show_phone')}
                  </button>
                )}
                <div className="contact-actions"><MessageButton pet={pet} /><FavoriteButton petId={pet.id} /></div>
                {pet.createdBy && <Link href={`/users/${pet.createdBy}`} className="owner-link">{t('detail_owner_profile')} <span aria-hidden="true">→</span></Link>}
              </div>
            </section>
          ) : (
            editForm && (
              <PetEditForm
                initial={editForm}
                onSave={handleSaveEdit}
                onCancel={() => setEditing(false)}
                saving={saving}
              />
            )
          )}

          {isOwner && !editing && (
            <section className="owner-panel" aria-labelledby="owner-actions-heading">
              <h2 id="owner-actions-heading">{t('detail_owner_actions')}</h2>
              <div className="owner-actions">
                <Button variant="ghost" onClick={() => setEditing(true)}><Icon name="pencil" size={16} aria-hidden="true" /> {t('detail_edit_btn')}</Button>
                <Button variant="danger" onClick={handleDelete} disabled={deleting} aria-busy={deleting}><Icon name="trash" size={16} aria-hidden="true" /> {deleting ? t('detail_deleting') : t('detail_delete_btn')}</Button>
                {!pet.resolved && <Button onClick={handleResolve} disabled={resolving} aria-busy={resolving} variant="secondary"><Icon name="check" size={16} aria-hidden="true" /> {resolving ? t('detail_resolving') : t('detail_resolve_btn')}</Button>}
              </div>
            </section>
          )}
        </div>
      </div>

      {pet.lat != null && pet.lng != null && (
        <section className="detail-section map-section" aria-labelledby="pet-map-heading">
          <div className="section-heading"><div><h2 id="pet-map-heading">{t('detail_map_heading')}</h2><p>{t('detail_last_seen_loc')}</p></div></div>
          <LocationMap lat={pet.lat} lng={pet.lng} label={t('detail_last_seen_loc')} />
        </section>
      )}

      <section className="detail-section share-section" aria-labelledby="pet-share-heading">
        <div className="section-heading"><div><h2 id="pet-share-heading">{t('detail_share_heading')}</h2><p>{t('detail_share_hint')}</p></div></div>
        <ShareButtons url={url} title={title} />
        <ReportButton petId={pet.id} />
      </section>

      <SightingsList petId={pet.id} />

      <style jsx>{`
        .sr-only { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0; }
        .detail-back { margin-bottom: var(--sp-3); }
        .resolved-banner {
          display: flex; align-items: center; gap: var(--sp-2); min-height: 48px;
          margin-bottom: var(--sp-4); padding: var(--sp-2) var(--sp-3);
          color: var(--success-text); background: var(--success-bg);
          border: 1.5px solid var(--success); border-radius: var(--r-md); font-size: 13.5px; font-weight: 650;
        }
        .detail-grid {
          display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(340px, .9fr);
          gap: var(--sp-6); align-items: start; margin-bottom: var(--sp-6);
        }
        .detail-media { min-width: 0; margin: 0; }
        .media-frame {
          position: relative; width: 100%; aspect-ratio: 4 / 3; display: grid; place-items: center;
          overflow: hidden; background: var(--thumb-bg); border: 1px solid var(--border-subtle);
          border-radius: var(--r-xl); box-shadow: var(--shadow-sm);
        }
        .detail-media.is-resolved .media-frame { opacity: .72; filter: saturate(.75); }
        .media-placeholder { display: grid; justify-items: center; gap: var(--sp-3); color: var(--text-secondary); font-size: var(--text-sm); }
        .placeholder-icon {
          width: 124px; height: 124px; display: grid; place-items: center; color: var(--primary);
          background: var(--glass-bg); border: 1px solid var(--glass-border); border-radius: 50%; box-shadow: var(--shadow-sm);
        }
        .detail-info { min-width: 0; display: flex; flex-direction: column; gap: var(--sp-3); }
        .info-card, .owner-panel, .detail-section {
          padding: var(--sp-4); background: var(--surface-2); border: 1px solid var(--border-subtle);
          border-radius: var(--r-lg); box-shadow: var(--shadow-sm);
        }
        .info-card > h2, .owner-panel h2 { margin-bottom: var(--sp-3); font-size: var(--text-lg); }
        .pet-facts { display: grid; margin: 0; }
        .pet-facts > div {
          display: grid; grid-template-columns: minmax(96px, .7fr) minmax(0, 1.3fr); gap: var(--sp-3);
          padding: var(--sp-2) 0; border-bottom: 1px solid var(--border-subtle);
        }
        .pet-facts dt { color: var(--text-secondary); font-size: var(--text-xs); font-weight: 650; }
        .pet-facts dd { margin: 0; color: var(--text-primary); font-size: var(--text-sm); line-height: 1.5; overflow-wrap: anywhere; }
        .reward-row dd { display: flex; align-items: center; gap: var(--sp-1); color: var(--accent); font-weight: 650; }
        .contact-block { padding-top: var(--sp-4); }
        .contact-block h3 { margin-bottom: var(--sp-2); font-size: var(--text-base); }
        .phone-action {
          width: 100%; min-height: var(--touch-target); display: flex; align-items: center; justify-content: center; gap: var(--sp-2);
          padding: var(--sp-2) var(--sp-3); color: var(--text-on-accent); background: var(--grad-accent);
          border: 0; border-radius: var(--r-md); font: 700 var(--text-sm) var(--font-body); cursor: pointer; text-decoration: none;
          transition: transform var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out);
        }
        .phone-action:hover { transform: translateY(-1px); box-shadow: var(--shadow-md); }
        .contact-actions { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: var(--sp-2); margin-top: var(--sp-2); }
        .owner-link {
          min-height: 40px; display: inline-flex; align-items: center; gap: var(--sp-1); margin-top: var(--sp-2);
          color: var(--primary); font-size: var(--text-xs); font-weight: 650; text-decoration: underline;
          text-decoration-color: transparent; text-underline-offset: 4px;
        }
        .owner-link:hover { text-decoration-color: currentColor; }
        .owner-panel { box-shadow: none; }
        .owner-actions { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--sp-2); }
        .owner-actions :global(.btn-base:last-child:nth-child(3)) { grid-column: 1 / -1; }
        .detail-section { margin-top: var(--sp-5); }
        .map-section { padding-bottom: var(--sp-4); }
        .share-section { box-shadow: none; }
        .detail-skeleton { display: grid; grid-template-columns: 1.1fr .9fr; gap: var(--sp-6); align-items: start; }
        .skeleton-media { aspect-ratio: 4 / 3; border-radius: var(--r-xl); }
        .skeleton-copy { display: grid; gap: var(--sp-3); }
        .skeleton-line { height: 14px; border-radius: var(--r-sm); }
        .skeleton-line--short { width: 34%; }
        .skeleton-line--title { width: 76%; height: 30px; }
        .skeleton-card { height: 280px; border-radius: var(--r-lg); }
        @media (max-width: 900px) {
          .detail-grid, .detail-skeleton { grid-template-columns: 1fr; gap: var(--sp-4); }
          .media-frame { aspect-ratio: 16 / 10; }
          .skeleton-media { aspect-ratio: 16 / 10; }
        }
        @media (max-width: 640px) {
          .detail-grid { gap: var(--sp-3); margin-bottom: var(--sp-4); }
          .media-frame { aspect-ratio: 4 / 3; border-radius: var(--r-md); }
          .placeholder-icon { width: 96px; height: 96px; }
          .info-card, .owner-panel, .detail-section { padding: var(--sp-3); border-radius: var(--r-md); }
          .pet-facts > div { grid-template-columns: 1fr; gap: var(--sp-1); }
          .contact-actions { grid-template-columns: 1fr; }
          .owner-actions { grid-template-columns: 1fr; }
          .owner-actions :global(.btn-base) { width: 100%; }
          .owner-actions :global(.btn-base:last-child:nth-child(3)) { grid-column: auto; }
          .detail-section { margin-top: var(--sp-4); }
        }
        @media (prefers-reduced-motion: reduce) { .phone-action { transition: none; } }
      `}</style>
    </div>
  );
}
