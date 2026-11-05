import { test, expect } from './fixtures';
import { loadEnvConfig } from '@next/env';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { createAdminClient } from '../../lib/supabaseAdmin';
import { createPublicClient } from '../../lib/supabaseClient';

test.beforeEach(async ({ baseURL }) => {
  loadEnvConfig(resolve(__dirname, '../..'), true);
  const target = new URL(baseURL ?? 'http://localhost:3000');
  if (target.protocol !== 'http:' || !['127.0.0.1', 'localhost'].includes(target.hostname)
    || process.env.NEXT_PUBLIC_SUPABASE_URL !== 'http://127.0.0.1:54321') throw new Error('Hardening tests require a local app and database');
});

test('nonce CSP survives initial rendering and navigation and blocks injected scripts', async ({ page, request }) => {
  const violations: string[] = [];
  page.on('console', message => { if (/content security policy/i.test(message.text())) violations.push(message.text()); });
  await page.addInitScript(() => localStorage.setItem('mur-analytics-consent', 'declined'));
  const response = await page.goto('/');
  const policy = response?.headers()['content-security-policy'] ?? '';
  const script = policy.split(';').find(part => part.trim().startsWith('script-src ')) ?? '';
  expect(script).toContain("'nonce-");
  expect(script).not.toContain("'unsafe-inline'");
  expect(script).not.toContain("'unsafe-eval'");
  expect(response?.headers()['cache-control']).toContain('no-store');
  const nonce = await page.locator('meta[property="csp-nonce"]').getAttribute('content');
  expect(nonce).toBeTruthy();
  expect(await page.locator('script:not([src])').evaluateAll(nodes => nodes.every(node => Boolean((node as HTMLScriptElement).nonce)))).toBe(true);
  expect(await page.locator('style').evaluateAll(nodes => nodes.every(node => Boolean((node as HTMLStyleElement).nonce)))).toBe(true);
  const next = await request.get('/', { headers: { 'x-nonce': 'forged', 'next-router-prefetch': '1' } });
  expect(next.headers()['content-security-policy']).not.toBe(policy);
  expect(next.headers()['content-security-policy']).not.toContain('forged');
  await page.locator('footer a[href="/listings"]').first().click();
  await expect(page).toHaveURL(/\/listings$/);
  await expect(page.locator('h1')).toBeVisible();
  // Wait for hydration and client-inserted styles after navigation.
  await expect(page.locator('#match-file')).toBeAttached();
  expect(violations).toEqual([]);
  await page.route('**/privacy', async route => {
    const response = await route.fetch();
    const html = await response.text();
    await route.fulfill({ response, body: html.replace('</body>', '<script>document.documentElement.dataset.injectedScript = "executed"</script></body>') });
  });
  await page.goto('/privacy');
  await expect(page.locator('h1')).toBeVisible();
  expect(await page.locator('html').getAttribute('data-injected-script')).toBeNull();
});

test('oversized public JSON bodies return 413 without a write', async ({ request }) => {
  for (const route of ['/api/feedback', '/api/donations/create', '/api/push-subscriptions', '/api/assistant']) {
    const response = await request.post(route, {
      headers: { 'Idempotency-Key': randomUUID(), Authorization: 'Bearer invalid-local-test-token' }, data: { ignored: 'x'.repeat(17 * 1024) },
    });
    expect(response.status(), route).toBe(413);
  }
});

test('real database export includes over 1000 rows and excludes another account', async ({ request }) => {
  test.setTimeout(90_000);
  const admin = createAdminClient();
  const users: string[] = [];
  const petId = randomUUID(), conversationId = randomUUID();
  try {
    let token = '';
    for (let index = 0; index < 3; index++) {
      const email = `export-${randomUUID()}@example.com`, password = `Local-${randomUUID()}-A1!`;
      const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
      if (created.error || !created.data.user) throw new Error('Export fixture account failed');
      users.push(created.data.user.id);
      if (index === 0) {
        const auth = await createPublicClient().auth.signInWithPassword({ email, password });
        if (auth.error || !auth.data.session) throw new Error('Export fixture login failed');
        token = auth.data.session.access_token;
      }
    }
    const pet = await admin.from('pets').insert({ id: petId, created_by: users[0], status: 'lost', type: 'Муур', name: 'Export fixture', phone: '88776655', phone_hidden: true });
    if (pet.error) throw pet.error;
    const conversation = await admin.from('conversations').insert({ id: conversationId, pet_id: petId, initiator_id: users[1], owner_id: users[0] });
    if (conversation.error) throw conversation.error;
    const notifications = Array.from({ length: 1105 }, (_, index) => ({ user_id: users[0], type: 'test', title: 'Export fixture', body: String(index) }));
    const messages = Array.from({ length: 1105 }, (_, index) => ({ conversation_id: conversationId, sender_id: users[index % 2], content: `Export ${index}`, created_at: new Date(Date.now() - 86_400_000).toISOString() }));
    for (let offset = 0; offset < 1105; offset += 100) {
      const notification = await admin.from('notifications').insert(notifications.slice(offset, offset + 100));
      if (notification.error) throw notification.error;
      const message = await admin.from('messages').insert(messages.slice(offset, offset + 100));
      if (message.error) throw message.error;
    }
    const foreign = await admin.from('notifications').insert({ user_id: users[2], type: 'test', title: 'Foreign private fixture', body: 'Must never export' });
    if (foreign.error) throw foreign.error;
    const response = await request.get(`/api/account/export?userId=${users[2]}`, { headers: { Authorization: `Bearer ${token}` } });
    expect(response.status()).toBe(200);
    const payload = await response.json();
    expect(payload.account.id).toBe(users[0]);
    expect(payload.notifications.filter((row: { title: string }) => row.title === 'Export fixture')).toHaveLength(1105);
    expect(payload.notifications.every((row: { user_id: string }) => row.user_id === users[0])).toBe(true);
    expect(payload.messages).toHaveLength(1105);
    expect(new Set(payload.messages.map((row: { id: string }) => row.id)).size).toBe(1105);
    expect(payload.messages.every((row: { conversation_id: string }) => row.conversation_id === conversationId)).toBe(true);
    expect(JSON.stringify(payload)).not.toContain('Must never export');
  } finally {
    const deleted = await admin.from('pets').delete().eq('id', petId);
    if (deleted.error) throw deleted.error;
    for (const id of users) {
      const removed = await admin.auth.admin.deleteUser(id);
      if (removed.error) throw removed.error;
      await admin.from('background_jobs').delete().eq('dedupe_key', `avatar:${id}`);
    }
  }
});
