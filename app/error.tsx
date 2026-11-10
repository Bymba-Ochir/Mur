'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import { useLanguage } from '../lib/i18n';
import Button from '../components/ui/Button';
import styles from './recovery.module.css';

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t } = useLanguage();

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <section className={styles.panel} aria-labelledby="error-title">
      <h1 id="error-title">{t('err_title')}</h1>
      <p className={styles.desc}>{t('err_desc')}</p>
      <div className={styles.actions}>
        <Button className={styles.action + ' ' + styles.primary} onClick={reset}>{t('err_retry')}</Button>
        <Button as="link" href="/" className={styles.action} variant="ghost">{t('nf_home')}</Button>
      </div>
    </section>
  );
}
