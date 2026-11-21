// app/pets/[id]/page.tsx
// Server component — Facebook/Messenger share хийхэд зурган preview (og:image)
// зөв харагдахын тулд metadata-г серверт нь тооцоолно.
import type { Metadata } from 'next';
import { supabase } from '../../../lib/supabase';
import PetDetailClient from './PetDetailClient';
import { getTurnstileConfig } from '../../../lib/turnstile';
import { fetchServerListingPhotoUrls } from '../../../lib/serverPhotoRepository';
import { pageMetadata, SITE_NAME, SITE_PREVIEW_IMAGE, SITE_URL } from '../../../lib/siteMetadata';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  // Metadata-д зөвхөн хэрэгтэй багануудыг татна (color_signature vector-г биш)
  const { data: pet } = await supabase
    .from('pets')
    .select('status,type,name,district,place,color')
    .eq('id', id)
    .single();

  if (!pet) {
    return { title: 'Зар олдсонгүй | МӨР', robots: { index: false, follow: false } };
  }

  const photos = await fetchServerListingPhotoUrls(supabase, 'pet', id);
  const primaryPhoto = photos[0] ?? null;
  const title = `${pet.status === 'lost' ? 'Алдсан' : 'Олдсон'} ${pet.type}${pet.name ? ' — ' + pet.name : ''}`;
  const location = [pet.district, pet.place].filter(Boolean).join(' — ');
  const description = `${location ? location + '. ' : ''}${pet.color ? 'Онцгой шинж тэмдэг: ' + pet.color + '. ' : ''}Дэлгэрэнгүй мэдээллийг үзэж, харсан бол «Би харсан» товчоор мэдээлээрэй.`;
  const canonical = new URL(`/pets/${encodeURIComponent(id)}`, SITE_URL).href;

  return {
    ...pageMetadata({ path: `/pets/${encodeURIComponent(id)}`, title: `${title} | МӨР`, description }),
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      locale: 'mn_MN',
      images: primaryPhoto ? [{ url: primaryPhoto, alt: title }] : [{ url: SITE_PREVIEW_IMAGE, width: 512, height: 512, alt: SITE_NAME }],
      type: 'website',
    },
    twitter: {
      card: primaryPhoto ? 'summary_large_image' : 'summary',
      title,
      description,
      images: [primaryPhoto || SITE_PREVIEW_IMAGE],
    },
  };
}

export default async function PetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PetDetailClient id={id} guestSightingSiteKey={getTurnstileConfig()?.siteKey} />;
}
