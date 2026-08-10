'use client';
import Link from 'next/link';
import { useLanguage } from '../lib/i18n';

export default function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <span className="footer-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" width="16" height="16" aria-hidden="true" focusable="false">
              <path d="M12 21c-3.5-3-8-6.2-8-10.4C4 7.2 6.4 5 9.2 5c1.2 0 2.3.5 3 1.3.7-.8 1.8-1.3 3-1.3 2.8 0 5.2 2.2 5.2 5.6 0 4.2-4.5 7.4-8 10.4z" fill="#FFFFFF" />
            </svg>
          </span>
          <div>
            <span className="footer-name">МӨР</span>
            <p className="footer-tagline">{t('footer_tagline')}</p>
          </div>
        </div>
        <nav className="footer-links" aria-label="Хууль эрх зүйн холбоосууд">
          <Link href="/privacy">{t('footer_privacy')}</Link>
          <Link href="/terms">{t('footer_terms')}</Link>
        </nav>
      </div>
      <p className="footer-rights" suppressHydrationWarning>© {new Date().getFullYear()} МӨР · {t('footer_rights')}</p>

      <style jsx>{`
        .footer {
          margin-top: var(--sp-8);
          background: var(--surface-1);
          border-top: 1px solid var(--border-subtle);
          padding: var(--sp-6) var(--sp-5) var(--sp-5);
          color: var(--text-secondary);
        }
        @media (max-width: 640px) {
          .footer { padding-bottom: calc(58px + var(--sp-4)); }
        }
        @media (min-width: 1025px) {
          .footer { margin-top: var(--sp-8); padding: var(--sp-7) var(--sp-5) var(--sp-6); }
        }
        .footer-inner {
          max-width: 980px; margin: 0 auto;
          display: flex; justify-content: space-between; align-items: flex-start; gap: var(--sp-4);
          flex-wrap: wrap;
        }
        @media (min-width: 1025px) {
          .footer-inner { max-width: 1040px; gap: var(--sp-6); }
        }
        .footer-brand {
          display: flex; gap: var(--sp-3); max-width: 340px;
        }
        @media (min-width: 1025px) {
          .footer-brand { gap: 14px; }
        }
        .footer-mark {
          width: 34px; height: 34px; border-radius: 9px;
          background: var(--grad-brand);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        @media (min-width: 1025px) {
          .footer-mark { width: 36px; height: 36px; }
        }
        .footer-name {
          font-family: var(--font-display); font-weight: 700;
          font-size: 16px; letter-spacing: -0.01em; color: var(--text-primary);
        }
        @media (min-width: 1025px) {
          .footer-name { font-size: 20px; }
        }
        .footer-tagline {
          font-size: 13px; color: var(--text-tertiary); margin-top: 4px;
          line-height: 1.6; max-width: 340px;
        }
        @media (min-width: 1025px) {
          .footer-tagline { font-size: 13.5px; max-width: 380px; }
        }
        .footer-links { display: flex; gap: var(--sp-4); align-items: center; }
        @media (min-width: 1025px) {
          .footer-links { gap: var(--sp-6); }
        }
        .footer-links :global(a) {
          color: var(--text-secondary); text-decoration: none;
          font-size: 13.5px; font-weight: 500;
          transition: color 0.15s ease;
        }
        @media (min-width: 1025px) {
          .footer-links :global(a) { font-size: 14px; }
        }
        .footer-links :global(a:hover) { color: var(--text-primary); }
        .footer-links :global(a:focus-visible) {
          outline: 2px solid var(--border-focus); outline-offset: 2px; border-radius: 4px;
        }
        .footer-rights {
          max-width: 980px; margin: var(--sp-4) auto 0;
          font-size: 12px; color: var(--text-tertiary);
          padding-top: var(--sp-4); border-top: 1px solid var(--border-subtle);
        }
        @media (min-width: 1025px) {
          .footer-rights { max-width: 1040px; margin: var(--sp-5) auto 0; }
        }
      `}</style>
    </footer>
  );
}
