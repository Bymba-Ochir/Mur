import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

function callbackSignature(donationId: string, secret: string): Buffer {
  return createHmac('sha256', secret).update(`mur:qpay:callback:v1:${donationId}`).digest();
}

export function createQPayCallbackUrl(siteUrl: string, donationId: string, secret: string): string {
  const url = new URL('/api/qpay/callback', siteUrl);
  url.searchParams.set('donationId', donationId);
  url.searchParams.set('sig', callbackSignature(donationId, secret).toString('hex'));
  return url.toString();
}

export function verifyQPayCallbackSignature(donationId: string, signature: string | null, secret: string): boolean {
  return !!signature && /^[a-f0-9]{64}$/.test(signature)
    && timingSafeEqual(callbackSignature(donationId, secret), Buffer.from(signature, 'hex'));
}

export function verifyLegacyQPayCallbackSecret(provided: string, secret: string): boolean {
  const digest = (value: string) => createHash('sha256').update(value).digest();
  return timingSafeEqual(digest(provided), digest(secret));
}
