import { test, expect } from './fixtures';

const pets = [
  { id: '20e742b5-240b-4523-8857-8c38cb26482f', status: 'lost', name: 'Lucky Boy', type: 'Нохой', breed: 'Монгол банхар', color: 'хар', district: 'Баянзүрх', place: '22 хороо', phone: '88776655', phone_hidden: true, has_reward: true, created_at: '2026-09-05T00:00:00Z' },
  { id: '2bbc79c6-ebbb-4a31-a8a4-5f7a8e6658c4', status: 'found', name: 'Олдсон муур', type: 'Муур', color: 'саарал', district: 'Баянзүрх', place: 'Цэцэрлэгт хүрээлэнгийн урд талын автобусны буудал', phone: '99112233', has_reward: false, created_at: '2026-10-05T00:00:00Z' },
  { id: '312454fa-3509-454c-a79a-5737073a9504', status: 'lost', name: 'А'.repeat(80), type: 'Нохой', color: 'бор', district: 'Хан-Уул', place: '15 хороо', phone: '', phone_hidden: true, has_reward: false, created_at: '2026-10-15T00:00:00Z' },
];
const photo = '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480"><rect width="640" height="480" fill="#e9e5ff"/><circle cx="320" cy="240" r="100" fill="#bc935b"/></svg>';

test.beforeEach(async ({ page, baseURL }) => {
  const target = new URL(baseURL ?? 'http://localhost:3000');
  if (target.protocol !== 'http:' || !['localhost', '127.0.0.1'].includes(target.hostname)) throw new Error('Layout tests require the local app');
  await page.addInitScript(() => { localStorage.setItem('mur-lang', 'mn'); localStorage.setItem('mur-analytics-consent', 'declined'); });
});

test('home services occupy equal columns on desktop, tablet and mobile', async ({ page }) => {
  for (const [width, columns] of [[1440, 4], [768, 2], [360, 1]]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const cards = page.locator('.services-grid .service-card');
    await expect(cards).toHaveCount(4);
    await cards.first().scrollIntoViewIfNeeded();
    const boxes = await cards.evaluateAll(nodes => nodes.map(node => { const box = node.getBoundingClientRect(); return { x: box.x, y: box.y, width: box.width }; }));
    expect(Math.max(...boxes.map(box => box.width)) - Math.min(...boxes.map(box => box.width))).toBeLessThan(1);
    expect(boxes.filter(box => Math.abs(box.y - boxes[0].y) < 1)).toHaveLength(columns);
    expect(await cards.evaluateAll(nodes => nodes.map(node => new URL((node as HTMLAnchorElement).href).pathname))).toEqual(['/adoptions', '/sitting', '/clinics', '/assistant']);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  }
});

test('listing photos are larger and actions follow content without a stretched blank area', async ({ page }) => {
  await page.route('http://127.0.0.1:54321/rest/v1/pets?**', route => route.fulfill({ json: pets }));
  await page.route('http://127.0.0.1:54321/rest/v1/pet_photos?**', route => route.fulfill({ json: pets.slice(0, 2).flatMap(pet => [0, 1].map(position => ({ pet_id: pet.id, url: `http://127.0.0.1:54321/storage/v1/object/public/pet-photos/layout-${pet.id}-${position}.svg`, position }))) }));
  await page.route('http://127.0.0.1:54321/storage/v1/object/public/pet-photos/layout-**', route => route.fulfill({ contentType: 'image/svg+xml', body: photo }));
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/listings');
    const cards = page.locator('.pet-card');
    await expect(cards).toHaveCount(3);
    const first = cards.first();
    const frame = await first.locator('.thumb').boundingBox();
    expect(frame).not.toBeNull();
    expect(Math.abs(frame!.height / frame!.width - .75)).toBeLessThan(.01);
    const metrics = await first.evaluate(node => {
      const meta = node.querySelector('.card-meta')!.getBoundingClientRect();
      const actions = node.querySelector('.card-actions')!.getBoundingClientRect();
      return { gap: actions.top - meta.bottom };
    });
    expect(metrics.gap).toBeLessThanOrEqual(20);
    const detail = first.locator('.detail-link');
    await expect(detail).toHaveCSS('border-top-style', 'solid');
    expect((await detail.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await expect(detail).toHaveAttribute('href', /\/pets\/20e742b5-/);
    await expect(first.locator('.phone')).toHaveCount(0);
    await expect(first).not.toContainText('88776655');
    const gallery = first.locator('.gallery');
    await gallery.locator('.next').click();
    await expect(gallery.locator('.counter')).toHaveText('2 / 2');
    const contact = cards.nth(1).locator('button.phone');
    await contact.click();
    await expect(cards.nth(1).locator('a.phone')).toHaveAttribute('href', 'tel:99112233');
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  }
});
