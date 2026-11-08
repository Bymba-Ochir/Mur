import { test, expect } from './fixtures';
import type { Locator } from '@playwright/test';
import type { Session } from '@supabase/supabase-js';
import sharp from 'sharp';
import { loadEnvConfig } from '@next/env';
import { randomInt, randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { createAdminClient } from '../../lib/supabaseAdmin';
import { createPublicClient } from '../../lib/supabaseClient';
import { GUEST_SIGHTING_PHOTO_BUCKET } from '../../lib/sightingPhoto';

let userId: string | undefined;
let session: Session | null = null;
const petId = randomUUID();
const sightingOnlyPetId = randomUUID();
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
  const fixture = {
    created_by: userId, status: 'lost', name: 'Map fixture', type: 'Муур',
    color: 'Бор', district: 'Баянзүрх', place: 'Туршилтын байршил', phone: String(randomInt(10_000_000, 100_000_000)),
  };
  const inserted = await admin.from('pets').insert([
    { ...fixture, id: petId, lat: 47.9184, lng: 106.9177 },
    { ...fixture, id: sightingOnlyPetId, lat: null, lng: null },
  ]);
  if (inserted.error) throw inserted.error;
  for (const message of ['Нэг байршлын эхний мэдээлэл', '<img src=x onerror=alert(1)>']) {
    const sighting = await admin.rpc('create_sighting_if_active', {
      target_id: randomUUID(), target_pet: sightingOnlyPetId, target_reporter: userId,
      target_message: message, target_place: null, target_lat: 47.9184, target_lng: 106.9177, target_sighted_at: null,
    });
    if (sighting.error) throw sighting.error;
  }
});

