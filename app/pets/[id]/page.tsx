// app/pets/[id]/page.tsx
// Server component — Facebook/Messenger share хийхэд зурган preview (og:image)
// зөв харагдахын тулд metadata-г серверт нь тооцоолно.
import type { Metadata } from 'next';
import { supabase } from '../../../lib/supabase';
import PetDetailClient from './PetDetailClient';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  // Metadata-д зөвхөн хэрэгтэй багануудыг татна (color_signature vector-г биш)
  const { data: pet } = await supabase
    .from('pets')
    .select('status,type,name,district,place,color,photo_url')
    .eq('id', id)
    .single();

  if (!pet) {
    return { title: 'МӨР — Бичлэг олдсонгүй' };
  }

  const title = `${pet.status === 'lost' ? 'Алдсан' : 'Олдсон'} ${pet.type}${pet.name ? ' — ' + pet.name : ''}`;
  const description = `${pet.district} — ${pet.place}. ${pet.color ? 'Өнгө: ' + pet.color + '. ' : ''}Дэлгэрэнгүй мэдээлэл, холбоо барих дугаарыг үзнэ үү.`;

  return {
    title: `${title} | МӨР`,
    description,
    openGraph: {
      title,
      description,
      images: pet.photo_url ? [{ url: pet.photo_url, width: 800, height: 600 }] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: pet.photo_url ? [pet.photo_url] : [],
    },
  };
}

export default async function PetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PetDetailClient id={id} />;
}
