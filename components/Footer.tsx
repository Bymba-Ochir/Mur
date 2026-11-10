'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage, type TranslationKey } from '../lib/i18n';
import BrandLogo from './ui/BrandLogo';
import DonateButton, { type BankTransfer } from './DonateButton';

const footerGroups: { title: TranslationKey; links: { href: string; label: TranslationKey }[] }[] = [
  { title: 'footer_listings_heading', links: [
    { href: '/listings', label: 'nav_listings' },
    { href: '/report-lost', label: 'nav_lost' },
    { href: '/report-found', label: 'nav_found' },
  ] },
  { title: 'nav_services', links: [
    { href: '/adoptions', label: 'nav_adoptions' },
    { href: '/sitting', label: 'nav_sitting' },
    { href: '/clinics', label: 'health_tab_clinics' },
  ] },
  { title: 'footer_info_heading', links: [
    { href: '/privacy', label: 'footer_privacy' },
    { href: '/terms', label: 'footer_terms' },
  ] },
];

export default function Footer({ donationsEnabled = false, bankTransfer }: { donationsEnabled?: boolean; bankTransfer?: BankTransfer }) {
  const { t } = useLanguage();
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <Link href="/" className="footer-home" aria-label={t('brand_home_label')}><BrandLogo /></Link>
          <p className="footer-tagline">{t('footer_tagline')}</p>
          {(bankTransfer || donationsEnabled) && <div className="footer-support"><DonateButton bankTransfer={bankTransfer} /></div>}
        </div>
        <nav className="footer-links" aria-label={t('footer_nav_label')}>
          {footerGroups.map((group) => (
            <div key={group.title} className="footer-group">
              <p className="footer-group-title">{t(group.title)}</p>
              <ul>
                {group.links.map(({ href, label }) => (
                  <li key={href}><Link href={href} aria-current={isActive(href) ? 'page' : undefined}>{t(label)}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
      <p className="footer-rights" suppressHydrationWarning>© {new Date().getFullYear()} МӨР · {t('footer_rights')}</p>

      <style jsx>{`
        .footer {
          padding: var(--sp-6) var(--sp-4) calc(var(--sp-4) + var(--safe-bottom));
          color: var(--text-secondary);
          background: var(--surface-1);
          border-top: 1px solid var(--border-subtle);
        }
        .footer-inner {
          display: grid;
          grid-template-columns: minmax(12rem, 1fr) minmax(0, 2fr);
          align-items: start;
          gap: clamp(20px, 5vw, 72px);
          max-width: var(--container-xl);
          margin-inline: auto;
        }
        .footer-brand { --brand-logo-size: 34px; }
        .footer-home :global(.mur-logo) { display: inline-flex; }
        .footer-tagline { max-width: 30ch; margin-top: 8px; font-size: var(--text-sm); line-height: 1.6; }
        .footer-support { margin-top: var(--sp-3); }
        .footer-links { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--sp-4); }
        .footer-group-title { margin: 0 0 6px; color: var(--text-primary); font-size: var(--text-sm); font-weight: 700; }
        .footer-group ul { list-style: none; padding: 0; margin: 0; }
        .footer-links :global(a) {
          display: inline-flex;
          align-items: center;
          min-height: 38px;
          color: var(--text-secondary);
          font-size: var(--text-sm);
          line-height: 1.4;
          text-decoration: none;
        }
        .footer-links :global(a:hover) { color: var(--text-primary); text-decoration: underline; }
        .footer-links :global(a[aria-current='page']) { color: var(--primary); font-weight: 650; }
        .footer :global(a:focus-visible) { outline: 2px solid var(--border-focus); outline-offset: 2px; border-radius: 4px; }
        .footer-rights {
          max-width: var(--container-xl);
          margin: var(--sp-5) auto 0;
          padding-top: var(--sp-3);
          color: var(--text-secondary);
          border-top: 1px solid var(--border-subtle);
          font-size: var(--text-xs);
          line-height: 1.5;
        }
        @media (max-width: 760px) {
          .footer { padding-top: var(--sp-5); }
          .footer-inner { grid-template-columns: 1fr; }
          .footer-links :global(a) { min-height: var(--touch-target); }
        }
        @media (max-width: 420px) {
          .footer-links { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
      `}</style>
    </footer>
  );
}
