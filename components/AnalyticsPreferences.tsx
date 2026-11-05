'use client';

import { useId } from 'react';
import { useLanguage } from '../lib/i18n';
import { setConsentStatus, useAnalyticsConsent } from '../lib/analyticsConsent';
import Button from './ui/Button';

export default function AnalyticsPreferences() {
  const { t } = useLanguage();
  const consent = useAnalyticsConsent();
  const titleId = useId();

  return (
    <section className="analytics-preferences" aria-labelledby={titleId}>
      <h2 id={titleId}>{t('analytics_preferences_title')}</h2>
      <p>{t('analytics_preferences_description')}</p>
      <div className="consent-actions" role="group" aria-labelledby={titleId}>
        <Button size="sm" variant={consent === 'accepted' ? 'primary' : 'ghost'} aria-pressed={consent === 'accepted'} onClick={() => setConsentStatus('accepted')}>
          {t('consent_accept')}
        </Button>
        <Button size="sm" variant={consent === 'declined' ? 'primary' : 'ghost'} aria-pressed={consent === 'declined'} onClick={() => setConsentStatus('declined')}>
          {t('consent_decline')}
        </Button>
      </div>
      <p className="consent-status" role="status">{t(consent === 'accepted' ? 'analytics_preferences_accepted' : consent === 'declined' ? 'analytics_preferences_declined' : 'analytics_preferences_unset')}</p>
      <style jsx>{`
        .analytics-preferences{padding:clamp(22px,4vw,38px);border-top:1px solid var(--border-subtle);background:var(--surface-2)}
        h2{margin:0 0 var(--sp-3);font-size:var(--text-lg)}
        p{margin:0;color:var(--text-secondary);font-size:var(--text-sm);line-height:1.7}
        .consent-actions{display:flex;flex-wrap:wrap;gap:var(--sp-2);margin-top:var(--sp-3)}
        .consent-status{margin-top:var(--sp-3);font-weight:650}
        @media(max-width:560px){.analytics-preferences{padding:var(--sp-4) var(--page-pad,var(--sp-4))}}
      `}</style>
    </section>
  );
}
