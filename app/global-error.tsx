'use client';
import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="mn">
      <body>
        <div style={{ maxWidth: 520, margin: '12vh auto', padding: '40px 28px', textAlign: 'center', fontFamily: 'system-ui, sans-serif', color: '#171A2B', background: '#FFFFFF', border: '1px solid #E6E8F0', borderRadius: 24, boxShadow: '0 18px 50px rgba(23, 26, 43, 0.08)' }}>
          <div aria-hidden="true" style={{ width: 52, height: 52, margin: '0 auto 16px', display: 'grid', placeItems: 'center', borderRadius: 16, background: '#F0EFFF', color: '#625BF6', fontSize: 24, fontWeight: 800 }}>!</div>
          <h2 style={{ marginBottom: 12 }}>Алдаа гарлаа</h2>
          <p style={{ color: '#667085', marginBottom: 20, lineHeight: 1.6 }}>
            Уучлаарай, ямар нэгэн зүйл буруу болсон байна. Дахин оролдоно уу.
          </p>
          <button
            onClick={reset}
            style={{ minHeight: 44, padding: '11px 22px', borderRadius: 999, border: 'none', background: '#625BF6', color: '#fff', cursor: 'pointer', fontWeight: 700 }}
          >
            Дахин оролдох
          </button>
        </div>
      </body>
    </html>
  );
}
