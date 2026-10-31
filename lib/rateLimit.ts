// lib/rateLimit.ts
// Instance-local burst guard only. Authoritative quotas use apiRateLimit.ts.
import { isIP } from 'node:net';

type Entry = { count: number; resetAt: number };

const buckets = new Map<string, Entry>();

const MAX_ENTRIES = 10_000;

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now();

  // Хугацаа дууссан entry-уудыг үе үе цэвэрлэж, Map-ыг хязгаарт байлгана
  if (buckets.size >= MAX_ENTRIES) {
    for (const [k, v] of buckets) {
      if (now >= v.resetAt) buckets.delete(k);
    }
  }

  const entry = buckets.get(key);
  if (!entry || now >= entry.resetAt) {
    if (!entry && buckets.size >= MAX_ENTRIES) return { allowed: false, retryAfterSec: Math.ceil(windowMs / 1000) };
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSec: 0 };
  }

  entry.count += 1;
  if (entry.count > limit) {
    return { allowed: false, retryAfterSec: Math.ceil((entry.resetAt - now) / 1000) };
  }
  return { allowed: true, retryAfterSec: 0 };
}

export function getClientIp(request: Request): string {
  // Only trust forwarding headers on the hosting platform that overwrites them.
  // Self-hosted/local requests share a conservative bucket instead of trusting
  // arbitrary browser-supplied x-forwarded-for / x-real-ip values.
  if (process.env.VERCEL !== '1') return 'unknown';
  const raw = (request.headers.get('x-vercel-forwarded-for') ?? request.headers.get('x-forwarded-for') ?? '').trim();
  if (isIP(raw) === 4) return raw;
  if (isIP(raw) !== 6) return 'unknown';
  try {
    const canonical = new URL(`http://[${raw}]/`).hostname.slice(1, -1);
    const [left, right = ''] = canonical.split('::');
    const prefix = left ? left.split(':') : [];
    const suffix = right ? right.split(':') : [];
    const groups = canonical.includes('::')
      ? [...prefix, ...Array<string>(8 - prefix.length - suffix.length).fill('0'), ...suffix]
      : prefix;
    const numbers = groups.map((group) => parseInt(group, 16));
    // IPv4-mapped IPv6 must use the same bucket as its IPv4 spelling.
    if (numbers.slice(0, 5).every((part) => part === 0) && numbers[5] === 0xffff) {
      return [numbers[6] >> 8, numbers[6] & 255, numbers[7] >> 8, numbers[7] & 255].join('.');
    }
    // Address rotation within an IPv6 /64 cannot generate fresh IP budgets.
    return `${numbers.slice(0, 4).map((part) => part.toString(16)).join(':')}::/64`;
  } catch { return 'unknown'; }
}
