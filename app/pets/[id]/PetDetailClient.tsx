'use client';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { fetchPetById, markResolved, updatePet, deletePet } from '../../../lib/petService';
import { useAuth } from '../../../lib/useAuth';
import { maskPhone, formatPhone } from '../../../lib/utils';
import { relativeTime } from '../../../lib/relativeTime';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
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
      showToast('🎉 ' + t('detail_resolved_badge').replace('✅ ', ''), 'success');
    } catch (err) {
      showToast('Алдаа гарлаа: ' + getErrorMessage(err), 'error');
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
      showToast('Мэдээлэл хадгалагдлаа', 'success');
    } catch (err) {
      showToast('Алдаа гарлаа: ' + getErrorMessage(err), 'error');
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
      showToast('Алдаа гарлаа: ' + getErrorMessage(err), 'error');
      setDeleting(false);
    }
  }

  if (error) return <p className="text-[var(--alert)]">{t('detail_not_found')}</p>;
  if (!pet) return <p className="text-[var(--muted)]">{t('detail_loading')}</p>;

  const title = `${pet.status === 'lost' ? t('nav_lost') : t('nav_found')} ${pet.type}${pet.name ? ' — ' + pet.name : ''}`;
  const isOwner = user && pet.createdBy && user.id === pet.createdBy;

  return (
    <div className="page-shell page-shell--detail">
      <div className="eyebrow">{pet.status === 'lost' ? t('report_lost_eyebrow') : t('report_found_eyebrow')}</div>
      <h1 className="mb-[var(--sp-1)] text-2xl">{title}</h1>
      {pet.createdAt && (
        <p className="mb-[var(--sp-3)] text-[12.5px] text-[var(--muted)]">🕓 {relativeTime(pet.createdAt)}</p>
      )}

      {pet.resolved && (
        <div className="pop-in mb-[var(--sp-3)] rounded-[var(--r-sm)] border-[1.5px] border-[var(--success)] bg-[var(--success-bg)] px-3.5 py-2 text-[13.5px] font-semibold text-[var(--success-text)]">
          {t('detail_resolved_badge')}
        </div>
      )}

      <div className="mb-[var(--sp-4)] grid grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] items-start gap-[var(--sp-5)] max-[1024px]:grid-cols-1 max-[1024px]:gap-[var(--sp-4)] max-sm:mb-[var(--sp-3)] max-sm:gap-[var(--sp-3)] min-[1440px]:mb-[var(--sp-6)] min-[1440px]:gap-[var(--sp-7)]">
        {/* Зураг — зүүн талд, том */}
        <div className="min-w-0">
          <div className={`relative flex aspect-4/3 w-full items-center justify-center overflow-hidden rounded-[var(--r-md)] bg-[var(--thumb-bg)] ${pet.resolved ? 'opacity-60' : 'opacity-100'}`}>
            {pet.photoURLs.length ? (
              <PetImageGallery images={pet.photoURLs} alt={`${pet.type}${pet.name ? ', ' + pet.name : ''}${pet.color ? ', ' + pet.color : ''}`} />
            ) : (
              <span className="flex size-[120px] items-center justify-center rounded-full border border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--primary)] shadow-[var(--shadow-sm)]"><PetIcon type={pet.type} size={72} /></span>
            )}
          </div>
        </div>

        {/* Мэдээлэл — баруун талд */}
        <div className="flex min-w-0 flex-col">
          {!editing ? (
            <div className="card p-[var(--sp-4)]">
              <p className="mb-[var(--sp-1)]"><b>{t('detail_type')}</b> {pet.type}{pet.color ? `, ${pet.color}` : ''}</p>
              {pet.breed && <p className="mb-[var(--sp-1)]"><b>{t('detail_breed')}</b> {getBreedLabel(pet.breed, lang)}</p>}
              <p className="mb-[var(--sp-1)]"><b>{t('detail_district')}</b> {pet.district}</p>
              <p className="mb-[var(--sp-1)]"><b>{t('detail_place')}</b> {pet.place}</p>
              {pet.hasReward ? (
                <p className="mb-[var(--sp-1)]"><b>🎁 {t('reward_prefix')}</b></p>
              ) : null}
              {revealed ? (
                <a href={`tel:${pet.phone}`} className="mt-[var(--sp-2)] inline-block font-bold text-[var(--primary)]">
                  ☎ {formatPhone(pet.phone)}
                </a>
              ) : (
                <button
                  onClick={() => setRevealed(true)}
                  className="mt-[var(--sp-2)] inline-block cursor-pointer border-0 bg-transparent p-0 font-[family-name:inherit] font-bold text-[var(--primary)]"
                >
                  ☎ {maskPhone(pet.phone)} · {t('detail_show_phone')}
                </button>
              )}
              {/* Чат товч — зөвхөн бусад хэрэглэгчдэд */}
              {!editing && <div className="mt-[var(--sp-3)]"><MessageButton pet={pet} /></div>}
            </div>
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
            <div className="mt-[var(--sp-2)] flex gap-[var(--sp-2)] [&_.btn-base]:flex-1">
              <Button variant="ghost" onClick={() => setEditing(true)} className="flex-1 text-[13px]">
                {t('detail_edit_btn')}
              </Button>
              <Button variant="ghost" onClick={handleDelete} disabled={deleting}
                className="flex-1 justify-center border-[1.5px] border-[var(--alert)] bg-[var(--card)] text-[13px] text-[var(--alert)]">
                {deleting ? t('detail_deleting') : t('detail_delete_btn')}
              </Button>
            </div>
          )}

          {isOwner && !pet.resolved && !editing && (
            <Button
              onClick={handleResolve}
              disabled={resolving}
              variant="primary"
              className="mt-[var(--sp-2)] w-full justify-center bg-[var(--success)] text-white"
            >
              {resolving ? t('detail_resolving') : t('detail_resolve_btn')}
            </Button>
          )}
        </div>
      </div>

      {pet.lat != null && pet.lng != null && (
        <div className="mt-[var(--sp-4)]">
          <p className="mb-[var(--sp-2)] text-[13px] font-semibold text-[var(--primary)]">
            {t('detail_last_seen_loc')}
          </p>
          <LocationMap lat={pet.lat} lng={pet.lng} />
        </div>
      )}

      <ShareButtons url={url} title={title} />

      <p className="mt-[var(--sp-3)] text-xs text-[var(--muted)]">
        {t('detail_share_hint')}
      </p>

      <ReportButton petId={pet.id} />

      <SightingsList petId={pet.id} />

    </div>
  );
}
