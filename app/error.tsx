'use client';
import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import { useLanguage } from '../lib/i18n';

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t } = useLanguage();

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="ep">
      <p className="ep-icon" aria-hidden="true">🐾</p>
      <h1 className="ep-title">{t('err_title')}</h1>
      <p className="ep-desc">{t('err_desc')}</p>
      <button onClick={reset} className="ep-retry">{t('err_retry')}</button>

      <style jsx>{`
        .ep {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          text-align: center; padding: 80px 20px; min-height: 55vh;
        }
        .ep-icon { font-size: 48px; margin: 0 0 12px; }
        .ep-title { font-family: var(--font-display); font-size: 22px; color: var(--primary); margin: 0 0 10px; }
        .ep-desc { color: var(--muted); font-size: 14.5px; margin: 0 0 24px; max-width: 420px; }
        .ep-retry {
          padding: 11px 20px; background: var(--brand); color: #fff;
          border: none; border-radius: var(--r-pill); font-weight: 600; font-size: 14px; cursor: pointer;
        }
        .ep-retry:hover { background: var(--primary-light); }
        .ep-retry:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
      `}</style>
    </div>
  );
}
