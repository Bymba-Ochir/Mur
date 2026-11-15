import { test, expect } from './fixtures';

const paths = ['/', '/listings', '/report-lost', '/report-found'];
for (const bot of ['Googlebot', 'facebookexternalhit/1.1']) {
  test(`public search metadata is present in server HTML for ${bot}`, async ({ request, page, baseURL }) => {
    const origin = new URL(baseURL ?? 'http://localhost:3000');
    if (origin.protocol !== 'http:' || !['127.0.0.1', 'localhost'].includes(origin.hostname)) throw new Error('SEO tests require the local app');
    const canonicalUrls: string[] = [];
    for (const path of paths) {
      const response = await request.get(path, { headers: { 'user-agent': bot } });
      expect(response.ok()).toBe(true);
      const metadata = await page.evaluate(html => {
        const document = new DOMParser().parseFromString(html, 'text/html');
        const property = (name: string) => document.querySelector<HTMLMetaElement>(`meta[property="${name}"]`)?.content;
        const structured = document.querySelector<HTMLScriptElement>('script[type="application/ld+json"]');
        return {
          title: document.title,
          description: document.querySelector<HTMLMetaElement>('meta[name="description"]')?.content,
          canonical: document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href,
          shareUrl: property('og:url'), shareTitle: property('og:title'), image: property('og:image'),
          website: structured ? JSON.parse(structured.textContent ?? '') : null,
          nonce: structured?.nonce,
          faq: document.querySelector('.home-faq')?.textContent,
        };
      }, await response.text());
      expect(metadata.title).toContain('МӨР');
      expect(metadata.description).toMatch(/нохой|Нохой/);
      expect(new URL(metadata.canonical!).pathname).toBe(path);
      expect(new URL(metadata.shareUrl!).href).toBe(new URL(metadata.canonical!).href);
      expect(metadata.shareTitle).toBe(metadata.title);
      expect(metadata.image).toContain('/icon-512.png');
      expect(metadata.website).toMatchObject({ '@type': 'WebSite', name: 'МӨР', alternateName: 'MUR' });
      expect(metadata.nonce).toBeTruthy();
      expect(response.headers()['content-security-policy']).toContain(`'nonce-${metadata.nonce}'`);
      if (path === '/') expect(metadata.faq).toContain('Нохойгоо эсвэл муураа алдсан бол яах вэ?');
      canonicalUrls.push(metadata.canonical!);
    }
    expect(new Set(canonicalUrls).size).toBe(paths.length);
  });
}
