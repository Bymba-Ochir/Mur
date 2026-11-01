import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('../../lib/apiRateLimit', () => ({ limitIpRequest: vi.fn(), limitUserRequest: vi.fn(), limitServiceRequest: vi.fn() }));
vi.mock('../../lib/backgroundJobs', () => ({ scheduleBackgroundJobs: vi.fn() }));
vi.mock('../../lib/supabaseAdmin', () => ({ createAdminClient: vi.fn() }));
vi.mock('../../lib/serverAuth', () => ({ requireRequestUser: vi.fn() }));
vi.mock('../../lib/errorTracking', () => ({ reportError: vi.fn() }));
import { createAdminClient } from '../../lib/supabaseAdmin';
import { requireRequestUser } from '../../lib/serverAuth';
import { scheduleBackgroundJobs } from '../../lib/backgroundJobs';
import { limitServiceRequest } from '../../lib/apiRateLimit';
import { POST as notify } from '../../app/api/notify/route';
import { POST as sighting } from '../../app/api/sightings/route';
import { DELETE as contentDelete } from '../../app/api/content/[kind]/[id]/route';
import { DELETE as accountDelete } from '../../app/api/account/delete/route';
import { GET as worker } from '../../app/api/background-jobs/route';

const id = 'cabf2a31-9caf-4f1e-8db6-aae4b0ea2fff';
const petId = '93c0a77d-f012-4c08-b4a3-bc0982b370fd';
const owner = 'bbd603c4-f47d-4ddc-86ac-75a579fb5278';
const rpc = vi.fn(); const from = vi.fn(); const remove = vi.fn(); const deleteUser = vi.fn();
const admin = { rpc, from, storage: { from: remove }, auth: { admin: { deleteUser } } } as unknown as ReturnType<typeof createAdminClient>;
function request(path: string, body: unknown = {}, method = 'POST', secret = 'private') {
  return new Request(`https://mur.test${path}`, { method,
    headers: { 'content-type': 'application/json', 'authorization': `Bearer ${secret}`, 'x-webhook-secret': secret, 'idempotency-key': id },
    ...(method === 'GET' ? {} : { body: JSON.stringify(body) }),
  });
}
beforeEach(() => {
  vi.resetAllMocks(); vi.stubEnv('NOTIFY_WEBHOOK_SECRET', 'private'); vi.stubEnv('CRON_SECRET', 'private');
  vi.mocked(createAdminClient).mockReturnValue(admin);
  vi.mocked(requireRequestUser).mockResolvedValue({ user: { id: owner }, admin } as Awaited<ReturnType<typeof requireRequestUser>>);
  rpc.mockResolvedValue({ data: id, error: null }); deleteUser.mockResolvedValue({ error: null });
});
afterEach(() => vi.unstubAllEnvs());

describe('nearby webhook queue admission', () => {
  it('only trusts the record ID, ignoring webhook payload recipients/content', async () => {
    const response = await notify(request('/api/notify', { record: { id: petId, district: 'forged', endpoint: 'https://evil.test', created_by: id, place: 'forged' } }));
    expect(response.status).toBe(202); expect(await response.json()).toEqual({ accepted: true });
    expect(rpc).toHaveBeenCalledExactlyOnceWith('enqueue_nearby_notification', { target_pet: petId });
    expect(from).not.toHaveBeenCalled(); expect(scheduleBackgroundJobs).toHaveBeenCalledOnce();
  });
  it('does not acknowledge or wake the worker until the enqueue write commits', async () => {
    let release: (value: { data: string; error: null }) => void = () => {};
    rpc.mockReturnValue(new Promise(resolve => { release = resolve; }));
    const pending = notify(request('/api/notify', { record: { id: petId } }));
    await vi.waitFor(() => expect(rpc).toHaveBeenCalled());
    expect(scheduleBackgroundJobs).not.toHaveBeenCalled();
    release({ data: id, error: null }); expect((await pending).status).toBe(202);
  });
  it('returns 503 on an enqueue failure and never falsely acknowledges delivery', async () => {
    rpc.mockResolvedValue({ error: new Error('offline') });
    expect((await notify(request('/api/notify', { record: { id: petId } }))).status).toBe(503);
    expect(scheduleBackgroundJobs).not.toHaveBeenCalled();
  });
  it('does not wake a job for a missing/resolved pet', async () => {
    rpc.mockResolvedValue({ data: null, error: null });
    expect(await (await notify(request('/api/notify', { record: { id: petId } }))).json()).toEqual({ accepted: false });
    expect(scheduleBackgroundJobs).not.toHaveBeenCalled();
  });
  it('rejects invalid JSON/IDs and secrets before queue access', async () => {
    expect((await notify(request('/api/notify', { record: { id: 'wrong' } }))).status).toBe(400);
    expect((await notify(new Request('https://mur.test/api/notify', { method: 'POST', headers: { 'x-webhook-secret': 'private' }, body: '{' }))).status).toBe(400);
    expect((await notify(request('/api/notify', { record: { id: petId } }, 'POST', 'wrong'))).status).toBe(401);
    expect(rpc).not.toHaveBeenCalled();
  });
});

