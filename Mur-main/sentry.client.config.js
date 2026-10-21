// sentry.client.config.js
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  // Үнэгүй tier-ийн квотыг хэмнэхийн тулд бага түвшинд авна
  tracesSampleRate: 0.1,
  // DSN тохируулаагүй үед Sentry автоматаар idle горимд орж, алдаа шидэхгүй
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
});
