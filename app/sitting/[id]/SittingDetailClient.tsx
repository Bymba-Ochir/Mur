'use client';
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import PetIcon from '../../../components/PetIcon';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/ui/icons';
import LocationMap from '../../../components/LocationMap';
import SittingEditForm from '../../../components/SittingEditForm';
import type { SittingEditValues } from '../../../components/SittingEditForm';
import ShareButtons from '../../../components/ShareButtons';
import SittingBookingPanel from '../../../components/SittingBookingPanel';
import { useAuth } from '../../../lib/useAuth';
import { useToast } from '../../../components/Toast';
import { useLanguage } from '../../../lib/i18n';
import { fetchSittingListingById, updateSittingListing, deleteSittingListing } from '../../../lib/sittingService';
import { relativeTime } from '../../../lib/relativeTime';
import { maskPhone, formatPhone, normalizePhone, getErrorMessage } from '../../../lib/utils';
import type { SittingListing, SittingPetType } from '../../../lib/types';

function subscribeLocation(callback: () => void) { window.addEventListener('popstate', callback); window.addEventListener('hashchange', callback); return () => { window.removeEventListener('popstate', callback); window.removeEventListener('hashchange', callback); }; }

export default function SittingDetailClient({ id }: { id: string }) {
  const router = useRouter(); const { user } = useAuth(); const showToast = useToast(); const { t, lang } = useLanguage();
  const [listing, setListing] = useState<SittingListing | null>(null); const [error, setError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false); const [editing, setEditing] = useState(false); const [saving, setSaving] = useState(false); const [deleting, setDeleting] = useState(false);
  const url = useSyncExternalStore(subscribeLocation, () => window.location.href, () => '');

  const load = useCallback(async () => { setError(null); try { setListing(await fetchSittingListingById(id)); } catch (reason) { setError(getErrorMessage(reason) || t('form_generic_error')); } }, [id, t]);
  useEffect(() => { void Promise.resolve().then(load); }, [load]);
  const isOwner = Boolean(user && listing && listing.userId === user.id);
  const typeLabel = (petType: SittingPetType) => petType === 'Бүгд' ? t('sitting_pet_type_all') : petType === 'Нохой' ? t('type_dog') : petType === 'Муур' ? t('type_cat') : t('type_other');

  async function handleSave(values: SittingEditValues) {
    setSaving(true); const fields = { ...values, price: values.price ? Number(values.price) : null, phone: normalizePhone(values.phone) };
    try { await updateSittingListing(id, fields); setListing((current) => current ? { ...current, ...fields } : current); setEditing(false); showToast(t('detail_save'), 'success'); }
    catch (reason) { showToast(getErrorMessage(reason) || t('form_generic_error'), 'error'); } finally { setSaving(false); }
  }
  async function handleDelete() { if (!confirm(t('detail_delete_confirm'))) return; setDeleting(true); try { await deleteSittingListing(id); router.push('/sitting'); } catch (reason) { showToast(getErrorMessage(reason) || t('form_generic_error'), 'error'); setDeleting(false); } }

  if (error) return <div className="page-shell page-shell--narrow"><div className="state-panel state-panel--error" role="alert"><span className="state-panel__icon"><Icon name="alert" size={28} /></span><h2>{t('sitting_detail_error_title')}</h2><p>{error}</p><div className="detail-actions"><Button variant="secondary" onClick={() => void load()}>{t('err_retry')}</Button><Button as="link" href="/sitting" variant="ghost">{t('detail_back_listings')}</Button></div></div></div>;
  if (!listing) return <div className="page-shell page-shell--detail"><div className="detail-skeleton" aria-busy="true" aria-label={t('detail_loading')}><div className="skeleton media-skeleton" /><div className="skeleton info-skeleton" /><p>{t('sitting_detail_loading_desc')}</p></div><style jsx>{`.detail-skeleton{display:grid;grid-template-columns:1.1fr .9fr;gap:var(--sp-6)}.skeleton{min-height:24rem;border-radius:var(--r-xl);background:linear-gradient(90deg,var(--surface-2),var(--overcast),var(--surface-2));background-size:200% 100%;animation:shimmer 1.4s infinite}.detail-skeleton p{grid-column:1/-1;color:var(--muted);text-align:center}@keyframes shimmer{to{background-position:-200% 0}}@media(max-width:900px){.detail-skeleton{grid-template-columns:1fr}.skeleton{min-height:18rem}}@media(prefers-reduced-motion:reduce){.skeleton{animation:none}}`}</style></div>;

  const label = typeLabel(listing.petType);
  return (
    <div className="page-shell page-shell--detail">
      <div className="back-row"><Button as="link" href="/sitting" variant="ghost"><Icon name="arrowLeft" size={17} />{t('detail_back_listings')}</Button></div>
      <header className="page-header detail-header"><p className="eyebrow">{t('sitting_eyebrow')}</p><h1>{label}</h1><p className="detail-meta"><Icon name="calendar" size={14} aria-hidden="true" />{relativeTime(listing.createdAt, lang)}</p></header>
      {editing ? <SittingEditForm initial={{ petType: listing.petType, description: listing.description, experience: listing.experience, availability: listing.availability, price: listing.price == null ? '' : String(listing.price), district: listing.district, place: listing.place, phone: listing.phone }} onSave={handleSave} onCancel={() => setEditing(false)} saving={saving} /> : (
        <div className="detail-grid">
          <div className="media-box">{listing.photoURL ? <Image src={listing.photoURL} alt={listing.description || label} fill sizes="(max-width: 900px) 100vw, 56vw" priority /> : <span className="pet-placeholder"><PetIcon type={listing.petType === 'Бүгд' ? 'Бусад' : listing.petType} size={72} /></span>}</div>
          <section className="info-card" aria-labelledby="sitting-facts-title"><h2 id="sitting-facts-title">{t('sitting_detail_information')}</h2>
            <dl className="facts"><div><dt>{t('sitting_pet_type_label')}</dt><dd>{label}</dd></div>{listing.experience && <div><dt>{t('sitting_detail_experience').replace(':', '')}</dt><dd>{listing.experience}</dd></div>}{listing.availability && <div><dt>{t('sitting_detail_availability').replace(':', '')}</dt><dd>{listing.availability}</dd></div>}<div><dt>{t('detail_district').replace(':', '')}</dt><dd>{listing.district}</dd></div><div><dt>{t('detail_place').replace(':', '')}</dt><dd>{listing.place}</dd></div><div><dt>{t('sitting_detail_price').replace(':', '')}</dt><dd>{listing.price == null ? t('sitting_price_free') : `₮ ${listing.price.toLocaleString(lang === 'mn' ? 'mn-MN' : 'en-US')} ${t('sitting_price_per_day')}`}</dd></div></dl>
            {listing.description && <section className="description-block"><h3>{t('detail_description').replace(':', '')}</h3><p>{listing.description}</p></section>}
            <div className="phone-section">{revealed ? <a className="phone-link" href={`tel:${listing.phone}`}><Icon name="phone" size={15} aria-hidden="true" />{formatPhone(listing.phone)}</a> : listing.phone ? <Button variant="ghost" onClick={() => setRevealed(true)}><Icon name="phone" size={15} aria-hidden="true" />{maskPhone(listing.phone)} · {t('detail_show_phone')}</Button> : null}</div>
            <Link href={`/users/${listing.userId}`} className="profile-owner-link">{t('sitting_provider_profile')}<span aria-hidden="true">→</span></Link>
            {isOwner && <div className="owner-actions"><Button variant="ghost" onClick={() => setEditing(true)}>{t('detail_edit_btn')}</Button><Button variant="danger" onClick={handleDelete} disabled={deleting}>{deleting ? t('detail_deleting') : t('detail_delete_btn')}</Button></div>}
          </section>
        </div>
      )}
      {listing.lat != null && listing.lng != null && <section className="map-section" aria-labelledby="sitting-map-title"><h2 id="sitting-map-title">{t('sitting_map_title')}</h2><LocationMap lat={listing.lat} lng={listing.lng} /></section>}
      <SittingBookingPanel listingId={listing.id} sitterId={listing.userId} dailyPrice={listing.price} />
      <div className="share-section"><ShareButtons url={url} title={`${t('sitting_title')} — ${label}`} /><p>{t('detail_share_hint')}</p></div>
      <style jsx>{`
        .back-row{margin-bottom:var(--sp-3)}.detail-header{margin-bottom:var(--sp-6)}.detail-grid{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(20rem,.9fr);gap:var(--sp-6);align-items:start}.media-box{position:relative;display:flex;align-items:center;justify-content:center;aspect-ratio:4/3;overflow:hidden;background:var(--thumb-bg);border-radius:var(--r-xl)}.media-box :global(img){object-fit:cover}.pet-placeholder{display:flex;align-items:center;justify-content:center;width:7.5rem;height:7.5rem;color:var(--primary);background:var(--glass-bg);border:1px solid var(--glass-border);border-radius:50%;box-shadow:var(--shadow-sm)}
        .info-card{display:flex;flex-direction:column;gap:var(--sp-3);padding:var(--sp-6);background:var(--card);border:1px solid var(--line);border-radius:var(--r-xl);box-shadow:var(--shadow-sm)}.info-card h2,.map-section h2{margin:0;font-family:var(--font-heading);font-size:var(--text-xl)}.facts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:var(--sp-2);margin:0}.facts div{padding:var(--sp-3);background:var(--surface-2);border:1px solid var(--line);border-radius:var(--r-sm)}dt{color:var(--muted);font-size:var(--text-xs);font-weight:700}dd{margin:var(--sp-1) 0 0;color:var(--ink);font-size:var(--text-sm);font-weight:700;overflow-wrap:anywhere}.description-block{padding-top:var(--sp-3);border-top:1px solid var(--line)}.description-block h3{margin:0 0 var(--sp-2);color:var(--primary);font-size:var(--text-sm)}.description-block p{margin:0;color:var(--muted);font-size:var(--text-sm);line-height:1.7;white-space:pre-wrap;overflow-wrap:anywhere}
        .phone-section{margin-top:var(--sp-3)}.phone-link{display:inline-flex;align-items:center;gap:var(--sp-2);min-height:var(--touch-target);padding:var(--sp-2) var(--sp-3);color:var(--primary);background:var(--eyebrow-bg);border-radius:var(--r-sm);font-size:var(--text-sm);font-weight:700;text-decoration:none}.profile-owner-link{display:inline-flex;align-items:center;gap:var(--sp-1);width:max-content;min-height:var(--touch-target);padding:var(--sp-2) 0;color:var(--primary);font-weight:700;text-decoration:none}.owner-actions{display:flex;gap:var(--sp-2);margin-top:var(--sp-3)}.owner-actions :global(.btn-base){flex:1}.map-section{margin-top:var(--sp-6);padding:var(--sp-5);background:var(--card);border:1px solid var(--line);border-radius:var(--r-xl)}.map-section h2{margin-bottom:var(--sp-3)}.share-section{margin-top:var(--sp-6);text-align:center}.share-section p{margin-top:var(--sp-2);color:var(--muted);font-size:var(--text-xs)}
        @media(max-width:900px){.detail-grid{grid-template-columns:1fr}.media-box{aspect-ratio:16/11}.info-card{padding:var(--sp-5)}}@media(max-width:640px){.media-box,.info-card,.map-section{border-radius:var(--r-md)}.map-section{padding:var(--sp-4)}}@media(max-width:520px){.facts{grid-template-columns:1fr}.owner-actions{flex-direction:column}.owner-actions :global(.btn-base){width:100%}}
      `}</style>
    </div>
  );
}
