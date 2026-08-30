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

  it('listings keeps explicit filter labels and stable responsive grids', () => {
    const listings = source('app/listings/page.tsx');
    expect(listings).toContain('listings_search_label');
    expect(listings).toContain('aria-labelledby="listings-filters-heading"');
    expect(listings).toContain('grid-template-columns: repeat(3, minmax(0, 1fr))');
    expect(listings).toContain('@media (max-width: 900px)');
    expect(listings).toContain('@media (max-width: 600px)');
    expect(listings).not.toContain('style={{ flex:');
  });

  it('listing cards expose separate phone and detail controls', () => {
    const card = source('components/PetCardView.tsx');
    const listingCard = source('components/PetCard.tsx');
    expect(card).toContain('className="card-actions"');
    expect(card).toContain('className="detail-link"');
    expect(listingCard).not.toContain('role="link"');
    expect(listingCard).not.toContain('tabIndex={0}');
  });

  it('lost and found detail uses semantic sections and a stable mobile breakpoint', () => {
    const detail = source('app/pets/[id]/PetDetailClient.tsx');
    expect(detail).toContain('className="pet-facts"');
    expect(detail).toContain('className="contact-block"');
    expect(detail).toContain('className="owner-panel"');
    expect(detail).toContain('@media (max-width: 900px)');
    expect(detail).not.toContain('style={{');
  });

  it('pet detail shared controls are accessible and avoid inline layout styles', () => {
    const gallery = source('components/PetImageGallery.tsx');
    const editForm = source('components/PetEditForm.tsx');
    const sightings = source('components/SightingsList.tsx');
    expect(gallery).toContain('role="group"');
    expect(gallery).toContain('detail_gallery_previous');
    expect(gallery).not.toContain('>‹</button>');
    expect(editForm).toContain('<form className="edit-form"');
    expect(editForm).toContain('aria-invalid');
    expect(sightings).toContain('aria-controls="sighting-form"');
    expect(sightings).not.toContain('style={{');
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
      expect(detail).toMatch(/Дахин оролдох|err_retry/);
      expect(detail).toMatch(/буцах|Буцах|detail_back_listings/);
    }
  });

  it('message detail does not redirect while rendering', () => {
    const message = source('app/messages/[id]/MessageThreadClient.tsx');
    expect(message).not.toContain("router.push('/');");
    expect(message).toContain('Icon name="lock"');
  });

  it('lost and found report forms use semantic steps and inline validation', () => {
    const form = source('components/PetForm.tsx');
    const lost = source('app/report-lost/page.tsx');
    const found = source('app/report-found/page.tsx');
    expect(form).toContain('<fieldset className="form-step">');
    expect(form).toContain('aria-invalid={Boolean(fieldErrors.color)}');
    expect(form).toContain('aria-invalid={Boolean(fieldErrors.place)}');
    expect(form).toContain('aria-invalid={Boolean(fieldErrors.phone)}');
    expect(form).toContain('@media (max-width: 900px)');
    expect(form).not.toContain('style={{');
    expect(form).not.toMatch(/⏳|📍|🎁/);
    expect(lost).toContain('<p className="eyebrow">');
    expect(found).toContain('<p className="eyebrow">');
  });

  it('report form status messages are localized and reusable', () => {
    const hook = source('lib/usePetForm.ts');
    expect(hook).toContain("t('photo_optimizing')");
    expect(hook).toContain("t('location_failed')");
    expect(hook).toContain("t('form_generic_error')");
    expect(hook).not.toContain("'Алдаа гарлаа. Дахин оролдоно уу.'");
  });
});
