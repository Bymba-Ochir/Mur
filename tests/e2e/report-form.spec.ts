import { test, expect } from './fixtures';
import { loadEnvConfig } from '@next/env';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import type { Session } from '@supabase/supabase-js';
import { createAdminClient } from '../../lib/supabaseAdmin';
import { createPublicClient } from '../../lib/supabaseClient';

let session: Session | null = null;
let userId: string | null = null;

test.beforeAll(async () => {
  loadEnvConfig(resolve(__dirname, '../..'), true);
  if (process.env.NEXT_PUBLIC_SUPABASE_URL !== 'http://127.0.0.1:54321') {
    throw new Error('Report form tests require local Supabase on 127.0.0.1:54321');
  }
  const email = `report-form-${randomUUID()}@example.com`;
  const password = `local-${randomUUID()}-A1!`;
  const { data, error } = await createAdminClient().auth.admin.createUser({ email, password, email_confirm: true });
  if (error || !data.user) throw new Error('Could not create a local form test account');
  userId = data.user.id;
  const signedIn = await createPublicClient().auth.signInWithPassword({ email, password });
  if (signedIn.error || !signedIn.data.session) throw new Error('Could not sign in to the local form test account');
  session = signedIn.data.session;
});

test.afterAll(async () => {
  if (!userId) return;
  const { error } = await createAdminClient().auth.admin.deleteUser(userId);
  if (error) throw new Error('Could not clean up the local form test account');
});

test.beforeEach(async ({ page, baseURL }) => {
  const site = new URL(baseURL ?? 'http://localhost:3000');
  if (site.protocol !== 'http:' || !['127.0.0.1', 'localhost'].includes(site.hostname)) throw new Error('Form tests require a local app');
  await page.addInitScript(({ origin, authSession }) => {
    if (location.origin !== origin) return;
    localStorage.setItem('mur-onboarding-v2-seen', '1');
    localStorage.setItem('mur-analytics-consent', 'declined');
    localStorage.setItem('sb-127-auth-token', JSON.stringify(authSession));
  }, { origin: site.origin, authSession: session });
});

test.describe('Алдсан мэдэгдэх форм (4 алхам, submit хийхгүй)', () => {
  test('заавал талбар дутуу үед алдааг харуулж, дараагийн алхам руу шилжихгүй', async ({ page }) => {
    await page.goto('/report-lost');
    // Алхам 1 (Зураг) -> Алхам 2 (Мэдээлэл)
    await page.getByRole('button', { name: /Дараах/ }).click();
    await page.getByRole('button', { name: /Дараах/ }).click();
    await expect(page.getByText('Амьтны өнгийг оруулна уу.', { exact: true })).toBeVisible();
    await expect(page.locator('.progress-text')).toContainText('2/4');
  });

  test('өнгө бөглөсний дараа байршлын алхам руу шилжинэ', async ({ page }) => {
    await page.goto('/report-lost');
    await page.getByRole('button', { name: /Дараах/ }).click();
    await page.getByPlaceholder('Жишээ: Хар халзан').fill('хар халзан');
    await page.getByRole('button', { name: /Дараах/ }).click();
    await expect(page.locator('.progress-text')).toContainText('3/4');
  });

  test('явцын заагч (PawTrail) 4 алхмыг харуулна', async ({ page }) => {
    await page.goto('/report-lost');
    await expect(page.getByText('1/4')).toBeVisible();
    await page.getByRole('button', { name: /Дараах/ }).click();
    await expect(page.getByText('2/4')).toBeVisible();
  });

  test('"Буцах" товч өмнөх алхам руу буцаана', async ({ page }) => {
    await page.goto('/report-lost');
    await page.getByRole('button', { name: /Дараах/ }).click();
    await expect(page.getByText('2/4')).toBeVisible();
    await page.getByRole('button', { name: /Буцах/ }).click();
    await expect(page.getByText('1/4')).toBeVisible();
  });

  test('desktop дэлгэцэнд preview карт харагдана', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Preview зөвхөн ≥860px дэлгэцэнд харагддаг');
    await page.goto('/report-lost');
    await expect(page.getByText('Ийм харагдана')).toBeVisible();
  });
});


test('нооргийг сэргээж, зарын төрлөөр тусгаарлан, өөр tab-ийн өөрчлөлтийг дарж бичихгүй', async ({ page, context }) => {
  await page.goto('/report-lost');
  await page.getByRole('button', { name: 'Дараах', exact: true }).click();
  await page.locator('#pet-color').fill('Хар халзан');
  await expect(page.getByText('Ноорог энэ төхөөрөмж дээр хадгалагдлаа.', { exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Үргэлжлүүлэх', exact: true }).click();
  await expect(page.locator('#pet-color')).toHaveValue('Хар халзан');
  await expect(page.getByText('Ноорог энэ төхөөрөмж дээр хадгалагдлаа.', { exact: true })).toBeVisible();
  const other = await context.newPage();
  try {
    await other.goto(page.url());
    await other.getByRole('button', { name: 'Үргэлжлүүлэх', exact: true }).click();
    await expect(other.getByText('Ноорог энэ төхөөрөмж дээр хадгалагдлаа.', { exact: true })).toBeVisible();
    await page.locator('#pet-color').fill('Цагаан');
    await expect(page.locator('.draft-status[role="alert"]')).toContainText('Ноорог өөр цонхонд өөрчлөгдсөн байна.');
    await other.reload();
    await other.getByRole('button', { name: 'Үргэлжлүүлэх', exact: true }).click();
    await expect(other.locator('#pet-color')).toHaveValue('Хар халзан');
    await other.goto('/report-found');
    await expect(other.locator('#photo-input')).toBeAttached();
    await expect(other.getByRole('heading', { name: 'Өмнөх зараа үргэлжлүүлэх үү?' })).toHaveCount(0);
    await other.goto('/report-lost');
    await other.getByRole('button', { name: 'Шинээр эхлэх', exact: true }).click();
    await expect(other.locator('.progress-text')).toContainText('1/4');
    await other.reload();
    await expect(other.locator('#photo-input')).toBeAttached();
    await expect(other.getByRole('heading', { name: 'Өмнөх зараа үргэлжлүүлэх үү?' })).toHaveCount(0);
  } finally { await other.close(); }
});
