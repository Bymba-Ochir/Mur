import { test, expect } from './fixtures';

for (const route of ['/privacy', '/terms']) {
  for (const lang of ['mn', 'en']) {
    test(`${route} provides working guest feedback contact in ${lang}`, async ({ page }) => {
      await page.addInitScript(locale => {
        localStorage.setItem('mur-lang', locale);
        localStorage.setItem('mur-analytics-consent', 'declined');
      }, lang);
      await page.goto(route);
      await expect(page.locator('h1')).toHaveText(route === '/privacy'
        ? lang === 'mn' ? 'Нууцлалын бодлого' : 'Privacy Policy'
        : lang === 'mn' ? 'Үйлчилгээний нөхцөл' : 'Terms of Service');
      await expect(page.locator('a[href="mailto:hello@mur.mn"]')).toHaveCount(0);
      await expect(page.locator('.legal-sidebar .related-link')).toHaveCSS('display', 'grid');
      if (route === '/privacy') {
        await expect(page.locator('.legal-body')).toContainText(lang === 'mn' ? 'Утсаа нуух' : 'Hide phone');
        await expect(page.locator('.legal-body')).toContainText('Sentry');
        await expect(page.locator('.legal-body')).toContainText('Groq');
      }
      const contact = page.locator('.legal-footer').getByRole('button', { name: lang === 'mn' ? 'Санал хүсэлт' : 'Feedback', exact: true });
      await contact.click();
      const dialog = page.getByRole('dialog');
      await expect(dialog).toHaveCount(1);
      await expect(dialog).toBeVisible();
      await expect(dialog.locator('#feedback-message')).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(dialog).toHaveCount(0);
      await expect(contact).toBeFocused();
      await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
    });
  }
}
