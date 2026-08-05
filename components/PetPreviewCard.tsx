'use client';
import PetCardView from './PetCardView';
import { useLanguage } from '../lib/i18n';
import type { District } from '../lib/districts';
import type { PetStatus, PetType } from '../lib/types';

/**
 * Мэдэгдэх форм бөглөх явцад баруун талд харагдах "яг ийм харагдана" preview карт.
 * Картын markup/стиль нь PetCardView-ээс (жагсаалтын карттай нэгдсэн).
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
      <PetCardView
        status={status}
        badgeLabel={status === 'lost' ? t('nav_lost').toUpperCase() : t('nav_found').toUpperCase()}
        name={name}
        type={type}
        color={color}
        district={district}
        place={place}
        phone={phone}
        interactive={false}
        imageNode={
          photoPreview ? (
            <img src={photoPreview} alt={`${typeLabel}${color ? ', ' + color : ''}${name ? ', ' + name : ''}`} />
          ) : undefined
        }
      />

      <style jsx>{`
        .preview-wrap { max-width: 260px; }
        .preview-label { font-size: 12px; color: var(--muted); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.03em; }
      `}</style>
    </div>
  );
}
