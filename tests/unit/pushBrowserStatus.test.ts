import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ getSession: vi.fn() }));
vi.mock('../../lib/supabase', () => ({ supabase: { auth: mocks } }));
import { isSubscribed, isVaccineSubscribed } from '../../lib/push';
const endpoint = 'https://fcm.googleapis.com/fcm/send/device';
const keys = { p256dh: 'public', auth: 'browser-secret' };
const subscription = { toJSON: () => ({ endpoint, keys }) };
const getSubscription = vi.fn(), getRegistration = vi.fn(), fetchMock = vi.fn();
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal('navigator', { serviceWorker: { getRegistration } });
  vi.stubGlobal('Notification', { permission: 'granted' });
  vi.stubGlobal('PushManager', class {});
  vi.stubGlobal('fetch', fetchMock);
  getRegistration.mockResolvedValue({ pushManager: { getSubscription } });
  getSubscription.mockResolvedValue(subscription);
  mocks.getSession.mockResolvedValue({ data: { session: null } });
  fetchMock.mockResolvedValue(Response.json({ subscribed: true, vaccine: false }));
});
afterEach(() => vi.unstubAllGlobals());
it('confirms district registration on the server and keeps browser secrets out of URLs', async () => {
  expect(await isSubscribed('Баянзүрх')).toBe(true);
  const [url, options] = fetchMock.mock.calls[0];
  expect(url).toBe('/api/push-subscriptions/status');
  expect(options).toMatchObject({ method: 'POST', cache: 'no-store' });
  expect(JSON.parse(options.body)).toEqual({ endpoint, keys, district: 'Баянзүрх' });
});
it('does not treat browser presence as server registration', async () => {
  fetchMock.mockResolvedValue(Response.json({ subscribed: false, vaccine: false }));
  expect(await isSubscribed('Хан-Уул')).toBe(false);
});
it('does not query status when permission was revoked or the browser subscription was deleted', async () => {
  vi.stubGlobal('Notification', { permission: 'denied' });
  expect(await isSubscribed('Баянзүрх')).toBe(false);
  vi.stubGlobal('Notification', { permission: 'granted' });
  getSubscription.mockResolvedValue(null);
  expect(await isSubscribed('Баянзүрх')).toBe(false);
  expect(fetchMock).not.toHaveBeenCalled();
});
it('checks vaccine status using the same browser proof and authenticated bearer', async () => {
  mocks.getSession.mockResolvedValue({ data: { session: { access_token: 'verified-session-token' } } });
  fetchMock.mockResolvedValue(Response.json({ subscribed: false, vaccine: true }));
  expect(await isVaccineSubscribed()).toBe(true);
  expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer verified-session-token');
  expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ endpoint, keys });
});
it.each([429, 503])('does not turn status errors into a false subscribed state (%s)', async status => {
  fetchMock.mockResolvedValue(Response.json({}, { status }));
  await expect(isSubscribed('Баянзүрх')).rejects.toThrow('Push status unavailable');
});
