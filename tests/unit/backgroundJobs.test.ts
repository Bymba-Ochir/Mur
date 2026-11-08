import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('next/server', async (importOriginal) => ({ ...await importOriginal<typeof import('next/server')>(), after: vi.fn() }));
vi.mock('web-push', () => ({ default: { setVapidDetails: vi.fn(), sendNotification: vi.fn() } }));
vi.mock('../../lib/supabaseAdmin', () => ({ createAdminClient: vi.fn() }));
vi.mock('../../lib/apiRateLimit', () => ({ limitServiceRequest: vi.fn() }));
vi.mock('../../lib/errorTracking', () => ({ reportError: vi.fn() }));
import { after } from 'next/server';
import webpush from 'web-push';
import { createAdminClient } from '../../lib/supabaseAdmin';
import { limitServiceRequest } from '../../lib/apiRateLimit';
import { reportError } from '../../lib/errorTracking';
import { runBackgroundJobs, scheduleBackgroundJobs, type BackgroundJob } from '../../lib/backgroundJobs';

const owner = 'bbd603c4-f47d-4ddc-86ac-75a579fb5278';
const petId = '93c0a77d-f012-4c08-b4a3-bc0982b370fd';
const id = 'cabf2a31-9caf-4f1e-8db6-aae4b0ea2fff';
const project = 'https://demo.supabase.co';
const url = (path: string) => `${project}/storage/v1/object/public/pet-photos/${path}`;
const rpc = vi.fn();
const from = vi.fn();
const insert = vi.fn();
const remove = vi.fn();
const getUserById = vi.fn();
const storageFrom = vi.fn();
const admin = { rpc, from, auth: { admin: { getUserById } }, storage: { from: storageFrom } } as unknown as ReturnType<typeof createAdminClient>;
let queue: BackgroundJob[];
let tasks: Array<() => unknown>;

function job(kind: BackgroundJob['kind'], payload: Record<string, unknown>): BackgroundJob {
  return { id, kind, payload, cursor_id: null, lease_token: petId, attempts: 1, created_at: '2026-11-01T00:00:00Z' };
}
function query(data: unknown) {
  return {
    select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), lte: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(), limit: vi.fn().mockReturnThis(), gt: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue({ data, error: null }),
    then(resolve: (result: { data: unknown; error: null }) => unknown) { return Promise.resolve({ data, error: null }).then(resolve); },
  };
}
beforeEach(() => {
  vi.resetAllMocks();
  queue = []; tasks = [];
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', project);
  vi.stubEnv('NEXT_PUBLIC_VAPID_PUBLIC_KEY', 'public'); vi.stubEnv('VAPID_PRIVATE_KEY', 'private');
  vi.mocked(createAdminClient).mockReturnValue(admin);
  vi.mocked(limitServiceRequest).mockResolvedValue(null);
  vi.mocked(after).mockImplementation((task) => { if (typeof task === 'function') tasks.push(task); });
  rpc.mockImplementation(async (name: string) => ({ data: name === 'claim_background_job' ? queue.splice(0, 1) : name === 'referenced_listing_photo_urls' ? [] : true, error: null }));
  from.mockImplementation((table: string) => table === 'notifications' ? { insert } : query(table === 'pets' ? { id: petId, resolved: false } : []));
  insert.mockResolvedValue({ error: null }); remove.mockResolvedValue({ error: null });
  storageFrom.mockReturnValue({ remove });
  getUserById.mockResolvedValue({ data: { user: null }, error: { status: 404 } });
  vi.mocked(webpush.sendNotification).mockResolvedValue({} as Awaited<ReturnType<typeof webpush.sendNotification>>);
});
afterEach(() => vi.unstubAllEnvs());

describe('response-independent worker scheduling', () => {
  it('does no work until after the response and then drains the durable queue', async () => {
    scheduleBackgroundJobs();
    expect(rpc).not.toHaveBeenCalled(); expect(limitServiceRequest).not.toHaveBeenCalled();
    expect(tasks).toHaveLength(1);
    await tasks[0]();
    expect(limitServiceRequest).toHaveBeenCalledWith('background-jobs');
    expect(rpc).toHaveBeenCalledExactlyOnceWith('claim_background_job');
  });
  it('stops a wake-up at the distributed service budget', async () => {
    vi.mocked(limitServiceRequest).mockResolvedValue(Response.json({}, { status: 429 }) as Awaited<ReturnType<typeof limitServiceRequest>>);
    scheduleBackgroundJobs(); await tasks[0](); expect(rpc).not.toHaveBeenCalled();
  });
  it('does not spend the cron admission budget twice', async () => {
    scheduleBackgroundJobs(true); await tasks[0](); expect(limitServiceRequest).not.toHaveBeenCalled();
  });
  it('reports worker/scheduling failures without undoing the response', async () => {
    rpc.mockRejectedValue(new Error('secret provider response'));
    scheduleBackgroundJobs(); await tasks[0]();
    expect(reportError).toHaveBeenCalledWith(expect.objectContaining({ message: 'Background worker failed' }), expect.anything());
    vi.mocked(after).mockImplementation(() => { throw new Error('no request scope'); });
    expect(() => scheduleBackgroundJobs()).not.toThrow();
  });
});

