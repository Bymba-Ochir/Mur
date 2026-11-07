import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { createAdminClient as AdminFactory } from '../../lib/supabaseAdmin';
vi.mock('../../lib/supabaseAdmin', () => ({ createAdminClient: vi.fn() }));
vi.mock('../../lib/apiRateLimit', () => ({ limitIpRequest: vi.fn(), limitUserRequest: vi.fn() }));
vi.mock('../../lib/errorTracking', () => ({ reportError: vi.fn() }));
import { createAdminClient } from '../../lib/supabaseAdmin';
import { limitIpRequest, limitUserRequest } from '../../lib/apiRateLimit';
import { POST } from '../../app/api/push-subscriptions/status/route';

const endpoint = 'https://fcm.googleapis.com/fcm/send/test-device';
const keys = { p256dh: 'public-key', auth: 'private-browser-proof' };
const row = { district: 'Баянзүрх', user_id: null as string | null, keys };
const maybeSingle = vi.fn(), getUser = vi.fn();
const eq = vi.fn(() => ({ maybeSingle }));
const select = vi.fn(() => ({ eq }));
const from = vi.fn(() => ({ select }));
const admin = { from, auth: { getUser } } as unknown as ReturnType<typeof AdminFactory>;
function request(body: unknown = { endpoint, keys, district: 'Баянзүрх' }, authorization?: string) {
  return new Request('http://localhost/api/push-subscriptions/status', { method: 'POST', headers: { 'content-type': 'application/json', ...(authorization ? { authorization } : {}) }, body: JSON.stringify(body) });
}
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(createAdminClient).mockReturnValue(admin);
  vi.mocked(limitIpRequest).mockResolvedValue(null);
  vi.mocked(limitUserRequest).mockResolvedValue(null);
  maybeSingle.mockResolvedValue({ data: row, error: null });
  getUser.mockResolvedValue({ data: { user: { id: 'alice' } }, error: null });
});

describe('proof-based push status', () => {
  it('checks the guest browser proof and only the requested district', async () => {
    const response = await POST(request());
    expect(await response.json()).toEqual({ subscribed: true, vaccine: false });
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(eq).toHaveBeenCalledWith('endpoint', endpoint);
    expect(getUser).not.toHaveBeenCalled();
    expect(await (await POST(request({ endpoint, keys, district: 'Хан-Уул' }))).json()).toEqual({ subscribed: false, vaccine: false });
  });
  it('does not accept a browser-only registration missing from the server', async () => {
    maybeSingle.mockResolvedValue({ data: null, error: null });
    expect(await (await POST(request())).json()).toEqual({ subscribed: false, vaccine: false });
  });
  it('does not reveal registration through an endpoint and forged keys', async () => {
    const response = await POST(request({ endpoint, keys: { ...keys, auth: 'wrong' }, district: 'Баянзүрх', userId: 'alice' }));
    expect(await response.json()).toEqual({ subscribed: false, vaccine: false });
  });
  it.each([undefined, 'Bearer bob'])('does not disclose an owned device to a guest or another account (%s)', async authorization => {
    maybeSingle.mockResolvedValue({ data: { ...row, user_id: 'alice' }, error: null });
    getUser.mockResolvedValue({ data: { user: { id: 'bob' } }, error: null });
    expect(await (await POST(request(undefined, authorization))).json()).toEqual({ subscribed: false, vaccine: false });
  });
  it('verifies owner auth on the server and reuses the proof for vaccine status', async () => {
    maybeSingle.mockResolvedValue({ data: { ...row, user_id: 'alice' }, error: null });
    const response = await POST(request(undefined, 'Bearer verified-token'));
    expect(await response.json()).toEqual({ subscribed: true, vaccine: true });
    expect(getUser).toHaveBeenCalledWith('verified-token');
    expect(limitUserRequest).toHaveBeenCalledWith('push-browser-status', 'alice', admin);
  });
  it('rejects a forged bearer instead of downgrading it to a guest', async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: new Error('bad token') });
    expect((await POST(request(undefined, 'Bearer forged'))).status).toBe(401);
    expect(from).not.toHaveBeenCalled();
  });
  it.each([
    { endpoint, district: 'Баянзүрх' },
    { endpoint, keys: { p256dh: '', auth: '' } },
    { endpoint: 'https://127.0.0.1/device', keys },
    { endpoint, keys, district: 'invalid' },
  ])('rejects invalid proof or district before reading subscriptions (%j)', async body => {
    expect((await POST(request(body))).status).toBe(400);
    expect(from).not.toHaveBeenCalled();
  });
  it.each([429, 503])('stops before expensive work when the rate store returns %i', async status => {
    vi.mocked(limitIpRequest).mockResolvedValue(Response.json({}, { status }) as Awaited<ReturnType<typeof limitIpRequest>>);
    expect((await POST(request())).status).toBe(status);
    expect(createAdminClient).not.toHaveBeenCalled();
  });
  it('bounds JSON bodies and does not disclose database failures', async () => {
    expect((await POST(request({ value: 'x'.repeat(17000) }))).status).toBe(413);
    maybeSingle.mockResolvedValue({ data: null, error: new Error('private backend details') });
    const response = await POST(request());
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: 'Status unavailable' });
  });
});
