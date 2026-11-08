import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { createAdminClient } from './supabaseAdmin';
import { checkRateLimit, getClientIp } from './rateLimit';
import { reportError } from './errorTracking';

interface Rule { limit: number; windowSeconds: number; }
interface Policy { resourceIp?: Rule; ip?: Rule; user?: Rule; service?: Rule; requiresUser?: boolean; }
const minute = (limit: number): Rule => ({ limit, windowSeconds: 60 });
const hour = (limit: number): Rule => ({ limit, windowSeconds: 3600 });

/** Thresholds live here, never in browser input or database RPC arguments from a client. */
export const API_RATE_POLICIES = {
  health: { ip: minute(60) },
  'account-export': { ip: minute(6), user: hour(2), requiresUser: true },
  'account-delete': { ip: minute(10), user: hour(3), requiresUser: true },
  'content-delete': { ip: minute(30), user: minute(20), requiresUser: true },
  'push-status': { ip: minute(60), user: minute(30), requiresUser: true },
  'push-create': { ip: hour(8) },
  'push-browser-status': { ip: minute(60), user: minute(30) },
  assistant: { ip: { limit: 60, windowSeconds: 600 }, user: { limit: 30, windowSeconds: 600 }, requiresUser: true },
  reports: { ip: minute(30), user: hour(8), requiresUser: true },
  'feedback-create': { ip: hour(10) },
  sightings: { ip: minute(30), requiresUser: true },
  'sighting-new': { ip: hour(20), user: hour(10) },
  'guest-sighting': { ip: minute(60), resourceIp: hour(20) },
  'guest-sighting-open': { ip: minute(30) },
  'guest-sighting-review': { ip: minute(120), user: minute(60), requiresUser: true },
  'donation-create': { ip: minute(30) },
  'donation-new': { ip: minute(5) },
  'donation-status': { ip: minute(60) },
  'qpay-callback': { ip: minute(240), service: minute(300) },
  'qpay-invoice': { service: minute(30) },
  notify: { service: minute(120) },
  'pet-image-wake': { ip: minute(20), user: hour(12), requiresUser: true },
  'pet-image-worker': { service: minute(3) },
  'background-jobs': { service: minute(12) },
  cron: { service: minute(2) },
} satisfies Record<string, Policy>;

export type ApiRatePolicy = keyof typeof API_RATE_POLICIES;
type AdminClient = ReturnType<typeof createAdminClient>;
type Counter = { allowed: boolean; retry_after_seconds: number; remaining: number };
const deniedUntil = new Map<string, number>();
const MAX_CACHED_DENIALS = 10_000;

function throttled(retryAfter: number): NextResponse {
  return NextResponse.json({ error: 'Хэт олон хүсэлт илгээлээ. Түр хүлээгээд дахин оролдоно уу.' }, {
    status: 429,
    headers: { 'Retry-After': String(Math.max(1, retryAfter)), 'Cache-Control': 'no-store' },
  });
}

async function consumeBudget(scope: string, subject: string, rule: Rule, admin?: AdminClient): Promise<NextResponse | null> {
  const key = createHash('sha256').update(`mur-api-v102:${scope}:${subject}`).digest('hex');
  const now = Date.now();
  const cached = deniedUntil.get(key);
  if (cached && cached > now) return throttled(Math.ceil((cached - now) / 1000));
  deniedUntil.delete(key);

  // A short per-instance burst guard reduces counter-store pressure. It is not
  // the authoritative quota, and allowed requests are never cached locally.
  const burst = checkRateLimit(`burst:${key}`, Math.max(rule.limit, 10), 1000);
  if (!burst.allowed) return throttled(burst.retryAfterSec);

  try {
    const { data, error } = await (admin ?? createAdminClient()).rpc('consume_api_rate_limit', {
      bucket_key: key,
      max_requests: rule.limit,
      window_seconds: rule.windowSeconds,
    });
    if (error) throw error;
    const row = (Array.isArray(data) ? data[0] : data) as Counter | undefined;
    if (!row || typeof row.allowed !== 'boolean' || !Number.isInteger(row.retry_after_seconds)
      || row.retry_after_seconds < 0 || row.retry_after_seconds > rule.windowSeconds
      || !Number.isInteger(row.remaining) || row.remaining < 0 || row.remaining > rule.limit
      || (!row.allowed && row.retry_after_seconds < 1)) {
      throw new Error('Invalid rate-limit counter response');
    }
    if (row.allowed) return null;

    if (deniedUntil.size >= MAX_CACHED_DENIALS) {
      for (const [cachedKey, expires] of deniedUntil) if (expires <= now) deniedUntil.delete(cachedKey);
    }
    if (deniedUntil.size < MAX_CACHED_DENIALS) deniedUntil.set(key, now + row.retry_after_seconds * 1000);
    return throttled(row.retry_after_seconds);
  } catch (error) {
    reportError(error, { area: 'backend', operation: 'api-rate-limit-store' });
    // Never silently downgrade distributed limits to an instance-local counter.
    return NextResponse.json({ error: 'Үйлчилгээ түр боломжгүй байна. Дахин оролдоно уу.' }, {
      status: 503, headers: { 'Retry-After': '5', 'Cache-Control': 'no-store' },
    });
  }
}

export async function limitIpRequest(request: Request, name: ApiRatePolicy, admin?: AdminClient): Promise<NextResponse | null> {
  const policy: Policy = API_RATE_POLICIES[name];
  if (policy.requiresUser && !/^Bearer\s+\S+$/i.test(request.headers.get('authorization') ?? '')) {
    return NextResponse.json({ error: 'Нэвтрэх шаардлагатай.' }, { status: 401, headers: { 'Cache-Control': 'no-store' } });
  }
  if (!policy.ip) throw new Error(`Missing IP rate policy: ${name}`);
  return consumeBudget(`${name}:ip`, getClientIp(request), policy.ip, admin);
}

export async function limitResourceIpRequest(request: Request, name: ApiRatePolicy, resourceId: string, admin?: AdminClient) {
  const policy: Policy = API_RATE_POLICIES[name];
  if (!policy.resourceIp) throw new Error(`Missing resource IP rate policy: ${name}`);
  return consumeBudget(`${name}:resource-ip`, `${resourceId}:${getClientIp(request)}`, policy.resourceIp, admin);
}

/** userId must come from Supabase auth.getUser(), never request JSON/headers. */
export async function limitUserRequest(name: ApiRatePolicy, userId: string, admin?: AdminClient): Promise<NextResponse | null> {
  const policy: Policy = API_RATE_POLICIES[name];
  if (!policy.user || !userId) throw new Error(`Missing verified-user rate policy: ${name}`);
  return consumeBudget(`${name}:user`, userId, policy.user, admin);
}

/** Call only AFTER validating the cron/webhook/callback secret. */
export async function limitServiceRequest(name: ApiRatePolicy, identity = 'global', admin?: AdminClient): Promise<NextResponse | null> {
  const policy: Policy = API_RATE_POLICIES[name];
  if (!policy.service) throw new Error(`Missing service rate policy: ${name}`);
  return consumeBudget(`${name}:service`, identity, policy.service, admin);
}
