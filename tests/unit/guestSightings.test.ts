// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { POST } from '../../app/api/sightings/guest/route';
import { POST as review } from '../../app/api/sightings/guest/review/route';

const { rpc, schedule, limitResourceIpRequest } = vi.hoisted(() => ({
  rpc: vi.fn(), schedule: vi.fn(), limitResourceIpRequest: vi.fn(),
}));
vi.mock('../../lib/supabaseAdmin', () => ({ createAdminClient: () => ({ rpc }) }));
vi.mock('../../lib/apiRateLimit', () => ({ limitIpRequest: async () => null, limitUserRequest: async () => null, limitResourceIpRequest }));
vi.mock('../../lib/backgroundJobs', () => ({ scheduleBackgroundJobs: schedule }));
vi.mock('../../lib/errorTracking', () => ({ reportError: vi.fn() }));
vi.mock('../../lib/serverAuth', () => ({
  requireRequestUser: async () => ({ user: { id: 'verified-owner' }, admin: { rpc } }),
}));

const petId = '01000000-0000-4000-8000-000000000001';
const key = '01000000-0000-4000-8000-000000000002';

function submission(details = {}) {
  return new Request('https://mur.example/api/sightings/guest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Idempotency-Key': key },
    body: JSON.stringify({ petId, message: 'Seen', turnstileToken: 'token', ...details }),
  });
}

function verify(result = { success: true, hostname: 'mur.example', action: 'guest_sighting' }) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(result)));
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv('TURNSTILE_SITE_KEY', 'site');
  vi.stubEnv('TURNSTILE_SECRET_KEY', 'secret');
  vi.stubEnv('TURNSTILE_HOSTNAME', 'mur.example');
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

it('requires successful Turnstile validation for the expected hostname and action', async () => {
  verify({ success: true, hostname: 'mur.example', action: 'different_form' });
  expect((await POST(submission())).status).toBe(400);
  verify({ success: true, hostname: 'untrusted.example', action: 'guest_sighting' });
  expect((await POST(submission())).status).toBe(400);
  expect(rpc).not.toHaveBeenCalled();
});

it('ignores forged identity and queues a notification only after storage succeeds', async () => {
  verify();
  rpc.mockResolvedValue({ data: 'created', error: null });
  const request = submission({ ownerId: 'forged', author: 'forged' });
  expect((await POST(request)).status).toBe(201);
  expect(limitResourceIpRequest).toHaveBeenCalledWith(request, 'guest-sighting', petId, { rpc });
  expect(rpc).toHaveBeenCalledExactlyOnceWith('submit_guest_sighting', {
    target_key: key, target_pet: petId, target_message: 'Seen',
    target_place: null, target_lat: null, target_lng: null, target_sighted_at: null,
  });
  expect(schedule).toHaveBeenCalledOnce();
});

it('does not store a verified report if its listing quota is exhausted', async () => {
  verify();
  limitResourceIpRequest.mockResolvedValue(new Response(null, { status: 429 }));
  expect((await POST(submission())).status).toBe(429);
  expect(rpc).not.toHaveBeenCalled();
});

it('uses the verified identity for moderation and disables caching of private details', async () => {
  rpc.mockResolvedValue({ data: null, error: null });
  const response = await review(new Request('https://mur.example/api/sightings/guest/review', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ petId, id: key, action: 'publish', ownerId: 'forged' }),
  }));
  expect(response.status).toBe(404);
  expect(response.headers.get('Cache-Control')).toBe('private, no-store');
  expect(rpc).toHaveBeenCalledExactlyOnceWith('review_guest_sighting', {
    target_pet: petId, target_id: key, target_owner: 'verified-owner', action: 'publish',
  });
});
