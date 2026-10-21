// app/pets/[id]/page.tsx
// Server component — Facebook/Messenger share хийхэд зурган preview (og:image)
// зөв харагдахын тулд metadata-г серверт нь тооцоолно.
import type { Metadata } from 'next';
import { supabase } from '../../../lib/supabase';
import PetDetailClient from './PetDetailClient';
import { fetchServerListingPhotoUrls } from '../../../lib/serverPhotoRepository';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  // Metadata-д зөвхөн хэрэгтэй багануудыг татна (color_signature vector-г биш)
  const { data: pet } = await supabase
    .from('pets')
    .select('status,type,name,district,place,color')
    .eq('id', id)
    .single();

  if (!pet) {
    return { title: 'МӨР — Бичлэг олдсонгүй' };
  }

  const photos = await fetchServerListingPhotoUrls(supabase, 'pet', id);
  const primaryPhoto = photos[0] ?? null;
  const title = `${pet.status === 'lost' ? 'Алдсан' : 'Олдсон'} ${pet.type}${pet.name ? ' — ' + pet.name : ''}`;
  const description = `${pet.district} — ${pet.place}. ${pet.color ? 'Өнгө: ' + pet.color + '. ' : ''}Дэлгэрэнгүй мэдээлэл, холбоо барих дугаарыг үзнэ үү.`;

  return {
    title: `${title} | МӨР`,
    description,
    openGraph: {
      title,
      description,
      images: primaryPhoto ? [{ url: primaryPhoto, width: 800, height: 600 }] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: primaryPhoto ? [primaryPhoto] : [],
    },
  };
}

export default async function PetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PetDetailClient id={id} />;
}
