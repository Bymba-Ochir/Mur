'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useSyncExternalStore } from 'react';
import PetIcon from '../../../components/PetIcon';
import SittingEditForm from '../../../components/SittingEditForm';
import type { SittingEditValues } from '../../../components/SittingEditForm';
import ShareButtons from '../../../components/ShareButtons';
import { useAuth } from '../../../lib/useAuth';
import { useToast } from '../../../components/Toast';
import { useLanguage } from '../../../lib/i18n';
import { fetchSittingListingById, updateSittingListing, deleteSittingListing } from '../../../lib/sittingService';
import { relativeTime } from '../../../lib/relativeTime';
import { maskPhone, formatPhone, normalizePhone, getErrorMessage } from '../../../lib/utils';
import type { SittingListing, SittingPetType } from '../../../lib/types';

function subscribeLocation(cb: () => void) {
  window.addEventListener('popstate', cb);
  window.addEventListener('hashchange', cb);
  return () => { window.removeEventListener('popstate', cb); window.removeEventListener('hashchange', cb); };
}

export default function SittingDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const showToast = useToast();
  const { t } = useLanguage();

  const [listing, setListing] = useState<SittingListing | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const url = useSyncExternalStore(subscribeLocation, () => typeof window !== 'undefined' ? window.location.href : '');

  useEffect(() => {
    fetchSittingListingById(id)
      .then(setListing)
      .catch((err) => setError(getErrorMessage(err) || 'Алдаа'));
  }, [id]);

  const isOwner = user && listing && listing.userId === user.id;

  function petTypeLabel(petType: SittingPetType): string {
    return petType === 'Бүгд' ? t('sitting_pet_type_all')
      : petType === 'Нохой' ? t('type_dog')
      : petType === 'Муур' ? t('type_cat')
      : t('type_other');
  }

  async function handleSave(values: SittingEditValues) {
    setSaving(true);
    const fields = {
      petType: values.petType,
      description: values.description,
      experience: values.experience,
      availability: values.availability,
      price: values.price ? Number(values.price) : null,
      district: values.district,
      place: values.place,
      phone: normalizePhone(values.phone),
    };
    try {
      await updateSittingListing(id, fields);
      setListing((prev) => prev ? { ...prev, ...fields } : prev);
      setEditing(false);
      showToast(t('detail_save'), 'success');
    } catch (err) {
      showToast(getErrorMessage(err) || 'Алдаа гарлаа', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(t('detail_delete_confirm'))) return;
    setDeleting(true);
    try {
      await deleteSittingListing(id);
      router.push('/sitting');
    } catch (err) {
      showToast(getErrorMessage(err) || 'Алдаа гарлаа', 'error');
      setDeleting(false);
    }
  }

  if (error) return <p style={{ color: 'var(--alert)' }}>{error}</p>;
  if (!listing) return <p>{t('detail_loading')}</p>;

  const label = petTypeLabel(listing.petType);

  return (
    <div>
      <div className="page-header">
        <div className="eyebrow">{t('sitting_eyebrow')}</div>
        <h1>{label}</h1>
        <p>{relativeTime(listing.createdAt)}</p>
      </div>

      {editing ? (
        <SittingEditForm
          initial={{
            petType: listing.petType,
            description: listing.description,
            experience: listing.experience,
            availability: listing.availability,
            price: listing.price != null ? String(listing.price) : '',
            district: listing.district,
            place: listing.place,
            phone: listing.phone,
          }}
          onSave={handleSave}
          onCancel={() => setEditing(false)}
          saving={saving}
        />
      ) : (
        <div className="detail-grid">
          <div className="media-box">
            {listing.photoURL ? (
              <Image
                src={listing.photoURL}
                alt={listing.description || label}
                fill
                sizes="(max-width: 800px) 100vw, 520px"
                style={{ objectFit: 'cover' }}
                priority
              />
            ) : (
              <span style={{
                color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 120, height: 120, background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
                borderRadius: '50%', boxShadow: 'var(--shadow-sm)',
              }}><PetIcon type={listing.petType === 'Бүгд' ? 'Бусад' : listing.petType} size={72} /></span>
            )}
          </div>

          <div className="info-card">
            <p><strong>{t('sitting_pet_type_label')}</strong> {label}</p>
            {listing.description && (
              <div style={{ marginTop: 'var(--sp-3)' }}>
                <p><strong>{t('detail_description')}</strong></p>
                <p style={{ whiteSpace: 'pre-wrap' }}>{listing.description}</p>
              </div>
            )}
            {listing.experience && <p><strong>{t('sitting_detail_experience')}</strong> {listing.experience}</p>}
            {listing.availability && <p><strong>{t('sitting_detail_availability')}</strong> {listing.availability}</p>}
            <p><strong>{t('detail_district')}</strong> {listing.district}</p>
            <p><strong>{t('detail_place')}</strong> {listing.place}</p>
            <p><strong>{t('sitting_detail_price')}</strong> {listing.price != null ? `₮ ${listing.price.toLocaleString()} ${t('sitting_price_per_day')}` : t('sitting_price_free')}</p>

            <div className="phone-section">
              {revealed ? (
                <a className="phone-link" href={`tel:${listing.phone}`}>☎ {formatPhone(listing.phone)}</a>
              ) : listing.phone ? (
                <button className="btn btn-ghost" onClick={() => setRevealed(true)}>☎ {maskPhone(listing.phone)} · {t('detail_show_phone')}</button>
              ) : null}
            </div>

            {isOwner && (
              <div className="owner-actions">
                <button className="btn btn-ghost" onClick={() => setEditing(true)}>{t('detail_edit_btn')}</button>
                <button className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
                  {deleting ? t('detail_deleting') : t('detail_delete_btn')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="back-row">
        <Link href="/sitting" className="btn btn-ghost" style={{ display: 'inline-flex' }}>{t('sitting_back_to_list')}</Link>
      </div>

      <div className="share-section">
        <ShareButtons url={url} title={`Асрах үйлчилгээ — ${label}`} />
        <p className="share-hint">{t('detail_share_hint')}</p>
      </div>

      <style jsx>{`
        .detail-grid { display: grid; grid-template-columns: 1fr; gap: var(--sp-5); }
        @media (min-width: 800px) { .detail-grid { grid-template-columns: 1fr 1fr; gap: var(--sp-6); } }
        .media-box {
          aspect-ratio: 4/3; background: var(--thumb-bg); border-radius: var(--r-lg); overflow: hidden;
          position: relative; display: flex; align-items: center; justify-content: center;
        }
        @media (max-width: 640px) { .media-box { border-radius: var(--r-md); } }
        @media (min-width: 1025px) { .media-box { border-radius: var(--r-xl); } }
        .info-card {
          background: var(--card); border: 1px solid var(--line); border-radius: var(--r-lg);
          padding: var(--sp-5); display: flex; flex-direction: column; gap: var(--sp-2);
        }
        @media (max-width: 640px) { .info-card { border-radius: var(--r-md); padding: var(--sp-4); } }
        @media (min-width: 1025px) { .info-card { border-radius: var(--r-xl); padding: var(--sp-6); } }
        p { font-size: 14px; margin: 4px 0; line-height: 1.5; }
        strong { color: var(--primary); }
        .phone-section { margin-top: var(--sp-4); }
        .phone-link {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 15px; font-weight: 600; color: var(--primary); text-decoration: none;
        }
        .owner-actions { display: flex; gap: var(--sp-2); margin-top: var(--sp-4); }
        .owner-actions .btn { flex: 1; min-height: var(--touch-target); }
        .back-row { margin-top: var(--sp-5); }
        .share-section { margin-top: var(--sp-6); text-align: center; }
        .share-hint { font-size: 12px; color: var(--muted); margin-top: var(--sp-2); }
      `}</style>
    </div>
  );
}
