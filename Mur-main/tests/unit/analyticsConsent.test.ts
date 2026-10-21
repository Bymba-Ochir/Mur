import { beforeEach, describe, it, expect } from 'vitest';
import {
  getConsentStatus,
  setConsentStatus,
  analyticsBeforeSend,
  speedInsightsBeforeSend,
} from '../../lib/analyticsConsent';

// localStorage jsdom-д байдаг тул тест бүрийн өмнө цэвэрлэнэ
beforeEach(() => {
  localStorage.clear();
});

describe('getConsentStatus / setConsentStatus', () => {
  it('шинэ хэрэглэгчид null буцаана (зөвшөөрөл тодорхойгүй)', () => {
    expect(getConsentStatus()).toBeNull();
  });

  it('accepted хадгалаад буцаана', () => {
    setConsentStatus('accepted');
    expect(getConsentStatus()).toBe('accepted');
  });

  it('declined хадгалаад буцаана', () => {
    setConsentStatus('declined');
    expect(getConsentStatus()).toBe('declined');
  });

  it('хуучирсан/танигдахгүй утга null гэж тооцогдоно', () => {
    localStorage.setItem('mur-analytics-consent', 'garbage');
    expect(getConsentStatus()).toBeNull();
  });
});

describe('analyticsBeforeSend', () => {
  const event = { type: 'pageview', url: '/listings' } as const;

  it('зөвшөөрөлгүй үед event хаяна (null)', () => {
    expect(analyticsBeforeSend(event)).toBeNull();
  });

  it('зөвшөөрөл өгсөн үед event дамжуулна', () => {
    setConsentStatus('accepted');
    expect(analyticsBeforeSend(event)).toBe(event);
  });

  it('татгалзсан үед event хаяна', () => {
    setConsentStatus('declined');
    expect(analyticsBeforeSend(event)).toBeNull();
  });
});

describe('speedInsightsBeforeSend', () => {
  const event = { type: 'vital', url: '/listings' } as const;

  it('зөвшөөрөлгүй үед event хаяна', () => {
    expect(speedInsightsBeforeSend(event)).toBeNull();
  });

  it('зөвшөөрөл өгсөн үед event дамжуулна', () => {
    setConsentStatus('accepted');
    expect(speedInsightsBeforeSend(event)).toBe(event);
  });
});
