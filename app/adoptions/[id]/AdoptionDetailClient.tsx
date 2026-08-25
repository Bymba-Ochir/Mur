'use client';
import { useEffect, useState } from 'react';
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

function subscribeLocation(cb: () => void) {
  window.addEventListener('popstate', cb);
  window.addEventListener('hashchange', cb);
  return () => { window.removeEventListener('popstate', cb); window.removeEventListener('hashchange', cb); };
}

export default function AdoptionDetailClient({ id }: { id: string }) {
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

  useEffect(() => {
    fetchAdoptionById(id)
      .then(setAdoption)
      .catch((err) => setError(getErrorMessage(err) || 'Алдаа'));
  }, [id]);

  const isOwner = user && adoption && adoption.createdBy === user.id;

  const genderLabel = adoption?.gender === 'Эрэгтэй' ? t('gender_male')
    : adoption?.gender === 'Эмэгтэй' ? t('gender_female')
    : t('gender_unknown');

  async function handleSave(values: AdoptionEditValues) {
    setSaving(true);
    try {
      await updateAdoption(id, values);
      setAdoption((prev) => prev ? { ...prev, ...values } : prev);
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
      await deleteAdoption(id);
      router.push('/adoptions');
    } catch (err) {
      showToast(getErrorMessage(err) || 'Алдаа гарлаа', 'error');
      setDeleting(false);
    }
  }

  if (error) return <p className="text-[var(--alert)]">{error}</p>;
  if (!adoption) return <p>{t('detail_loading')}</p>;

  return (
    <div className="page-shell page-shell--detail">
      <div className="page-header">
        <div className="eyebrow">{t('adoptions_eyebrow')}</div>
        <h1>{adoption.type}{adoption.name ? ` — ${adoption.name}` : ''}</h1>
        <p>{relativeTime(adoption.createdAt)}</p>
      </div>

      <div className="mt-[var(--sp-5)]">
        <Button as="link" href="/adoptions" variant="ghost">{t('adoptions_back_to_list')}</Button>
      </div>

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
        <div className="grid grid-cols-1 gap-[var(--sp-5)] min-[800px]:grid-cols-2 min-[800px]:gap-[var(--sp-6)]">
          <div className="relative flex aspect-4/3 items-center justify-center overflow-hidden rounded-[var(--r-lg)] bg-[var(--thumb-bg)] max-sm:rounded-[var(--r-md)] min-[1025px]:rounded-[var(--r-xl)]">
            {(adoption.photoURLs?.length || adoption.photoURL) ? (
              <PetImageGallery
                images={adoption.photoURLs?.length ? adoption.photoURLs : [adoption.photoURL!]}
                alt={`${adoption.type}${adoption.name ? ' — ' + adoption.name : ''}`}
              />
            ) : (
              <span className="flex size-[120px] items-center justify-center rounded-full border border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--primary)] shadow-[var(--shadow-sm)]"><PetIcon type={adoption.type} size={72} /></span>
            )}
          </div>

          <div className="flex flex-col gap-[var(--sp-2)] rounded-[var(--r-lg)] border border-[var(--line)] bg-[var(--card)] p-[var(--sp-5)] max-sm:rounded-[var(--r-md)] max-sm:p-[var(--sp-4)] min-[1025px]:rounded-[var(--r-xl)] min-[1025px]:p-[var(--sp-6)] [&_p]:my-1 [&_p]:text-sm [&_p]:leading-[1.5] [&_strong]:text-[var(--primary)]">
            <p><strong>{t('detail_type')}:</strong> {adoption.type === 'Муур' ? t('type_cat') : adoption.type === 'Нохой' ? t('type_dog') : t('type_other')}</p>
            {adoption.breed && <p><strong>{t('detail_breed')}</strong> {getBreedLabel(adoption.breed, lang)}</p>}
            {adoption.age && <p><strong>{t('detail_age')}</strong> {adoption.age}</p>}
            <p><strong>{t('detail_gender')}</strong> {genderLabel}</p>
            <p><strong>{t('detail_district')}</strong> {adoption.district}</p>
            <p><strong>{t('detail_place')}</strong> {adoption.place}</p>
            {adoption.description && (
              <div className="mt-[var(--sp-3)]">
                <p><strong>{t('detail_description')}</strong></p>
                <p className="whitespace-pre-wrap">{adoption.description}</p>
              </div>
            )}

            <div className="mt-[var(--sp-4)]">
              {revealed ? (
                <a className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-[var(--primary)] no-underline" href={`tel:${adoption.phone}`}>☎ {formatPhone(adoption.phone)}</a>
              ) : adoption.phone ? (
                <Button variant="ghost" onClick={() => setRevealed(true)}>☎ {maskPhone(adoption.phone)} · {t('detail_show_phone')}</Button>
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

      <div className="mt-[var(--sp-4)] text-center">
        <Button as="link" href={`/profiles/adoption/${adoption.id}`} variant="accent">
          {t('profiles_view_profile')}
        </Button>
      </div>

      <div className="mt-[var(--sp-6)] text-center">
        <ShareButtons url={url} title={`Үрчлүүлэх ${adoption.type}${adoption.name ? ' — ' + adoption.name : ''}`} />
        <p className="mt-[var(--sp-2)] text-xs text-[var(--muted)]">{t('detail_share_hint')}</p>
      </div>

    </div>
  );
}
