import { isAllowedPushEndpoint } from './pushEndpoint';

export interface PushIdentity { endpoint: string; keys: { p256dh: string; auth: string }; }

/** The endpoint alone is public information, never proof of browser ownership. */
export function parsePushIdentity(body: Record<string, unknown>): PushIdentity | null {
  const keys = body.keys;
  if (!isAllowedPushEndpoint(body.endpoint) || !keys || typeof keys !== 'object' || Array.isArray(keys)) return null;
  const { p256dh, auth } = keys as Record<string, unknown>;
  if (typeof p256dh !== 'string' || !p256dh || p256dh.length > 500 || typeof auth !== 'string' || !auth || auth.length > 500) return null;
  return { endpoint: body.endpoint, keys: { p256dh, auth } };
}
