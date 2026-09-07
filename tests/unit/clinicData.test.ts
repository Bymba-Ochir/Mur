import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { VET_CLINICS } from '../../lib/vetClinics';
import { searchClinics } from '../../lib/clinicService';

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('verified veterinary clinic data', () => {
  it('finds services and formatted phone numbers while respecting filters', () => {
    expect(searchClinics({ query: 'Рентген' }).map((c) => c.id)).toContain('enerekh-vet');
    expect(searchClinics({ query: '9590-9987' }).map((c) => c.id)).toContain('enerekh-vet');
    expect(searchClinics({ query: '95909987', district: 'Баянзүрх' })).toHaveLength(0);
  });
  it('keeps every clinic traceable and directly contactable', () => {
    expect(VET_CLINICS.length).toBeGreaterThanOrEqual(6);

    for (const clinic of VET_CLINICS) {
      expect(clinic.name.trim()).not.toBe('');
      expect(clinic.address.trim()).not.toBe('');
      expect(clinic.phone).toMatch(/^\d{8}$/);
      expect(clinic.phones?.length).toBeGreaterThan(0);
      expect(clinic.mapUrl).toMatch(/^https:\/\/www\.google\.com\/maps\/place\//);
      expect(clinic.verifiedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('only marks documented detailed services as verified', () => {
    const enerekh = VET_CLINICS.find((clinic) => clinic.id === 'enerekh-vet');
    expect(enerekh?.serviceDetailsVerified).toBe(true);
    expect(enerekh?.services).toEqual(expect.arrayContaining(['Рентген', 'ЭХО', 'Цусны шинжилгээ']));

    for (const id of ['animals-healthy', 'jargal-vet', 'ochir-vet']) {
      const clinic = VET_CLINICS.find((item) => item.id === id);
      expect(clinic?.serviceDetailsVerified).toBe(false);
      expect(clinic?.services).not.toContain('Рентген');
    }
  });

  it('shows phone and source links without a reveal interaction', () => {
    const card = source('components/ClinicCard.tsx');
    const list = source('components/VetClinicList.tsx');

    expect(card).toContain('className="phone-list"');
    expect(card).toContain('href={`tel:${phone}`}');
    expect(card).toContain('href={clinic.mapUrl}');
    expect(card).toContain('href={clinic.websiteUrl}');
    expect(card).not.toMatch(/revealPhone|showPhone|setShowPhone/);
    expect(list).toContain("'Рентген'");
    expect(list).toContain("'ЭХО'");
    expect(list).toContain("'Цусны шинжилгээ'");
  });
});
