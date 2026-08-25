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
        <div className="p-10 text-center font-sans">
          <h2 className="mb-3">Алдаа гарлаа</h2>
          <p className="mb-5 text-[#6B7680]">
            Уучлаарай, ямар нэгэн зүйл буруу болсон байна. Дахин оролдоно уу.
          </p>
          <button
            onClick={reset}
            className="cursor-pointer rounded-[10px] border-0 bg-[#17414D] px-[22px] py-[11px] font-semibold text-white"
          >
            Дахин оролдох
          </button>
        </div>
      </body>
    </html>
  );
}
