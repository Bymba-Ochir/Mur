'use client';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { fetchPetById, markResolved, updatePet, deletePet } from '../../../lib/petService';
import { useAuth } from '../../../lib/useAuth';
import { maskPhone, formatPhone } from '../../../lib/utils';
import { relativeTime } from '../../../lib/relativeTime';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
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

  if (error) return <div className="page-shell page-shell--narrow"><div className="state-panel state-panel--error" role="alert"><span className="state-panel__icon"><Icon name="alert" size={28} /></span><h2>{t('detail_not_found')}</h2><p>{error}</p><div className="detail-actions"><Button variant="secondary" onClick={() => void load()}>Дахин оролдох</Button><Button as="link" href="/listings" variant="ghost">Жагсаалт руу буцах</Button></div></div></div>;
  if (!pet) return <div className="page-shell page-shell--narrow"><div className="state-panel" aria-live="polite"><span className="state-panel__icon"><Icon name="paw" size={28} /></span><h2>{t('detail_loading')}</h2><p>Зарын мэдээллийг бэлтгэж байна.</p></div></div>;

  const title = `${pet.status === 'lost' ? t('nav_lost') : t('nav_found')} ${pet.type}${pet.name ? ' — ' + pet.name : ''}`;
  const isOwner = user && pet.createdBy && user.id === pet.createdBy;

  return (
    <div className="page-shell page-shell--detail">
      <div className="detail-back"><Button as="link" href="/listings" variant="ghost">Жагсаалт руу буцах</Button></div>
      <div className="page-header">
        <div className="eyebrow">{pet.status === 'lost' ? t('report_lost_eyebrow') : t('report_found_eyebrow')}</div>
        <h1>{title}</h1>
        {pet.createdAt && <p className="detail-meta"><Icon name="calendar" size={14} aria-hidden="true" /> {relativeTime(pet.createdAt)}</p>}
      </div>

      {pet.resolved && (
        <div className="pop-in resolved-banner" style={{ background: 'var(--success-bg)', border: '1.5px solid var(--success)', borderRadius: 'var(--r-sm)', padding: '8px 14px', marginBottom: 'var(--sp-3)', color: 'var(--success-text)', fontSize: 13.5, fontWeight: 600 }}>
          <Icon name="check" size={16} aria-hidden="true" /> {t('detail_resolved_badge').replace('✅ ', '')}
        </div>
      )}

      <div className="detail-grid">
        {/* Зураг — зүүн талд, том */}
        <div className="detail-media">
          <div style={{
            borderRadius: 'var(--r-md)', overflow: 'hidden', background: 'var(--thumb-bg)',
            aspectRatio: '4 / 3', width: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: pet.resolved ? 0.6 : 1, position: 'relative',
          }}>
            {pet.photoURLs.length ? (
              <PetImageGallery images={pet.photoURLs} alt={`${pet.type}${pet.name ? ', ' + pet.name : ''}${pet.color ? ', ' + pet.color : ''}`} />
            ) : (
              <span style={{
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 120,
                height: 120,
                background: 'var(--glass-bg)',
                border: '1px solid var(--glass-border)',
                borderRadius: '50%',
                boxShadow: 'var(--shadow-sm)',
              }}><PetIcon type={pet.type} size={72} /></span>
            )}
          </div>
        </div>

        {/* Мэдээлэл — баруун талд */}
        <div className="detail-info">
          {!editing ? (
            <div className="card" style={{ padding: 'var(--sp-4)' }}>
              <p style={{ marginBottom: 'var(--sp-1)' }}><b>{t('detail_type')}</b> {pet.type}{pet.color ? `, ${pet.color}` : ''}</p>
              {pet.breed && <p style={{ marginBottom: 'var(--sp-1)' }}><b>{t('detail_breed')}</b> {getBreedLabel(pet.breed, lang)}</p>}
              <p style={{ marginBottom: 'var(--sp-1)' }}><b>{t('detail_district')}</b> {pet.district}</p>
              <p style={{ marginBottom: 'var(--sp-1)' }}><b>{t('detail_place')}</b> {pet.place}</p>
              {pet.hasReward ? (
                <p style={{ marginBottom: 'var(--sp-1)', display:'flex', alignItems:'center', gap:6 }}><Icon name="sparkles" size={15} aria-hidden="true" /><b>{t('reward_prefix')}</b></p>
              ) : null}
              {revealed ? (
                <a href={`tel:${pet.phone}`} style={{ display: 'inline-block', marginTop: 'var(--sp-2)', fontWeight: 700, color: 'var(--primary)' }}>
                  <Icon name="phone" size={15} aria-hidden="true" /> {formatPhone(pet.phone)}
                </a>
              ) : (
                <button
                  onClick={() => setRevealed(true)}
                  style={{ display: 'inline-block', marginTop: 'var(--sp-2)', fontWeight: 700, color: 'var(--primary)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  <Icon name="phone" size={15} aria-hidden="true" /> {maskPhone(pet.phone)} · {t('detail_show_phone')}
                </button>
              )}
              {/* Чат товч — зөвхөн бусад хэрэглэгчдэд */}
              {!editing && <div style={{ marginTop: 'var(--sp-3)', display: 'flex', gap: 'var(--sp-2)', flexWrap: 'wrap' }}><MessageButton pet={pet} /><FavoriteButton petId={pet.id} /></div>}
              {!editing && pet.createdBy && <Link href={`/users/${pet.createdBy}`} style={{ display: 'inline-flex', alignItems: 'center', marginTop: 'var(--sp-3)', color: 'var(--primary)', fontWeight: 650, textDecoration: 'none' }}>Зарын эзний profile →</Link>}
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
            <div style={{ display: 'flex', gap: 'var(--sp-2)', marginTop: 'var(--sp-2)' }}>
              <Button variant="ghost" onClick={() => setEditing(true)} style={{ flex: 1, fontSize: 13 }}>
                {t('detail_edit_btn')}
              </Button>
              <Button variant="ghost" onClick={handleDelete} disabled={deleting}
                style={{ background: 'var(--card)', color: 'var(--alert)', border: '1.5px solid var(--alert)', flex: 1, justifyContent: 'center', fontSize: 13 }}>
                {deleting ? t('detail_deleting') : t('detail_delete_btn')}
              </Button>
            </div>
          )}

          {isOwner && !pet.resolved && !editing && (
            <Button
              onClick={handleResolve}
              disabled={resolving}
              variant="primary"
              style={{ marginTop: 'var(--sp-2)', background: 'var(--success)', color: '#fff', width: '100%', justifyContent: 'center' }}
            >
              {resolving ? t('detail_resolving') : t('detail_resolve_btn')}
            </Button>
          )}
        </div>
      </div>

      {pet.lat != null && pet.lng != null && (
        <div style={{ marginTop: 'var(--sp-4)' }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary)', marginBottom: 'var(--sp-2)' }}>
            {t('detail_last_seen_loc')}
          </p>
          <LocationMap lat={pet.lat} lng={pet.lng} />
        </div>
      )}

      <ShareButtons url={url} title={title} />

      <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 'var(--sp-3)' }}>
        {t('detail_share_hint')}
      </p>

      <ReportButton petId={pet.id} />

      <SightingsList petId={pet.id} />

      <style jsx>{`
        .resolved-banner { display: flex; align-items: center; gap: 7px; }
        .detail-grid {
          display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
          gap: var(--sp-5); align-items: start; margin-bottom: var(--sp-4);
        }
        @media (max-width: 1024px) {
          .detail-grid { grid-template-columns: 1fr; gap: var(--sp-4); }
        }
        @media (max-width: 640px) {
          .detail-grid { gap: var(--sp-3); margin-bottom: var(--sp-3); }
        }
        @media (min-width: 1440px) {
          .detail-grid { gap: var(--sp-7); margin-bottom: var(--sp-6); }
        }
        .detail-media { min-width: 0; }
        .detail-info { min-width: 0; display: flex; flex-direction: column; }
        .detail-back { margin-bottom:var(--sp-3); }
      `}</style>
    </div>
  );
}
