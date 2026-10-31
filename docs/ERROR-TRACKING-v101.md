# Mur error tracking — v101

Суурь commit: `168cf6b4bfe2d1506834b5b29c91451bd22ad0cf` (v100).

## Бүртгэл

- Browser: Sentry-ийн runtime/unhandled rejection handler, одоо байгаа React
  error boundary-ууд, HTTP 5xx integration, үндсэн pet/adoption/sitting form-ийн
  барьж авсан алдаа, authenticated fetch-ийн network failure.
- Backend: Next.js `onRequestError` hook нь unhandled route/render алдааг бүртгэнэ.
  API catch, cron claim/acknowledgement, Groq, QPay callback/polling, health
  query-ийн handled failure-ууд нийтлэг `reportError` helper ашиглана.
- `area=frontend|backend`, тогтмол `operation` tag-аар ялгана.
- Input validation, `UNAUTHORIZED`, `AbortError` нь helper-ээс event үүсгэхгүй.
  HTTP integration нь 4xx-ийг error болгохгүй.
- Expected push expiry/failure-ууд сануулга тутамд alert үүсгэхгүй.

## Sentry project ба alert

- Organization: `mur-me`
- Project: `mur` (Next.js), ID `4512350101700690`
- Issues: <https://mur-me.sentry.io/issues/?project=4512350101700690>
- Alerts: <https://mur-me.sentry.io/monitors/alerts/?project=4512350101700690>
- Идэвхтэй alert: <https://mur-me.sentry.io/monitors/alerts/1439113/?project=4512350101700690>
- Alert source: зөвхөн `mur`; trigger: **A new issue is created**;
  action: **Notify Bymba-Ochir** on preferred channel.
- Бүх environment хамарна: development дээр анх үүссэн issue-г production
  дээр дахин анхных гэж үзэхгүйгээс болж notification алдагдуулахгүй.
  Ижил issue-ийн давтагдсан event бүрд email илгээхгүй.

`lib/sentryOptions.ts` дахь DSN нь энэ project-ийн **public ingestion DSN**.
Энэ нь management API token биш. Default нь үүгээр холбогдох тул Vercel-д
шинэ нууц түлхүүр нэмэх шаардлагагүй. Env-ээр дараах байдлаар override хийж болно:

- Browser: `NEXT_PUBLIC_SENTRY_DSN`
- Server/Edge: `SENTRY_DSN`, байхгүй бол `NEXT_PUBLIC_SENTRY_DSN`
- Тухайн DSN variable-ийг explicit хоосон утгатай болговол runtime monitoring унтарна.
- Vercel environment болон commit SHA нь `production`/`preview`, release tag-ийг
  автоматаар өгнө. Өөр hosting-д `SENTRY_ENVIRONMENT`,
  `NEXT_PUBLIC_SENTRY_ENVIRONMENT`, `SENTRY_RELEASE`, `NEXT_PUBLIC_SENTRY_RELEASE`
  тохируулж болно.

Source map upload шаардлагатай бол Vercel-ийн server/build env-д `SENTRY_ORG=mur-me`,
`SENTRY_PROJECT=mur`, тохирох `SENTRY_AUTH_TOKEN` нэмнэ. Token-ийг Git эсвэл
`NEXT_PUBLIC_*` variable-д оруулахгүй. Token байхгүй үед error event илгээх нь ажиллана;
production stack trace нь эх TypeScript мөрүүдэд map хийгдэхгүй байж болно.

## Дамжуулах өгөгдлийг хязгаарласан нь

`sentryOptions` нь browser/Node/Edge-д нийтлэг. Request/response body, headers,
cookies, user identity, URL query parameter, DB parameter, stack local variable,
AI prompt/response-ийн collection унтарсан. Session replay нэмээгүй.
Tracing/log collection унтарсан; error sampling нь **100%**.

`beforeSend` нь request body/header/query/user/extra-г хасаж, URL болон exception
text-ийн common credential хэлбэрүүдийг scrub хийнэ. Console/UI breadcrumb-ийг
дамжуулахгүй. Supabase error-ийн row details/hint-ийг event-д хавсаргахгүй.
QPay provider-ийн raw response body-г exception message-д нэмэхгүй.
Энэ нь дурын exception message бүх хувийн мэдээллээс бүрэн цэвэр гэсэн баталгаа биш;
шинэ error message-д хэрэглэгчийн өгөгдөл, нууц түлхүүр оруулахгүй.

## Шалгах

```powershell
Set-Location 'D:\Mur\mur-mvp'
node --env-file=.env.local scripts/verify-error-tracking.mjs
```

Энэ нь `monitoring-test` environment-д нэг synthetic backend error явуулна.
Sentry Issues-д event гарсан, alert-ийн **Recent Runs**-д notification action
ажилласан эсэхийг шалгана. Inbox-д хүрснийг хүлээн авагч баталгаажуулна.
Энэ script нь browser runtime-ийн end-to-end шалгалт биш; browser/Node/Edge
SDK config, privacy болон API reporting-ийг unit тестээр хамруулсан.

2026-10-31-ний баталгаажуулалт:

- `npm run typecheck`: PASS
- `npm run lint`: PASS
- `npm test`: 49 файл / 224 тест PASS
- `npm run build`: PASS
- Synthetic event ID: `d1a71fbbc1024c1daf1a5305acda4e4d`
- Sentry issue: <https://mur-me.sentry.io/issues/157587847/?project=4512350101700690>
- Alert History: **Total Triggers = 1**, тухайн issue-д **Alerts = 1**.
  Email inbox-ийг уншаагүй; Sentry-ийн trigger history-г баталгаажуулсан.

Production-д нийтэд нээлттэй error үүсгэх endpoint нэмээгүй. Production DB SQL
өөрчлөлт байхгүй. v99/v100 RPC, pagination, idempotency, төлбөрийн баталгаажуулалт
болон эрхийн шүүлтүүд хэвээр.

## Commit / push

```powershell
Set-Location 'D:\Mur\mur-mvp'
npm run typecheck; if ($LASTEXITCODE -ne 0) { throw 'Typecheck failed' }
npm run lint; if ($LASTEXITCODE -ne 0) { throw 'Lint failed' }
npm test; if ($LASTEXITCODE -ne 0) { throw 'Tests failed' }
npm run build; if ($LASTEXITCODE -ne 0) { throw 'Build failed' }
git add -A; if ($LASTEXITCODE -ne 0) { throw 'Git add failed' }
git commit -m 'feat: track frontend and backend errors with Sentry'; if ($LASTEXITCODE -ne 0) { throw 'Commit failed' }
git push origin main
```

## Албан баримт

- <https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/>
- <https://docs.sentry.io/product/monitors-and-alerts/alerts/create-alerts/>
