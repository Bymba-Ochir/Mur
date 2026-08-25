'use client';
import { useLanguage } from '../lib/i18n';
import { setConsentStatus } from '../lib/analyticsConsent';
import { useLocalStorageValue } from '../lib/useLocalStorageState';

export default function AnalyticsNotice() {
  const { t } = useLanguage();
  const consent = useLocalStorageValue('mur-analytics-consent', 'declined');
  if (consent !== null) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-[145] flex flex-wrap items-center justify-center gap-[var(--sp-4)] border-t border-[var(--line)] bg-[var(--card)] px-[var(--sp-4)] py-[var(--sp-3)] text-[13.5px] text-[var(--ink)] shadow-[var(--shadow-lift)] max-sm:bottom-[58px]" role="region" aria-label={t('consent_text')}>
      <p className="m-0 leading-[1.4]">{t('consent_text')} <a className="font-semibold text-[var(--accent)]" href="/privacy">{t('footer_privacy')}</a></p>
      <div className="flex gap-[var(--sp-2)]">
        <button onClick={() => setConsentStatus('accepted')} className="cursor-pointer rounded-[var(--r-sm)] border-0 bg-[var(--brand)] px-3.5 py-2 text-[13px] font-semibold text-[var(--text-on-accent)]">{t('consent_accept')}</button>
        <button onClick={() => setConsentStatus('declined')} className="cursor-pointer rounded-[var(--r-sm)] border border-[var(--line)] bg-transparent px-3.5 py-2 text-[13px] font-semibold text-[var(--muted)]">{t('consent_decline')}</button>
      </div>
    </div>
  );
}
