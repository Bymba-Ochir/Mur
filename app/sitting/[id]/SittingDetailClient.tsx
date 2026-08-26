'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useSyncExternalStore } from 'react';
import PetIcon from '../../../components/PetIcon';
import Button from '../../../components/ui/Button';
import LocationMap from '../../../components/LocationMap';
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
import { Phone } from 'lucide-react';

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

  if (error) return <p className="text-[var(--alert)]">{error}</p>;
  if (!listing) return <p>{t('detail_loading')}</p>;

  const label = petTypeLabel(listing.petType);

  return (
    <div className="page-shell page-shell--detail">
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
        <div className="grid grid-cols-1 gap-[var(--sp-5)] min-[800px]:grid-cols-2 min-[800px]:gap-[var(--sp-6)]">
          <div className="relative flex aspect-4/3 items-center justify-center overflow-hidden rounded-[var(--r-lg)] bg-[var(--thumb-bg)] max-sm:rounded-[var(--r-md)] min-[1025px]:rounded-[var(--r-xl)]">
            {listing.photoURL ? (
              <Image
                src={listing.photoURL}
                alt={listing.description || label}
                fill
                sizes="(max-width: 800px) 100vw, 520px"
                className="object-cover"
                priority
              />
            ) : (
              <span className="flex size-[120px] items-center justify-center rounded-full border border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--primary)] shadow-[var(--shadow-sm)]"><PetIcon type={listing.petType === 'Бүгд' ? 'Бусад' : listing.petType} size={72} /></span>
            )}
          </div>

          <div className="flex flex-col gap-[var(--sp-2)] rounded-[var(--r-lg)] border border-[var(--line)] bg-[var(--card)] p-[var(--sp-5)] max-sm:rounded-[var(--r-md)] max-sm:p-[var(--sp-4)] min-[1025px]:rounded-[var(--r-xl)] min-[1025px]:p-[var(--sp-6)] [&_p]:my-1 [&_p]:text-sm [&_p]:leading-[1.5] [&_strong]:text-[var(--primary)]">
            <p><strong>{t('sitting_pet_type_label')}</strong> {label}</p>
            {listing.description && (
              <div className="mt-[var(--sp-3)]">
                <p><strong>{t('detail_description')}</strong></p>
                <p className="whitespace-pre-wrap">{listing.description}</p>
              </div>
            )}
            {listing.experience && <p><strong>{t('sitting_detail_experience')}</strong> {listing.experience}</p>}
            {listing.availability && <p><strong>{t('sitting_detail_availability')}</strong> {listing.availability}</p>}
            <p><strong>{t('detail_district')}</strong> {listing.district}</p>
            <p><strong>{t('detail_place')}</strong> {listing.place}</p>
            <p><strong>{t('sitting_detail_price')}</strong> {listing.price != null ? `₮ ${listing.price.toLocaleString()} ${t('sitting_price_per_day')}` : t('sitting_price_free')}</p>

            <div className="mt-[var(--sp-4)]">
              {revealed ? (
                <a className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-[var(--primary)] no-underline" href={`tel:${listing.phone}`}><Phone size={15} aria-hidden="true" /> {formatPhone(listing.phone)}</a>
              ) : listing.phone ? (
                <Button variant="ghost" onClick={() => setRevealed(true)}><Phone size={15} aria-hidden="true" /> {maskPhone(listing.phone)} · {t('detail_show_phone')}</Button>
              ) : null}
            </div>

            {isOwner && (
              <div className="mt-[var(--sp-4)] flex gap-[var(--sp-2)] [&_.btn-base]:min-h-[var(--touch-target)] [&_.btn-base]:flex-1">
                <Button variant="ghost" onClick={() => setEditing(true)}>{t('detail_edit_btn')}</Button>
                <Button variant="danger" onClick={handleDelete} disabled={deleting}>
                  {deleting ? t('detail_deleting') : t('detail_delete_btn')}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {listing.lat != null && listing.lng != null && (
        <div className="mt-[var(--sp-5)]">
          <p className="mb-[var(--sp-2)] text-[13px] font-semibold text-[var(--primary)]">{t('sitting_map_title')}</p>
          <LocationMap lat={listing.lat} lng={listing.lng} />
        </div>
      )}

      <div className="mt-[var(--sp-5)]">
        <Button as="link" href="/sitting" variant="ghost">{t('sitting_back_to_list')}</Button>
      </div>

      <div className="mt-[var(--sp-6)] text-center">
        <ShareButtons url={url} title={`Асрах үйлчилгээ — ${label}`} />
        <p className="mt-[var(--sp-2)] text-xs text-[var(--muted)]">{t('detail_share_hint')}</p>
      </div>

    </div>
  );
}
