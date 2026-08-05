# Security — байр суурь ба хүлээн зөвшөөрсөн эрсдэл

МӨР платформын аюулгүй байдлын арга хэмжээ болон одоогоор хүлээн зөвшөөрсөн
эрсдэлүүдийн бүртгэл. Шинэчлэлт: 2026-08-05.

## 1. Идэвхтэй хамгаалалт

| Хамгаалалт | Тайлбар |
|---|---|
| **CSP + security headers** | `next.config.js`-ийн `headers()` — CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy` (clickjacking, MIME sniffing, XSS-ийн гадаргууг хязгаарлана) |
| **RLS** | Бүх 8 хүснэгт row-level security-тэй; публик унших, эзэмшигч/админ зөвхөн бичих |
| **Rate limit** | Pet бичлэг: Postgres trigger (`check_pet_rate_limit`, 1цаг/5). Хандив: `lib/rateLimit.ts` (1мин/5/IP, `/api/donations/create`) |
| **DB-level validation** | `validate_pet_input()` trigger — утасны дугаар формат, талбарын урт (клиентээр тойрч болохгүй) |
| **Серверийн нууцууд** | `SUPABASE_SERVICE_ROLE_KEY`, `VAPID_PRIVATE_KEY`, `QPAY_*`, `NOTIFY_WEBHOOK_SECRET` зөвхөн сервер route-д (`NEXT_PUBLIC_` угтваргүй); webhook/cron route-ууд secret шалгалттай |
| **Env validation** | `lib/env.ts` — заавал env алга бол fail-fast |
| **Dead code устгал** | `app/api/embed` (хуучин серверийн HF embedding) — CLIP browser-д шилжсэн тул устгагдсан |

## 2. Хүлээн зөвшөөрсөн эрсдэл (accepted risk)

### 2.1. `npm audit` — 5 vulnerability (2026-08-05, Next 16 + React 19 + Sentry v10-ийн дараа)

`@sentry/nextjs@10`, `next@16.3`, `react@19` upgrade хийгдсэн тул
Sentry/Next.js-ийн vuln-ууд арилсан (33→5). Үлдсэн 5 нь бүгд **test/dev tooling**:

| Vuln | Хаана | Эрсдэл |
|---|---|---|
| `esbuild` / `vite` / `vitest` (moderate + 1 high + 1 critical) | `vitest`, `vite-node`, `@vitest/mocker` | **Зөвхөн dev/test орчинд** — production build bundle-д орохгүй, нийтийн интерфейсээр хүрэх боломжгүй |

**Яагаад хүлээн зөвшөөрсөн бэ:**
- Эдгээр нь build-time/dev-ийн хэрэгсэл; `next start`-д ашиглагдахгүй.
- Fix нь `vitest@4` **breaking major** (Vite 7, config өөрчлөлт) — MVP-д
  хөгжүүлэлтийн тасралт үүсгэхгүйн тулд тусдаа төлөвлөнө (§3).

### 2.2. Бусад

- **In-memory rate limiter** нь Vercel serverless-д instance бүрд хамаарна —
  бүрэн хатуу хязгаарлалт биш (spam-ыг мэдэгдэхүйц бууруулдаг, бүрэн зогсоодоггүй).
  Хуулийн зөвшөөрөлт (legal) бус, техникийн түр хамгаалалт.
- **Вакцин сануулгын cron** — Vercel Cron-д тохируулсан үед л идэвхтэй.

## 3. Төлөвлөсөн эргэн төлөлт (remediation)

- [x] `@sentry/nextjs` → v10 шинэчилсэн (2026-08-05) — `@sentry/*`-ийн vuln арилсан.
- [x] `next` 14 → **16.3** + `react` → **19** + ESLint 9 flat config шинэчилсэн
      (2026-08-05) — Next.js-ийн vuln арилсан; async `params`, `eslint .` руу
      шилжсэн; `react-hooks/set-state-in-effect` rule унтраасан
      (localStorage hydration загвар; useSyncExternalStore миграци follow-up).
      Үлдсэн5 vuln нь зөвхөн dev/test (vitest).
- [ ] `vitest` 2 → 4 upgrade (dev/test tooling-ийн үлдсэн5 vuln) — Vite 7 breaking.
- [ ] `useSyncExternalStore` руу localStorage-уншилтыг шилжүүлж,
      `react-hooks/set-state-in-effect`-ийг дахин идэвхжүүлэх.
- [ ] Хэрэв хандив spam-ын түвшин өсвөл: DB-суурилсан эсвэл Redis (Upstash) rate limiter.
- [ ] Апп өсөхөд: Supabase Pro → автомат backup + PITR (`docs/BACKUP.md` §7).

## 4. Шинэчлэх журам

- Шинэ package нэмэх/шинэчлэх үед: `npm audit` ажиллуулж, шинэ өндөр/критик vuln
  гарвал энэ файлыг шинэчилнэ.
- Энэ файлын §3-ын checkbox-ыг хэрэгжүүлсэн үед тэмдэглэнэ.
