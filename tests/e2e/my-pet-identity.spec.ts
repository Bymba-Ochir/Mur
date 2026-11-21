import { test, expect } from './fixtures';
import { loadEnvConfig } from '@next/env';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import type { Session } from '@supabase/supabase-js';
import { createAdminClient } from '../../lib/supabaseAdmin';
import { createPublicClient } from '../../lib/supabaseClient';
import { ownedPetPhotoStoragePath } from '../../lib/storageObjectPath';

let session: Session;
let userId: string;
const image = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aK1cAAAAASUVORK5CYII=', 'base64');
test.beforeAll(async () => {
  loadEnvConfig(resolve(__dirname, '../..'), true);
  if (process.env.NEXT_PUBLIC_SUPABASE_URL !== 'http://127.0.0.1:54321') throw new Error('Local Supabase required');
  const email = `my-pet-identity-${randomUUID()}@example.com`;
  const password = `Local-${randomUUID()}!`;
  const created = await createAdminClient().auth.admin.createUser({ email, password, email_confirm: true });
  if (created.error || !created.data.user) throw new Error('Local test user could not be created');
  userId = created.data.user.id;
  const signedIn = await createPublicClient().auth.signInWithPassword({ email, password });
  if (signedIn.error || !signedIn.data.session) throw new Error('Local test sign-in failed');
  session = signedIn.data.session;
});
test.afterAll(async () => {
  if (!userId) return;
  const admin = createAdminClient();
  const rows = await admin.from('my_pets').select('photo_url').eq('user_id', userId);
  if (rows.error) throw rows.error;
  const paths = (rows.data ?? []).map(row => ownedPetPhotoStoragePath(row.photo_url, userId, process.env.NEXT_PUBLIC_SUPABASE_URL)).filter((path): path is string => Boolean(path));
  if (paths.length) {
    const removed = await admin.storage.from('pet-photos').remove(paths);
    if (removed.error) throw removed.error;
  }
  const deleted = await admin.auth.admin.deleteUser(userId);
  if (deleted.error) throw deleted.error;
});

for (const scenario of [{ width: 390, theme: 'light' }, { width: 1440, theme: 'dark' }]) {
  test(`saved pet identity transfers into a lost report at ${scenario.width}px ${scenario.theme}`, async ({ page, baseURL }, testInfo) => {
    const site = new URL(baseURL ?? 'http://localhost:3000');
    if (!['127.0.0.1', 'localhost'].includes(site.hostname)) throw new Error('Local app required');
    await page.setViewportSize({ width: scenario.width, height: 900 });
    await page.addInitScript(({ token, theme }) => {
      localStorage.setItem('sb-127-auth-token', JSON.stringify(token));
      localStorage.setItem('mur-onboarding-v2-seen', '1');
      localStorage.setItem('mur-analytics-consent', 'declined');
      localStorage.setItem('mur-theme', theme);
    }, { token: session, theme: scenario.theme });
    await page.goto('/my-pets');
    const name = 'Туршилт ' + scenario.width;
    const form = page.locator('.registration-form');
    if (!await form.isVisible()) await page.getByRole('button', { name: '+ Нэмэх', exact: true }).click();
    await form.getByLabel('Амьтны нэр *', { exact: true }).fill(name);
    await form.getByLabel('Онцгой шинж тэмдэг', { exact: true }).fill('Цээж цагаан');
    await form.getByLabel('Зураг', { exact: true }).setInputFiles({ name: 'pet.png', mimeType: 'image/png', buffer: image });
    await expect(form.locator('img')).toBeVisible();
    await expect(form.getByRole('button', { name: '+ Нэмэх', exact: true })).toBeEnabled();
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({ path: testInfo.outputPath('registration.png'), fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    await form.getByRole('button', { name: '+ Нэмэх', exact: true }).click();
    const card = page.locator('.pet-card').filter({ has: page.getByRole('heading', { name, exact: true }) });
    await expect(card).toContainText('Цээж цагаан');
    await expect(card.locator('img')).toBeVisible();
    await card.getByRole('button', { name: 'Амьтны мэдээлэл засах', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Амьтны мэдээлэл засах', exact: true });
    await dialog.getByLabel('Онцгой шинж тэмдэг', { exact: true }).fill('Зүүн чих сэтэрхий');
    await dialog.getByRole('button', { name: 'Хадгалах', exact: true }).click();
    await expect(dialog).toBeHidden();
    await expect(card).toContainText('Зүүн чих сэтэрхий');
    await card.getByRole('link', { name: 'Алдсан зар үүсгэх', exact: true }).click();
    await page.getByRole('button', { name: name + ' — Мэдээллийг ашиглах', exact: true }).click();
    await expect(page.locator('.selected-photo img')).toHaveCount(1);
    await page.getByRole('button', { name: 'Дараах', exact: true }).click();
    await expect(page.getByLabel('Нэр (мэдэх бол)', { exact: true })).toHaveValue(name);
    await expect(page.getByLabel('Онцгой шинж тэмдэг *', { exact: true })).toHaveValue('Зүүн чих сэтэрхий');
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    await page.locator('.form-layout').screenshot({ path: testInfo.outputPath('prefilled-report.png') });
    await expect(page).toHaveURL(/\/report-lost\?myPetId=/);
  });
}
