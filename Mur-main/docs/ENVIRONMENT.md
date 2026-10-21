# Орчны хувьсагч

Кодын `process.env` хэрэглээнээс гаргасан жагсаалт. Example файлууд бүх интеграцийн утгыг заавал агуулахгүй. Бодит key-г энд хуулж болохгүй.

| Нэр | Зориулалт |
|---|---|
| `CI` | CI runner-ийн төлөв |
| `CRON_SECRET` | Серверийн нууц; reminder cron Bearer header |
| `GROQ_API_KEY` | Серверийн нууц; AI upstream |
| `NEXT_PUBLIC_SENTRY_DSN` | Public; runtime error reporting endpoint |
| `NEXT_PUBLIC_SITE_URL` | Public; canonical домэйн, sitemap/robots холбоос |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser/public; RLS-ээр хамгаалагдах client key |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser/public; үндсэн Supabase URL, build үед хэрэгтэй |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Public; browser push бүртгэл |
| `NEXT_RUNTIME` | Next runtime-аас өгөгдөнө |
| `NODE_ENV` | Next/Node runtime төлөв; гараар production дуурайлгаж тохируулахгүй |
| `NOTIFY_WEBHOOK_SECRET` | Серверийн нууц; /api/notify-ийн x-webhook-secret |
| `PLAYWRIGHT_BASE_URL` | Тестийн target URL |
| `QPAY_BASE_URL` | Сервер; QPay base URL, lib/qpay.ts-д default байна |
| `QPAY_CALLBACK_SECRET` | Серверийн нууц; callback баталгаажуулалт |
| `QPAY_INVOICE_CODE` | Сервер; QPay invoice тохиргоо |
| `QPAY_PASSWORD` | Серверийн нууц; QPay нэвтрэлт |
| `QPAY_USERNAME` | Серверийн нууц; QPay нэвтрэлт |
| `SENTRY_AUTH_TOKEN` | Build нууц; sourcemap upload эрх |
| `SENTRY_ORG` | Build; Sentry байгууллага |
| `SENTRY_PROJECT` | Build; Sentry төсөл |
| `SKIP_SENTRY_BUILD` | next.config.js-д build plugin сонголт; зөвшөөрлийн хориг тойрох хэрэгсэл биш |
| `SUPABASE_SERVICE_ROLE_KEY` | Серверийн нууц; privileged API, RLS bypass тул browser-т гаргахгүй |
| `VAPID_PRIVATE_KEY` | Серверийн нууц; push гарын үсэг |
| `VERCEL_GIT_COMMIT_SHA` | Vercel build metadata |

Backup script: `DATABASE_URL` нууц холболт, `BACKUP_DIR`, `BACKUP_KEEP` (default 14), `BACKUP_DEST` тусдаа ашиглана. Shell script `.env.local`-ийг автоматаар уншихгүй.

Шинэ VAPID хос үүсгэх:
```powershell
npx web-push generate-vapid-keys
```
Private утгыг зөвхөн server env-д хадгал. Хуучин ил гарсан хосыг дахин ашиглахгүй. Public key солигдоход хэрэглэгчийн subscription-ийг дахин бүртгэх шаардлага гарна.

`NEXT_PUBLIC_*` утгууд browser bundle-д орж болно; сольсны дараа дахин build/deploy хийнэ. Preview болон Production env-ийг тусад нь шалгана.
