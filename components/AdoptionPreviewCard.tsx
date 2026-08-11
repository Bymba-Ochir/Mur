'use client';
import AdoptionCardView from './AdoptionCardView';
import { useLanguage } from '../lib/i18n';
import type { District } from '../lib/districts';
import type { AdoptionGender, PetType } from '../lib/types';
import { getBreedLabel } from '../lib/petBreeds';

/**
 * Үрчлүүлэх форм бөглөх явцад баруун талд харагдах preview карт.
 */
export default function AdoptionPreviewCard({
  name, type, age, gender, breed, district, place, phone, photoPreview,
}: {
  name: string;
  type: PetType;
  age: string;
  gender: AdoptionGender;
  breed: string;
  district: District;
  place: string;
  phone: string;
  photoPreview: string | null;
}) {
  const { t, lang } = useLanguage();
  const genderLabel = gender === 'Эрэгтэй' ? t('gender_male') : gender === 'Эмэгтэй' ? t('gender_female') : t('gender_unknown');

  return (
    <div className="preview-wrap">
      <p className="preview-label">{t('preview_label')}</p>
      <AdoptionCardView
        badgeLabel={t('nav_adoptions').toUpperCase()}
        name={name}
        type={type}
        age={age}
        gender={genderLabel}
        breed={breed ? getBreedLabel(breed, lang) : ''}
        district={district}
        place={place}
        phone={phone}
        interactive={false}
        imageNode={
          photoPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoPreview} alt={`${type}${breed ? ', ' + breed : ''}${name ? ', ' + name : ''}`} />
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
