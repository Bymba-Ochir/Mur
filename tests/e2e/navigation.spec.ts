import { test, expect } from './fixtures';

test.describe('Үндсэн навигаци', () => {
  test('нүүр хуудас ачаалагдаж, гарчиг харагдана', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    const actions = page.getByRole('navigation', { name: 'Алдсан, олдсон амьтны үндсэн үйлдлүүд' });
    for (const [name, href] of [['Амьтнаа алдсан', '/report-lost'], ['Амьтан олсон', '/report-found'], ['Зар хайх', '/listings']]) {
      const action = actions.getByRole('link', { name, exact: true });
      await expect(action).toHaveAttribute('href', href);
      await expect(action).toBeInViewport();
    }
    await expect(page.getByText('Жишээ зар', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: /Заавар үзэх/ }).click();
    await expect(page.getByRole('dialog', { name: 'МӨР гэж юу вэ?' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
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
    if (isMobile) await page.locator('.mobile-menu-btn').click();
    const tools = page.locator(isMobile ? '.mobile-menu-row' : '.nav-tools');
    await tools.locator('.lang-btn').click();
    await expect(page.locator('h1')).not.toHaveText(heroBefore || '');
  });

  test('Dark mode товч дарахад html[data-theme] солигдоно', async ({ page, isMobile }) => {
    await page.goto('/');
    const before = await page.locator('html').getAttribute('data-theme');
    if (isMobile) await page.locator('.mobile-menu-btn').click();
    const tools = page.locator(isMobile ? '.mobile-menu-row' : '.nav-tools');
    await tools.locator('.theme-btn').click();
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

  test('QPay идэвхгүй үед хандивын товч харагдахгүй', async ({ page, isMobile }) => {
    await page.goto('/');
    if (isMobile) await page.locator('.mobile-menu-btn').click();
    await expect(page.getByRole('button', { name: 'Дэмжих', exact: true })).toHaveCount(0);
  });

  test('home service card-ууд layout style-тай байна', async ({ page }) => {
    await page.goto('/');
    const card = page.locator('.service-card').first();
    await expect(card).toBeVisible();
    await expect(card).toHaveCSS('display', 'grid');
    await expect(card).not.toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  });

  test('mobile menu item-ууд тусдаа мөрөөр харагдана', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile project only');
    await page.goto('/');
    await page.locator('.mobile-menu-btn').click();
    const menu = page.locator('.mobile-nav');
    const lost = menu.locator('a[href="/report-lost"]');
    const found = menu.locator('a[href="/report-found"]');
    await expect(lost).toBeVisible();
    await expect(found).toBeVisible();
    expect((await found.boundingBox())!.y).toBeGreaterThan((await lost.boundingBox())!.y);
    await expect(lost).toHaveCSS('display', 'flex');
    expect((await lost.boundingBox())?.height).toBeGreaterThanOrEqual(40);
  });
});
