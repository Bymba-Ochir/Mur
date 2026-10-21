'use client';
import { useListingFilters } from '../lib/useListingFilters';
import { useState } from 'react';
import AdoptionCardView from './AdoptionCardView';
import PetImageGallery from './PetImageGallery';
import { useLanguage } from '../lib/i18n';
import type { Adoption } from '../lib/types';
import { getBreedLabel } from '../lib/petBreeds';

export default function AdoptionCard({ adoption }: { adoption: Adoption }) {
  const { t, lang } = useLanguage();
  const { query } = useListingFilters();
  const [revealed, setRevealed] = useState(false);
  const images = adoption.photoURLs?.length ? adoption.photoURLs : adoption.photoURL ? [adoption.photoURL] : [];

  const typeLabel = adoption.type === 'Муур' ? t('type_cat') : adoption.type === 'Нохой' ? t('type_dog') : t('type_other');

  return (
    <AdoptionCardView
      badgeLabel={t('nav_adoptions').toUpperCase()}
      name={adoption.name}
      type={adoption.type}
      typeLabel={typeLabel}
      age={adoption.age}
      gender={adoption.gender}
      genderLabel={adoption.gender === 'Эрэгтэй' ? t('gender_male') : adoption.gender === 'Эмэгтэй' ? t('gender_female') : t('gender_unknown')}
      breed={adoption.breed ? getBreedLabel(adoption.breed, lang) : ''}
      district={adoption.district}
      place={adoption.place}
      phone={adoption.phone}
      createdAt={adoption.createdAt || undefined}
      revealed={revealed}
      onRevealPhone={() => setRevealed(true)}
      showPhoneLabel={t('listings_card_show_phone')}
      callPhoneLabel={t('listings_card_call')}
      detailHref={`/adoptions/${adoption.id}${query ? "?returnTo=" + encodeURIComponent("/adoptions" + query) : ""}`}
      detailLabel={t('listings_card_detail')}
      language={lang}
      imageNode={
        images.length ? (
          <PetImageGallery images={images} alt={`${adoption.type}${adoption.name ? ' — ' + adoption.name : ''}`} />
        ) : undefined
      }
    />
  );
}
