import { test, expect } from './fixtures';

for (const lang of ['mn', 'en']) {
  test(`analytics consent can be withdrawn, persists, and syncs between tabs (${lang})`, async ({ page, context }) => {
    await context.addInitScript(locale => {
      localStorage.setItem('mur-lang', locale);
      if (!localStorage.getItem('mur-analytics-consent')) localStorage.setItem('mur-analytics-consent', 'declined');
    }, lang);
    await page.goto('/privacy');
    const preferences = page.getByRole('region', { name: lang === 'mn' ? 'Хэрэглээний хэмжилт' : 'Usage analytics', exact: true });
    const accept = preferences.getByRole('button', { name: lang === 'mn' ? 'Зөвшөөрөх' : 'Accept', exact: true });
    const decline = preferences.getByRole('button', { name: lang === 'mn' ? 'Татгалзах' : 'Decline', exact: true });
    await expect(decline).toHaveAttribute('aria-pressed', 'true');
    await accept.click();
    await expect(accept).toHaveAttribute('aria-pressed', 'true');
    expect(await page.evaluate(() => localStorage.getItem('mur-analytics-consent'))).toBe('accepted');
    await page.reload();
    await expect(accept).toHaveAttribute('aria-pressed', 'true');
    const other = await context.newPage();
    await other.goto('/privacy');
    await other.locator('.analytics-preferences').getByRole('button', { name: lang === 'mn' ? 'Татгалзах' : 'Decline', exact: true }).click();
    await expect(decline).toHaveAttribute('aria-pressed', 'true');
    expect(await page.evaluate(() => localStorage.getItem('mur-analytics-consent'))).toBe('declined');
    await other.close();
    await page.reload();
    await expect(decline).toHaveAttribute('aria-pressed', 'true');
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
  });
}
