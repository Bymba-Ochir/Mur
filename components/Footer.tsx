'use client';
import Link from 'next/link';
import { useLanguage } from '../lib/i18n';

const LINK = 'rounded text-[13.5px] font-medium text-[var(--text-secondary)] no-underline transition-colors duration-150 hover:text-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--border-focus)] min-[1025px]:text-sm';

export default function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="mt-[var(--sp-8)] border-t border-[var(--border-subtle)] bg-[var(--surface-1)] px-[var(--sp-5)] pb-[var(--sp-5)] pt-[var(--sp-6)] text-[var(--text-secondary)] max-sm:pb-[calc(58px+var(--sp-4))] min-[1025px]:pb-[var(--sp-6)] min-[1025px]:pt-[var(--sp-7)]">
      <div className="mx-auto flex max-w-[980px] flex-wrap items-start justify-between gap-[var(--sp-4)] min-[1025px]:max-w-[1040px] min-[1025px]:gap-[var(--sp-6)]">
        <div className="flex max-w-[340px] gap-[var(--sp-3)] min-[1025px]:gap-3.5">
          <span className="flex size-[34px] shrink-0 items-center justify-center rounded-[9px] bg-[image:var(--grad-brand)] min-[1025px]:size-9" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" width="16" height="16" aria-hidden="true"><path d="M12 21c-3.5-3-8-6.2-8-10.4C4 7.2 6.4 5 9.2 5c1.2 0 2.3.5 3 1.3.7-.8 1.8-1.3 3-1.3 2.8 0 5.2 2.2 5.2 5.6 0 4.2-4.5 7.4-8 10.4z" fill="#FFFFFF" /></svg>
          </span>
          <div>
            <span className="font-[family-name:var(--font-display)] text-base font-bold tracking-[-0.01em] text-[var(--text-primary)] min-[1025px]:text-xl">МӨР</span>
            <p className="mt-1 max-w-[340px] text-[13px] leading-[1.6] text-[var(--text-tertiary)] min-[1025px]:max-w-[380px] min-[1025px]:text-[13.5px]">{t('footer_tagline')}</p>
          </div>
        </div>
        <nav className="flex items-center gap-[var(--sp-4)] min-[1025px]:gap-[var(--sp-6)]" aria-label="Хууль эрх зүйн холбоосууд"><Link className={LINK} href="/privacy">{t('footer_privacy')}</Link><Link className={LINK} href="/terms">{t('footer_terms')}</Link></nav>
      </div>
      <p className="mx-auto mt-[var(--sp-4)] max-w-[980px] border-t border-[var(--border-subtle)] pt-[var(--sp-4)] text-xs text-[var(--text-tertiary)] min-[1025px]:mt-[var(--sp-5)] min-[1025px]:max-w-[1040px]" suppressHydrationWarning>© {new Date().getFullYear()} МӨР · {t('footer_rights')}</p>
    </footer>
  );
}
