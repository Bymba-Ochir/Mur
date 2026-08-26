'use client';
import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import { useLanguage } from '../lib/i18n';
import { PawPrint } from 'lucide-react';

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t } = useLanguage();

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-[55vh] flex-col items-center justify-center px-5 py-20 text-center">
      <PawPrint className="mb-3 text-[var(--primary)]" size={42} aria-hidden="true" />
      <h1 className="mb-2.5 font-[family-name:var(--font-display)] text-[22px] text-[var(--primary)]">{t('err_title')}</h1>
      <p className="mb-6 max-w-[420px] text-[14.5px] text-[var(--muted)]">{t('err_desc')}</p>
      <button onClick={reset} className="cursor-pointer rounded-[var(--r-pill)] border-0 bg-[var(--brand)] px-5 py-[11px] text-sm font-semibold text-white hover:bg-[var(--primary-light)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]">{t('err_retry')}</button>
    </div>
  );
}
