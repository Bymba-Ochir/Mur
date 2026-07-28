'use client';
import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="mn">
      <body>
        <div style={{ padding: 40, textAlign: 'center', fontFamily: 'sans-serif' }}>
          <h2 style={{ marginBottom: 12 }}>Алдаа гарлаа</h2>
          <p style={{ color: '#6B7680', marginBottom: 20 }}>
            Уучлаарай, ямар нэгэн зүйл буруу болсон байна. Дахин оролдоно уу.
          </p>
          <button
            onClick={reset}
            style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#1F4B5C', color: '#fff', cursor: 'pointer' }}
          >
            Дахин оролдох
          </button>
        </div>
      </body>
    </html>
  );
}
