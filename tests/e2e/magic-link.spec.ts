import { test, expect } from './fixtures';
import { loadEnvConfig } from '@next/env';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { createAdminClient } from '../../lib/supabaseAdmin';
import { createPublicClient } from '../../lib/supabaseClient';

const mailpit = 'http://127.0.0.1:54324';

test('email sign-in reaches the local mailbox and creates a verified browser session', async ({ page, request, baseURL, isMobile }) => {
  loadEnvConfig(resolve(__dirname, '../..'), true);
  const origin = new URL(baseURL ?? 'http://localhost:3000');
  if (process.env.NEXT_PUBLIC_SUPABASE_URL !== 'http://127.0.0.1:54321'
    || origin.protocol !== 'http:' || !['localhost', '127.0.0.1'].includes(origin.hostname) || origin.port !== '3000') {
    throw new Error('Magic-link tests require local Supabase and the allowlisted app on port 3000');
  }
  const email = `magic-${randomUUID()}@example.com`;
  const admin = createAdminClient();
  const created = await admin.auth.admin.createUser({ email, email_confirm: true });
  if (created.error || !created.data.user) throw new Error('Local magic-link account creation failed');
  const userId = created.data.user.id;
  let messageId: string | undefined;
  try {
    await page.addInitScript(() => {
      localStorage.setItem('mur-lang', 'mn');
      localStorage.setItem('mur-analytics-consent', 'declined');
    });
    await page.goto('/');
    if (isMobile) await page.locator('.mobile-menu-btn').click();
    await page.getByRole('button', { name: 'Нэвтрэх', exact: true }).last().click();
    const dialog = page.getByRole('dialog', { name: /Нэвтрэх/ });
    await dialog.locator('#login-email').fill(email);
    await dialog.locator('button[type="submit"]').click();
    await expect(dialog.locator('[role="status"]')).toBeVisible();

    await expect.poll(async () => {
      const response = await request.get(`${mailpit}/api/v1/search`, { params: { query: `to:${email}`, limit: 10 } });
      if (!response.ok()) throw new Error('Local Mailpit search failed');
      const data = await response.json() as { messages: { ID: string; To: { Address: string }[] }[] };
      messageId = data.messages.find(message => message.To.some(recipient => recipient.Address === email))?.ID;
      return Boolean(messageId);
    }, { timeout: 15000 }).toBe(true);
    const messageResponse = await request.get(`${mailpit}/api/v1/message/${messageId}`);
    expect(messageResponse.ok()).toBe(true);
    const message = await messageResponse.json() as { HTML: string };
    const links = [...message.HTML.matchAll(/href=["']([^"']+)["']/gi)].flatMap(match => {
      try { return [new URL(match[1].replace(/&amp;/g, '&'))]; } catch { return []; }
    });
    const verification = links.find(url => url.origin === 'http://127.0.0.1:54321' && url.pathname === '/auth/v1/verify');
    if (!verification) throw new Error('Mailpit message did not contain the expected local verification link');
    // Inspect only the destination; never print the one-time verification token.
    expect(new URL(verification.searchParams.get('redirect_to') ?? '').origin).toBe(origin.origin);
    await page.goto(verification.href);
    await expect.poll(() => page.evaluate(() => {
      try { return Boolean(JSON.parse(localStorage.getItem('sb-127-auth-token') ?? '{}').access_token); } catch { return false; }
    })).toBe(true);
    const token = await page.evaluate(() => JSON.parse(localStorage.getItem('sb-127-auth-token')!).access_token as string);
    const verified = await createPublicClient().auth.getUser(token);
    expect(verified.error).toBeNull();
    expect(verified.data.user?.id).toBe(userId);
    await page.goto('/report-lost');
    await expect(page.getByRole('button', { name: 'Дараах', exact: true })).toBeVisible();
    await expect(page.locator('input[type="file"]')).not.toHaveCount(0);
  } finally {
    // IDs belong only to this fixture; never clear the shared inbox or other accounts.
    const removed = await admin.auth.admin.deleteUser(userId);
    if (removed.error) throw new Error('Local magic-link account cleanup failed');
    await admin.from('background_jobs').delete().eq('dedupe_key', `avatar:${userId}`);
    if (messageId) {
      const mailRemoved = await request.delete(`${mailpit}/api/v1/messages`, { data: { IDs: [messageId] } });
      expect(mailRemoved.ok()).toBe(true);
    }
  }
});
