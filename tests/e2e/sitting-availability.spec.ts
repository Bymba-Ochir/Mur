import { loadEnvConfig } from '@next/env';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { createAdminClient } from '../../lib/supabaseAdmin';
import { createPublicClient } from '../../lib/supabaseClient';
import { test, expect } from './fixtures';

test('sitting availability and beginner status survive publishing and editing', async ({ page, baseURL }, testInfo) => {
  loadEnvConfig(resolve(__dirname, '../..'), true);
  const origin = new URL(baseURL ?? 'http://localhost:3000');
  if (process.env.NEXT_PUBLIC_SUPABASE_URL !== 'http://127.0.0.1:54321'
    || origin.protocol !== 'http:' || !['127.0.0.1', 'localhost'].includes(origin.hostname)) {
    throw new Error('Sitting availability tests require local Supabase and the local app');
  }
  const admin = createAdminClient();
  const email = `sitting-${randomUUID()}@example.invalid`;
  const password = `Local-${randomUUID()}-A1!`;
  const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (created.error) throw created.error;
  const userId = created.data.user.id;

  try {
    const signed = await createPublicClient().auth.signInWithPassword({ email, password });
    if (signed.error || !signed.data.session) throw new Error('Could not sign in to the local fixture');
    await page.addInitScript(session => {
      localStorage.setItem('sb-127-auth-token', JSON.stringify(session));
      localStorage.setItem('mur-lang', 'mn');
      localStorage.setItem('mur-analytics-consent', 'declined');
    }, signed.data.session);
    await page.goto('/sitting/new');

    const form = page.getByRole('form', { name: 'Асрах үйлчилгээний зар нэмэх форм' });
    const next = form.getByRole('button', { name: 'Дараах', exact: true });
    await next.click();
    const description = `Асрах хуваарийн туршилт ${randomUUID().slice(0, 8)}`;
    await form.locator('#s-desc').fill(description);
    await form.getByRole('checkbox', { name: 'Саяхан эхэлсэн' }).check();
    await form.getByLabel('Боломжтой цаг', { exact: true }).fill('Амралтын өдрүүдэд');
    const date = form.getByLabel('Огноо', { exact: true });
    const time = form.getByLabel('Цаг', { exact: true });
    await date.fill('2030-04-15');
    await next.click();
    await expect(form.getByRole('alert')).toContainText('Огноо болон цагийг хамтад нь оруулна уу');
    await time.fill('18:30');
    await form.locator('.care-fields').screenshot({ path: testInfo.outputPath('sitting-care-fields.png') });
    await next.click();
    await form.locator('#s-place').fill('22 хороо');
    await form.getByRole('checkbox', { name: 'Утсаа нуух — зөвхөн чатаар холбогдох' }).check();
    await form.getByRole('button', { name: 'Асрах зар нийтлэх' }).click();
    await expect(page.getByText('Зар амжилттай нийтлэгдлээ!')).toBeVisible();

    const { data: listing, error } = await admin.from('sitting_listings')
      .select('id,available_from,is_beginner,availability').eq('user_id', userId).single();
    if (error) throw error;
    const expected = await page.evaluate(() => new Date('2030-04-15T18:30').toISOString());
    expect(new Date(listing.available_from).toISOString()).toBe(expected);
    expect(listing).toMatchObject({ is_beginner: true, availability: 'Амралтын өдрүүдэд' });

    await page.goto('/sitting');
    const card = page.locator('.sitting-card').filter({ hasText: description });
    await expect(card.getByText('Саяхан эхэлсэн', { exact: true })).toBeVisible();
    await expect(card.getByText('2030.04.15 18:30', { exact: true })).toBeVisible();
    await card.getByRole('link', { name: new RegExp(description) }).click();

    const facts = page.locator('.facts');
    await expect(facts.getByText('Саяхан эхэлсэн', { exact: true })).toBeVisible();
    await expect(facts.getByText('2030.04.15 18:30', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Засах', exact: true }).click();
    const edit = page.getByRole('form', { name: 'Засах' });
    await expect(edit.getByLabel('Огноо', { exact: true })).toHaveValue('2030-04-15');
    await expect(edit.getByLabel('Цаг', { exact: true })).toHaveValue('18:30');
    await expect(edit.getByRole('checkbox', { name: 'Саяхан эхэлсэн' })).toBeChecked();
    await edit.getByLabel('Огноо', { exact: true }).fill('');
    await edit.getByLabel('Цаг', { exact: true }).fill('');
    await edit.getByRole('checkbox', { name: 'Саяхан эхэлсэн' }).uncheck();
    await edit.getByRole('button', { name: 'Хадгалах' }).click();
    await expect(edit).toHaveCount(0);
    await page.reload();
    await expect(facts.getByText('Амралтын өдрүүдэд', { exact: true })).toBeVisible();
    await expect(facts.locator('time')).toHaveCount(0);
    await expect(facts.getByText('Саяхан эхэлсэн', { exact: true })).toHaveCount(0);
  } finally {
    const removed = await admin.auth.admin.deleteUser(userId);
    if (removed.error) throw removed.error;
    await admin.from('background_jobs').delete().eq('dedupe_key', `avatar:${userId}`);
  }
});
