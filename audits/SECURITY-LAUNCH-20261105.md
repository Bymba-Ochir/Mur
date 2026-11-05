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


## Нэмэлт эмзэг байдлын шалгалт — `b570a7b`

Эзэмшигч өмнөх security update-ийг commit/push хийсэн тул audit-ын явцад суурийг `b570a7b1cdd651407b931ff15eedb1009819539f` руу тулгасан. Доорх үр дүн нь 2026-11-05-ны нэмэлт шалгалт бөгөөд дээрх анхны snapshot-ийг орлохгүйгээр үргэлжлүүлж баримтжуулна.

### Сүүлийн advisory ба deploy

- Next.js-ийн [2026-11-03-ны албан security release](https://nextjs.org/blog/november-2026-security-release) нь 16.4.5-ийг patched Active LTS гэж заасан. Local болон committed lockfile хоёул Next 16.4.5, Sentry 10.78.0; Sharp 0.35.5 байна.
- [2026-10-14-ний Next security release](https://nextjs.org/blog/nextjs-security-update-october-14-2026) нь upstream React RSC болон image optimization засваруудыг Next 16.4.1-д оруулсан. React-ийн [RSC advisory](https://github.com/react/react/security/advisories/GHSA-xqc2-xf4c-x3h3) нь `react-server-dom-*` package-уудад хамаарна; энгийн `react` package-ийн 19.2.8 гэсэн дугаараас дангаар нь RSC exploit батлагдсан гэж дүгнээгүй.
- Шалгасан source-д `use server`, `use cache`, `unstable_cache`, `cacheComponents`, `next/og` хэрэглээ олдоогүй. Энэ нь framework patch хийх шаардлагагүй гэсэн үг биш; patched Next хувилбарыг хадгална.
- `b570a7b`-ийн [GitHub CI](https://github.com/Bymba-Ochir/Mur/actions/runs/42021888128) амжилттай. GitHub deployment `7572809132` нь `Production`, `success` төлөвтэй; [Vercel deployment](https://vercel.com/bymbaas-projects-311dc457/mur/FAC2tH2RfkYPELXLWFdyog2336vU) мөн success байна. Энэ metadata нь production RLS/SMTP/provider тохиргооны баталгаа биш.

### Олдвор ба хатууруулах ажил

| Төрөл | Үр дүн / үргэлжлүүлэх ажил |
|---|---|
| Dependency advisory | Шинэчилсэн local audit: critical 0, high 0, moderate 12. Үлдсэн glob/minimatch advisory-ийн dependency chain, хязгаарыг дээр тайлбарласан. Тэдгээрийг аюулгүй гэж батлаагүй. |
| CSP hardening | `script-src` дэх `unsafe-inline`, `unsafe-eval` байгаа нь батлагдсан. Энэ нь XSS-ийн дараагийн хамгаалалтыг сулруулдаг; attacker-controlled HTML injection энэ review-д олдоогүй. Nonce/AI runtime-ийн тусдаа compatibility ажил хэрэгтэй, шууд устгаж аппыг эвдэхгүй. |
| JSON request budget | Feedback endpoint streamed 16 KiB cap-тай, бусад хэд хэдэн API `request.json()`-оор бүх body-г parse хийдэг. App-level body cap-ийг нийтлэг helper-ээр жигд болгох нь resource hardening-ийн дараагийн ажил. Энэ шалгалтаар DoS үзүүлж батлаагүй. |
| Export хэмжээ | `account/export` нь өөрийн хэрэглэгчийн өгөгдлөөр шүүдэг ч олон query болон messages export дээр pagination байхгүй. Том account-ийн completeness/resource review шаардлагатай; бусдын өгөгдөл алдагдахыг нотлоогүй. |
| Production тохиргоо | Production grant/RLS, storage, SMTP, scheduler, backup нь тусдаа operator баталгаажуулалт хэвээр. Local pass-ийг production audit гэж үзэхгүй. |

### Бодитоор шалгасан эрхийн хил

`tests/e2e/security-boundaries.spec.ts` нь зөвхөн loopback app болон `127.0.0.1:54321` local Supabase дээр ажиллана. Хоёр зориулалтын account, нэг туршилтын зар үүсгэж, төгсгөлд зөвхөн эдгээр fixture-ийг устгана. Бодит QPay/Groq дуудлага, production SQL, RCE/DoS payload ашиглаагүй. Зориудын 401/503 хариугаар эзэмшигчид худал Sentry alert явуулахгүйн тулд test server process-ийн backend DSN-ийг explicit хоосон болгосон; production тохиргоо өөрчлөгдөөгүй.

Батлагдсан local scenario:

- Нэвтрээгүй account/content delete, image worker wake-up, report, assistant хүсэлтүүд 401.
- Хуурамч Bearer token-оор account устгах хүсэлт 401.
- Буруу cron/webhook credential-тай background worker, vaccine reminder, QPay callback 401 эсвэл тохиргоо байхгүй бол 503; амжилттай эрхтэй хариу өгөөгүй.
- Guest болон B хэрэглэгч A-ийн нийтэд харагдах зарыг уншихад нуусан утас гараагүй. Owner A өөрийн contact RPC-ээр дугаараа авч чадсан; B авч чадаагүй.
- B хэрэглэгч `mur_private` schema-аас contact-уудыг шууд уншиж чадаагүй.
- B нь A-ийн `id`, `userId` query болон `x-user-id` header-ийг явуулсан ч зар устгах API 403 буцааж, A-ийн зар хэвээр үлдсэн.
- B-ийн account export нь spoofed `userId`-г дагаагүй: account ID B, A-ийн зар/нуусан утас агуулаагүй.
- Authenticated B нь private background claim RPC ажиллуулах болон өөрийгөө `admins` хүснэгтэд нэмэх боломжгүй.

### Static review ба secret шалгалт

- `requireRequestUser` нь серверээс `auth.getUser(token)` verify хийдэг; ownership/user quota нь request JSON дахь identity-г ашигладаггүй.
- QPay callback нь HMAC эсвэл legacy secret шалгасны дараа canonical invoice/amount-ийг DB-ээс авч provider API-аар батална; success page/browser payload-аас paid болгох зам энэ review-д илрээгүй. Signature, incorrect secret, guarded update-ийн unit тестүүд тэнцсэн.
- Outbound Groq/QPay URL нь server config; push endpoint нь HTTPS provider allowlist-тай. Photo worker нь project origin + owner folder, 8 MiB byte cap, 16 MP decode cap ашиглана. Уншсан замуудад browser URL-ийг дурын privileged fetch рүү шууд дамжуулсан зам олдоогүй; бүх provider-ийн runtime SSRF pentest биш.
- User text-ийн React rendering болон map popup-ийн `textContent` хэрэглээг үзсэн. `dangerouslySetInnerHTML` нь тогтмол theme bootstrap script-д байна; review-д user text оруулах `innerHTML` зам илрээгүй. Энэ нь XSS боломж бүрийг үгүйсгэх баталгаа биш.
- Current tracked 481 текст файлд private-key header, GitHub/AWS/Supabase secret key-ийн танигдсан хэлбэр, service-role JWT хайхад candidate илрээгүй. Secret-ийн утга хэвлээгүй. Бүх key формат, Git history, provider secret/config, untracked ignored файл хамрагдаагүй.
- GitHub secret-scanning API-аас open alert авахад хоосон жагсаалт буцсан. Closed alert болон бүх history-г тусад нь шинээр scan хийсэн гэж тайлагнаагүй.

### Шалгалтын үр дүн

- `npm run audit:security`: PASS (critical/high 0; moderate 12).
- Migration history: 29 ordered migrations, 23 immutable source PASS.
- Local DB: 4 pgTAP файл, 92 тест PASS. Phone privacy, message access/block, server-only RPC, constraints/queue зэрэг орсон.
- Typecheck, lint, build: PASS. Unit: 63 файл / 392 тест PASS.
- Browser suite: 68 PASS / 2 зориулалтын platform skip. Шинэ security boundary сценарийн desktop/mobile 4 run тусдаа мөн тэнцсэн.

Хязгаар: энэ нь scoped code/dependency/local authorization assessment. Production дээр exploit ажиллуулаагүй, traffic/load attack хийгээгүй, compromised account/session эсвэл бүх бизнесийн урсгалыг red-team байдлаар бүрэн хамруулаагүй. Шалгасан scenario-д шинэ critical/high auth bypass батлагдаагүй; “эмзэг байдал огт байхгүй” гэсэн баталгаа биш.
