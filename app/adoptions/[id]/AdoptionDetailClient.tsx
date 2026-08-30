'use client';
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
    catch (reason) { setError(getErrorMessage(reason) || 'Алдаа'); }
  }, [id]);

  useEffect(() => { void Promise.resolve().then(load); }, [load]);

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

  if (error) return <div className="page-shell page-shell--narrow"><div className="state-panel state-panel--error" role="alert"><span className="state-panel__icon"><Icon name="alert" size={28} /></span><h2>Үрчлүүлэх зар нээгдсэнгүй</h2><p>{error}</p><div className="detail-actions"><Button variant="secondary" onClick={() => void load()}>Дахин оролдох</Button><Button as="link" href="/adoptions" variant="ghost">Жагсаалт руу буцах</Button></div></div></div>;
  if (!adoption) return <div className="page-shell page-shell--narrow"><div className="state-panel" aria-live="polite"><span className="state-panel__icon"><Icon name="heart" size={28} /></span><h2>{t('detail_loading')}</h2><p>Үрчлүүлэх зарын мэдээллийг бэлтгэж байна.</p></div></div>;

  return (
    <div className="page-shell page-shell--detail">
      <div className="back-row"><Button as="link" href="/adoptions" variant="ghost">{t('adoptions_back_to_list')}</Button></div>
      <div className="page-header">
        <div className="eyebrow">{t('adoptions_eyebrow')}</div>
        <h1>{adoption.type}{adoption.name ? ` — ${adoption.name}` : ''}</h1>
        <p className="detail-meta"><Icon name="calendar" size={14} aria-hidden="true" /> {relativeTime(adoption.createdAt)}</p>
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
        <div className="detail-grid">
          <div className="media-box">
            {(adoption.photoURLs?.length || adoption.photoURL) ? (
              <PetImageGallery
                images={adoption.photoURLs?.length ? adoption.photoURLs : [adoption.photoURL!]}
                alt={`${adoption.type}${adoption.name ? ' — ' + adoption.name : ''}`}
              />
            ) : (
              <span style={{
                color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 120, height: 120, background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
                borderRadius: '50%', boxShadow: 'var(--shadow-sm)',
              }}><PetIcon type={adoption.type} size={72} /></span>
            )}
          </div>

          <div className="info-card">
            <p><strong>{t('detail_type')}:</strong> {adoption.type === 'Муур' ? t('type_cat') : adoption.type === 'Нохой' ? t('type_dog') : t('type_other')}</p>
            {adoption.breed && <p><strong>{t('detail_breed')}</strong> {getBreedLabel(adoption.breed, lang)}</p>}
            {adoption.age && <p><strong>{t('detail_age')}</strong> {adoption.age}</p>}
            <p><strong>{t('detail_gender')}</strong> {genderLabel}</p>
            <p><strong>{t('detail_district')}</strong> {adoption.district}</p>
            <p><strong>{t('detail_place')}</strong> {adoption.place}</p>
            {adoption.description && (
              <div style={{ marginTop: 'var(--sp-3)' }}>
                <p><strong>{t('detail_description')}</strong></p>
                <p style={{ whiteSpace: 'pre-wrap' }}>{adoption.description}</p>
              </div>
            )}

            <div className="phone-section">
              {revealed ? (
                <a className="phone-link" href={`tel:${adoption.phone}`}><Icon name="phone" size={15} aria-hidden="true" /> {formatPhone(adoption.phone)}</a>
              ) : adoption.phone ? (
                <Button variant="ghost" onClick={() => setRevealed(true)}><Icon name="phone" size={15} aria-hidden="true" /> {maskPhone(adoption.phone)} · {t('detail_show_phone')}</Button>
              ) : null}
            </div>
            {adoption.createdBy && <Link href={`/users/${adoption.createdBy}`} className="profile-owner-link">Зарын эзний profile →</Link>}

            {isOwner && (
              <div className="owner-actions">
                <Button variant="ghost" onClick={() => setEditing(true)}>{t('detail_edit_btn')}</Button>
                <Button variant="danger" onClick={handleDelete} disabled={deleting}>
                  {deleting ? t('detail_deleting') : t('detail_delete_btn')}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: 'var(--sp-4)' }}>
        <Button as="link" href={`/profiles/adoption/${adoption.id}`} variant="accent">
          {t('profiles_view_profile')}
        </Button>
      </div>

      <AdoptionApplicationPanel adoptionId={adoption.id} ownerId={adoption.createdBy} />

      <div className="share-section">
        <ShareButtons url={url} title={`Үрчлүүлэх ${adoption.type}${adoption.name ? ' — ' + adoption.name : ''}`} />
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
        .profile-owner-link { display: inline-flex; margin-top: var(--sp-3); color: var(--primary); font-weight: 650; text-decoration: none; }
        .owner-actions :global(.btn-base) { flex: 1; min-height: var(--touch-target); }
        .back-row { margin-bottom: var(--sp-3); }
        .share-section { margin-top: var(--sp-6); text-align: center; }
        .share-hint { font-size: 12px; color: var(--muted); margin-top: var(--sp-2); }
      `}</style>
    </div>
  );
}
