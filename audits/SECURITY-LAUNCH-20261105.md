# Mur — 2026-11-05-ны нээлтийн техникийн шалгалт

Суурь: `3fa22f7`. Энэ тайлангийн огноо Asia/Ulaanbaatar. Зөвхөн public HTTP response, repository болон local dependency/test орчныг шалгасан. Production database, provider credential, Git history, бүх route-ийн эрхийн бүрэн аудит биш.

## Public HTTP

| Хүсэлт | Үр дүн |
|---|---|
| `https://mur-chi.vercel.app/` | 200 |
| `http://mur-chi.vercel.app/` | 308 → HTTPS |
| `/.env`, `/.env.local`, `/.git/HEAD`, `/.git/config` | Дөрвүүлээ 404 |

Нүүр хуудасны response-д CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, HSTS, Referrer-Policy, Permissions-Policy байна. HSTS нь `max-age=63072000; includeSubDomains; preload`. Response-ийн шалгалтаар env assignment / Git HEAD/config агуулга илрээгүй. Response body-г тайланд хадгалаагүй.

CSP нь AI болон Next.js/styled-jsx-ийн одоогийн хэрэглээнд зориулсан inline/eval зөвшөөрлүүдтэй. Header байгаа нь policy-г хамгийн хатуу болгосон гэсэн үг биш. Nonce болон eval-ийг багасгах өөрчлөлтийг тусдаа runtime/AI regression шалгалттай хийнэ.

## Dependency advisory

Бүрэн `npm audit` эхэнд 22 өртсөн package мэдээлсэн: 2 critical, 6 high, 14 moderate. Энэ тоо нь unique exploit-ийн тоо биш; нэг transitive advisory олон parent package-д дамжин тоологдож болно.

Одоогийн major хувилбар дотор шинэчилсэн:

| Package | Өмнө | Шинэ |
|---|---|---|
| `next` | 16.3.0 | 16.4.5 |
| `eslint-config-next` | 16.3.0 | 16.4.5 |
| `@sentry/nextjs` | 10.69.0 | 10.78.0 |
| `vite` | 7.3.6 | 7.3.7 |
| `vitest` | 4.1.10 | 4.1.12 |

`brace-expansion`, `js-yaml`, `source-map-js`, `zod`-ийн transitive хувилбаруудыг parent-ийн зөвшөөрсөн semver хүрээнд шинэчилсэн. `npm audit fix --force`, major override, framework downgrade ашиглаагүй.

Дараах audit: **critical 0, high 0, moderate 12**. `npm run audit:security` нь `npm audit --audit-level=high` ажиллуулж амжилттай гарсан. GitHub quality job энэ шалгалтыг мөн ажиллуулна. Advisory өгөгдөл өөрчлөгдөж болох тул release бүрд дахин ажиллуулна.

## Үлдсэн moderate advisory

- `glob` cancellation болон `minimatch` globparts amplification advisory нь Sentry-ийн bundler/webpack plugin болон TypeScript-ESLint-ийн dependency chain-д байна.
- npm audit нь Sentry болон eslint-config-next-ийн downgrade санал болгосон. Төслийн одоогийн major/хамгаалалтыг хадгалахын тулд үүнийг хэрэглээгүй.
- Одоогийн build/lint package-уудын compatible upstream fix-ийг хүлээн авч шинэчлэх эсвэл тусдаа compatibility review хийсэн override шаардлагатай. Advisory-г ignored гэж тэмдэглээгүй, audit report-оос хасаагүй.
- Эдгээр dependency-ийн өртсөн замд production хүсэлтийн хэрэглэгчийн өгөгдөл хүрдэг эсэхийг энэ шалгалт бүрэн батлаагүй. Moderate-ийг аюулгүй гэж баталсан тайлан биш.

Sentry-ийн critical tunnel advisory нь `tunnelRoute` болон middleware-only authorization зэрэг нөхцөл шаарддаг. Mur-д tunnelRoute тохируулаагүй, Turbopack ашигладаг, privileged API нь server authorization хийдэг. Зөвхөн audit severity-гээс Mur халдлагад өртсөн гэж дүгнээгүй; dependency-г зассан хувилбар руу шинэчилсэн.

Эх сурвалж: [Sentry advisory](https://github.com/advisories/GHSA-mchm-gjx6-7h55), [Next image optimization advisory](https://github.com/advisories/GHSA-2xp9-vwfh-vxw4), [glob advisory](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4), [minimatch advisory](https://github.com/advisories/GHSA-g3hv-75wg-m249).

## Үлдсэн production баталгаажуулалт

Domain/redirect, custom SMTP delivery, production migration болон RLS, managed DB/Storage backup, Sentry email alert, scheduler queue, live QPay урсгал, зардлын тохиргоог [нээлтийн checklist](../docs/PUBLIC-LAUNCH.md)-ийн дагуу батална. Энэ security update нь production SQL/deploy хийдэггүй.

## Local баталгаажуулалт

- Шинэ dependency хувилбарууд дээр TypeScript, ESLint, 63 файлын 392 unit тест болон production build тэнцсэн.
- Бүх browser suite: 64 PASS, 2 зориулалтын platform skip. Magic link, privacy/consent, forms, maps, navigation, responsive урсгалууд орсон.
- Sentry build config-ийн import-ийг шинэ public `@sentry/nextjs/config` entry рүү шилжүүлсэн; ижил `withSentryConfig` API ашиглана.
- CI-ийн гурван job `.nvmrc` дахь Node 24 ашиглаж байгааг шалгасан.
- Production deployment болон SQL ажиллуулаагүй. Энэ local засвар push/deploy хийсний дараа шинэ CI болон Vercel release-ийг дахин батална.
