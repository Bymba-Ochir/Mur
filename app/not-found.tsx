'use client';
import Link from 'next/link';
import { useLanguage } from '../lib/i18n';

export default function NotFound() {
  const { t } = useLanguage();

  return (
    <div className="flex min-h-[55vh] flex-col items-center justify-center px-5 py-20 text-center">
      <p className="mb-2 font-[family-name:var(--font-mono)] text-[64px] font-bold tracking-[0.05em] text-[var(--accent)]" aria-hidden="true">404</p>
      <h1 className="mb-2.5 font-[family-name:var(--font-display)] text-[22px] text-[var(--primary)]">{t('nf_title')}</h1>
      <p className="mb-6 max-w-[420px] text-[14.5px] text-[var(--muted)]">{t('nf_desc')}</p>
      <Link href="/" className="inline-flex items-center rounded-[var(--r-pill)] bg-[var(--brand)] px-5 py-[11px] text-sm font-semibold text-white no-underline hover:bg-[var(--primary-light)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]">{t('nf_home')}</Link>
    </div>
  );
}
