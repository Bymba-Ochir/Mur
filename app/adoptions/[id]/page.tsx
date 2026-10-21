import type { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import AdoptionDetailClient from './AdoptionDetailClient';
import { fetchServerListingPhotoUrls } from '../../../lib/serverPhotoRepository';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const { data } = await supabase
    .from('adoptions')
    .select('type, name, age, breed, district, place')
    .eq('id', id)
    .single();

  if (!data) return { title: 'Үрчлүүлэх амьтан — МӨР' };

  const photos = await fetchServerListingPhotoUrls(supabase, 'adoption', id);
  const title = `Үрчлүүлэх ${data.type}${data.name ? ' — ' + data.name : ''}`;
  const description = [
    data.type,
    data.breed,
    data.age,
    `${data.district} — ${data.place}`,
  ].filter(Boolean).join(' · ');

  return {
    title: `${title} — МӨР`,
    description,
    openGraph: {
      title,
      description,
      images: photos.map((url) => ({ url, width: 800, height: 600 })),
    },
  };
}

export default async function AdoptionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdoptionDetailClient id={id} />;
}
