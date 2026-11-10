'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '../lib/i18n';
import BrandLogo from './ui/BrandLogo';
import DonateButton, { type BankTransfer } from './DonateButton';

export default function Footer({ donationsEnabled = false, bankTransfer }: { donationsEnabled?: boolean; bankTransfer?: BankTransfer }) {
  const { t } = useLanguage();
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <BrandLogo />
          <p className="footer-tagline">{t('footer_tagline')}</p>
          {(bankTransfer || donationsEnabled) && <div className="footer-support"><DonateButton bankTransfer={bankTransfer} /></div>}
        </div>
        <nav className="footer-links" aria-label={t('footer_nav_label')}>
          <Link href="/listings" aria-current={isActive('/listings') ? 'page' : undefined}>{t('nav_listings')}</Link>
          <Link href="/adoptions" aria-current={isActive('/adoptions') ? 'page' : undefined}>{t('nav_adoptions')}</Link>
          <Link href="/sitting" aria-current={isActive('/sitting') ? 'page' : undefined}>{t('nav_sitting')}</Link>
          <Link href="/clinics" aria-current={isActive('/clinics') ? 'page' : undefined}>{t('health_tab_clinics')}</Link>
          <Link href="/privacy" aria-current={isActive('/privacy') ? 'page' : undefined}>{t('footer_privacy')}</Link>
          <Link href="/terms" aria-current={isActive('/terms') ? 'page' : undefined}>{t('footer_terms')}</Link>
        </nav>
      </div>
      <p className="footer-rights" suppressHydrationWarning>© {new Date().getFullYear()} МӨР · {t('footer_rights')}</p>

      <style jsx>{`
        .footer {
          margin-top: 0;
          background: var(--surface-1);
          border-top: 1px solid var(--border-subtle);
          padding: var(--sp-6) var(--sp-5) calc(var(--sp-5) + var(--safe-bottom));
          color: var(--text-secondary);
        }
        @media (max-width: 640px) {
          .footer { padding: var(--sp-5) var(--sp-3) calc(var(--sp-5) + var(--safe-bottom)); }
        }
        @media (min-width: 1025px) {
          .footer { margin-top: 0; padding: var(--sp-7) var(--sp-5) calc(var(--sp-6) + var(--safe-bottom)); }
        }
        .footer-inner {
          max-width: 980px; margin: 0 auto;
          display: flex; justify-content: space-between; align-items: flex-start; gap: var(--sp-4);
          flex-wrap: wrap;
        }
        @media (min-width: 1025px) {
          .footer-inner { max-width: 1040px; gap: var(--sp-6); }
        }
        .footer-brand { --brand-logo-size: 36px; max-width: 340px; }
        .footer-support { margin-top: var(--sp-2); }
        .footer-tagline {
          font-size: 13px; color: var(--text-tertiary); margin-top: 4px;
          line-height: 1.6; max-width: 340px;
        }
        @media (min-width: 1025px) {
          .footer-tagline { font-size: 13.5px; max-width: 380px; }
        }
        .footer-links { display: grid; grid-template-columns: repeat(3, max-content); gap: var(--sp-2) var(--sp-5); align-items: center; justify-content:end; max-width:540px; }
        @media (min-width: 1025px) {
          .footer-links { gap: var(--sp-6); }
        }
        .footer-links :global(a) {
          color: var(--text-secondary); text-decoration: none;
          font-size: 13.5px; font-weight: 500;
          min-height: 36px; display: inline-flex; align-items: center;
          transition: color 0.15s ease, background 0.15s ease;
        }
        @media (min-width: 1025px) {
          .footer-links :global(a) { font-size: 14px; }
        }
        .footer-links :global(a:hover) { color: var(--text-primary); }
        .footer-links :global(a:active) { color: var(--primary-dark); }
        .footer-links :global(a[aria-current='page']) { color: var(--primary); font-weight: 650; }
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
        @media (max-width:640px) {
          .footer-inner { flex-direction:column; }
          .footer-links { width: 100%; grid-template-columns: repeat(2, minmax(0, 1fr)); justify-content:stretch; max-width:none; gap: var(--sp-1) var(--sp-3); }
          .footer-links :global(a) { min-height: var(--touch-target); padding: 4px 0; }
          .footer-rights { line-height: 1.5; }
        }
      `}</style>
    </footer>
  );
}
