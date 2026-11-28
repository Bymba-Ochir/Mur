import { test, expect } from './fixtures';
// Read-only public acceptance checks. Run against the locally updated app.
for(const width of [360,390,768,1366]) {
 test(`public page overflow and login gate at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:900});
  await page.addInitScript(()=>{localStorage.setItem('mur-onboarding-v2-seen','1');localStorage.setItem('mur-install-dismissed','1');localStorage.setItem('mur-analytics-consent','declined');localStorage.setItem('mur-lang','mn');});
  for(const route of ['/','/report-lost','/report-found','/privacy','/clinics']) {
   await page.goto(route);
   await expect(page.locator('h1').first()).toBeVisible();
   await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth)).toBeLessThanOrEqual(1);
   if(route.startsWith('/report-')) {
    await expect(page.getByText('Зар оруулахын тулд нэвтэрнэ үү')).toBeVisible();
    await expect(page.locator('input[type=file]')).toHaveCount(0);
   }
  }
 });
}

for (const { width, height } of [{ width: 320, height: 568 }, { width: 390, height: 844 }]) {
  test(`listings results stay visible with the consent notice at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.addInitScript(() => {
      localStorage.setItem('mur-onboarding-v2-seen', '1');
      localStorage.setItem('mur-install-dismissed', '1');
      localStorage.setItem('mur-lang', 'mn');
    });
    await page.route('http://127.0.0.1:54321/rest/v1/pets?**', route => route.fulfill({ json: [] }));
    await page.goto('/listings?status=found');

    const notice = page.locator('[data-floating-notice="analytics"]');
    const emptyTitle = page.locator('.empty-title');
    const filters = page.locator('.filters-panel');
    await expect(emptyTitle).toBeVisible();
    await expect(notice).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
    const [text, buttons, noticeBox, title, filtersBox] = await Promise.all([
      notice.locator('p').boundingBox(),
      notice.locator('.analytics-actions').boundingBox(),
      notice.boundingBox(),
      emptyTitle.boundingBox(),
      filters.boundingBox(),
    ]);
    expect(text!.width).toBeGreaterThan(noticeBox!.width - 24);
    expect(text!.y + text!.height).toBeLessThan(buttons!.y);
    expect(title!.y).toBeLessThan(filtersBox!.y + filtersBox!.height + 48);
    expect(title!.y + title!.height).toBeLessThan(noticeBox!.y);

    const photoSearch = page.getByRole('button', { name: 'Зургаар хайх' });
    const photoPanel = page.locator('#match-upload-panel');
    await expect(photoPanel).toBeHidden();
    await photoSearch.click();
    await expect(photoPanel).toBeVisible();
    await photoSearch.click();
    await expect(photoPanel).toBeHidden();

    const post = page.getByText('Зар нийтлэх', { exact: true });
    await post.click();
    await expect(page.locator('.report-options a')).toHaveCount(2);
    await expect(page.locator('.report-options a').first()).toBeVisible();
    await post.click();

    await notice.getByRole('button', { name: 'Татгалзах' }).click();
    await page.getByRole('button', { name: 'Шүүлтүүр цэвэрлэх' }).click();
    await expect(page).toHaveURL(/\/listings$/);
    await expect(emptyTitle).toHaveText('Одоогоор зар алга');
  });
}
