import { GUEST_SIGHTING_CHALLENGE } from './guestSightings';

export function getTurnstileConfig() {
  const siteKey = process.env.TURNSTILE_SITE_KEY?.trim();
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  const hostname = process.env.TURNSTILE_HOSTNAME?.trim().toLowerCase();
  return siteKey && secret && hostname ? { siteKey, secret, hostname } : null;
}

export async function verifyGuestSightingChallenge(token: string, config: NonNullable<ReturnType<typeof getTurnstileConfig>>) {
  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret: config.secret, response: token }),
    cache: 'no-store',
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error('Turnstile Siteverify unavailable');
  const result = await response.json();
  return result?.success === true && result.hostname === config.hostname && result.action === GUEST_SIGHTING_CHALLENGE;
}