describe('leased, bounded job processing', () => {
  const notification = () => job('sighting-notification', { ownerId: owner, sightingId: id, petId, place: 'Park' });
  it('uses the persisted idempotency key and waits for its write before acknowledging', async () => {
    queue.push(notification());
    expect(await runBackgroundJobs(admin)).toEqual({ processed: 1, failed: 0 });
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ id, user_id: owner, href: `/pets/${petId}` }));
    expect(rpc).toHaveBeenCalledWith('finish_background_job', { target_id: id, target_lease: petId, outcome: 'done', next_cursor: null });
    expect(insert.mock.invocationCallOrder[0]).toBeLessThan(rpc.mock.invocationCallOrder[1]);
  });
  it('notifies the owner about guest sightings without requiring a private address', async () => {
    queue.push(job('sighting-notification', { ownerId: owner, sightingId: id, petId, guest: true }));
    expect(await runBackgroundJobs(admin)).toEqual({ processed: 1, failed: 0 });
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({
      user_id: owner, href: `/pets/${petId}#guest-sightings`, body: 'Шинэ харсан мэдээлэл нэмэгдлээ.',
    }));
  });
  it('preserves the referenced private image and removes an abandoned retry', async () => {
    const kept = `${id}/${petId}/${'a'.repeat(64)}.jpg`;
    const abandoned = `${id}/${owner}/${'a'.repeat(64)}.jpg`;
    const report = query({ photo_path: kept });
    from.mockReturnValue(report);
    queue.push(job('storage-cleanup', { guestSightingPhotoPath: kept }), job('storage-cleanup', { guestSightingPhotoPath: abandoned }));
    expect(await runBackgroundJobs(admin)).toEqual({ processed: 2, failed: 0 });
    expect(report.eq).toHaveBeenCalledWith('submission_key', id);
    expect(storageFrom).toHaveBeenCalledExactlyOnceWith('guest-sighting-photos');
    expect(remove).toHaveBeenCalledExactlyOnceWith([abandoned]);
  });
  it.each(['23505', '23503'])('treats a duplicate/deleted recipient (%s) as complete', async (code) => {
    queue.push(notification()); insert.mockResolvedValue({ error: { code } });
    expect((await runBackgroundJobs(admin)).failed).toBe(0);
  });
  it('retries failed jobs with their same lease and reports no private payload', async () => {
    queue.push({ ...notification(), attempts: 8 }); insert.mockResolvedValue({ error: new Error('private body/token') });
    expect((await runBackgroundJobs(admin)).failed).toBe(1);
    expect(rpc).toHaveBeenCalledWith('finish_background_job', expect.objectContaining({ outcome: 'retry', target_lease: petId }));
    const captured = vi.mocked(reportError).mock.calls[0][0] as Error;
    expect(captured.message).toContain('retries exhausted'); expect(captured.message).not.toContain('private');
  });
  it('stops after ten claims, leaving the rest persisted for another invocation', async () => {
    queue.push(...Array.from({ length: 11 }, notification));
    expect((await runBackgroundJobs(admin)).processed).toBe(10); expect(queue).toHaveLength(1);
  });
  it('does not silently accept a stale acknowledgement or failed queue store', async () => {
    queue.push(notification());
    rpc.mockImplementation(async (name: string) => ({ data: name === 'claim_background_job' ? queue.splice(0, 1) : false, error: null }));
    await expect(runBackgroundJobs(admin)).rejects.toThrow('lease lost');
    rpc.mockResolvedValue({ data: null, error: new Error('RPC unavailable') });
    await expect(runBackgroundJobs(admin)).rejects.toThrow('RPC unavailable');
  });
});

