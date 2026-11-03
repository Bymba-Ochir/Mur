import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { createAdminClient as AdminFactory } from '../../lib/supabaseAdmin';
vi.mock('../../lib/apiRateLimit', () => ({ limitIpRequest: vi.fn(), limitUserRequest: vi.fn(), limitServiceRequest: vi.fn() }));
vi.mock('../../lib/serverAuth', () => ({ requireRequestUser: vi.fn() }));
vi.mock('../../lib/supabaseAdmin', () => ({ createAdminClient: vi.fn() }));
vi.mock('../../lib/errorTracking', () => ({ reportError: vi.fn() }));
vi.mock('../../lib/backgroundJobs', () => ({ scheduleBackgroundJobs: vi.fn() }));
vi.mock('../../lib/qpay', () => ({ checkQPayPayment: vi.fn(), createQPayInvoice: vi.fn() }));
vi.mock('web-push', () => ({ default: { setVapidDetails: vi.fn(), sendNotification: vi.fn() } }));

import { limitIpRequest, limitUserRequest, limitServiceRequest } from '../../lib/apiRateLimit';
import { requireRequestUser } from '../../lib/serverAuth';
import { createAdminClient } from '../../lib/supabaseAdmin';
import { checkQPayPayment, createQPayInvoice } from '../../lib/qpay';
import webpush from 'web-push';
import { GET as health } from '../../app/api/health/route';
import { GET as accountExport } from '../../app/api/account/export/route';
import { DELETE as accountDelete } from '../../app/api/account/delete/route';
import { DELETE as contentDelete } from '../../app/api/content/[kind]/[id]/route';
import { POST as reports } from '../../app/api/reports/route';
import { POST as sightings } from '../../app/api/sightings/route';
import { POST as assistant } from '../../app/api/assistant/route';
import { POST as donationCreate } from '../../app/api/donations/create/route';
import { GET as donationStatus } from '../../app/api/donations/status/route';
import { POST as callback } from '../../app/api/qpay/callback/route';
import { GET as pushStatus, POST as pushCreate } from '../../app/api/push-subscriptions/route';
import { POST as notify } from '../../app/api/notify/route';
import { GET as cron } from '../../app/api/vaccine-reminders/route';
import { GET as backgroundWorker } from '../../app/api/background-jobs/route';

const id = '4ae02d5a-f9a3-4bf0-b7de-059c86f85a4d';
const petId = '7dc31e58-2087-41c3-821c-ed4515aa5d47';
const from = vi.fn();
const rpc = vi.fn();
const getUser = vi.fn();
const admin = { from, rpc, auth: { getUser, admin: { deleteUser: vi.fn() } }, storage: { from: vi.fn() } } as unknown as ReturnType<typeof AdminFactory>;

