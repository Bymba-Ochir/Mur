import { test, expect } from './fixtures';
import type { Page } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('mur-lang', 'mn');
    localStorage.setItem('mur-analytics-consent', 'declined');
  });
});

async function openClinics(page: Page) {
  await page.goto('/clinics');
  await expect(page.locator('.clinic-map .leaflet-control-zoom-in')).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await page.locator('.page-transition').evaluate(element => Promise.all(element.getAnimations().map(animation => animation.finished)));
  await page.evaluate(() => window.scrollTo(0, 0));
}

test('clinic sidebar stays below the navbar while the document scrolls, then stops at the list end', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await openClinics(page);
  const panel = page.locator('.map-panel');
  const initial = await panel.evaluate(element => element.getBoundingClientRect().toJSON());
  const listRight = await page.locator('.clinic-results').evaluate(element => element.getBoundingClientRect().right);
  expect(initial.left).toBeGreaterThan(listRight);

  await page.evaluate(y => window.scrollTo(0, y + 300), initial.top);
  const top = await panel.evaluate(element => parseFloat(getComputedStyle(element).top));
  await expect.poll(() => panel.evaluate(element => element.getBoundingClientRect().top)).toBeCloseTo(top, 0);
  const navBottom = await page.locator('.navbar-wrap').evaluate(element => element.getBoundingClientRect().bottom);
  expect(top).toBeGreaterThanOrEqual(navBottom + 8);
  const listTop = await page.locator('.clinic-results').evaluate(element => element.getBoundingClientRect().top);
  const scrollBefore = await page.evaluate(() => window.scrollY);

  // A wheel over the map must scroll the page, without trapping scroll in the card.
  const map = await page.locator('.clinic-map').boundingBox();
  expect(map).not.toBeNull();
  await page.mouse.move(map!.x + map!.width / 2, map!.y + map!.height / 2);
  await page.mouse.wheel(0, 400);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(scrollBefore + 200);
  await expect.poll(() => panel.evaluate(element => element.getBoundingClientRect().top)).toBeCloseTo(top, 0);
  expect(await panel.evaluate(element => element.getBoundingClientRect().left)).toBeCloseTo(initial.left, 0);
  expect(await page.locator('.clinic-results').evaluate(element => element.getBoundingClientRect().top)).toBeLessThan(listTop - 200);
  expect(await page.evaluate(() => document.scrollingElement === document.documentElement)).toBe(true);

  // Sticky positioning must release at the container boundary instead of covering the footer.
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect.poll(() => panel.evaluate(element => {
    const list = element.closest('.clinic-explorer')!;
    return Math.abs(element.getBoundingClientRect().bottom - list.getBoundingClientRect().bottom);
  })).toBeLessThan(1);
  expect(await panel.evaluate(element => element.getBoundingClientRect().top)).toBeLessThan(top);
});

test('clinic sidebar fits short desktop screens without an inner scrollbar', async ({ page }) => {
  for (const height of [600, 480]) {
    await page.setViewportSize({ width: 1280, height });
    await openClinics(page);
    const panel = page.locator('.map-panel');
    const initialTop = await panel.evaluate(element => element.getBoundingClientRect().top);
    await page.evaluate(y => window.scrollTo(0, y + 300), initialTop);
    await expect.poll(() => panel.evaluate(element => element.getBoundingClientRect().bottom)).toBeLessThanOrEqual(height - 16);
    expect(await panel.evaluate(element => element.scrollHeight - element.clientHeight)).toBeLessThanOrEqual(1);
    const map = await page.locator('.clinic-map').boundingBox();
    expect(map!.height).toBeGreaterThan(250);
    await expect(page.locator('#clinic-map-title')).toBeInViewport();
    await expect(page.locator('.clinic-map .leaflet-control-attribution')).toBeInViewport();
  }
});

test('clinic map scrolls normally above results on tablet and mobile', async ({ page }) => {
  for (const width of [1100, 768, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await openClinics(page);
    const panel = page.locator('.map-panel');
    const initial = await panel.evaluate(element => element.getBoundingClientRect().toJSON());
    const listTop = await page.locator('.clinic-results').evaluate(element => element.getBoundingClientRect().top);
    expect(initial.bottom).toBeLessThanOrEqual(listTop);
    await page.evaluate(y => window.scrollTo(0, y + 300), initial.top);
    await expect.poll(() => panel.evaluate(element => element.getBoundingClientRect().top + window.scrollY)).toBeCloseTo(initial.top, 0);
    expect(await panel.evaluate(element => element.getBoundingClientRect().top)).toBeLessThan(0);
    expect(await panel.evaluate(element => getComputedStyle(element).position)).toBe('static');
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
  }
});
