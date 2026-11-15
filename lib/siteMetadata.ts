import type { Metadata } from 'next';

export const SITE_URL = new URL('/', process.env.NEXT_PUBLIC_SITE_URL || 'https://mur-chi.vercel.app').href;
export const SITE_NAME = 'МӨР';
export const SITE_TITLE = 'Алдсан, олдсон нохой муурын зар | МӨР';
export const SITE_DESCRIPTION = 'Улаанбаатарт алдсан, олдсон нохой муурын зар. Зураг, байршлаар хайж, харсан амьтныхаа мэдээллийг бүртгэлгүйгээр эзэнд нь хүргээрэй.';
export const SITE_PREVIEW_IMAGE = new URL('/icon-512.png', SITE_URL).href;

// Root defaults intentionally have no canonical or og:url. Each public page
// supplies its own URL, so child routes cannot accidentally point to home.
export const siteBrandMetadata = {
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  openGraph: {
    title: SITE_TITLE, description: SITE_DESCRIPTION, siteName: SITE_NAME,
    locale: 'mn_MN', type: 'website',
    images: [{ url: SITE_PREVIEW_IMAGE, width: 512, height: 512, alt: 'МӨР' }],
  },
  twitter: { card: 'summary', title: SITE_TITLE, description: SITE_DESCRIPTION, images: [SITE_PREVIEW_IMAGE] },
} satisfies Metadata;

export function pageMetadata({ path, title, description }: { path: string; title: string; description: string }): Metadata {
  const canonical = new URL(path, SITE_URL).href;
  return {
    ...siteBrandMetadata, title, description,
    alternates: { canonical },
    openGraph: { ...siteBrandMetadata.openGraph, title, description, url: canonical },
    twitter: { ...siteBrandMetadata.twitter, title, description },
  };
}

export function websiteStructuredData() {
  return {
    '@context': 'https://schema.org', '@type': 'WebSite',
    '@id': new URL('/#website', SITE_URL).href,
    url: SITE_URL, name: SITE_NAME, alternateName: 'MUR',
    description: SITE_DESCRIPTION, inLanguage: 'mn-MN',
  };
}
