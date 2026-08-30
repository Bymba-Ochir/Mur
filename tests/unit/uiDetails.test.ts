import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('page detail safeguards', () => {
  it('highlights nested navigation routes', () => {
    const navbar = source('components/Navbar.tsx');
    expect(navbar).toContain('pathname.startsWith(`${href}/`)');
    expect(navbar).toContain('aria-current');
  });

  it('keeps primary navigation available at medium desktop widths', () => {
    const navbar = source('components/Navbar.tsx');
    expect(navbar).toContain('@media (min-width: 1041px) and (max-width: 1180px)');
    expect(navbar).not.toContain('@media (max-width: 1180px) {\n          .nav-links { display: none; }');
    expect(navbar).not.toContain('<header className="navbar">');
  });

  it('mobile navigation has modal close and focus containment', () => {
    const navbar = source('components/Navbar.tsx');
    expect(navbar).toContain('mobileCloseButtonRef');
    expect(navbar).toContain('keepFocusInside');
    expect(navbar).toContain('className="mobile-backdrop"');
    expect(navbar).toContain('aria-modal="true"');
  });

  it('home and footer define stable mobile grids', () => {
    const home = source('app/page.tsx');
    const footer = source('components/Footer.tsx');
    expect(home).toContain('@media (max-width: 720px)');
    expect(home).toContain('grid-template-columns: repeat(3, minmax(0, 1fr))');
    expect(footer).toContain('grid-template-columns: repeat(2, minmax(0, 1fr))');
  });

  it('detail pages provide retry and back actions', () => {
    for (const path of [
      'app/pets/[id]/PetDetailClient.tsx',
      'app/adoptions/[id]/AdoptionDetailClient.tsx',
      'app/sitting/[id]/SittingDetailClient.tsx',
      'app/profiles/adoption/[id]/AdoptionProfileClient.tsx',
      'app/profiles/mypet/[id]/MyPetProfileClient.tsx',
    ]) {
      const detail = source(path);
      expect(detail).toContain('state-panel--error');
      expect(detail).toContain('Дахин оролдох');
      expect(detail).toMatch(/буцах|Буцах/);
    }
  });

  it('message detail does not redirect while rendering', () => {
    const message = source('app/messages/[id]/MessageThreadClient.tsx');
    expect(message).not.toContain("router.push('/');");
    expect(message).toContain('Icon name="lock"');
  });
});