function request(path: string, method = 'POST', body: unknown = {}, headers: Record<string, string> = {}) {
  return new Request(`https://mur.test${path}`, {
    method, headers: { authorization: 'Bearer private', 'content-type': 'application/json', 'Idempotency-Key': id, ...headers },
    ...(method === 'GET' ? {} : { body: JSON.stringify(body) }),
  });
}
const params = () => ({ params: Promise.resolve({ kind: 'pets', id }) });
const endpoints: Array<[string, () => Promise<Response>]> = [
  ['GET /health', () => health(request('/api/health', 'GET'))],
  ['GET /account/export', () => accountExport(request('/api/account/export', 'GET'))],
  ['DELETE /account/delete', () => accountDelete(request('/api/account/delete', 'DELETE', { confirmation: 'УСТГАХ' }))],
  ['DELETE /content/:kind/:id', () => contentDelete(request(`/api/content/pets/${id}`, 'DELETE'), params())],
  ['POST /reports', () => reports(request('/api/reports'))],
  ['POST /sightings', () => sightings(request('/api/sightings'))],
  ['POST /assistant', () => assistant(request('/api/assistant', 'POST', { message: 'test' }))],
  ['POST /donations/create', () => donationCreate(request('/api/donations/create'))],
  ['GET /donations/status', () => donationStatus(request('/api/donations/status', 'GET'))],
  ['POST /qpay/callback', () => callback(request('/api/qpay/callback'))],
  ['GET /push-subscriptions', () => pushStatus(request('/api/push-subscriptions?endpoint=https://fcm.googleapis.com/device', 'GET'))],
  ['POST /push-subscriptions', () => pushCreate(request('/api/push-subscriptions'))],
  ['POST /notify', () => notify(request('/api/notify', 'POST', {}, { 'x-webhook-secret': 'private' }))],
  ['GET /vaccine-reminders', () => cron(request('/api/vaccine-reminders', 'GET'))],
  ['GET /background-jobs', () => backgroundWorker(request('/api/background-jobs', 'GET'))],
];

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv('CRON_SECRET', 'private');
  vi.stubEnv('QPAY_CALLBACK_SECRET', 'private');
  vi.stubEnv('NOTIFY_WEBHOOK_SECRET', 'private');
  vi.stubEnv('NEXT_PUBLIC_VAPID_PUBLIC_KEY', 'public');
  vi.stubEnv('VAPID_PRIVATE_KEY', 'private');
  vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://mur.test');
  vi.mocked(createAdminClient).mockReturnValue(admin);
  vi.mocked(requireRequestUser).mockResolvedValue({ user: { id: 'verified-user' }, admin } as Awaited<ReturnType<typeof requireRequestUser>>);
  getUser.mockResolvedValue({ data: { user: { id: 'verified-user' } }, error: null });
  vi.mocked(limitIpRequest).mockResolvedValue(null);
  vi.mocked(limitUserRequest).mockResolvedValue(null);
  vi.mocked(limitServiceRequest).mockResolvedValue(null);
});
afterEach(() => vi.unstubAllEnvs());

describe.each([429, 503])('all API handlers stop expensive work on admission status %i', (status) => {
  it.each(endpoints)('%s', async (_name, invoke) => {
    const blocked = Response.json({ error: 'blocked' }, { status, headers: { 'Retry-After': '5' } });
    vi.mocked(limitIpRequest).mockResolvedValue(blocked as Awaited<ReturnType<typeof limitIpRequest>>);
    vi.mocked(limitServiceRequest).mockResolvedValue(blocked as Awaited<ReturnType<typeof limitServiceRequest>>);
    const response = await invoke();
    expect(response.status).toBe(status);
    expect(response.headers.get('Retry-After')).toBe('5');
    expect(from).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
    expect(getUser).not.toHaveBeenCalled();
    expect(requireRequestUser).not.toHaveBeenCalled();
    expect(admin.storage.from).not.toHaveBeenCalled();
    expect(checkQPayPayment).not.toHaveBeenCalled();
    expect(createQPayInvoice).not.toHaveBeenCalled();
    expect(webpush.sendNotification).not.toHaveBeenCalled();
  });
});

