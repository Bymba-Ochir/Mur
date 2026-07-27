// app/pets/[id]/page.js
// Server component — Facebook/Messenger share хийхэд зурган preview (og:image)
// зөв харагдахын тулд metadata-г серверт нь тооцоолно.
import { createClient } from '@supabase/supabase-js';
import PetDetailClient from './PetDetailClient';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function generateMetadata({ params }) {
  const { data: pet } = await supabase.from('pets').select('*').eq('id', params.id).single();

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

export default function PetDetailPage({ params }) {
  return <PetDetailClient id={params.id} />;
}
