'use client';
import { useEffect, useState } from 'react';
import { useLanguage } from '../lib/i18n';
import { getConsentStatus, setConsentStatus } from '../lib/analyticsConsent';

// Апп cookie хэрэглэдэггүй тул энэ нь "cookie" баннер биш — зөвхөн нэргүй
// статистик (Vercel Analytics/Speed Insights) цуглуулдгийг мэдэгдэх,
// хэрэглэгчид зөвшөөрөх/татгалзах боломж өгөх хөнгөн мэдэгдэл юм.
export default function AnalyticsNotice() {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Зөвшөөрөл хараахан шийдэгдээгүй (null) үед л баннер харуулна
    if (getConsentStatus() === null) setVisible(true);
  }, []);

  function choose(status: 'accepted' | 'declined') {
    setConsentStatus(status);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="analytics-notice" role="region" aria-label={t('consent_text')}>
      <p>
        {t('consent_text')}{' '}
        <a href="/privacy">{t('footer_privacy')}</a>
      </p>
      <div className="analytics-actions">
        <button onClick={() => choose('accepted')} className="accept">{t('consent_accept')}</button>
        <button onClick={() => choose('declined')} className="decline">{t('consent_decline')}</button>
      </div>

      <style jsx>{`
        .analytics-notice {
          position: fixed; bottom: 0; left: 0; right: 0; z-index: 145;
          display: flex; align-items: center; justify-content: center; gap: var(--sp-4);
          flex-wrap: wrap;
          background: var(--card); color: var(--ink);
          border-top: 1px solid var(--line);
          box-shadow: var(--shadow-lift);
          padding: var(--sp-3) var(--sp-4);
          font-size: 13.5px;
        }
        @media (max-width: 640px) {
          .analytics-notice { bottom: 58px; }
        }
        .analytics-notice p { margin: 0; line-height: 1.4; }
        .analytics-notice a { color: var(--accent); font-weight: 600; }
        .analytics-actions { display: flex; gap: var(--sp-2); }
        .analytics-actions button {
          border: none; border-radius: var(--r-sm); padding: 8px 14px;
          font-weight: 600; font-size: 13px; cursor: pointer;
        }
        .accept { background: var(--brand); color: #fff; }
        .decline { background: transparent; color: var(--muted); border: 1px solid var(--line); }
      `}</style>
    </div>
  );
}
