import { test, expect } from './fixtures';

const petId = '5a70755d-d0fb-4123-a074-097719d4c350';
const adoptionId = '5a70755d-d0fb-4123-a074-097719d4c351';
const sittingId = '5a70755d-d0fb-4123-a074-097719d4c352';
const photo = '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480"><rect width="640" height="480" fill="#e9e5ff"/><circle cx="320" cy="240" r="100" fill="#bc935b"/></svg>';

test.beforeEach(async ({ page, baseURL }) => {
  const origin = new URL(baseURL ?? 'http://localhost:3000');
  if (origin.protocol !== 'http:' || !['localhost', '127.0.0.1'].includes(origin.hostname)) throw new Error('Card navigation tests require the local app');
  await page.addInitScript(() => { localStorage.setItem('mur-lang', 'mn'); localStorage.setItem('mur-analytics-consent', 'declined'); });
  const records: Record<string, Record<string, unknown>[]> = {
    pets: [{ id: petId, status: 'lost', name: 'Картын туршилт', type: 'Нохой', color: 'хар', district: 'Баянзүрх', place: '22 хороо', phone: '99112233', phone_hidden: false, created_at: '2026-11-07T00:00:00Z' }],
    adoptions: [{ id: adoptionId, name: 'Картын туршилт', type: 'Муур', color: 'бор', district: 'Баянзүрх', place: '22 хороо', phone: '', phone_hidden: true, created_at: '2026-11-07T00:00:00Z' }],
    sitting_listings: [{ id: sittingId, pet_type: 'Нохой', description: 'Картын туршилт', district: 'Баянзүрх', place: '22 хороо', phone: '', phone_hidden: true, price: 0, created_at: '2026-11-07T00:00:00Z' }],
    pet_photos: [0,1].map(position => ({ pet_id: petId, position, url: `http://127.0.0.1:54321/storage/v1/object/public/pet-photos/card-navigation-${position}.svg` })),
    adoption_photos: [0,1].map(position => ({ adoption_id: adoptionId, position, url: `http://127.0.0.1:54321/storage/v1/object/public/pet-photos/card-navigation-${position}.svg` })),
  };
  for (const [table, data] of Object.entries(records)) {
    await page.route(`http://127.0.0.1:54321/rest/v1/${table}?**`, route => route.fulfill({
      json: route.request().headers().accept?.includes('vnd.pgrst.object') ? data[0] : data,
    }));
  }
  await page.route('http://127.0.0.1:54321/storage/v1/object/public/pet-photos/card-navigation-**', route => route.fulfill({ contentType: 'image/svg+xml', body: photo }));
});

for (const scenario of [
  { path: '/listings?q=card', destination: `/pets/${petId}`, selector: '.pet-card', gallery: true },
  { path: '/adoptions?q=card', destination: `/adoptions/${adoptionId}`, selector: '.pet-card', gallery: true },
  { path: '/sitting', destination: `/sitting/${sittingId}`, selector: '.sitting-card', gallery: false },
]) {
  test(`${scenario.path} cards open directly while retaining separate controls`, async ({ page, context, isMobile }) => {
    await page.goto(scenario.path);
    let card = page.locator(scenario.selector).filter({ hasText: 'Картын туршилт' }).first();
    await expect(card).toBeVisible();
    await expect(card.locator('.detail-link')).toHaveCount(0);
    const link = card.locator('.listing-card-link');
    await expect(link).toHaveAttribute('href', new RegExp(scenario.destination));
    if (scenario.gallery) {
      await card.locator('.gallery .next').click();
      await expect(card.locator('.gallery .counter')).toHaveText('2 / 2');
      await expect(page).toHaveURL(url => url.pathname === scenario.path.split('?')[0]);
      await expect(card.locator('a button, a a')).toHaveCount(0);
    }
    const phone = card.locator('button.phone');
    if (await phone.count()) {
      await phone.click();
      await expect(card.locator('a.phone')).toHaveAttribute('href', 'tel:99112233');
      await expect(page).toHaveURL(url => url.pathname === scenario.path.split('?')[0]);
    }
    // Blank content is part of the native link hit area, not an imperative div click.
    const thumb = await card.locator('.thumb').boundingBox();
    const box = await card.boundingBox();
    await card.click({ position: { x: box!.width - 20, y: thumb!.height + 58 } });
    await expect(page).toHaveURL(url => url.pathname === scenario.destination);
    if (scenario.path.includes('?')) expect(new URL(page.url()).searchParams.get('returnTo')).toBe(scenario.path);

    await page.goto(scenario.path);
    card = page.locator(scenario.selector).filter({ hasText: 'Картын туршилт' }).first();
    await page.keyboard.press('Tab');
    await card.locator('.listing-card-link').focus();
    await expect(card).toHaveCSS('outline-style', 'solid');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(url => url.pathname === scenario.destination);

    await page.goto(scenario.path);
    card = page.locator(scenario.selector).filter({ hasText: 'Картын туршилт' }).first();
    if (!isMobile) {
      const opened = context.waitForEvent('page');
      await card.locator('.listing-card-link').click({ modifiers: ['Control'] });
      const tab = await opened;
      await tab.waitForURL(url => url.pathname === scenario.destination);
      await tab.close();
      await expect(page).toHaveURL(url => url.pathname === scenario.path.split('?')[0]);
    }
    await card.click({ position: { x: 70, y: 30 } });
    await expect(page).toHaveURL(url => url.pathname === scenario.destination);
  });
}
