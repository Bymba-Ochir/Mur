import type { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import AdoptionProfileClient from './AdoptionProfileClient';
import { fetchServerListingPhotoUrls } from '../../../../lib/serverPhotoRepository';

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

  if (!data) return { title: 'Амьтны профайл — МӨР' };

  const photos = await fetchServerListingPhotoUrls(supabase, 'adoption', id);
  const primaryPhoto = photos[0] ?? null;
  const title = `Үрчлүүлэх ${data.type}${data.name ? ' — ' + data.name : ''}`;
  const description = [data.type, data.breed, data.age, `${data.district} — ${data.place}`].filter(Boolean).join(' · ');

  return {
    title: `${title} — МӨР`,
    description,
    openGraph: {
      title,
      description,
      images: primaryPhoto ? [{ url: primaryPhoto, width: 800, height: 600 }] : [],
    },
  };
}

export default async function AdoptionProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdoptionProfileClient id={id} />;
}
