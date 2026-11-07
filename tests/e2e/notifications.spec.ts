import { loadEnvConfig } from '@next/env';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { createAdminClient } from '../../lib/supabaseAdmin';
import { createPublicClient } from '../../lib/supabaseClient';
import { test, expect } from './fixtures';

test('notifications open alongside the signed-in navbar and survive filter changes', async ({ page, baseURL }) => {
  loadEnvConfig(resolve(__dirname, '../..'), true);
  const origin = new URL(baseURL ?? 'http://localhost:3000');
  if (process.env.NEXT_PUBLIC_SUPABASE_URL !== 'http://127.0.0.1:54321'
    || origin.protocol !== 'http:' || !['127.0.0.1', 'localhost'].includes(origin.hostname)) {
    throw new Error('Notification browser tests require local Supabase and the local app');
  }
  const admin = createAdminClient();
  const email = `notifications-${randomUUID()}@example.com`;
  const password = `Local-${randomUUID()}-A1!`;
  const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (created.error) throw created.error;
  const userId = created.data.user.id;
  try {
    const signed = await createPublicClient().auth.signInWithPassword({ email, password });
    if (signed.error || !signed.data.session) throw new Error('Local notification sign-in failed');
    const title = 'Мэдэгдлийн туршилт';
    const inserted = await admin.from('notifications').insert({
      user_id: userId, type: 'message', title, body: 'Туршилтын зурвас',
    });
    if (inserted.error) throw inserted.error;
    await page.addInitScript(session => {
      localStorage.setItem('sb-127-auth-token', JSON.stringify(session));
      localStorage.setItem('mur-lang', 'mn');
      localStorage.setItem('mur-analytics-consent', 'declined');
    }, signed.data.session);
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.name));

    await page.goto('/notifications');
    const inbox = page.locator('.notification-page');
    await expect(inbox.getByRole('heading', { name: 'Мэдэгдэл', exact: true })).toBeVisible();
    await expect(inbox.getByText(title, { exact: true })).toBeVisible();
    await inbox.locator('.filter-group').getByRole('button', { name: /Уншаагүй/ }).click();
    await expect(inbox.getByText(title, { exact: true })).toBeVisible();
    await inbox.getByRole('button', { name: 'Бүгдийг уншсан болгох' }).click();
    await expect(inbox.getByText(title, { exact: true })).toHaveCount(0);
    await expect(inbox.locator('.unread-summary strong')).toHaveText('0');
    await inbox.locator('.filter-group').getByRole('button', { name: /Бүгд/ }).click();
    await expect(inbox.getByText(title, { exact: true })).toBeVisible();
    expect(errors).toEqual([]);
  } finally {
    const removed = await admin.auth.admin.deleteUser(userId);
    if (removed.error) throw removed.error;
    await admin.from('background_jobs').delete().eq('dedupe_key', `avatar:${userId}`);
  }
});
