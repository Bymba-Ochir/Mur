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
  const typeLabel = type === 'Муур' ? t('type_cat') : type === 'Нохой' ? t('type_dog') : t('type_other');

  return (
    <div className="preview-wrap">
      <p className="preview-label">{t('preview_label')}</p>
      <AdoptionCardView
        badgeLabel={t('nav_adoptions').toUpperCase()}
        name={name}
        type={type}
        typeLabel={typeLabel}
        age={age}
        gender={genderLabel}
        genderLabel={genderLabel}
        breed={breed ? getBreedLabel(breed, lang) : ''}
        district={district}
        place={place}
        phone={phone}
        interactive={false}
        showPhoneLabel={t('listings_card_show_phone')}
        callPhoneLabel={t('listings_card_call')}
        language={lang}
        imageNode={
          photoPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoPreview} alt={`${type}${breed ? ', ' + breed : ''}${name ? ', ' + name : ''}`} />
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
