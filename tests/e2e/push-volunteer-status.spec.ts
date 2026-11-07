import { test, expect } from './fixtures';
import { loadEnvConfig } from '@next/env';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { createAdminClient } from '../../lib/supabaseAdmin';
import { createPublicClient } from '../../lib/supabaseClient';

test.beforeEach(async ({ baseURL }) => {
  loadEnvConfig(resolve(__dirname, '../..'), true);
  const origin = new URL(baseURL ?? 'http://localhost:3000');
  if (origin.protocol !== 'http:' || !['127.0.0.1', 'localhost'].includes(origin.hostname)
    || process.env.NEXT_PUBLIC_SUPABASE_URL !== 'http://127.0.0.1:54321') throw new Error('Push and volunteer acceptance tests require local Supabase');
});

test('browser registration is active only for the matching district stored on the server', async ({ page }) => {
  const admin = createAdminClient();
  const endpoint = `https://fcm.googleapis.com/fcm/send/mur-status-${randomUUID()}`;
  const keys = { p256dh: 'local-public-key', auth: 'local-browser-proof' };
  await page.addInitScript(({ endpoint, keys }) => {
    localStorage.setItem('mur-lang', 'mn'); localStorage.setItem('mur-analytics-consent', 'declined');
    const subscription = { toJSON: () => ({ endpoint, keys }) };
    const registration = { pushManager: { getSubscription: async () => subscription, subscribe: async () => subscription } };
    Object.defineProperty(navigator, 'serviceWorker', { configurable: true, value: {
      getRegistration: async () => registration, register: async () => registration, ready: Promise.resolve(registration),
    } });
    Object.defineProperty(window, 'PushManager', { configurable: true, value: class {} });
    Object.defineProperty(window, 'Notification', { configurable: true, value: { permission: 'granted', requestPermission: async () => 'granted' } });
  }, { endpoint, keys });
  try {
    await page.goto('/listings?district=' + encodeURIComponent('Баянзүрх'));
    await expect(page.locator('.notify-btn')).toContainText('мэдэгдэл авах');
    await expect(page.locator('.notify-copy')).toHaveCount(0);
    const created = await admin.from('push_subscriptions').insert({ endpoint, keys, district: 'Баянзүрх' });
    if (created.error) throw new Error('Could not create local push fixture');
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await expect(page.locator('.notify-copy')).toContainText('Баянзүрх');
    await page.goto('/listings?district=' + encodeURIComponent('Хан-Уул'));
    await expect(page.locator('.notify-copy')).toHaveCount(0);
    await expect(page.locator('.notify-btn')).toContainText('Хан-Уул');
    await page.locator('.notify-btn').click();
    await expect(page.locator('.notify-copy')).toContainText('Хан-Уул');
    const saved = await admin.from('push_subscriptions').select('district').eq('endpoint', endpoint).single();
    expect(saved.data?.district).toBe('Хан-Уул');
    await admin.from('push_subscriptions').delete().eq('endpoint', endpoint);
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await expect(page.locator('.notify-btn')).toContainText('Хан-Уул');
    await expect(page.locator('.notify-copy')).toHaveCount(0);
  } finally {
    const removed = await admin.from('push_subscriptions').delete().eq('endpoint', endpoint);
    if (removed.error) throw new Error('Local push fixture cleanup failed');
  }
});

