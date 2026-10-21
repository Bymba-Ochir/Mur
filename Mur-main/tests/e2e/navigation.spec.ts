import { test, expect } from '@playwright/test';

// Onboarding модалыг хаах — localStorage-д харсан туг тавих
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('mur-onboarding-seen', '1');
  });
});

test.describe('Үндсэн навигаци', () => {
  test('нүүр хуудас ачаалагдаж, гарчиг харагдана', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.getByRole('link', { name: /Алдсан мэдэгдэх/ })).toBeVisible();
  });

  test('Navbar-аар "Алдсан" хуудас руу шилжинэ', async ({ page, isMobile }) => {
    await page.goto('/');
    if (isMobile) {
      await page.locator('.mobile-menu-btn').click();
      await page.locator('.mobile-nav').waitFor({ state: 'visible' });
    }
    await page.getByRole('link', { name: 'Алдсан', exact: true }).first().click();
    await expect(page).toHaveURL(/report-lost/);
    await expect(page.locator('h1')).toContainText('Мэдээллээ оруулна уу');
  });

  test('Navbar-аар "Жагсаалт" хуудас руу шилжинэ', async ({ page, isMobile }) => {
    await page.goto('/');
    if (isMobile) {
      await page.locator('.mobile-menu-btn').click();
      await page.locator('.mobile-nav').waitFor({ state: 'visible' });
    }
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
  test('EN/MN товч дарахад текст солигдоно', async ({ page, isMobile }) => {
    await page.goto('/');
    const heroBefore = await page.locator('h1').textContent();
    if (isMobile) {
      await page.locator('.mobile-menu-btn').click();
      await page.locator('.mobile-nav').waitFor({ state: 'visible' });
    }
    await page.locator('.lang-btn').last().click();
    await expect(page.locator('h1')).not.toHaveText(heroBefore || '');
  });

  test('Dark mode товч дарахад html[data-theme] солигдоно', async ({ page, isMobile }) => {
    await page.goto('/');
    const before = await page.locator('html').getAttribute('data-theme');
    if (isMobile) {
      await page.locator('.mobile-menu-btn').click();
      await page.locator('.mobile-nav').waitFor({ state: 'visible' });
    }
    await page.locator('.theme-btn').last().click();
    const after = await page.locator('html').getAttribute('data-theme');
    expect(after).not.toBe(before);
  });
});

test.describe('UI regression', () => {
  test('login modal viewport дээр харагдаж, хаагдахад scroll сэргэнэ', async ({ page, isMobile }) => {
    await page.goto('/');
    if (isMobile) {
      await page.locator('.mobile-menu-btn').click();
      await page.getByRole('button', { name: /Нэвтрэх/ }).last().click();
    } else {
      await page.getByRole('button', { name: /Нэвтрэх/ }).first().click();
    }
    const dialog = page.getByRole('dialog', { name: /Нэвтрэх/ });
    await expect(dialog).toBeVisible();
    await expect(page.locator('body')).toHaveCSS('overflow', 'hidden');
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
  });

  test('хандивын modal viewport дээр харагдана', async ({ page, isMobile }) => {
    await page.goto('/');
    if (isMobile) await page.locator('.mobile-menu-btn').click();
    await page.getByRole('button', { name: /Дэмжих/ }).last().click();
    await expect(page.getByRole('dialog', { name: /Дэмж/ })).toBeVisible();
  });

  test('home service card-ууд layout style-тай байна', async ({ page }) => {
    await page.goto('/');
    const card = page.locator('.service-card').first();
    await expect(card).toBeVisible();
    await expect(card).toHaveCSS('display', 'block');
    await expect(card).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  });

  test('mobile menu item-ууд тусдаа мөрөөр харагдана', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile project only');
    await page.goto('/');
    await page.locator('.mobile-menu-btn').click();
    const lost = page.locator('.mobile-nav-link').first();
    await expect(lost).toBeVisible();
    await expect(lost).toHaveCSS('display', 'flex');
    expect((await lost.boundingBox())?.height).toBeGreaterThanOrEqual(40);
  });
});
