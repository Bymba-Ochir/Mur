// lib/analyticsConsent.ts
// Аналитикийн зөвшөөрөл. Апп cookie тавьдаггүй (Vercel Analytics/Speed Insights
// нь cookie-гүй, нэргүй ажилладаг) тул сонголтыг localStorage-д хадгална.
// beforeSend handler-ууд нь зөвшөөрөл өгөөгүй үед event-үүдийг хаяж,
// дата цуглуулалтыг хэрэглэгчийн сонголтод холбоно.
import type { BeforeSendEvent } from '@vercel/analytics';
import type { BeforeSendMiddleware } from '@vercel/speed-insights';
import { setLocalStorageValue } from './useLocalStorageState';

const CONSENT_KEY = 'mur-analytics-consent';

export type ConsentStatus = 'accepted' | 'declined' | null;

export function getConsentStatus(): ConsentStatus {
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    if (v === 'accepted' || v === 'declined') return v;
  } catch {
    // localStorage байхгүй/хориотой үед зөвшөөрөл тодорхойгүй гэж үзнэ
  }
  return null;
}

// setLocalStorageValue-р бичвэл useSyncExternalStore-ийн listener-үүд ч
// шинэчлэгдэнэ (AnalyticsNotice-ийн баннер шууд нуугдана)
export function setConsentStatus(status: 'accepted' | 'declined'): void {
  setLocalStorageValue(CONSENT_KEY, status);
}

function hasConsent(): boolean {
  return getConsentStatus() === 'accepted';
}

/** Vercel Analytics-ийн pageview/event-үүдийг зөвшөөрөл өгсөн үед л дамжуулна */
export function analyticsBeforeSend(event: BeforeSendEvent): BeforeSendEvent | null {
  return hasConsent() ? event : null;
}

/** Vercel Speed Insights-ийн web-vital event-үүдийг зөвшөөрөл өгсөн үед л дамжуулна */
export const speedInsightsBeforeSend: BeforeSendMiddleware = (event) => {
  return hasConsent() ? event : null;
};
