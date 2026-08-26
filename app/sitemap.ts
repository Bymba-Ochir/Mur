// app/sitemap.ts
// Google-д индекслэгдэхэд туслах динамик sitemap. Идэвхтэй (олдоогүй) амьтны
// дэлгэрэнгүй хуудсуудыг мөн оруулна — "алдсан нохой Улаанбаатар" гэх мэт
// хайлтад тухайн бичлэгүүд шууд олдох боломжтой болгоно.
import type { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://mur-chi.vercel.app';

  const staticRoutes: MetadataRoute.Sitemap = [
    { path: '', changeFrequency: 'daily' as const, priority: 1 },
    { path: '/listings', changeFrequency: 'hourly' as const, priority: 0.8 },
    { path: '/adoptions', changeFrequency: 'hourly' as const, priority: 0.8 },
    { path: '/clinics', changeFrequency: 'weekly' as const, priority: 0.7 },
    { path: '/assistant', changeFrequency: 'monthly' as const, priority: 0.6 },
    { path: '/report-lost', changeFrequency: 'hourly' as const, priority: 0.8 },
    { path: '/report-found', changeFrequency: 'hourly' as const, priority: 0.8 },
    { path: '/sitting', changeFrequency: 'hourly' as const, priority: 0.8 },
    { path: '/privacy', changeFrequency: 'yearly' as const, priority: 0.3 },
    { path: '/terms', changeFrequency: 'yearly' as const, priority: 0.3 },
  ].map(({ path, changeFrequency, priority }) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  }));

  let dynamicRoutes: MetadataRoute.Sitemap = [];
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const [petsResult, adoptionsResult, sittingResult] = await Promise.all([
      supabase.from('pets').select('id, created_at').eq('resolved', false).order('created_at', { ascending: false }).limit(1000),
      supabase.from('adoptions').select('id, created_at').order('created_at', { ascending: false }).limit(1000),
      supabase.from('sitting_listings').select('id, created_at').order('created_at', { ascending: false }).limit(1000),
    ]);

    dynamicRoutes = [
      ...(petsResult.data || []).map((item) => ({ url: `${base}/pets/${item.id}`, lastModified: item.created_at })),
      ...(adoptionsResult.data || []).map((item) => ({ url: `${base}/adoptions/${item.id}`, lastModified: item.created_at })),
      ...(sittingResult.data || []).map((item) => ({ url: `${base}/sitting/${item.id}`, lastModified: item.created_at })),
    ].map((item) => ({ ...item, changeFrequency: 'daily' as const, priority: 0.6 }));
  } catch {
    // Supabase холбогдохгүй үед ч sitemap бүрэн унахгүй, зөвхөн статик хуудсуудыг буцаана
  }

  return [...staticRoutes, ...dynamicRoutes];
}