describe('paged nearby push', () => {
  const nearby = () => job('nearby-push', { petId, district: 'Баянзүрх', status: 'lost', type: 'cat', place: 'Park' });
  it('reads twenty recipients with a keyset cursor, five in flight, and checkpoints only after delivery', async () => {
    queue.push({ ...nearby(), cursor_id: owner });
    const subscriptions = Array.from({ length: 20 }, (_, i) => ({ id: `sub-${i}`, endpoint: `https://fcm.googleapis.com/device-${i}`, keys: { p256dh: 'p', auth: 'a' } }));
    const page = query(subscriptions);
    from.mockImplementation((table: string) => table === 'pets' ? query({ id: petId, resolved: false }) : page);
    let active = 0; let maximum = 0;
    vi.mocked(webpush.sendNotification).mockImplementation(async () => { active += 1; maximum = Math.max(maximum, active); await Promise.resolve(); active -= 1; return {} as Awaited<ReturnType<typeof webpush.sendNotification>>; });
    await runBackgroundJobs(admin);
    expect(page.limit).toHaveBeenCalledWith(20); expect(page.gt).toHaveBeenCalledWith('id', owner);
    expect(page.lte).toHaveBeenCalledWith('created_at', '2026-11-01T00:00:00Z'); expect(maximum).toBe(5);
    expect(rpc).toHaveBeenCalledWith('finish_background_job', expect.objectContaining({ outcome: 'continue', next_cursor: 'sub-19' }));
    expect(webpush.sendNotification).toHaveBeenCalledWith(expect.anything(), expect.stringContaining(`nearby:${petId}`), expect.objectContaining({ timeout: 3000 }));
  });
  it('does not notify for a deleted/resolved listing', async () => {
    queue.push(nearby()); from.mockReturnValue(query({ id: petId, resolved: true }));
    await runBackgroundJobs(admin); expect(webpush.sendNotification).not.toHaveBeenCalled();
  });
  it('removes expired endpoints but retries transient errors without advancing the page', async () => {
    queue.push(nearby());
    const page = query([{ id: owner, endpoint: 'https://fcm.googleapis.com/expired', keys: {} }, { id, endpoint: 'https://fcm.googleapis.com/transient', keys: {} }]);
    const deletion = query([]);
    from.mockImplementation((table: string) => table === 'pets' ? query({ resolved: false }) : from.mock.calls.filter(([name]) => name === 'push_subscriptions').length === 1 ? page : deletion);
    vi.mocked(webpush.sendNotification).mockRejectedValueOnce({ statusCode: 410 }).mockRejectedValueOnce({ statusCode: 503, body: 'private' });
    await runBackgroundJobs(admin);
    expect(deletion.eq).toHaveBeenCalledWith('id', owner);
    expect(rpc).toHaveBeenCalledWith('finish_background_job', expect.objectContaining({ outcome: 'retry', next_cursor: null }));
  });
  it('never sends to an unapproved endpoint', async () => {
    queue.push(nearby());
    from.mockImplementation((table: string) => table === 'pets' ? query({ resolved: false }) : query([{ id, endpoint: 'https://attacker.test/private', keys: {} }]));
    await runBackgroundJobs(admin); expect(webpush.sendNotification).not.toHaveBeenCalled();
  });
});

describe('privileged cleanup jobs', () => {
  it('keeps referenced files and rejects another owner or origin', async () => {
    const kept = url(`${owner}/kept.jpg`); const deleted = url(`${owner}/deleted.jpg`);
    queue.push(job('storage-cleanup', { ownerId: owner, urls: [kept, deleted, url(`${petId}/other.jpg`), 'https://evil.test/file.jpg'] }));
    rpc.mockImplementation(async (name: string) => ({ data: name === 'claim_background_job' ? queue.splice(0, 1) : name === 'referenced_listing_photo_urls' ? [{ url: kept }] : true, error: null }));
    await runBackgroundJobs(admin); expect(remove).toHaveBeenCalledExactlyOnceWith([`${owner}/deleted.jpg`]);
  });
  it('does not delete storage before it can verify current references', async () => {
    queue.push(job('storage-cleanup', { ownerId: owner, urls: [url(`${owner}/photo.jpg`)] }));
    rpc.mockImplementation(async (name: string) => name === 'referenced_listing_photo_urls' ? { error: new Error('offline') } : { data: name === 'claim_background_job' ? queue.splice(0, 1) : true });
    expect((await runBackgroundJobs(admin)).failed).toBe(1); expect(remove).not.toHaveBeenCalled();
  });
  it('cleans only the three fixed avatar names after verifying the account is gone', async () => {
    queue.push(job('avatar-cleanup', { ownerId: owner })); await runBackgroundJobs(admin);
    expect(getUserById).toHaveBeenCalledWith(owner);
    expect(remove).toHaveBeenCalledWith(['avatar.jpg', 'avatar.png', 'avatar.webp'].map(name => `${owner}/${name}`));
  });
  it('retains avatars when the owner still exists', async () => {
    queue.push(job('avatar-cleanup', { ownerId: owner })); getUserById.mockResolvedValue({ data: { user: { id: owner } }, error: null });
    expect((await runBackgroundJobs(admin)).failed).toBe(1); expect(remove).not.toHaveBeenCalled();
  });
});
