import { test as base, expect } from '@playwright/test';

// CI uses a deterministic image instead of downloading public map tiles.
const tile = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aK1cAAAAASUVORK5CYII=', 'base64');

export const test = base.extend({
  page: async ({ page, context }, runPage) => {
    const obsoleteRequests: string[] = [];
    await context.route('https://tile.openstreetmap.org/**', route => route.fulfill({ contentType: 'image/png', body: tile }));
    await context.route('**/*.basemaps.cartocdn.com/**', route => {
      obsoleteRequests.push(route.request().url());
      return route.abort();
    });
    await runPage(page);
    expect(obsoleteRequests, 'Maps must not request the obsolete keyless provider').toEqual([]);
  },
});

export { expect };
