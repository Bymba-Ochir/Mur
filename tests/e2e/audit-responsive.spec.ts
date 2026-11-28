import { test, expect } from './fixtures';
import type { Locator } from '@playwright/test';
import sharp from 'sharp';

async function expectFullSelectLabel(control: Locator) {
  await expect(control).toBeVisible();
  const screenshot = await control.screenshot({ animations: 'disabled' });
  const original = await control.evaluate(el => {
    const select = el as HTMLSelectElement;
    const previous = select.style.textOverflow;
    select.style.textOverflow = 'clip';
    return previous;
  });
  try {
    const withoutEllipsis = await control.screenshot({ animations: 'disabled' });
    const [visible, reference] = await Promise.all(
      [screenshot, withoutEllipsis].map(bytes => sharp(bytes).removeAlpha().raw().toBuffer({ resolveWithObject: true })),
    );
    expect(visible.info.width).toBe(reference.info.width);
    expect(visible.info.height).toBe(reference.info.height);
    let changedPixels = 0;
    for (let offset = 0; offset < visible.data.length; offset += visible.info.channels) {
      if ([0, 1, 2].some(channel => Math.abs(visible.data[offset + channel] - reference.data[offset + channel]) > 20)) {
        changedPixels += 1;
      }
    }
    expect(changedPixels, 'The selected label should render without an ellipsis').toBeLessThanOrEqual(3);
  } finally {
    await control.evaluate((el, previous) => { (el as HTMLSelectElement).style.textOverflow = previous; }, original);
  }
}

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

for (const { width, height } of [{ width: 320, height: 568 }, { width: 360, height: 640 }, { width: 390, height: 844 }]) {
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
    const type = page.getByRole('combobox', { name: 'Төрлөөр шүүх' });
    const district = page.getByRole('combobox', { name: 'Дүүргээр шүүх' });
    if (width <= 360) {
      await page.evaluate(() => document.fonts.ready);
      const status = page.getByRole('combobox', { name: 'Төлвөөр шүүх' });
      const [statusBox, typeBox, districtBox] = await Promise.all([status.boundingBox(), type.boundingBox(), district.boundingBox()]);
      expect(typeBox!.y).toBeCloseTo(statusBox!.y, 0);
      expect(districtBox!.y).toBeGreaterThan(typeBox!.y + typeBox!.height);
      expect(districtBox!.width).toBeGreaterThan(typeBox!.width + statusBox!.width);
      if (width === 320) {
        await expectFullSelectLabel(type);
        await expectFullSelectLabel(district);
      }
    }

    const photoSearch = page.getByRole('button', { name: 'Зургаар хайх' });
    const photoPanel = page.locator('#match-upload-panel');
    await expect(photoPanel).toBeHidden();
    await photoSearch.click();
    await expect(photoPanel).toBeVisible();
    await photoSearch.click();
    await expect(photoPanel).toBeHidden();

    const post = page.getByText('Зар нийтлэх', { exact: true });
    await post.click();
    const reportMenu = page.locator('.report-options');
    const reportLinks = reportMenu.getByRole('link');
    await expect(reportLinks).toHaveCount(2);
    for (const [index, name, href] of [
      [0, 'Алдсан амьтнаа мэдээлэх', '/report-lost'],
      [1, 'Олдсон амьтныг мэдээлэх', '/report-found'],
    ] as const) {
      const option = reportLinks.nth(index);
      await expect(option).toHaveText(name);
      await expect(option).toHaveAttribute('href', href);
      await expect(option).toBeVisible();
      const box = (await option.boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(width);
      expect(await option.evaluate(el => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1);
    }
    await post.click();

    await notice.getByRole('button', { name: 'Татгалзах' }).click();
    await page.getByRole('button', { name: 'Шүүлтүүр цэвэрлэх' }).click();
    await expect(page).toHaveURL(/\/listings$/);
    await expect(emptyTitle).toHaveText('Одоогоор зар алга');
    await expect(page.locator('.empty-actions a')).toHaveCount(2);
    for (const action of await page.locator('.empty-actions a').all()) await expect(action).toBeVisible();
    await district.selectOption('Сонгинохайрхан');
    await expect(district).toHaveValue('Сонгинохайрхан');
    if (width === 320) await expectFullSelectLabel(district);
    else if (width > 360) {
      const selectedDistrict = page.locator('.selected-district');
      await expect(selectedDistrict).toHaveText('Сонгинохайрхан');
      await expect(selectedDistrict).toBeVisible();
      expect(await selectedDistrict.evaluate(el => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1);
    }

    await page.getByRole('button', { name: 'Хайлтыг хадгалах', exact: true }).click();
    const login = page.getByRole('dialog', { name: 'Нэвтрэх' });
    await expect(login).toContainText('Хайлтаа хадгалахын тулд нэвтэрнэ үү.');
    expect(new URL(page.url()).searchParams.get('district')).toBe('Сонгинохайрхан');
  });
}
