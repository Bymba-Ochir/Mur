import { test, expect } from './fixtures';

test.beforeEach(async ({ page, baseURL }) => {
  const origin = new URL(baseURL ?? 'http://localhost:3000');
  if (origin.protocol !== 'http:' || !['localhost', '127.0.0.1'].includes(origin.hostname)) throw new Error('Guide tests require the local app');
  await page.addInitScript(() => {
    localStorage.setItem('mur-analytics-consent', 'declined');
    Object.defineProperty(window, 'Notification', { configurable: true, value: {
      requestPermission: async () => { throw new Error('The navigation guide must not request notification permission'); },
    } });
  });
});

for (const scenario of [
  { lang: 'mn', choice: 'Зар хайх', route: '/listings', district: 'Баянзүрх' },
  { lang: 'en', choice: 'Adopt a pet', route: '/adoptions', district: 'Хан-Уул' },
] as const) {
  test(`guide carries the selected district into ${scenario.route}`, async ({ page }) => {
    const errors: string[] = [], pushRequests: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => { if (request.url().endsWith('/api/push-subscriptions') && request.method() === 'POST') pushRequests.push(request.url()); });
    await page.addInitScript(lang => localStorage.setItem('mur-lang', lang), scenario.lang);
    await page.goto('/');
    await page.locator('.how-guide').click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: new RegExp('^' + scenario.choice) }).click();
    await dialog.getByRole('button', { name: scenario.lang === 'mn' ? 'Үргэлжлүүлэх' : 'Continue', exact: true }).click();
    await expect(dialog.locator('#onb-title')).toBeFocused();
    await dialog.locator('select').selectOption(scenario.district);
    await dialog.getByRole('button', { name: scenario.lang === 'mn' ? 'Зар үзэх' : 'View listings', exact: true }).click();
    await expect(page).toHaveURL(url => url.pathname === scenario.route && url.searchParams.get('district') === scenario.district);
    await expect(page.getByRole('combobox', { name: scenario.lang === 'mn' ? 'Дүүргээр шүүх' : 'Filter by district', exact: true })).toHaveValue(scenario.district);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    expect(pushRequests).toEqual([]);
    expect(errors).toEqual([]);
  });
}

for (const [choice, route] of [['Амьтнаа алдсан', '/report-lost'], ['Амьтан олсон', '/report-found']]) {
  test(`guide opens ${route} without unrelated setup steps`, async ({ page }) => {
    await page.goto('/');
    await page.locator('.how-guide').click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: new RegExp('^' + choice) }).click();
    await dialog.getByRole('button', { name: 'Маягт нээх', exact: true }).click();
    await expect(page).toHaveURL(url => url.pathname === route && url.search === '');
    await expect(page.getByText('Зар оруулахын тулд нэвтэрнэ үү')).toBeVisible();
    await expect(page.locator('input[type="file"]')).toHaveCount(0);
  });
}

test('guide contains keyboard focus, restores it on Escape and starts with a fresh choice', async ({ page }) => {
  await page.goto('/');
  const trigger = page.locator('.how-guide');
  await trigger.click();
  let dialog = page.getByRole('dialog');
  await expect(dialog.locator('#onb-title')).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(dialog.getByRole('button', { name: 'Алгасах', exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(dialog.getByRole('button', { name: 'Хаах', exact: true })).toBeFocused();
  await dialog.getByRole('button', { name: /^Зар хайх/ }).click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
  await trigger.click();
  dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('button', { name: 'Үргэлжлүүлэх', exact: true })).toBeDisabled();
  await expect(dialog.locator('[aria-pressed="true"]')).toHaveCount(0);
});
