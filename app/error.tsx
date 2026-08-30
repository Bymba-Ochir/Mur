'use client';
import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import { useLanguage } from '../lib/i18n';
import Icon from '../components/ui/icons';
import Button from '../components/ui/Button';

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t } = useLanguage();

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="ep state-panel state-panel--error">
      <span className="state-panel__icon"><Icon name="alert" size={30} /></span>
      <h1 className="ep-title">{t('err_title')}</h1>
      <p className="ep-desc">{t('err_desc')}</p>
      <Button onClick={reset} variant="primary">{t('err_retry')}</Button>

      <style jsx>{`
        .ep {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          text-align: center; padding: 80px 20px; min-height: 55vh;
        }
        .ep-title { font-family: var(--font-display); font-size: 22px; color: var(--primary); margin: 0 0 10px; }
        .ep-desc { color: var(--muted); font-size: 14.5px; margin: 0 0 24px; max-width: 420px; }
      `}</style>
    </div>
  );
}
