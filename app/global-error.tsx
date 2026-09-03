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
        <main className="global-error-shell">
          <div aria-hidden="true" className="global-error-icon">!</div>
          <h2>Алдаа гарлаа</h2>
          <p>
            Уучлаарай, ямар нэгэн зүйл буруу болсон байна. Дахин оролдоно уу.
          </p>
          <button onClick={reset}>
            Дахин оролдох
          </button>
        </main>
        <style>{`
          *{box-sizing:border-box}body{margin:0;padding:16px;background:#F7F8FC}
          .global-error-shell{max-width:520px;margin:12vh auto;padding:40px 28px;text-align:center;font-family:system-ui,sans-serif;color:#171A2B;background:#FFF;border:1px solid #E6E8F0;border-radius:24px;box-shadow:0 18px 50px rgba(23,26,43,.08)}
          .global-error-icon{display:grid;width:52px;height:52px;margin:0 auto 16px;place-items:center;color:#625BF6;background:#F0EFFF;border-radius:16px;font-size:24px;font-weight:800}
          h2{margin:0 0 12px}p{margin:0 0 20px;color:#667085;line-height:1.6}
          button{min-height:44px;padding:11px 22px;color:#FFF;background:#625BF6;border:0;border-radius:999px;cursor:pointer;font-weight:700}
          button:focus-visible{outline:3px solid #8D87FF;outline-offset:3px}
          @media(max-width:560px){body{padding:0}.global-error-shell{min-height:100dvh;margin:0;padding:clamp(40px,12vh,96px) 20px 28px;border:0;border-radius:0;box-shadow:none}button{width:100%}}
        `}</style>
      </body>
    </html>
  );
}