describe('sighting mutation/outbox separation', () => {
  function existing(data: unknown = null) {
    from.mockReturnValue({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data, error: null }) }) }) });
  }
  it('responds once v99 creation has committed without writing notifications in the request', async () => {
    existing(); rpc.mockResolvedValue({ data: [{ created: true, owner_id: id }], error: null });
    const response = await sighting(request('/api/sightings', { petId, message: 'Seen', place: 'Park', reporterId: id }));
    expect(response.status).toBe(201);
    expect(rpc).toHaveBeenCalledExactlyOnceWith('create_sighting_if_active', expect.objectContaining({ target_reporter: owner, target_pet: petId }));
    expect(from).toHaveBeenCalledExactlyOnceWith('sightings'); expect(scheduleBackgroundJobs).toHaveBeenCalledOnce();
  });
  it('repairs a matching pre-v103 retry without accepting forged identities', async () => {
    existing({ id, pet_id: petId, reporter_id: owner, message: 'Seen', place: 'Park' });
    expect((await sighting(request('/api/sightings', { petId, message: 'Seen', place: 'Park' }))).status).toBe(200);
    expect(rpc).toHaveBeenCalledExactlyOnceWith('enqueue_sighting_notification', { target_id: id });
  });
  it('does not enqueue or wake on a mismatched retry or inactive pet', async () => {
    existing({ id, pet_id: petId, reporter_id: id, message: 'Seen', place: 'Park' });
    expect((await sighting(request('/api/sightings', { petId, message: 'Seen', place: 'Park' }))).status).toBe(409);
    expect(rpc).not.toHaveBeenCalled();
    existing(); rpc.mockResolvedValue({ error: { message: 'PET_NOT_ACTIVE' } });
    expect((await sighting(request('/api/sightings', { petId, message: 'Seen', place: 'Park' }))).status).toBe(404);
    expect(scheduleBackgroundJobs).not.toHaveBeenCalled();
  });
  it('reports an outbox repair failure rather than an unhandled rejection', async () => {
    existing({ id, pet_id: petId, reporter_id: owner, message: 'Seen', place: 'Park' }); rpc.mockResolvedValue({ error: new Error('offline') });
    expect((await sighting(request('/api/sightings', { petId, message: 'Seen', place: 'Park' }))).status).toBe(500);
    expect(scheduleBackgroundJobs).not.toHaveBeenCalled();
  });
});

describe('deletion response boundaries', () => {
  function content(ownerId = owner, error: Error | null = null) {
    from.mockImplementation((table: string) => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: table === 'admins' ? null : { created_by: ownerId }, error: null }) }) }),
      delete: () => ({ eq: async () => ({ error }) }),
    }));
  }
  it('waits for content deletion but leaves all file cleanup to its transactional job', async () => {
    content(); const response = await contentDelete(request('/api/content/pets/' + petId, {}, 'DELETE'), { params: Promise.resolve({ kind: 'pets', id: petId }) });
    expect(response.status).toBe(200); expect(await response.json()).toEqual({ ok: true, storageCleanupPending: true });
    expect(remove).not.toHaveBeenCalled(); expect(scheduleBackgroundJobs).toHaveBeenCalledOnce();
    expect(from.mock.calls.map(([table]) => table)).toEqual(['admins', 'pets', 'pets']);
  });
  it('retains ownership checks and does not wake on denied/failed deletion', async () => {
    content(id);
    const invoke = () => contentDelete(request('/api/content/pets/' + petId, {}, 'DELETE'), { params: Promise.resolve({ kind: 'pets', id: petId }) });
    expect((await invoke()).status).toBe(403); content(owner, new Error('offline'));
    expect((await invoke()).status).toBe(500); expect(scheduleBackgroundJobs).not.toHaveBeenCalled();
  });
  it('confirms auth deletion before success and never loads all user photos', async () => {
    content(); expect((await accountDelete(request('/api/account/delete', { confirmation: 'УСТГАХ' }, 'DELETE'))).status).toBe(200);
    expect(deleteUser).toHaveBeenCalledWith(owner); expect(remove).not.toHaveBeenCalled();
    expect(from.mock.calls.map(([table]) => table)).toEqual(['pets', 'adoptions', 'sitting_listings']);
    expect(scheduleBackgroundJobs).toHaveBeenCalledOnce();
  });
  it('does not claim account deletion success if auth removal fails', async () => {
    content(); deleteUser.mockResolvedValue({ error: new Error('auth offline') });
    expect((await accountDelete(request('/api/account/delete', { confirmation: 'УСТГАХ' }, 'DELETE'))).status).toBe(500);
    expect(scheduleBackgroundJobs).not.toHaveBeenCalled();
  });
});

describe('private scheduled worker entry', () => {
  it('rejects missing configuration and incorrect credentials before touching rate/queue state', async () => {
    vi.stubEnv('CRON_SECRET', ''); expect((await worker(request('/api/background-jobs', {}, 'GET'))).status).toBe(503);
    vi.stubEnv('CRON_SECRET', 'private'); expect((await worker(request('/api/background-jobs', {}, 'GET', 'wrong'))).status).toBe(401);
    expect(limitServiceRequest).not.toHaveBeenCalled(); expect(scheduleBackgroundJobs).not.toHaveBeenCalled();
  });
  it('accepts valid cron calls without waiting for execution', async () => {
    const response = await worker(request('/api/background-jobs', {}, 'GET'));
    expect(response.status).toBe(202); expect(response.headers.get('cache-control')).toBe('no-store');
    expect(scheduleBackgroundJobs).toHaveBeenCalledExactlyOnceWith(true);
  });
});
