'use client';
import PetCardView from './PetCardView';
import { useLanguage } from '../lib/i18n';
import type { District } from '../lib/districts';
import type { PetStatus, PetType } from '../lib/types';
import { getBreedLabel } from '../lib/petBreeds';

/**
 * Мэдэгдэх форм бөглөх явцад баруун талд харагдах "яг ийм харагдана" preview карт.
 * Картын markup/стиль нь PetCardView-ээс (жагсаалтын карттай нэгдсэн).
 */
export default function PetPreviewCard({
  status, name, type, breed, color, district, place, phone, photoPreview, hasReward,
}: {
  status: PetStatus;
  name: string;
  type: PetType;
  breed?: string;
  color: string;
  district: District;
  place: string;
  phone: string;
  photoPreview: string | null;
  hasReward?: boolean;
}) {
  const { t, lang } = useLanguage();
  const typeLabel = type === 'Муур' ? t('type_cat') : type === 'Нохой' ? t('type_dog') : t('type_other');

  return (
    <div className="preview-wrap">
      <p className="preview-label">{t('preview_label')}</p>
      <PetCardView
        status={status}
        badgeLabel={status === 'lost' ? t('nav_lost').toUpperCase() : t('nav_found').toUpperCase()}
        name={name}
        type={type}
        typeLabel={typeLabel}
        breed={breed ? getBreedLabel(breed, lang) : undefined}
        color={color}
        district={district}
        place={place}
        phone={phone}
        hasReward={hasReward}
        rewardLabel={t('reward_prefix')}
        showPhoneLabel={t('listings_card_show_phone')}
        callPhoneLabel={t('listings_card_call')}
        language={lang}
        interactive={false}
        imageNode={
          photoPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoPreview} alt={`${typeLabel}${color ? ', ' + color : ''}${name ? ', ' + name : ''}`} />
          ) : undefined
        }
      />

      <style jsx>{`
        .preview-wrap { width: 100%; max-width: 20rem; }
        .preview-label { margin: 0 0 var(--sp-2); color: var(--muted); font-size: var(--text-xs); font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
      `}</style>
    </div>
  );
}
