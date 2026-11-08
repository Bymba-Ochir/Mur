// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { POST } from '../../app/api/sightings/guest/route';
import { GET as getPublishedPhoto } from '../../app/api/sightings/guest/photo/route';
import { GET as reviewGet, POST as review } from '../../app/api/sightings/guest/review/route';
import sharp from 'sharp';

const { rpc, schedule, limitIpRequest, limitResourceIpRequest, from, insert, storageFrom, upload, download } = vi.hoisted(() => ({
  rpc: vi.fn(), schedule: vi.fn(), limitIpRequest: vi.fn(), limitResourceIpRequest: vi.fn(),
  from: vi.fn(), insert: vi.fn(), storageFrom: vi.fn(), upload: vi.fn(), download: vi.fn(),
}));
vi.mock('../../lib/supabaseAdmin', () => ({ createAdminClient: () => ({ rpc, from, storage: { from: storageFrom } }) }));
vi.mock('../../lib/apiRateLimit', () => ({ limitIpRequest, limitUserRequest: async () => null, limitResourceIpRequest }));
vi.mock('../../lib/backgroundJobs', () => ({ scheduleBackgroundJobs: schedule }));
vi.mock('../../lib/errorTracking', () => ({ reportError: vi.fn() }));
vi.mock('../../lib/serverAuth', () => ({
  requireRequestUser: async () => ({ user: { id: 'verified-owner' }, admin: { rpc, storage: { from: storageFrom } } }),
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
  from.mockReturnValue({ insert });
  storageFrom.mockReturnValue({ upload, download });
  insert.mockResolvedValue({ error: null });
  upload.mockResolvedValue({ error: null });
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
  expect(limitResourceIpRequest).toHaveBeenCalledWith(request, 'guest-sighting', petId, expect.objectContaining({ rpc }));
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

it('uploads a valid guest image to private storage only after CAPTCHA passes', async () => {
  const png = await sharp({ create: { width: 2, height: 2, channels: 3, background: 'red' } }).png().toBuffer();
  const request = () => {
    const form = new FormData();
    form.set('details', JSON.stringify({ petId, message: 'Seen', turnstileToken: 'token', allowPublicPhoto: true }));
    form.set('photo', new Blob([new Uint8Array(png)], { type: 'image/png' }), 'test.png');
    return new Request('https://mur.example/api/sightings/guest', {
      method: 'POST', headers: { 'Idempotency-Key': key }, body: form,
    });
  };
  verify({ success: false, hostname: 'mur.example', action: 'guest_sighting' });
  expect((await POST(request())).status).toBe(400);
  expect(upload).not.toHaveBeenCalled();

  verify();
  rpc.mockResolvedValue({ data: 'created', error: null });
  expect((await POST(request())).status).toBe(201);
  expect(storageFrom).toHaveBeenCalledExactlyOnceWith('guest-sighting-photos');
  const [path, bytes] = upload.mock.calls[0];
  expect(path).toMatch(new RegExp(`^${key}/`));
  expect((await sharp(bytes).metadata()).format).toBe('jpeg');
  expect(insert).toHaveBeenCalledWith(expect.objectContaining({ payload: { guestSightingPhotoPath: path } }));
  expect(rpc).toHaveBeenCalledWith('submit_guest_sighting_with_photo_consent', expect.objectContaining({ target_photo_path: path, allow_public_photo: true }));
});

it('requires listing ownership on each private image request', async () => {
  const request = () => new Request(`https://mur.example/api/sightings/guest/review?petId=${petId}&photoId=${key}&ownerId=forged`);
  rpc.mockResolvedValue({ data: null, error: null });
  expect((await reviewGet(request())).status).toBe(404);
  expect(download).not.toHaveBeenCalled();

  const path = `${key}/${petId}/${'a'.repeat(64)}.jpg`;
  rpc.mockResolvedValue({ data: path, error: null });
  download.mockResolvedValue({ data: new Blob(['bytes'], { type: 'image/jpeg' }), error: null });
  const response = await reviewGet(request());
  expect(response.status).toBe(200);
  expect(response.headers.get('Cache-Control')).toBe('private, no-store');
  expect(storageFrom).toHaveBeenCalledExactlyOnceWith('guest-sighting-photos');
  expect(download).toHaveBeenCalledExactlyOnceWith(path);
  expect(rpc).toHaveBeenLastCalledWith('read_guest_sighting_photo', {
    target_pet: petId, target_id: key, target_owner: 'verified-owner',
  });
});

it('serves only published photo bytes and never redirects to private storage', async () => {
  const request = new Request(`https://mur.example/api/sightings/guest/photo?petId=${petId}&id=${key}`);
  rpc.mockResolvedValue({ data: null, error: null });
  expect((await getPublishedPhoto(request)).status).toBe(404);
  expect(download).not.toHaveBeenCalled();

  const path = `${key}/${petId}/${'b'.repeat(64)}.jpg`;
  rpc.mockResolvedValue({ data: path, error: null });
  download.mockResolvedValue({ data: new Blob(['image'], { type: 'image/jpeg' }), error: null });
  const response = await getPublishedPhoto(request);
  expect(response.status).toBe(200);
  expect(response.headers.get('Cache-Control')).toContain('no-store');
  expect(response.headers.get('Location')).toBeNull();
  expect(await response.text()).toBe('image');
  expect(rpc).toHaveBeenLastCalledWith('read_published_guest_sighting_photo', { target_pet: petId, target_id: key });
});

it('uses the verified identity for moderation and disables caching of private details', async () => {
  rpc.mockResolvedValue({ data: null, error: null });
  const response = await review(new Request('https://mur.example/api/sightings/guest/review', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ petId, id: key, action: 'publish', ownerId: 'forged' }),
  }));
  expect(response.status).toBe(404);
  expect(response.headers.get('Cache-Control')).toBe('private, no-store');
  expect(rpc).toHaveBeenCalledExactlyOnceWith('review_guest_sighting_with_photo', {
    target_pet: petId, target_id: key, target_owner: 'verified-owner', action: 'publish',
  });
});
