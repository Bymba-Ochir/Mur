import { chromium } from 'playwright';
import fs from 'fs';
const base = 'http://localhost:3000';
const out = './ui-checks';
fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const pages = [
  ['/', 'home'],
  ['/sitting', 'sitting-list'],
  ['/sitting/new', 'sitting-form'],
  ['/clinics', 'clinics'],
  ['/adoptions', 'adoptions-list'],
  ['/adoptions/5bac1395-c87b-4ee1-84e4-b3b65d3a7772', 'adoption-detail'],
  ['/pets/53851da3-30ac-4b5f-8a2a-11fa86242875', 'pet-detail'],
  ['/report-lost', 'report-lost'],
  ['/assistant', 'assistant'],
  ['/listings', 'listings'],
];
for (const [path, name] of pages) {
  const page = await ctx.newPage();
  try {
    await page.goto(base + path, { waitUntil: 'networkidle', timeout: 25000 });
    await page.waitForTimeout(1500);
  } catch { /* timeout ok for partial load */ }
  await page.screenshot({ path: `${out}/${name}.png`, fullPage: true });
  console.log(`${name}.png done`);
  await page.close();
}
await browser.close();
console.log('ALL DONE');
