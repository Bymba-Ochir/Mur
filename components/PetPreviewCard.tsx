'use client';
import PetIcon from './PetIcon';
import { useLanguage } from '../lib/i18n';
import type { District } from '../lib/districts';
import type { PetStatus, PetType } from '../lib/types';

/**
 * Мэдэгдэх форм бөглөх явцад баруун талд харагдах "яг ийм харагдана" preview карт.
 */
export default function PetPreviewCard({
  status, name, type, color, district, place, phone, photoPreview,
}: {
  status: PetStatus;
  name: string;
  type: PetType;
  color: string;
  district: District;
  place: string;
  phone: string;
  photoPreview: string | null;
}) {
  const { t } = useLanguage();
  const typeLabel = type === 'Муур' ? t('type_cat') : type === 'Нохой' ? t('type_dog') : t('type_other');

  return (
    <div className="preview-wrap">
      <p className="preview-label">{t('preview_label')}</p>
      <div className="pet-card">
        <div className="thumb">
          <span className={`badge ${status}`}>
            {status === 'lost' ? t('nav_lost').toUpperCase() : t('nav_found').toUpperCase()}
          </span>
          {photoPreview ? (
            <img src={photoPreview} alt="" />
          ) : (
            <span className="emoji"><PetIcon type={type} size={52} /></span>
          )}
        </div>
        <div className="info">
          <h4>{name || typeLabel}</h4>
          <p>{typeLabel}{color ? `, ${color}` : ''}</p>
          <p className="place">📍 {district}{place ? ` — ${place}` : ''}</p>
          {phone && <p className="phone">☎ {phone}</p>}
        </div>
      </div>

      <style jsx>{`
        .preview-wrap { max-width: 260px; }
        .preview-label { font-size: 12px; color: var(--muted); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.03em; }
        .pet-card {
          background: var(--card); border: 1px solid var(--line); border-radius: var(--r-md);
          overflow: hidden; box-shadow: 0 6px 18px rgba(0,0,0,0.06);
        }
        .thumb {
          height: 150px; background: var(--thumb-bg); position: relative;
          display: flex; align-items: center; justify-content: center;
        }
        .thumb img { width: 100%; height: 100%; object-fit: cover; }
        .emoji { color: var(--muted); display: flex; }
        .badge {
          position: absolute; top: 8px; left: 8px; font-size: 10px;
          padding: 3px 8px; border-radius: 6px; color: #fff; font-weight: 600;
        }
        .badge.lost { background: var(--alert); }
        .badge.found { background: var(--success); }
        .info { padding: 12px 14px; }
        h4 { font-size: 14.5px; margin-bottom: 2px; color: var(--primary); }
        p { font-size: 12.5px; color: var(--muted); margin: 2px 0; }
        .phone { margin-top: 6px; font-size: 13px; color: var(--primary); font-weight: 600; }
      `}</style>
    </div>
  );
}
