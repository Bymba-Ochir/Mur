'use client';
import { useListingReturnPath } from '../../../lib/useListingFilters';
import { formatPetAge } from '../../../lib/petAge';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSyncExternalStore } from 'react';
import PetIcon from '../../../components/PetIcon';
import PetImageGallery from '../../../components/PetImageGallery';
import Button from '../../../components/ui/Button';
import AdoptionEditForm from '../../../components/AdoptionEditForm';
import type { AdoptionEditValues } from '../../../components/AdoptionEditForm';
import ShareButtons from '../../../components/ShareButtons';
import { useAuth } from '../../../lib/useAuth';
import { useToast } from '../../../components/Toast';
import { useLanguage } from '../../../lib/i18n';
import { fetchAdoptionById, updateAdoption, deleteAdoption } from '../../../lib/adoptionService';
import { relativeTime } from '../../../lib/relativeTime';
import { maskPhone, formatPhone, getErrorMessage } from '../../../lib/utils';
import type { Adoption } from '../../../lib/types';
import { getBreedLabel } from '../../../lib/petBreeds';
import AdoptionApplicationPanel from '../../../components/AdoptionApplicationPanel';
import Icon from '../../../components/ui/icons';

function subscribeLocation(cb: () => void) {
  window.addEventListener('popstate', cb);
  window.addEventListener('hashchange', cb);
  return () => { window.removeEventListener('popstate', cb); window.removeEventListener('hashchange', cb); };
}

