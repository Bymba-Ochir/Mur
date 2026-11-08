import { NextRequest, NextResponse } from 'next/server';
import { contentSecurityPolicy } from './lib/contentSecurityPolicy';

export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const policy = contentSecurityPolicy(nonce, process.env.NEXT_PUBLIC_DATABASE_MODE === 'hosted', process.env.NODE_ENV === 'development',
    // Client navigation keeps the CSP of the original document.
    Boolean(process.env.TURNSTILE_SITE_KEY?.trim()));
  const headers = new Headers(request.headers);
  // Never trust the browser's nonce or CSP headers.
  headers.set('x-nonce', nonce);
  headers.set('Content-Security-Policy', policy);
  const response = NextResponse.next({ request: { headers } });
  response.headers.set('Content-Security-Policy', policy);
  // A shared HTML cache would reuse a nonce or mismatch it with the response policy.
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}

export const config = {
  // Include prefetch/RSC requests too; client-supplied prefetch headers cannot bypass CSP.
  matcher: ['/((?!api(?:/|$)|_next/static(?:/|$)|_next/image(?:/|$)|(?:favicon\\.ico|icon\\.svg|icon-192\\.png|icon-512\\.png|map-marker\\.svg|sw\\.js|manifest\\.json|robots\\.txt|sitemap\\.xml)$).*)'],
};
