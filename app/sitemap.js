// app/sitemap.js
// Google-д индекслэгдэхэд туслах динамик sitemap. Идэвхтэй (олдоогүй) амьтны
// дэлгэрэнгүй хуудсуудыг мөн оруулна — "алдсан нохой Улаанбаатар" гэх мэт
// хайлтад тухайн бичлэгүүд шууд олдох боломжтой болгоно.
import { createClient } from '@supabase/supabase-js';

export default async function sitemap() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://mur-chi.vercel.app';

  const staticRoutes = ['', '/listings', '/report-lost', '/report-found'].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: path === '' ? 'daily' : 'hourly',
    priority: path === '' ? 1 : 0.8,
  }));

  let petRoutes = [];
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    const { data } = await supabase
      .from('pets')
      .select('id, created_at')
      .eq('resolved', false)
      .order('created_at', { ascending: false })
      .limit(1000);

    petRoutes = (data || []).map((p) => ({
      url: `${base}/pets/${p.id}`,
      lastModified: p.created_at,
      changeFrequency: 'daily',
      priority: 0.6,
    }));
  } catch (e) {
    // Supabase холбогдохгүй үед ч sitemap бүрэн унахгүй, зөвхөн статик хуудсуудыг буцаана
  }

  return [...staticRoutes, ...petRoutes];
}
