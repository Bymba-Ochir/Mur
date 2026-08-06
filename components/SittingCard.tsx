'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useLanguage } from '../lib/i18n';
import SittingCardView from './SittingCardView';
import type { SittingListing } from '../lib/types';

export default function SittingCard({ listing }: { listing: SittingListing }) {
  const router = useRouter();
  const { t } = useLanguage();
  const [revealed, setRevealed] = useState(false);

  return (
    <SittingCardView
      badgeLabel={t('sitting_badge')}
      petType={listing.petType}
      description={listing.description}
      district={listing.district}
      place={listing.place}
      experience={listing.experience}
      availability={listing.availability}
      price={listing.price}
      phone={listing.phone}
      createdAt={listing.createdAt}
      revealed={revealed}
      onRevealPhone={() => setRevealed(true)}
      imageNode={
        listing.photoURL ? (
          <Image src={listing.photoURL} alt={listing.description} fill sizes="(max-width: 640px) 45vw, 220px" style={{ objectFit: 'cover' }} />
        ) : undefined
      }
      onClick={() => router.push(`/sitting/${listing.id}`)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.push(`/sitting/${listing.id}`); } }}
      role="link"
      tabIndex={0}
      aria-label={`${listing.petType} ${listing.district} — ${listing.place}`}
    />
  );
}
