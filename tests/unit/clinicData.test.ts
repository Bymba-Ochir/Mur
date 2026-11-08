import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { VET_CLINICS } from '../../lib/vetClinics';
import { CLINIC_AREAS, findNearestClinics, isMappedClinic, searchClinics } from '../../lib/clinicService';

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('veterinary clinic directory', () => {
  it('finds services and formatted phone numbers while respecting filters', () => {
    expect(searchClinics({ query: 'Рентген' }).map((c) => c.id)).toContain('enerekh-vet');
    expect(searchClinics({ query: '9590-9987' }).map((c) => c.id)).toContain('enerekh-vet');
    expect(searchClinics({ query: '95909987', district: 'Баянзүрх' })).toHaveLength(0);
  });
  it('keeps every clinic traceable and directly contactable', () => {
    expect(VET_CLINICS.filter(isMappedClinic).length).toBeGreaterThanOrEqual(6);
    expect(new Set(VET_CLINICS.map((clinic) => clinic.id)).size).toBe(VET_CLINICS.length);

    for (const clinic of VET_CLINICS) {
      expect(clinic.name.trim()).not.toBe('');
      expect(clinic.address.trim()).not.toBe('');
      expect(clinic.phone).toMatch(/^\d{8}$/);
      expect(clinic.phones?.length).toBeGreaterThan(0);
      expect(clinic.phones).toContain(clinic.phone);
      expect(clinic.phones?.every((phone) => /^\d{8}$/.test(phone))).toBe(true);
      if (isMappedClinic(clinic)) {
        expect(clinic.mapUrl).toMatch(/^https:\/\/www\.google\.com\/maps\/place\//);
        expect(clinic.verifiedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      } else {
        expect(clinic.source).toMatchObject({ publishedAt: '2026-08-17', url: 'https://aztaisavar.mn/mn' });
        expect(clinic).not.toHaveProperty('lat');
        expect(clinic).not.toHaveProperty('lng');
        expect(clinic.serviceDetailsVerified).toBe(false);
      }
    }
  });

  it('finds city and regional clinics while excluding unpinned clinics from distance calculations', () => {
    expect(CLINIC_AREAS).toEqual(expect.arrayContaining(['Улаанбаатар', 'Дархан-Уул', 'Ховд']));
    expect(searchClinics({ district: 'Улаанбаатар' }).map((clinic) => clinic.id)).toContain('city-paws');
    expect(searchClinics({ district: 'Улаанбаатар' }).map((clinic) => clinic.id)).not.toContain('vetmon');
    expect(searchClinics({ district: 'Дархан-Уул', service: 'Цусны шинжилгээ' }).map((clinic) => clinic.id)).toEqual(['vetmon']);
    expect(searchClinics({ query: '9953-9357' }).map((clinic) => clinic.id)).toEqual(['khovd-pet-clinic']);
    expect(searchClinics({ query: '76001950' }).map((clinic) => clinic.id)).toEqual(['sos-pet-care']);
    expect(findNearestClinics(47.9184, 106.9177, searchClinics({ district: 'Дархан-Уул' }))).toEqual([]);
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
