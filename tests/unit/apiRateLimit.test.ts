import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { createAdminClient as AdminFactory } from '../../lib/supabaseAdmin';
vi.mock('../../lib/supabaseAdmin', () => ({ createAdminClient: vi.fn() }));
vi.mock('../../lib/errorTracking', () => ({ reportError: vi.fn() }));
import { createAdminClient } from '../../lib/supabaseAdmin';
import { reportError } from '../../lib/errorTracking';

let limiter: typeof import('../../lib/apiRateLimit');
type Parameters = { bucket_key: string; max_requests: number; window_seconds: number };
const rpc = vi.fn<(name: string, parameters: Parameters) => Promise<{ data: unknown; error: unknown }>>();
let store: Map<string, { count: number; reset: number }>;

function request(ip = '203.0.113.10', extra: Record<string, string> = {}) {
  return new Request('https://mur.test/api/test', { headers: { 'x-vercel-forwarded-for': ip, ...extra } });
}

beforeEach(async () => {
  vi.resetModules();
  vi.resetAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-10-31T08:00:00Z'));
  vi.stubEnv('VERCEL', '1');
  store = new Map();
  rpc.mockImplementation(async (_name, args) => {
    const now = Date.now();
    let bucket = store.get(args.bucket_key);
    if (!bucket || bucket.reset <= now) { bucket = { count: 0, reset: now + args.window_seconds * 1000 }; store.set(args.bucket_key, bucket); }
    bucket.count = Math.min(bucket.count + 1, args.max_requests + 1);
    const allowed = bucket.count <= args.max_requests;
    return { error: null, data: [{ allowed, remaining: Math.max(0, args.max_requests - bucket.count), retry_after_seconds: allowed ? 0 : Math.ceil((bucket.reset - now) / 1000) }] };
  });
  vi.mocked(createAdminClient).mockReturnValue({ rpc } as unknown as ReturnType<typeof AdminFactory>);
  limiter = await import('../../lib/apiRateLimit');
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); });

describe('distributed API admission', () => {
  it('blocks a 1000-request burst before expensive work', async () => {
    const results = await Promise.all(Array.from({ length: 1000 }, () => limiter.limitIpRequest(request(), 'health')));
    expect(results.filter((result) => result === null)).toHaveLength(60);
    expect(results.filter((result) => result?.status === 429)).toHaveLength(940);
    expect(rpc).toHaveBeenCalledTimes(60);
    expect(reportError).not.toHaveBeenCalled();
  });

  it('shares quotas between independent worker modules instead of resetting on restart', async () => {
    const workerA = limiter;
    vi.resetModules();
    const workerB = await import('../../lib/apiRateLimit');
    let accepted = 0;
    for (let i = 0; i < 60; i++) if (!await workerA.limitIpRequest(request(), 'health')) accepted++;
    for (let i = 0; i < 60; i++) if (!await workerB.limitIpRequest(request(), 'health')) accepted++;
    expect(accepted).toBe(60);
    expect(store.size).toBe(1);
  });

  it('uses verified user quotas independent of token, IP or request-body identity', async () => {
    expect(await limiter.limitUserRequest('account-export', 'verified-user')).toBeNull();
    expect(await limiter.limitUserRequest('account-export', 'verified-user')).toBeNull();
    const blocked = await limiter.limitUserRequest('account-export', 'verified-user');
    expect(blocked?.status).toBe(429);
    expect(blocked?.headers.get('Retry-After')).toBe('3600');
    expect(await limiter.limitUserRequest('account-export', 'different-verified-user')).toBeNull();
    for (const [, args] of rpc.mock.calls) {
      expect(args.bucket_key).toMatch(/^[0-9a-f]{64}$/);
      expect(args.bucket_key).not.toContain('verified-user');
    }
  });

  it('rejects missing bearer credentials without calling the counter or auth provider', async () => {
    expect((await limiter.limitIpRequest(request(), 'account-export'))?.status).toBe(401);
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it('does not let user-controlled quota fields or bearer rotation change the IP bucket', async () => {
    await limiter.limitIpRequest(request('203.0.113.10', { authorization: 'Bearer first', 'x-user-id': 'one', 'x-rate-limit': '1000' }), 'assistant');
    await limiter.limitIpRequest(request('203.0.113.10', { authorization: 'Bearer second', 'x-user-id': 'two' }), 'assistant');
    expect(rpc.mock.calls[0][1]).toEqual(rpc.mock.calls[1][1]);
    expect(rpc.mock.calls[0][1]).toMatchObject({ max_requests: 60, window_seconds: 600 });
  });

  it('keeps endpoint quotas isolated and retries after the real window expires', async () => {
    for (let i = 0; i < 2; i++) expect(await limiter.limitServiceRequest('cron')).toBeNull();
    expect((await limiter.limitServiceRequest('cron'))?.status).toBe(429);
    const calls = rpc.mock.calls.length;
    expect((await limiter.limitServiceRequest('cron'))?.status).toBe(429);
    expect(rpc).toHaveBeenCalledTimes(calls);
    expect(await limiter.limitServiceRequest('notify')).toBeNull();
    vi.advanceTimersByTime(60_000);
    expect(await limiter.limitServiceRequest('cron')).toBeNull();
  });

  it('fails closed when the RPC is missing and never falls back to local-only admission', async () => {
    rpc.mockResolvedValue({ data: null, error: { code: 'PGRST202' } });
    const response = await limiter.limitIpRequest(request(), 'health');
    expect(response?.status).toBe(503);
    expect(response?.headers.get('Retry-After')).toBe('5');
    expect(response?.headers.get('Cache-Control')).toBe('no-store');
    expect(reportError).toHaveBeenCalledTimes(1);
  });

  it.each([null, [{ allowed: true }], [{ allowed: false, remaining: 0, retry_after_seconds: 0 }]])('rejects invalid counter responses: %j', async (data) => {
    rpc.mockResolvedValue({ data, error: null });
    expect((await limiter.limitIpRequest(request(), 'health'))?.status).toBe(503);
  });
});
