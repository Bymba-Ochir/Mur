import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('Tailwind CSS cascade layer', () => {
  const css = readFileSync(resolve(process.cwd(), 'app/globals.css'), 'utf8');

  it('legacy global styles are inside a lower-priority layer', () => {
    const layerStart = css.indexOf('@layer components {');
    const reset = css.indexOf('* { box-sizing: border-box; margin: 0; padding: 0; }');
    const layerEnd = css.lastIndexOf('}');

    expect(layerStart).toBeGreaterThan(-1);
    expect(reset).toBeGreaterThan(layerStart);
    expect(layerEnd).toBeGreaterThan(reset);
  });

  it('Tailwind utilities remain in the highest declared layer', () => {
    expect(css).toContain('@layer theme, base, components, utilities;');
    expect(css).toContain("@import 'tailwindcss/utilities.css' layer(utilities);");
  });
});
