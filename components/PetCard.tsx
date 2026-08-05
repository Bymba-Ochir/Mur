'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import type { KeyboardEvent } from 'react';
import PetCardView from './PetCardView';
import type { Pet } from '../lib/types';

export default function PetCard({ pet }: { pet: Pet }) {
  const router = useRouter();
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
      color={pet.color}
      district={pet.district}
      place={pet.place}
      phone={pet.phone}
      createdAt={pet.createdAt || undefined}
      similarity={pet.similarity}
      revealed={revealed}
      onRevealPhone={() => setRevealed(true)}
      imageNode={
        pet.photoURL ? (
          <Image
            src={pet.photoURL}
            alt={`${pet.type}${pet.name ? ' — ' + pet.name : ''}, ${pet.color || ''}`}
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