describe('authenticated budgets and trusted service entry points', () => {
  it.each(endpoints.filter(([name]) => ['/account/', '/content/', '/reports', '/assistant'].some((path) => name.includes(path))))('%s checks the verified user before data access', async (_name, invoke) => {
    vi.mocked(limitUserRequest).mockResolvedValue(Response.json({}, { status: 429 }) as Awaited<ReturnType<typeof limitUserRequest>>);
    expect((await invoke()).status).toBe(429);
    expect(vi.mocked(limitUserRequest).mock.calls[0][1]).toBe('verified-user');
    expect(from).not.toHaveBeenCalled();
  });

  it('does not spend service budgets or reach DB/payment for an invalid callback secret', async () => {
    expect((await callback(request('/api/qpay/callback', 'POST', { invoice_id: 'invoice' }, { authorization: 'Bearer wrong' }))).status).toBe(401);
    expect(limitIpRequest).not.toHaveBeenCalled();
    expect(limitServiceRequest).not.toHaveBeenCalled();
    expect(createAdminClient).not.toHaveBeenCalled();
    expect(checkQPayPayment).not.toHaveBeenCalled();
  });

  it('checks the verified push-status user before reading subscription rows', async () => {
    vi.mocked(limitUserRequest).mockResolvedValue(Response.json({}, { status: 429 }) as Awaited<ReturnType<typeof limitUserRequest>>);
    expect((await pushStatus(request('/api/push-subscriptions?endpoint=https://fcm.googleapis.com/device', 'GET'))).status).toBe(429);
    expect(limitUserRequest).toHaveBeenCalledWith('push-status', 'verified-user', admin);
    expect(from).not.toHaveBeenCalled();
  });

  it('rejects unconfigured/invalid notify secrets before limiting or fanout', async () => {
    vi.stubEnv('NOTIFY_WEBHOOK_SECRET', '');
    expect((await notify(request('/api/notify', 'POST', {}, { 'x-webhook-secret': '' }))).status).toBe(503);
    vi.stubEnv('NOTIFY_WEBHOOK_SECRET', 'private');
    expect((await notify(request('/api/notify', 'POST', {}, { 'x-webhook-secret': 'wrong' }))).status).toBe(401);
    expect(limitServiceRequest).not.toHaveBeenCalled();
    expect(webpush.sendNotification).not.toHaveBeenCalled();
  });

  it('keeps donation idempotent retries out of the new-invoice quota', async () => {
    const existing = { id, amount: 1000, supporter_name: null, message: null, is_anonymous: true, status_token: 'capability', invoice_id: 'invoice', qr_image: 'qr', qr_text: 'qr' };
    from.mockReturnValue({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: existing, error: null }) }) }) });
    expect((await donationCreate(request('/api/donations/create', 'POST', { amount: 1000, isAnonymous: true }))).status).toBe(200);
    expect(limitIpRequest).toHaveBeenCalledTimes(1);
    expect(vi.mocked(limitIpRequest).mock.calls[0][1]).toBe('donation-create');
    expect(createQPayInvoice).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
  });

  it('keeps sighting idempotent retries out of the new-sighting quotas', async () => {
    rpc.mockResolvedValue({ data: null, error: null });
    from.mockImplementation((table: string) => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ error: null, data: table === 'sightings' ? { id, pet_id: petId, reporter_id: 'verified-user', message: 'Seen', place: 'Park' } : { id: petId, created_by: 'verified-user' } }) }) }) }));
    const response = await sightings(request('/api/sightings', 'POST', { petId, message: 'Seen', place: 'Park' }));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ duplicate: true });
    expect(limitIpRequest).toHaveBeenCalledTimes(1);
    expect(limitUserRequest).not.toHaveBeenCalled();
    expect(rpc).toHaveBeenCalledExactlyOnceWith('enqueue_sighting_notification', { target_id: id });
  });

  it('polls only the stored donation status, without using the QPay invoice quota', async () => {
    const update = vi.fn();
    const filterToken = vi.fn(() => ({ maybeSingle: async () => ({ error: null, data: { status: 'pending', amount: 1000 } }) }));
    from.mockReturnValue({ select: () => ({ eq: () => ({ eq: filterToken }) }), update });
    vi.mocked(limitServiceRequest).mockResolvedValue(Response.json({}, { status: 429 }) as Awaited<ReturnType<typeof limitServiceRequest>>);
    const token = 'a'.repeat(64);
    const response = await donationStatus(request(`/api/donations/status?donationId=${id}&statusToken=${token}`, 'GET'));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: 'pending', amount: 1000 });
    expect(filterToken).toHaveBeenCalledWith('status_token', token);
    expect(limitServiceRequest).not.toHaveBeenCalled();
    expect(checkQPayPayment).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });
});
