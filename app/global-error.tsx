'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';
import { DICT } from '../lib/i18n';
import { useLocalStorageValue } from '../lib/useLocalStorageState';
import Button from '../components/ui/Button';
import styles from './recovery.module.css';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const lang = useLocalStorageValue('mur-lang') === 'en' ? 'en' : 'mn';
  const theme = useLocalStorageValue('mur-theme');
  const { err_title, err_desc, err_retry, nf_home } = DICT[lang];

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang={lang}>
      <body className={styles.standalone} data-theme={theme === 'dark' || theme === 'light' ? theme : undefined}>
        <main className={styles.panel} aria-labelledby="global-error-title">
          <h1 id="global-error-title">{err_title}</h1>
          <p className={styles.desc}>{err_desc}</p>
          <div className={styles.actions}>
            <Button className={styles.action + ' ' + styles.primary} onClick={reset}>{err_retry}</Button>
            <Button as="anchor" href="/" className={styles.action} variant="ghost">{nf_home}</Button>
          </div>
        </main>
      </body>
    </html>
  );
}
