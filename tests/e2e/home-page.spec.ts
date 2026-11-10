import { test, expect } from './fixtures';

const scenarios = [
  { width: 1440, lang: 'mn', theme: 'light', motion: 'no-preference' },
  { width: 1041, lang: 'en', theme: 'dark', motion: 'reduce' },
  { width: 768, lang: 'en', theme: 'dark', motion: 'reduce' },
  { width: 390, lang: 'mn', theme: 'light', motion: 'reduce' },
  { width: 320, lang: 'en', theme: 'dark', motion: 'no-preference' },
] as const;

test.beforeEach(async ({ baseURL }) => {
  const target = new URL(baseURL ?? 'http://localhost:3000');
  if (target.protocol !== 'http:' || !['127.0.0.1', 'localhost'].includes(target.hostname)) {
    throw new Error('Home acceptance tests require the local app');
  }
});

for (const scenario of scenarios) {
  test(`home keeps public actions and clear instructions at ${scenario.width}px in ${scenario.lang}`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize({ width: scenario.width, height: 900 });
    await page.emulateMedia({ reducedMotion: scenario.motion });
    await page.addInitScript(({ lang, theme }) => {
      localStorage.setItem('mur-lang', lang);
      localStorage.setItem('mur-theme', theme);
      localStorage.setItem('mur-analytics-consent', 'declined');
    }, scenario);
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('lang', scenario.lang);
    await expect(page.locator('html')).toHaveAttribute('data-theme', scenario.theme);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('.hero-actions a')).toHaveCount(3);
    for (const action of await page.locator('.hero-actions a').all()) {
      await expect(action).toBeInViewport();
      // The entrance transform can round 44 CSS pixels to 43.99997 in Chromium.
      expect((await action.boundingBox())!.height).toBeGreaterThanOrEqual(44 - 0.01);
    }

    await expect(page.locator('.home a[href="/my-pets"]')).toHaveCount(0);
    const mobileMenu = page.locator('.mobile-menu-btn');
    const services = page.locator('.services-trigger');
    if (scenario.width > 1040) {
      await expect(mobileMenu).toBeHidden();
      await services.click();
      await expect(services).toHaveAttribute('aria-expanded', 'true');
      const links = page.locator('#nav-services a');
      for (const [index, href] of ['/adoptions', '/sitting', '/clinics'].entries()) {
        await expect(links.nth(index)).toHaveAttribute('href', href);
        await expect(links.nth(index)).toBeVisible();
      }
      await expect(links).toHaveCount(3);
      await expect(page.locator('.mobile-backdrop')).toHaveCount(0);
      await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
      await page.keyboard.press('Tab');
      await expect(links.first()).toBeFocused();
      await page.keyboard.press('Escape');
      await expect(services).toHaveAttribute('aria-expanded', 'false');
      await expect(services).toBeFocused();
    } else {
      await expect(services).toBeHidden();
      await mobileMenu.click();
      await expect(page.locator('.mobile-nav a[href="/my-pets"]')).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(page.locator('.mobile-dropdown')).toHaveCount(0);
      await expect(mobileMenu).toBeFocused();
    }

    const steps = page.locator('.how ol > li');
    await expect(steps).toHaveCount(3);
    const headings = scenario.lang === 'mn' ? ['Бүртгэх', 'Хайх', 'Холбогдох'] : ['Post', 'Browse', 'Connect'];
    for (let index = 0; index < headings.length; index++) {
      await expect(steps.nth(index).getByRole('heading', { name: headings[index], exact: true })).toBeVisible();
      await expect(steps.nth(index).locator('p')).not.toBeEmpty();
    }
    await expect(steps.last()).toContainText(scenario.lang === 'mn' ? 'Дугаар нь ил байвал' : 'if a phone number is shared');
    await expect(page.locator('.how [aria-current="step"]')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    expect(errors).toEqual([]);
  });
}

test('every public home action opens an existing destination', async ({ page, request }) => {
  await page.addInitScript(() => localStorage.setItem('mur-analytics-consent', 'declined'));
  await page.goto('/');
  const destinations = await page.locator('.home a').evaluateAll(nodes => nodes.map(node => node.getAttribute('href')));
  expect(destinations).toEqual(['/report-lost', '/report-found', '/listings', '/adoptions', '/sitting', '/clinics', '/assistant']);
  for (const destination of destinations) {
    const response = await request.get(destination!);
    expect(response.ok(), `${destination} must be available`).toBe(true);
  }
});
