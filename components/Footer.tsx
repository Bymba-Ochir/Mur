'use client';
import Link from 'next/link';
import { useLanguage } from '../lib/i18n';

export default function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <span className="footer-mark" aria-hidden="true">М</span>
          <span className="footer-name">МӨР</span>
          <p className="footer-tagline">{t('footer_tagline')}</p>
        </div>
        <nav className="footer-links" aria-label="Хууль эрх зүйн холбоосууд">
          <Link href="/privacy">{t('footer_privacy')}</Link>
          <Link href="/terms">{t('footer_terms')}</Link>
        </nav>
      </div>
      <p className="footer-rights">© {new Date().getFullYear()} МӨР · {t('footer_rights')}</p>

      <style jsx>{`
        .footer {
          margin-top: var(--sp-8);
          background: var(--brand); color: #fff;
          padding: var(--sp-6) var(--sp-5) var(--sp-5);
        }
        @media (max-width: 640px) {
          .footer { padding-bottom: calc(58px + var(--sp-4)); } /* доод навигац дээр давахгүй */
        }
        @media (min-width: 1025px) {
          .footer { margin-top: var(--sp-9); padding: var(--sp-7) var(--sp-5) var(--sp-6); }
        }
        .footer-inner {
          max-width: 980px; margin: 0 auto;
          display: flex; justify-content: space-between; align-items: flex-start; gap: var(--sp-4);
          flex-wrap: wrap;
        }
        @media (min-width: 1025px) {
          .footer-inner { max-width: 1040px; gap: var(--sp-6); }
        }
        .footer-brand { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        @media (min-width: 1025px) {
          .footer-brand { gap: 14px; }
        }
        .footer-mark {
          width: 28px; height: 28px; border-radius: var(--r-sm); background: var(--accent); color: var(--brand);
          display: flex; align-items: center; justify-content: center;
          font-family: var(--font-display); font-weight: 700; font-size: 14px;
        }
        @media (min-width: 1025px) {
          .footer-mark { width: 36px; height: 36px; font-size: 16px; }
        }
        .footer-name { font-family: var(--font-display); font-weight: 700; font-size: 16px; letter-spacing: -0.01em; }
        @media (min-width: 1025px) {
          .footer-name { font-size: 20px; }
        }
        .footer-tagline {
          width: 100%; font-size: 12px; color: #C9DCE2; margin-top: var(--sp-1);
          font-weight: 400; line-height: 1.5; max-width: 320px;
        }
        @media (min-width: 1025px) {
          .footer-tagline { font-size: 13px; max-width: 380px; }
        }
        .footer-links { display: flex; gap: var(--sp-4); align-items: center; }
        @media (min-width: 1025px) {
          .footer-links { gap: var(--sp-6); }
        }
        .footer-links :global(a) {
          color: rgba(255,255,255,0.8); text-decoration: none; font-size: 13px; font-weight: 500;
          transition: color 0.15s ease;
        }
        @media (min-width: 1025px) {
          .footer-links :global(a) { font-size: 14px; }
        }
        .footer-links :global(a:hover) { color: #fff; }
        .footer-links :global(a:focus-visible) { outline: 2px solid #fff; outline-offset: 2px; border-radius: 4px; }
        .footer-rights {
          max-width: 980px; margin: var(--sp-4) auto 0;
          font-size: 11.5px; color: rgba(255,255,255,0.55);
        }
        @media (min-width: 1025px) {
          .footer-rights { max-width: 1040px; margin: var(--sp-5) auto 0; font-size: 12px; }
        }
      `}</style>
    </footer>
  );
}
