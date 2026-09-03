'use client';
import { useLanguage } from '../lib/i18n';
import { setConsentStatus } from '../lib/analyticsConsent';
import { useLocalStorageValue } from '../lib/useLocalStorageState';
import Icon from './ui/icons';

// Апп cookie хэрэглэдэггүй тул энэ нь "cookie" баннер биш — зөвхөн нэргүй
// статистик (Vercel Analytics/Speed Insights) цуглуулдгийг мэдэгдэх,
// хэрэглэгчид зөвшөөрөх/татгалзах боломж өгөх хөнгөн мэдэгдэл юм.
export default function AnalyticsNotice() {
  const { t } = useLanguage();
  // localStorage-тэй синхрончлогдсон зөвшөөрөл — useSyncExternalStore.
  // server дээр 'declined' → анхны анивчилтгүй; null (шийдээгүй) үед л харуулна
  const consent = useLocalStorageValue('mur-analytics-consent', 'declined');
  const visible = consent === null;

  function choose(status: 'accepted' | 'declined') {
    setConsentStatus(status);
  }

  if (!visible) return null;

  return (
    <div className="analytics-notice" data-floating-notice="analytics" role="region" aria-label={t('consent_text')}>
      <span className="notice-icon" aria-hidden="true"><Icon name="info" size={19} /></span>
      <p>{t('consent_text')} <a href="/privacy">{t('footer_privacy')}</a></p>
      <div className="analytics-actions">
        <button type="button" onClick={() => choose('accepted')} className="accept">{t('consent_accept')}</button>
        <button type="button" onClick={() => choose('declined')} className="decline">{t('consent_decline')}</button>
      </div>

      <style jsx>{`
        .analytics-notice {
          position: fixed; bottom: calc(var(--sp-3) + var(--safe-bottom)); left: 50%; z-index: 145;
          width: min(760px, calc(100vw - 32px)); transform:translateX(-50%);
          display: grid; grid-template-columns:36px minmax(0,1fr) auto; align-items: center; gap: var(--sp-3);
          background: var(--card); color: var(--ink);
          border: 1px solid var(--line); border-radius:var(--r-lg);
          box-shadow: var(--shadow-lift);
          padding: var(--sp-3) var(--sp-4);
          font-size: 13.5px;
        }
        @media (max-width: 640px) {
          .analytics-notice {
            bottom: calc(var(--sp-2) + var(--safe-bottom));
            width: calc(100vw - 16px);
            grid-template-columns:28px minmax(0,1fr) auto;
            gap:8px;
            padding:9px 10px;
            border-radius:var(--r-md);
            font-size:11.5px;
          }
          .analytics-actions { gap:4px; }
          .analytics-actions button { min-height:36px; padding:6px 9px; font-size:11px; }
          .notice-icon { width:28px; height:28px; }
          .analytics-notice p { line-height:1.35; }
        }
        .notice-icon{display:grid;place-items:center;width:36px;height:36px;color:var(--primary);background:var(--eyebrow-bg);border-radius:var(--r-sm)}
        .analytics-notice p { margin: 0; line-height: 1.4; }
        .analytics-notice a { color: var(--accent); font-weight: 600; }
        .analytics-actions { display: flex; gap: var(--sp-2); }
        .analytics-actions button {
          min-height:var(--touch-target-sm); border: none; border-radius: var(--r-sm); padding: 8px 14px;
          font-weight: 600; font-size: 13px; cursor: pointer;
        }
        .accept { background: var(--brand); color: var(--text-on-accent); }
        .decline { background: transparent; color: var(--muted); border: 1px solid var(--line); }
        .analytics-actions button:focus-visible,.analytics-notice a:focus-visible{outline:2px solid var(--border-focus);outline-offset:2px}
        @media(max-width:380px){
          .analytics-notice{grid-template-columns:26px minmax(0,1fr)}
          .analytics-actions{grid-column:1/-1}
          .analytics-actions button{flex:1}
          .analytics-notice p{display:-webkit-box;overflow:hidden;-webkit-box-orient:vertical;-webkit-line-clamp:3}
        }
      `}</style>
    </div>
  );
}
