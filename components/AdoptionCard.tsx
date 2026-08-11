'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import type { KeyboardEvent } from 'react';
import AdoptionCardView from './AdoptionCardView';
import { useLanguage } from '../lib/i18n';
import type { Adoption } from '../lib/types';
import { getBreedLabel } from '../lib/petBreeds';

export default function AdoptionCard({ adoption }: { adoption: Adoption }) {
  const router = useRouter();
  const { t, lang } = useLanguage();
  const [revealed, setRevealed] = useState(false);

  const typeLabel = adoption.type === 'Муур' ? t('type_cat') : adoption.type === 'Нохой' ? t('type_dog') : t('type_other');
  const cardLabel = `${typeLabel} ${adoption.name ? ', нэр ' + adoption.name : ''}, ${adoption.district}, ${adoption.place}. Дэлгэрэнгүй үзэх.`;

  function goToDetail() {
    router.push(`/adoptions/${adoption.id}`);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      goToDetail();
    }
  }

  return (
    <AdoptionCardView
      badgeLabel="ҮРЧЛҮҮЛЭХ"
      name={adoption.name}
      type={adoption.type}
      age={adoption.age}
      gender={adoption.gender}
      breed={adoption.breed ? getBreedLabel(adoption.breed, lang) : ''}
      district={adoption.district}
      place={adoption.place}
      phone={adoption.phone}
      createdAt={adoption.createdAt || undefined}
      revealed={revealed}
      onRevealPhone={() => setRevealed(true)}
      imageNode={
        adoption.photoURL ? (
          <Image
            src={adoption.photoURL}
            alt={`${adoption.type}${adoption.name ? ' — ' + adoption.name : ''}`}
            fill
            sizes="(max-width: 640px) 45vw, 220px"
            style={{ objectFit: 'cover' }}
          />
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
