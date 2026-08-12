'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { KeyboardEvent } from 'react';
import PetCardView from './PetCardView';
import { useLanguage } from '../lib/i18n';
import type { Pet } from '../lib/types';
import { getBreedLabel } from '../lib/petBreeds';
import PetImageGallery from './PetImageGallery';

export default function PetCard({ pet }: { pet: Pet }) {
  const router = useRouter();
  const { t, lang } = useLanguage();
  const [revealed, setRevealed] = useState(false);

  const cardLabel = `${pet.status === 'lost' ? 'Алдсан' : 'Олдсон'} ${pet.type}${pet.name ? ', нэр ' + pet.name : ''}, ${pet.district}, ${pet.place}. Дэлгэрэнгүй үзэх.`;

  function goToDetail() {
    router.push(`/pets/${pet.id}`);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      goToDetail();
    }
  }

  return (
    <PetCardView
      status={pet.status}
      badgeLabel={pet.status === 'lost' ? 'АЛДСАН' : 'ОЛДСОН'}
      name={pet.name}
      type={pet.type}
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
      revealed={revealed}
      onRevealPhone={() => setRevealed(true)}
      imageNode={
        pet.photoURLs.length ? (
          <PetImageGallery images={pet.photoURLs} alt={`${pet.type}${pet.name ? ' — ' + pet.name : ''}, ${pet.color || ''}`} />
        ) : undefined
      }
      onClick={goToDetail}
      onKeyDown={handleKeyDown}
      role="link"
      tabIndex={0}
      aria-label={cardLabel}
    />
  );
}