test('status proof cannot read or modify a different account subscription', async ({ request }) => {
  const admin = createAdminClient();
  const users: string[] = [], tokens: string[] = [];
  const endpoint = `https://fcm.googleapis.com/fcm/send/mur-owned-${randomUUID()}`;
  const keys = { p256dh: 'local-public-key', auth: 'local-owner-proof' };
  try {
    for (let index = 0; index < 2; index++) {
      const email = `push-status-${randomUUID()}@example.com`, password = `Local-${randomUUID()}-A1!`;
      const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
      if (created.error || !created.data.user) throw new Error('Local push account creation failed');
      users.push(created.data.user.id);
      const signed = await createPublicClient().auth.signInWithPassword({ email, password });
      if (signed.error || !signed.data.session) throw new Error('Local push account sign-in failed');
      tokens.push(signed.data.session.access_token);
    }
    const inserted = await admin.from('push_subscriptions').insert({ endpoint, keys, district: 'Баянзүрх', user_id: users[0] });
    if (inserted.error) throw new Error('Local owned push fixture failed');
    const proof = { endpoint, keys, district: 'Баянзүрх', userId: users[0] };
    const viewers: Array<Record<string, string>> = [{}, { Authorization: `Bearer ${tokens[1]}` }];
    for (const headers of viewers) {
      const response = await request.post('/api/push-subscriptions/status', { data: proof, headers });
      expect(response.status()).toBe(200);
      expect(await response.json()).toEqual({ subscribed: false, vaccine: false });
    }
    const owner = await request.post('/api/push-subscriptions/status', { data: proof, headers: { Authorization: `Bearer ${tokens[0]}` } });
    expect(await owner.json()).toEqual({ subscribed: true, vaccine: true });
    const wrong = await request.post('/api/push-subscriptions/status', { data: { ...proof, keys: { ...keys, auth: 'wrong' } }, headers: { Authorization: `Bearer ${tokens[0]}` } });
    expect(await wrong.json()).toEqual({ subscribed: false, vaccine: false });
    const mutation = await request.post('/api/push-subscriptions', { data: { ...proof, district: 'Хан-Уул' } });
    expect(mutation.status()).toBe(403);
    const original = await admin.from('push_subscriptions').select('district,user_id').eq('endpoint', endpoint).single();
    expect(original.data).toEqual({ district: 'Баянзүрх', user_id: users[0] });
  } finally {
    await admin.from('push_subscriptions').delete().eq('endpoint', endpoint);
    for (const userId of users) {
      const removed = await admin.auth.admin.deleteUser(userId);
      if (removed.error) throw new Error('Local push account cleanup failed');
    }
    if (users.length) await admin.from('background_jobs').delete().in('dedupe_key', users.map(id => `avatar:${id}`));
  }
});

test('volunteer badge loads a scalar district count without downloading membership rows', async ({ page, isMobile }) => {
  const admin = createAdminClient(), users: string[] = [];
  const district = isMobile ? 'Хан-Уул' : 'Баянзүрх';
  const baseline = await admin.rpc('get_volunteer_count', { target_district: district });
  if (baseline.error) throw new Error('Local volunteer migration is missing');
  const requests: string[] = [];
  page.on('request', request => { if (request.url().includes('/rest/v1/')) requests.push(new URL(request.url()).pathname); });
  await page.addInitScript(() => { localStorage.setItem('mur-lang', 'mn'); localStorage.setItem('mur-analytics-consent', 'declined'); });
  try {
    for (let index = 0; index < 2; index++) {
      const created = await admin.auth.admin.createUser({ email: `count-${randomUUID()}@example.com`, email_confirm: true });
      if (created.error || !created.data.user) throw new Error('Local volunteer account creation failed');
      users.push(created.data.user.id);
    }
    const inserted = await admin.from('volunteers').insert(users.map(user_id => ({ user_id, district })));
    if (inserted.error) throw new Error('Local volunteer fixture creation failed');
    await page.goto('/listings?district=' + encodeURIComponent(district));
    await expect(page.locator('.volunteer-copy b')).toHaveText(String(Number(baseline.data) + 2));
    expect(requests).toContain('/rest/v1/rpc/get_volunteer_count');
    expect(requests).not.toContain('/rest/v1/volunteers');
  } finally {
    for (const userId of users) {
      const removed = await admin.auth.admin.deleteUser(userId);
      if (removed.error) throw new Error('Local volunteer account cleanup failed');
    }
    if (users.length) await admin.from('background_jobs').delete().in('dedupe_key', users.map(id => `avatar:${id}`));
  }
});
