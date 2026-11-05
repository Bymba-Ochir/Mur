'use client';
import './global-error.css';
import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';
import { DICT } from '../lib/i18n';
import { useLocalStorageValue } from '../lib/useLocalStorageState';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const lang = useLocalStorageValue('mur-lang') === 'en' ? 'en' : 'mn';
  const { err_title, err_desc, err_retry } = DICT[lang];
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang={lang}>
      <body>
        <main className="global-error-shell">
          <div aria-hidden="true" className="global-error-icon">!</div>
          <h1>{err_title}</h1>
          <p>{err_desc}</p>
          <button type="button" onClick={reset}>{err_retry}</button>
        </main>

      </body>
    </html>
  );
}
