import type { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import SittingDetailClient from './SittingDetailClient';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const { data } = await supabase
    .from('sitting_listings')
    .select('pet_type, description, district, place, photo_url')
    .eq('id', id)
    .single();

  if (!data) return { title: 'Асрах үйлчилгээ — МӨР' };

  const title = data.description?.slice(0, 60) || `Асрах үйлчилгээ — ${data.pet_type ?? ''}`;
  const description = [data.pet_type, data.district, data.place].filter(Boolean).join(' · ');

  return {
    title: `${title} — МӨР`,
    description,
    openGraph: {
      title,
      description,
      images: data.photo_url ? [{ url: data.photo_url, width: 800, height: 600 }] : [],
    },
  };
}

export default async function SittingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SittingDetailClient id={id} />;
}
