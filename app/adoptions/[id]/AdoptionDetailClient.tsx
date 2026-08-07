'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useSyncExternalStore } from 'react';
import PetIcon from '../../../components/PetIcon';
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

function subscribeLocation(cb: () => void) {
  window.addEventListener('popstate', cb);
  window.addEventListener('hashchange', cb);
  return () => { window.removeEventListener('popstate', cb); window.removeEventListener('hashchange', cb); };
}

export default function AdoptionDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const showToast = useToast();
  const { t } = useLanguage();

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

  if (error) return <p style={{ color: 'var(--alert)' }}>{error}</p>;
  if (!adoption) return <p>{t('detail_loading')}</p>;

  return (
    <div>
      <div className="page-header">
        <div className="eyebrow">{t('adoptions_eyebrow')}</div>
        <h1>{adoption.type}{adoption.name ? ` — ${adoption.name}` : ''}</h1>
        <p>{relativeTime(adoption.createdAt)}</p>
      </div>

      <div className="back-row">
        <Link href="/adoptions" className="btn btn-ghost" style={{ display: 'inline-flex' }}>{t('adoptions_back_to_list')}</Link>
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
            {adoption.photoURL ? (
              <Image
                src={adoption.photoURL}
                alt={`${adoption.type}${adoption.name ? ' — ' + adoption.name : ''}`}
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
              }}><PetIcon type={adoption.type} size={72} /></span>
            )}
          </div>

          <div className="info-card">
            <p><strong>{t('detail_type')}:</strong> {adoption.type === 'Муур' ? t('type_cat') : adoption.type === 'Нохой' ? t('type_dog') : t('type_other')}</p>
            {adoption.breed && <p><strong>{t('detail_breed')}</strong> {adoption.breed}</p>}
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
                <a className="phone-link" href={`tel:${adoption.phone}`}>☎ {formatPhone(adoption.phone)}</a>
              ) : adoption.phone ? (
                <button className="btn btn-ghost" onClick={() => setRevealed(true)}>☎ {maskPhone(adoption.phone)} · {t('detail_show_phone')}</button>
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

      <div style={{ textAlign: 'center', marginTop: 'var(--sp-4)' }}>
        <Link href={`/profiles/adoption/${adoption.id}`} className="btn btn-accent" style={{ display: 'inline-flex' }}>
          {t('profiles_view_profile')}
        </Link>
      </div>

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
        .owner-actions .btn { flex: 1; min-height: var(--touch-target); }
        .back-row { margin-top: var(--sp-5); }
        .share-section { margin-top: var(--sp-6); text-align: center; }
        .share-hint { font-size: 12px; color: var(--muted); margin-top: var(--sp-2); }
      `}</style>
    </div>
  );
}
