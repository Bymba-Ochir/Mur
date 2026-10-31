import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { createAdminClient } from '../../lib/supabaseAdmin';

vi.mock('web-push', () => ({ default: { sendNotification: vi.fn(), setVapidDetails: vi.fn() } }));
vi.mock('../../lib/apiRateLimit', () => ({ limitIpRequest: async () => null, limitUserRequest: async () => null, limitServiceRequest: async () => null }));
vi.mock('../../lib/supabaseAdmin', () => ({ createAdminClient: vi.fn() }));

import webpush from 'web-push';
import { deliverReminderPages, type ReminderClaim } from '../../lib/serverReminderDelivery';
import { GET } from '../../app/api/vaccine-reminders/route';
import { createAdminClient as makeAdmin } from '../../lib/supabaseAdmin';

const today = '2026-10-31';
const subscription = { endpoint: 'https://fcm.googleapis.com/device', keys: { p256dh: 'key', auth: 'auth' } };
const config = {
  rpc: 'claim_due_vaccine_reminders_with_subscriptions' as const,
  table: 'my_pets' as const,
  payload: (claim: ReminderClaim) => ({ title: claim.id, body: 'Reminder', url: '/my-pets' }),
};

function database(pages: Array<{ data: ReminderClaim[] | null; error: unknown }>, updateError: unknown = null) {
  const eq = vi.fn().mockResolvedValue({ error: updateError });
  const inIds = vi.fn<(column: string, ids: string[]) => { eq: typeof eq }>().mockReturnValue({ eq });
  const update = vi.fn<(payload: { last_notified_date: string }) => { in: typeof inIds }>().mockReturnValue({ in: inIds });
  const from = vi.fn<(table: string) => { update: typeof update }>().mockReturnValue({ update });
  const rpc = vi.fn();
  pages.forEach((page) => rpc.mockResolvedValueOnce(page));
  const admin = { rpc, from } as unknown as ReturnType<typeof createAdminClient>;
  return { admin, rpc, from, update, inIds, eq };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(webpush.sendNotification).mockResolvedValue({ statusCode: 201, body: '', headers: {} });
});
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe('joined reminder pages', () => {
  it.each([config, { ...config, rpc: 'claim_due_medication_reminders_with_subscriptions' as const, table: 'medications' as const }])(
    'uses one joined read and one guarded update per page for $table', async (kind) => {
      const claims = Array.from({ length: 99 }, (_, i) => ({ id: String(i), subscriptions: [subscription] }));
      const db = database([{ data: claims, error: null }]);
      expect(await deliverReminderPages(db.admin, today, kind)).toEqual({ checked: 99, sent: 99 });
      expect(db.rpc).toHaveBeenCalledExactlyOnceWith(kind.rpc, { max_rows: 100 });
      // No push_subscriptions reads, even when every claim belongs to a different user.
      expect(db.from).toHaveBeenCalledExactlyOnceWith(kind.table);
      expect(db.update).toHaveBeenCalledExactlyOnceWith({ last_notified_date: today });
      expect(db.inIds).toHaveBeenCalledExactlyOnceWith('id', claims.map((claim) => claim.id));
      expect(db.eq).toHaveBeenCalledExactlyOnceWith('reminder_claim_date', today);
    },
  );

  it('fetches the next small page without per-claim database calls', async () => {
    const first = Array.from({ length: 100 }, (_, i) => ({ id: String(i), subscriptions: [] }));
    const db = database([{ data: first, error: null }, { data: [{ id: 'next', subscriptions: [] }], error: null }]);
    expect(await deliverReminderPages(db.admin, today, config)).toEqual({ checked: 101, sent: 0 });
    expect(db.rpc).toHaveBeenCalledTimes(2);
    expect(db.from).toHaveBeenCalledTimes(2);
    expect(db.inIds.mock.calls.map((call) => call[1].length)).toEqual([100, 1]);
  });

  it('does not update or send when the claim page is empty', async () => {
    const db = database([{ data: [], error: null }]);
    expect(await deliverReminderPages(db.admin, today, config)).toEqual({ checked: 0, sent: 0 });
    expect(db.from).not.toHaveBeenCalled();
    expect(webpush.sendNotification).not.toHaveBeenCalled();
  });

  it('acknowledges only delivered reminders and reminders with no subscriptions', async () => {
    vi.mocked(webpush.sendNotification).mockRejectedValueOnce(new Error('expired'));
    const claims = [
      { id: 'failed', subscriptions: [subscription] },
      { id: 'unsafe', subscriptions: [{ ...subscription, endpoint: 'https://internal.example/push' }] },
      { id: 'none', subscriptions: [] },
      { id: 'delivered', subscriptions: [subscription] },
    ];
    const db = database([{ data: claims, error: null }]);
    expect(await deliverReminderPages(db.admin, today, config)).toEqual({ checked: 4, sent: 1 });
    expect(webpush.sendNotification).toHaveBeenCalledTimes(2);
    expect(db.inIds).toHaveBeenCalledExactlyOnceWith('id', ['none', 'delivered']);
  });

  it('continues to other devices after a failed push', async () => {
    vi.mocked(webpush.sendNotification).mockRejectedValueOnce(new Error('expired'));
    const second = { ...subscription, endpoint: 'https://web.push.apple.com/device' };
    const db = database([{ data: [{ id: 'pet', subscriptions: [subscription, second] }], error: null }]);
    expect(await deliverReminderPages(db.admin, today, config)).toEqual({ checked: 1, sent: 1 });
    expect(db.inIds).toHaveBeenCalledExactlyOnceWith('id', ['pet']);
  });

  it('does not acknowledge when every device fails', async () => {
    vi.mocked(webpush.sendNotification).mockRejectedValue(new Error('expired'));
    const db = database([{ data: [{ id: 'pet', subscriptions: [subscription] }], error: null }]);
    expect(await deliverReminderPages(db.admin, today, config)).toEqual({ checked: 1, sent: 0 });
    expect(db.from).not.toHaveBeenCalled();
  });

  it('fails closed when the join RPC is missing, without retrying the old claim RPC', async () => {
    const error = { code: 'PGRST202', message: 'function not found' };
    const db = database([{ data: null, error }]);
    await expect(deliverReminderPages(db.admin, today, config)).rejects.toBe(error);
    expect(db.rpc).toHaveBeenCalledTimes(1);
    expect(db.from).not.toHaveBeenCalled();
    expect(webpush.sendNotification).not.toHaveBeenCalled();
  });
});