test.afterAll(async () => {
  const admin = createAdminClient();
  const deleted = await admin.from('pets').delete().in('id', [petId, sightingOnlyPetId]);
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

async function expectMapAssets(map: Locator, markerSource = '/map-marker.svg') {
  await expect(map).toBeVisible();
  await expect.poll(() => map.locator('.leaflet-tile-loaded').count()).toBeGreaterThan(0);
  await expect(map.locator('.leaflet-control-attribution a[href="https://www.openstreetmap.org/copyright"]')).toBeVisible();
  const marker = map.locator('img.leaflet-marker-icon').first();
  await expect(marker).toBeVisible();
  await expect(marker).toHaveAttribute('src', markerSource);
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

test('optional sighting photo, pin and time can be published and read after reload', async ({ page }, testInfo) => {
  await page.addInitScript(auth => localStorage.setItem('sb-127-auth-token', JSON.stringify(auth)), session);
  await page.goto(`/pets/${petId}`);
  const section = page.locator('.sightings-section');
  const form = section.locator('form');
  const map = page.locator('.map-section .location-map');
  const purple = map.locator('img[src="/map-marker.svg"]');
  const orange = map.locator('img[src="/sighting-map-marker.svg"]');
  const popup = map.locator('.leaflet-popup-content');
  const date = form.getByLabel('Огноо', { exact: true });
  const time = form.getByLabel('Цаг', { exact: true });
  const openForm = () => section.getByRole('button', { name: '+ Би харсан', exact: true }).click();
  const publish = async () => {
    const posted = page.waitForResponse(res => new URL(res.url()).pathname === '/api/sightings' && res.request().method() === 'POST');
    await form.getByRole('button', { name: 'Нийтлэх', exact: true }).click();
    const response = await posted;
    expect(response.status()).toBe(201);
  };

  await openForm();
  await form.getByLabel('Харсан тухай мэдээлэл').fill('Тайлбартай боловч цэг, цаггүй');
  await expect(time).toHaveValue('');
  await form.getByRole('button', { name: 'Газрын зураг дээр тэмдэглэх' }).click();
  const picker = form.getByRole('region', { name: 'Газрын зураг дээр байршил тэмдэглэх' });
  await expect(picker.locator('.leaflet-control-zoom-in')).toBeVisible();
  await expect(picker.locator('.leaflet-marker-icon')).toHaveCount(0);
  await picker.click({ position: { x: 140, y: 100 } });
  await expectMapAssets(picker, '/sighting-map-marker.svg');
  await form.getByRole('button', { name: 'Цэг арилгах' }).click();
  await expect(picker.locator('.leaflet-marker-icon')).toHaveCount(0);
  await publish();
  await expect(section.getByText('Тайлбартай боловч цэг, цаггүй', { exact: true })).toBeVisible();
  await expect(orange).toHaveCount(0);

  await openForm();
  await form.getByLabel('Харсан тухай мэдээлэл').fill('Газрын зураг, цагтай мэдээлэл');
  await form.getByLabel('Харсан байршил').fill('Хорооллын цэцэрлэг');
  await date.fill('2025-01-02');
  await form.getByRole('button', { name: 'Нийтлэх', exact: true }).click();
  await expect(page.getByText('Огноо болон цагийг хамтад нь оруулна уу, эсвэл хоёуланг нь хоосон үлдээнэ үү.')).toBeVisible();
  await expect(form).toBeVisible();
  await time.fill('18:30');
  const image = await sharp({ create: { width: 64, height: 48, channels: 3, background: '#d5640c' } }).png().toBuffer();
  const photo = form.getByLabel('Зураг (заавал биш)', { exact: true });
  const photoAlt = 'Харсан тухай хавсаргасан зураг';
  await photo.setInputFiles({ name: 'sighting.png', mimeType: 'image/png', buffer: image });
  await expect(form.getByRole('img', { name: photoAlt })).toBeVisible();
  await form.getByRole('button', { name: 'Зураг хасах' }).click();
  await expect(form.getByRole('img', { name: photoAlt })).toHaveCount(0);
  await photo.setInputFiles({ name: 'sighting.png', mimeType: 'image/png', buffer: image });
  await expect(form.getByRole('img', { name: photoAlt })).toBeVisible();
  await form.getByRole('button', { name: 'Газрын зураг дээр тэмдэглэх' }).click();
  await expect(picker.locator('.leaflet-control-zoom-in')).toBeVisible();
  await picker.click({ position: { x: 140, y: 100 } });
  await expectMapAssets(picker, '/sighting-map-marker.svg');
  await form.screenshot({ path: testInfo.outputPath('sighting-form.png') });
  await publish();
  await expect(section.getByText('Газрын зураг, цагтай мэдээлэл', { exact: true })).toHaveCount(1);
  await expect(purple).toBeVisible();
  await expect(orange).toBeVisible();
  await orange.click();
  await expect(popup.getByText('Газрын зураг, цагтай мэдээлэл', { exact: true })).toBeVisible();
  await expect(popup.getByText('Харсан байршил: Хорооллын цэцэрлэг')).toBeVisible();
  await expect(popup.getByText(/^Харсан: /)).toBeVisible();
  await expect(popup.getByText(/^Нийтэлсэн: /)).toBeVisible();
  await expect.poll(() => popup.getByRole('img', { name: photoAlt }).evaluate((img: HTMLImageElement) => img.naturalWidth)).toBe(64);

  await page.reload();
  const saved = section.locator('article').filter({ hasText: 'Газрын зураг, цагтай мэдээлэл' });
  await expect(saved.getByText('Харсан:', { exact: false })).toBeVisible();
  const expectedTime = await page.evaluate(() => new Date('2025-01-02T18:30').toISOString());
  const savedTime = await saved.locator('time').first().getAttribute('datetime');
  expect(new Date(savedTime!).toISOString()).toBe(expectedTime);
  await expect.poll(() => saved.getByRole('img', { name: photoAlt }).evaluate((img: HTMLImageElement) => img.naturalWidth)).toBe(64);
  await saved.getByRole('button', { name: 'Газрын зураг харах' }).click();
  await expect(popup.getByText('Газрын зураг, цагтай мэдээлэл', { exact: true })).toBeVisible();
  await expect(saved.locator('.location-map')).toHaveCount(0);
  await map.locator('.leaflet-popup-close-button').click();
  await orange.focus();
  await orange.press('Enter');
  await expect(popup.getByText('Газрын зураг, цагтай мэдээлэл', { exact: true })).toBeVisible();
  const plain = section.locator('article').filter({ hasText: 'Тайлбартай боловч цэг, цаггүй' });
  await expect(plain).toBeVisible();
  await expect(plain.getByRole('button', { name: 'Газрын зураг харах' })).toHaveCount(0);
  await expect(plain.locator('time')).toHaveCount(1);
});

test('guest photos open on the main map for the owner only', async ({ page }) => {
  const admin = createAdminClient();
  const fixtureId = randomUUID();
  const key = randomUUID();
  const photoPath = `${key}/${randomUUID()}/${'a'.repeat(64)}.jpg`;
  const message = 'Private guest map fixture';
  const photoAlt = 'Харсан тухай хавсаргасан зураг';
  const listing = await admin.from('pets').insert({
    id: fixtureId, created_by: userId, status: 'lost', name: 'Guest map fixture',
    type: 'Муур', color: 'Бор', district: 'Баянзүрх', place: 'Туршилтын байршил',
    phone: String(randomInt(10_000_000, 100_000_000)),
  });
  if (listing.error) throw listing.error;
  try {
    const image = await sharp({ create: { width: 32, height: 24, channels: 3, background: '#625bf6' } }).jpeg().toBuffer();
    const savedPhoto = await admin.storage.from(GUEST_SIGHTING_PHOTO_BUCKET).upload(photoPath, image, { contentType: 'image/jpeg' });
    if (savedPhoto.error) throw savedPhoto.error;
    const submitted = await admin.rpc('submit_guest_sighting', {
      target_key: key, target_pet: fixtureId, target_message: message, target_place: 'Private address',
      target_lat: 47.91523, target_lng: 106.92073, target_sighted_at: null, target_photo_path: photoPath,
    });
    expect(submitted.error).toBeNull();
    const { data: report, error } = await admin.from('guest_sightings').select('id').eq('submission_key', key).single();
    if (error) throw error;
    const published = await admin.rpc('review_guest_sighting', {
      target_pet: fixtureId, target_id: report.id, target_owner: userId, action: 'publish',
    });
    expect(published.error).toBeNull();

    const map = page.locator('.map-section .location-map');
    const pin = map.locator('img[src="/sighting-map-marker.svg"]');
    const popup = map.locator('.leaflet-popup-content');
    await page.goto(`/pets/${fixtureId}`);
    await pin.click();
    await expect(popup.getByText('Зочны мэдээлэл · Ойролцоох байршил')).toBeVisible();
    await expect(popup.getByRole('img', { name: photoAlt })).toHaveCount(0);
    await expect(popup.getByText(message)).toHaveCount(0);

    await page.addInitScript(auth => localStorage.setItem('sb-127-auth-token', JSON.stringify(auth)), session);
    await page.goto(`/pets/${fixtureId}?view=owner#guest-sightings`);
    const inbox = page.locator('#guest-sightings');
    await expect(inbox.getByText('Нийтэд харагдаж буй')).toBeVisible();
    await pin.click();
    await expect.poll(() => popup.getByRole('img', { name: photoAlt }).evaluate((img: HTMLImageElement) => img.naturalWidth)).toBe(32);
    await expect(popup.getByText(message)).toHaveCount(0);

    await inbox.getByRole('button', { name: 'Шинэ мэдээлэл нээх' }).click();
    await expect(inbox.getByText(message)).toBeVisible();
    await expect(inbox.locator('.location-map')).toHaveCount(0);
    await inbox.getByRole('button', { name: 'Газрын зураг харах' }).click();
    await expect(popup.getByText('Зочны тэмдэглэсэн яг байршил')).toBeVisible();
    await expect(popup.getByText(message)).toBeVisible();
    await expect.poll(() => popup.getByRole('img', { name: photoAlt }).evaluate((img: HTMLImageElement) => img.naturalWidth)).toBe(32);
  } finally {
    await admin.from('pets').delete().eq('id', fixtureId);
    await admin.storage.from(GUEST_SIGHTING_PHOTO_BUCKET).remove([photoPath]);
  }
});

test('sighting photo retries verify the file contents and reject a fake image', async ({ request }) => {
  const photo = await sharp({ create: { width: 32, height: 24, channels: 3, background: '#625bf6' } }).png().toBuffer();
  const key = randomUUID();
  const details = JSON.stringify({
    petId, message: 'Photo retry fixture', lat: 47.91848765301045, lng: 106.91778653520563,
  });
  function submit(buffer: Buffer, idempotencyKey = key) {
    return request.post('/api/sightings', {
      headers: { authorization: `Bearer ${session!.access_token}`, 'idempotency-key': idempotencyKey },
      multipart: { details, photo: { name: 'photo.png', mimeType: 'image/png', buffer } },
    });
  }
  expect((await submit(photo)).status()).toBe(201);
  const retry = await submit(photo);
  expect(retry.status()).toBe(200);
  expect(await retry.json()).toMatchObject({ duplicate: true });
  expect((await submit(Buffer.from('different file'))).status()).toBe(409);
  expect((await submit(Buffer.from('not an image'), randomUUID())).status()).toBe(400);
});

test('sightings alone create a map, with overlapping reports readable as text', async ({ page }, testInfo) => {
  await page.addInitScript(() => localStorage.setItem('mur-theme', 'dark'));
  await page.goto(`/pets/${sightingOnlyPetId}`);
  const map = page.locator('.map-section .location-map');
  const pin = map.locator('img[src="/sighting-map-marker.svg"]');
  await expect(pin).toHaveCount(1);
  await expect(map.locator('img[src="/map-marker.svg"]')).toHaveCount(0);
  await pin.click();
  const popup = map.locator('.leaflet-popup-content');
  await expect(popup.getByText('Нэг байршлын эхний мэдээлэл')).toBeVisible();
  await expect(popup.getByText('<img src=x onerror=alert(1)>')).toBeVisible();
  await expect(popup.locator('img')).toHaveCount(0);
  await expect(popup.getByText(/^Харсан: /)).toHaveCount(0);
  const wrapper = map.locator('.leaflet-popup-content-wrapper');
  const cardColor = await map.evaluate(element => getComputedStyle(element).getPropertyValue('--card').trim());
  expect(cardColor).toBeTruthy();
  expect(await wrapper.evaluate(element => getComputedStyle(element).backgroundColor)).not.toBe('rgb(255, 255, 255)');
  await map.screenshot({ path: testInfo.outputPath('sighting-map-dark.png') });

  // The real popup and map panes must stay below the fixed navbar while scrolling.
  await map.evaluate(element => {
    const navbar = document.querySelector('.navbar')!;
    const mapRect = element.getBoundingClientRect();
    const navRect = navbar.getBoundingClientRect();
    window.scrollBy({ top: mapRect.top - navRect.top + 4, behavior: 'instant' });
  });
  await expect.poll(() => page.evaluate(() => {
    const navbar = document.querySelector('.navbar')!;
    const nav = navbar.getBoundingClientRect();
    const mapRect = document.querySelector('.map-section .location-map')!.getBoundingClientRect();
    const x = (Math.max(nav.left, mapRect.left) + Math.min(nav.right, mapRect.right)) / 2;
    const y = (nav.top + nav.bottom) / 2;
    return mapRect.top <= y && mapRect.bottom >= y && navbar.contains(document.elementFromPoint(x, y));
  })).toBe(true);
});

test('clinic map uses the same working tiles and local marker asset', async ({ page }) => {
  await page.goto('/clinics');
  await expectMapAssets(page.locator('.clinic-map'));
});
