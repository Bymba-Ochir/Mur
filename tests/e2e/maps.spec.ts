import { test, expect } from './fixtures';
import type { Locator } from '@playwright/test';
import type { Session } from '@supabase/supabase-js';
import { loadEnvConfig } from '@next/env';
import { randomInt, randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { createAdminClient } from '../../lib/supabaseAdmin';
import { createPublicClient } from '../../lib/supabaseClient';

let userId: string | undefined;
let session: Session | null = null;
const petId = randomUUID();
test.beforeAll(async () => {
  loadEnvConfig(resolve(__dirname, '../..'), true);
  if (process.env.NEXT_PUBLIC_SUPABASE_URL !== 'http://127.0.0.1:54321') throw new Error('Map tests require local Supabase');
  const email = `map-${randomUUID()}@example.com`, password = `Local-${randomUUID()}-A1!`;
  const admin = createAdminClient();
  const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (created.error || !created.data.user) throw new Error('Local map account creation failed');
  userId = created.data.user.id;
  const signed = await createPublicClient().auth.signInWithPassword({ email, password });
  if (signed.error || !signed.data.session) throw new Error('Local map sign-in failed');
  session = signed.data.session;
  const inserted = await admin.from('pets').insert({
    id: petId, created_by: userId, status: 'lost', name: 'Map fixture', type: 'Муур',
    color: 'Бор', district: 'Баянзүрх', place: 'Туршилтын байршил', phone: String(randomInt(10_000_000, 100_000_000)), lat: 47.9184, lng: 106.9177,
  });
  if (inserted.error) throw inserted.error;
});

test.afterAll(async () => {
  const admin = createAdminClient();
  const deleted = await admin.from('pets').delete().eq('id', petId);
  if (deleted.error) throw deleted.error;
  if (userId) {
    const removed = await admin.auth.admin.deleteUser(userId);
    if (removed.error) throw removed.error;
    await admin.from('background_jobs').delete().eq('dedupe_key', `avatar:${userId}`);
  }
});

test.beforeEach(async ({ page, baseURL }) => {
  const origin = new URL(baseURL ?? 'http://localhost:3000');
  if (origin.protocol !== 'http:' || !['127.0.0.1', 'localhost'].includes(origin.hostname)) throw new Error('Map tests require a local app');
  await page.addInitScript(() => {
    localStorage.setItem('mur-lang', 'mn');
    localStorage.setItem('mur-analytics-consent', 'declined');
  });
});

async function expectMapAssets(map: Locator) {
  await expect(map).toBeVisible();
  await expect.poll(() => map.locator('.leaflet-tile-loaded').count()).toBeGreaterThan(0);
  await expect(map.locator('.leaflet-control-attribution a[href="https://www.openstreetmap.org/copyright"]')).toBeVisible();
  const marker = map.locator('img.leaflet-marker-icon').first();
  await expect(marker).toBeVisible();
  await expect(marker).toHaveAttribute('src', '/map-marker.svg');
  await expect.poll(() => marker.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
}

test('detail map shows its marker on a fresh initial load', async ({ page }) => {
  await page.goto(`/pets/${petId}`);
  await expectMapAssets(page.locator('.location-map'));
});

test('first click on an empty report map creates a working marker', async ({ page }) => {
  await page.addInitScript(auth => localStorage.setItem('sb-127-auth-token', JSON.stringify(auth)), session);
  await page.goto('/report-lost');
  const next = page.getByRole('button', { name: 'Дараах', exact: true });
  await next.click();
  await page.locator('#pet-color').fill('Хар');
  await next.click();
  const map = page.locator('.location-map');
  await expect(map).toBeVisible();
  await expect(map.locator('.leaflet-control-zoom-in')).toBeVisible();
  await map.click({ position: { x: 140, y: 100 } });
  await expectMapAssets(map);
});

test('sighting pin and time can be omitted or published and read after reload', async ({ page }) => {
  await page.addInitScript(auth => localStorage.setItem('sb-127-auth-token', JSON.stringify(auth)), session);
  await page.goto(`/pets/${petId}`);
  const section = page.locator('.sightings-section');
  const form = section.locator('form');
  const time = form.getByLabel('Харсан огноо, цаг (заавал биш)');
  const openForm = () => section.getByRole('button', { name: '+ Би харсан', exact: true }).click();
  const publish = async () => {
    const posted = page.waitForResponse(res => new URL(res.url()).pathname === '/api/sightings' && res.request().method() === 'POST');
    await form.getByRole('button', { name: 'Нийтлэх', exact: true }).click();
    expect((await posted).status()).toBe(201);
  };

  await openForm();
  await form.getByLabel('Харсан тухай мэдээлэл').fill('Тайлбартай боловч цэг, цаггүй');
  await expect(time).toHaveValue('');
  await form.getByRole('button', { name: 'Газрын зураг дээр тэмдэглэх (заавал биш)' }).click();
  const picker = form.getByRole('region', { name: 'Газрын зураг дээр байршил тэмдэглэх' });
  await expect(picker.locator('.leaflet-control-zoom-in')).toBeVisible();
  await expect(picker.locator('.leaflet-marker-icon')).toHaveCount(0);
  await picker.click({ position: { x: 140, y: 100 } });
  await expectMapAssets(picker);
  await form.getByRole('button', { name: 'Цэг арилгах' }).click();
  await expect(picker.locator('.leaflet-marker-icon')).toHaveCount(0);
  await publish();

  await openForm();
  await form.getByLabel('Харсан тухай мэдээлэл').fill('Газрын зураг, цагтай мэдээлэл');
  await time.fill('2025-01-02T18:30');
  await form.getByRole('button', { name: 'Газрын зураг дээр тэмдэглэх (заавал биш)' }).click();
  await expect(picker.locator('.leaflet-control-zoom-in')).toBeVisible();
  await picker.click({ position: { x: 140, y: 100 } });
  await publish();
  await expect(section.getByText('Газрын зураг, цагтай мэдээлэл', { exact: true })).toBeVisible();

  await page.reload();
  const saved = section.locator('article').filter({ hasText: 'Газрын зураг, цагтай мэдээлэл' });
  await expect(saved.getByText('Харсан:', { exact: false })).toBeVisible();
  await saved.getByRole('button', { name: 'Газрын зураг харах' }).click();
  await expectMapAssets(saved.getByRole('region', { name: 'Харсан байршил' }));
  const plain = section.locator('article').filter({ hasText: 'Тайлбартай боловч цэг, цаггүй' });
  await expect(plain).toBeVisible();
  await expect(plain.getByRole('button', { name: 'Газрын зураг харах' })).toHaveCount(0);
  await expect(plain.locator('time')).toHaveCount(1);
});

test('clinic map uses the same working tiles and local marker asset', async ({ page }) => {
  await page.goto('/clinics');
  await expectMapAssets(page.locator('.clinic-map'));
});
