import {test,expect} from '@playwright/test';
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