describe('reminder route authorization', () => {
  it('rejects requests without a configured cron secret', async () => {
    vi.stubEnv('CRON_SECRET', '');
    expect((await GET(new Request('https://example.com/api/vaccine-reminders'))).status).toBe(503);
    expect(makeAdmin).not.toHaveBeenCalled();
  });

  it('rejects an invalid bearer token before reaching the database', async () => {
    vi.stubEnv('CRON_SECRET', 'expected');
    expect((await GET(new Request('https://example.com/api/vaccine-reminders', { headers: { authorization: 'Bearer wrong' } }))).status).toBe(401);
    expect(makeAdmin).not.toHaveBeenCalled();
  });

  it('keeps vaccine and medication payloads and response counts', async () => {
    vi.stubEnv('CRON_SECRET', 'expected');
    vi.stubEnv('NEXT_PUBLIC_VAPID_PUBLIC_KEY', 'public');
    vi.stubEnv('VAPID_PRIVATE_KEY', 'private');
    const db = database([]);
    db.rpc.mockResolvedValueOnce({ data: [{ id: 'pet', name: 'Mur', subscriptions: [subscription] }], error: null });
    db.rpc.mockResolvedValueOnce({ data: [{ id: 'med', pet_name: 'Mur', name: 'Medicine', dosage: '5ml', subscriptions: [subscription] }], error: null });
    vi.mocked(makeAdmin).mockReturnValue(db.admin);
    const response = await GET(new Request('https://example.com/api/vaccine-reminders', { headers: { authorization: 'Bearer expected' } }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ checked: 1, sent: 1, medsChecked: 1, medsSent: 1 });
    const payloads = vi.mocked(webpush.sendNotification).mock.calls.map((call) => JSON.parse(call[1] as string));
    expect(payloads[0].title).toContain('Mur');
    expect(payloads[1]).toMatchObject({ body: 'Medicine — 5ml', url: '/my-pets' });
    expect(db.from.mock.calls.map((call) => call[0])).toEqual(['my_pets', 'medications']);
  });
});
