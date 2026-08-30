'use client';
import { useState } from 'react';
import PetCardView from './PetCardView';
import { useLanguage } from '../lib/i18n';
import type { Pet } from '../lib/types';
import { getBreedLabel } from '../lib/petBreeds';
import PetImageGallery from './PetImageGallery';

export default function PetCard({ pet }: { pet: Pet }) {
  const { t, lang } = useLanguage();
  const [revealed, setRevealed] = useState(false);

  const typeLabel = pet.type === 'Нохой' ? t('type_dog') : pet.type === 'Муур' ? t('type_cat') : t('type_other');

  return (
    <PetCardView
      status={pet.status}
      badgeLabel={pet.status === 'lost' ? t('listings_badge_lost') : t('listings_badge_found')}
      name={pet.name}
      type={pet.type}
      typeLabel={typeLabel}
      breed={pet.breed ? getBreedLabel(pet.breed, lang) : undefined}
      color={pet.color}
      district={pet.district}
      place={pet.place}
      phone={pet.phone}
      createdAt={pet.createdAt || undefined}
      similarity={pet.similarity}
      hybridScore={pet.hybridScore}
      hasReward={pet.hasReward}
      rewardLabel={t('reward_prefix')}
      similarityLabel={t('listings_card_similarity')}
      showPhoneLabel={t('listings_card_show_phone')}
      callPhoneLabel={t('listings_card_call')}
      detailHref={`/pets/${pet.id}`}
      detailLabel={t('listings_card_detail')}
      language={lang}
      revealed={revealed}
      onRevealPhone={() => setRevealed(true)}
      imageNode={
        pet.photoURLs.length ? (
          <PetImageGallery images={pet.photoURLs} alt={`${typeLabel}${pet.name ? ' — ' + pet.name : ''}, ${pet.color || ''}`} />
        ) : undefined
      }
    />
  );
}
