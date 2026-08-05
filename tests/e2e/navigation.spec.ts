import { test, expect } from '@playwright/test';

test.describe('Үндсэн навигаци', () => {
  test('нүүр хуудас ачаалагдаж, гарчиг харагдана', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.getByRole('link', { name: /Алдсан мэдэгдэх/ })).toBeVisible();
  });

  test('Navbar-аар "Алдсан" хуудас руу шилжинэ', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Алдсан', exact: true }).first().click();
    await expect(page).toHaveURL(/report-lost/);
    await expect(page.locator('h1')).toContainText('Мэдээллээ оруулна уу');
  });

  test('Navbar-аар "Жагсаалт" хуудас руу шилжинэ', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Жагсаалт', exact: true }).first().click();
    await expect(page).toHaveURL(/listings/);
  });

  test('skip-link фокус авахад харагдана (a11y)', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    const skipLink = page.locator('.skip-link');
    await expect(skipLink).toBeFocused();
  });
});

test.describe('Хэл, theme сэлгэх', () => {
  test('EN/MN товч дарахад текст солигдоно', async ({ page }) => {
    await page.goto('/');
    const heroBefore = await page.locator('h1').textContent();
    await page.getByRole('button', { name: /^(EN|MN)$/ }).click();
    await expect(page.locator('h1')).not.toHaveText(heroBefore || '');
  });

  test('Dark mode товч дарахад html[data-theme] солигдоно', async ({ page }) => {
    await page.goto('/');
    const before = await page.locator('html').getAttribute('data-theme');
    await page.getByRole('button', { name: /(Бараан горим|Цайвар горим|Switch to)/ }).click();
    const after = await page.locator('html').getAttribute('data-theme');
    expect(after).not.toBe(before);
  });
});
