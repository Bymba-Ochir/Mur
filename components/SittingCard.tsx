'use client';
import { useState } from 'react';
import Image from 'next/image';
import { useLanguage } from '../lib/i18n';
import SittingCardView from './SittingCardView';
import type { SittingListing } from '../lib/types';

export default function SittingCard({ listing }: { listing: SittingListing }) {
  const { t, lang } = useLanguage();
  const [revealed, setRevealed] = useState(false);
  const typeLabel = listing.petType === 'Бүгд' ? t('sitting_pet_type_all')
    : listing.petType === 'Нохой' ? t('type_dog')
    : listing.petType === 'Муур' ? t('type_cat')
    : t('type_other');

  return (
    <SittingCardView
      badgeLabel={t('sitting_badge')}
      petType={listing.petType}
      petTypeLabel={typeLabel}
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
      showPhoneLabel={t('detail_show_phone')}
      callPhoneLabel={t('detail_call_phone')}
      freeLabel={t('sitting_price_free')}
      perDayLabel={t('sitting_price_per_day')}
      detailHref={`/sitting/${listing.id}`}
      detailLabel={t('listings_card_detail')}
      language={lang}
      imageNode={listing.photoURL ? <Image src={listing.photoURL} alt={listing.description || typeLabel} fill sizes="(max-width: 560px) 100vw, (max-width: 1000px) 50vw, 33vw" /> : undefined}
    />
  );
}