export default function AdoptionDetailClient({ id }: { id: string }) {
  const returnPath = useListingReturnPath("/adoptions");
  const router = useRouter();
  const { user } = useAuth();
  const showToast = useToast();
  const { t, lang } = useLanguage();

  const [adoption, setAdoption] = useState<Adoption | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const url = useSyncExternalStore(subscribeLocation, () => typeof window !== 'undefined' ? window.location.href : '');

  const load = useCallback(async () => {
    setError(null);
    try { setAdoption(await fetchAdoptionById(id)); }
    catch (reason) { setError(getErrorMessage(reason) || t('form_generic_error')); }
  }, [id, t]);

  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  const isOwner = user && adoption && adoption.createdBy === user.id;

  const genderLabel = adoption?.gender === 'Эрэгтэй' ? t('gender_male')
    : adoption?.gender === 'Эмэгтэй' ? t('gender_female')
    : t('gender_unknown');
  const typeLabel = adoption?.type === 'Муур' ? t('type_cat') : adoption?.type === 'Нохой' ? t('type_dog') : t('type_other');

  async function handleSave(values: AdoptionEditValues) {
    setSaving(true);
    try {
      await updateAdoption(id, values);
      setAdoption((prev) => prev ? { ...prev, ...values } : prev);
      setEditing(false);
      showToast(t('detail_save'), 'success');
    } catch (err) {
      showToast(getErrorMessage(err) || t('form_generic_error'), 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(t('detail_delete_confirm'))) return;
    setDeleting(true);
    try {
      await deleteAdoption(id);
      router.push('/adoptions');
    } catch (err) {
      showToast(getErrorMessage(err) || t('form_generic_error'), 'error');
      setDeleting(false);
    }
  }

  if (error) return <div className="page-shell page-shell--narrow"><div className="state-panel state-panel--error" role="alert"><span className="state-panel__icon"><Icon name="alert" size={28} /></span><h2>{t('adoption_detail_error_title')}</h2><p>{error}</p><div className="detail-actions"><Button variant="secondary" onClick={() => void load()}>{t('err_retry')}</Button><Button as="link" href={returnPath} variant="ghost">{t('adoptions_back_to_list')}</Button></div></div></div>;
  if (!adoption) return <div className="page-shell page-shell--narrow"><div className="detail-skeleton" aria-busy="true" aria-label={t('detail_loading')}><span className="skeleton-media" /><div className="skeleton-lines"><span /><span /><span /><span /></div><style jsx>{`.detail-skeleton{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(18rem,.9fr);gap:var(--sp-6)}.skeleton-media,.skeleton-lines{min-height:24rem;border-radius:var(--r-xl);background:var(--surface-3);animation:pulse 1.4s ease-in-out infinite}.skeleton-lines{display:grid;align-content:start;gap:var(--sp-4);padding:var(--sp-6)}.skeleton-lines span{height:2.5rem;border-radius:var(--r-sm);background:var(--line)}.skeleton-lines span:first-child{width:62%}@keyframes pulse{50%{opacity:.58}}@media(max-width:900px){.detail-skeleton{grid-template-columns:1fr}.skeleton-media{min-height:18rem}.skeleton-lines{min-height:16rem}}@media(prefers-reduced-motion:reduce){.skeleton-media,.skeleton-lines{animation:none}}`}</style></div></div>;

  return (
    <div className="page-shell page-shell--detail">
      <div className="back-row"><Button as="link" href={returnPath} variant="ghost"><Icon name="arrowLeft" size={18} />{t('adoptions_back_to_list').replace('← ', '')}</Button></div>
      <header className="page-header detail-header">
        <p className="eyebrow">{t('adoptions_eyebrow')}</p>
        <h1>{typeLabel}{adoption.name ? ` — ${adoption.name}` : ''}</h1>
        <p className="detail-meta"><Icon name="calendar" size={14} aria-hidden="true" /> {relativeTime(adoption.createdAt, lang)}</p>
      </header>

      {!editing && <a className="contact-shortcut" href="#listing-contact">{t('detail_show_phone')}</a>}
      {editing ? (
        <AdoptionEditForm
          initial={{
            name: adoption.name,
            type: adoption.type,
            age: adoption.age,
            gender: adoption.gender,
            breed: adoption.breed,
            description: adoption.description,
            district: adoption.district,
            place: adoption.place,
            phone: adoption.phone,
          }}
          onSave={handleSave}
          onCancel={() => setEditing(false)}
          saving={saving}
        />
      ) : (
        <div className="detail-grid">
          <div className="media-box">
            {(adoption.photoURLs?.length || adoption.photoURL) ? (
              <PetImageGallery
                images={adoption.photoURLs?.length ? adoption.photoURLs : [adoption.photoURL!]}
                alt={`${adoption.type}${adoption.name ? ' — ' + adoption.name : ''}`}
              />
            ) : (
              <span className="pet-placeholder"><PetIcon type={adoption.type} size={72} /></span>
            )}
          </div>

          <section className="info-card" aria-labelledby="adoption-facts-title">
            <h2 id="adoption-facts-title">{t('detail_information')}</h2>
            <dl className="adoption-facts">
              <div><dt>{t('detail_type').replace(':', '')}</dt><dd>{typeLabel}</dd></div>
              {adoption.breed && <div><dt>{t('detail_breed').replace(':', '')}</dt><dd>{getBreedLabel(adoption.breed, lang)}</dd></div>}
              {adoption.age && <div><dt>{t('detail_age').replace(':', '')}</dt><dd>{formatPetAge(adoption.age, lang)}</dd></div>}
              <div><dt>{t('detail_gender').replace(':', '')}</dt><dd>{genderLabel}</dd></div>
              <div><dt>{t('detail_district').replace(':', '')}</dt><dd>{adoption.district}</dd></div>
              <div><dt>{t('detail_place').replace(':', '')}</dt><dd>{adoption.place}</dd></div>
            </dl>
            {adoption.description && (
              <section className="description-block"><h3>{t('detail_description').replace(':', '')}</h3><p>{adoption.description}</p></section>
            )}

            <div className="phone-section" id="listing-contact" tabIndex={-1}>
              {revealed ? (
                <a className="phone-link" href={`tel:${adoption.phone}`}><Icon name="phone" size={15} aria-hidden="true" /> {formatPhone(adoption.phone)}</a>
              ) : adoption.phone ? (
                <Button variant="ghost" onClick={() => setRevealed(true)}><Icon name="phone" size={15} aria-hidden="true" /> {maskPhone(adoption.phone)} · {t('detail_show_phone')}</Button>
              ) : null}
            </div>
            {adoption.createdBy && <Link href={`/users/${adoption.createdBy}`} className="profile-owner-link">{t('adoption_owner_profile')}<span aria-hidden="true">→</span></Link>}

            {isOwner && (
              <div className="owner-actions">
                <Button variant="ghost" onClick={() => setEditing(true)}>{t('detail_edit_btn')}</Button>
                <Button variant="danger" onClick={handleDelete} disabled={deleting}>
                  {deleting ? t('detail_deleting') : t('detail_delete_btn')}
                </Button>
              </div>
            )}
          </section>
        </div>
      )}

      <div className="profile-action">
        <Button as="link" href={`/profiles/adoption/${adoption.id}`} variant="accent">
          {t('adoption_view_profile')}
        </Button>
      </div>

      <AdoptionApplicationPanel adoptionId={adoption.id} ownerId={adoption.createdBy} />

      <div className="share-section">
        <ShareButtons url={url} title={`${t('nav_adoptions')} ${typeLabel}${adoption.name ? ' — ' + adoption.name : ''}`} />
        <p className="share-hint">{t('detail_share_hint')}</p>
      </div>

      <style jsx>{`
        .detail-header { margin-bottom: var(--sp-6); }
        .detail-grid { display: grid; grid-template-columns: minmax(0,1.1fr) minmax(20rem,.9fr); gap: var(--sp-6); align-items:start; }
        .media-box {
          aspect-ratio: 4/3; background: var(--thumb-bg); border-radius: var(--r-lg); overflow: hidden;
          position: relative; display: flex; align-items: center; justify-content: center;
        }
        .pet-placeholder { display:flex;align-items:center;justify-content:center;width:7.5rem;height:7.5rem;color:var(--primary);background:var(--glass-bg);border:1px solid var(--glass-border);border-radius:50%;box-shadow:var(--shadow-sm); }
        @media (max-width: 640px) { .media-box { border-radius: var(--r-md); } }
        @media (min-width: 1025px) { .media-box { border-radius: var(--r-xl); } }
        .info-card {
          background: var(--card); border: 1px solid var(--line); border-radius: var(--r-lg);
          padding: var(--sp-6); display: flex; flex-direction: column; gap: var(--sp-3); box-shadow:var(--shadow-sm);
        }
        @media (max-width: 640px) { .info-card { border-radius: var(--r-md); padding: var(--sp-4); } }
        @media (min-width: 1025px) { .info-card { border-radius: var(--r-xl); padding: var(--sp-6); } }
        .info-card h2 { margin:0;font-family:var(--font-heading);font-size:var(--text-xl); }
        .adoption-facts { display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:var(--sp-2);margin:0; }
        .adoption-facts div { padding:var(--sp-3);background:var(--surface-2);border:1px solid var(--line);border-radius:var(--r-sm); }
        dt { color:var(--muted);font-size:var(--text-xs);font-weight:700; }
        dd { margin:var(--sp-1) 0 0;color:var(--ink);font-size:var(--text-sm);font-weight:700; }
        .description-block { padding-top:var(--sp-3);border-top:1px solid var(--line); }
        .description-block h3 { margin:0 0 var(--sp-2);color:var(--primary);font-size:var(--text-sm); }
        .description-block p { margin:0;color:var(--muted);font-size:var(--text-sm);line-height:1.7;white-space:pre-wrap; }
        .phone-section { margin-top: var(--sp-4); }
        .phone-link {
          display: inline-flex; align-items: center; gap: var(--sp-2); min-height:var(--touch-target);padding:var(--sp-2) var(--sp-3);
          font-size: var(--text-sm); font-weight: 700; color: var(--primary); background:var(--eyebrow-bg);border-radius:var(--r-sm);text-decoration: none;
        }
        .owner-actions { display: flex; gap: var(--sp-2); margin-top: var(--sp-4); }
        .profile-owner-link { display: inline-flex;align-items:center;gap:var(--sp-1);width:max-content;min-height:var(--touch-target);padding:var(--sp-2) 0;color:var(--primary);font-weight:700;text-decoration:none; }
        .owner-actions :global(.btn-base) { flex: 1; min-height: var(--touch-target); }
        .back-row { margin-bottom: var(--sp-3); }
        .profile-action { display:flex;justify-content:center;margin-top:var(--sp-5); }
        .share-section { margin-top: var(--sp-6); text-align: center; }
        .share-hint { font-size: 12px; color: var(--muted); margin-top: var(--sp-2); }
        @media(max-width:900px){.detail-grid{grid-template-columns:1fr}.media-box{aspect-ratio:16/11}.info-card{padding:var(--sp-5)}}
        @media(max-width:520px){.adoption-facts{grid-template-columns:1fr}.owner-actions{flex-direction:column}.owner-actions :global(.btn-base){width:100%}}
      `}</style>
    </div>
  );
}
