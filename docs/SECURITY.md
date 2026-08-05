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

### 2.1. `npm audit` — 0 vulnerability (2026-08-05)

`@sentry/nextjs@10`, `next@16.3`, `react@19`, `vitest@4` + `vite@7` upgrade хийгдсэн.
`npm audit` одоо **0 vulnerability** — бүх known vuln арилсан.

### 2.2. Бусад

- **In-memory rate limiter** нь Vercel serverless-д instance бүрд хамаарна —
  бүрэн хатуу хязгаарлалт биш (spam-ыг мэдэгдэхүйц бууруулдаг, бүрэн зогсоодоггүй).
  Хуулийн зөвшөөрөлт (legal) бус, техникийн түр хамгаалалт.
- **Вакцин сануулгын cron** — Vercel Cron-д тохируулсан үед л идэвхтэй.

## 3. Төлөвлөсөн эргэн төлөлт (remediation)

- [x] `@sentry/nextjs` → v10 шинэчилсэн (2026-08-05) — `@sentry/*`-ийн vuln арилсан.
- [x] `next` 14 → **16.3** + `react` → **19** + ESLint 9 flat config шинэчилсэн
      (2026-08-05) — Next.js-ийн vuln арилсан; async `params`, `eslint .` руу
      шилжсэн.
- [x] `vitest` 2 → **4.1** + `vite` → **7.3** upgrade (2026-08-05) — `npm audit`
      **0 vulnerability** болсон, 37/37 тест ногоон.
- [x] localStorage-уншилт `useSyncExternalStore` руу шилжсэн
      (`lib/useLocalStorageState.ts` — theme, хэл, onboarding, analytics consent);
      async-fetch/URL effect-уудыг promise/`useSyncExternalStore`-р засч,
      `react-hooks/set-state-in-effect` дүрмийг **дахин идэвхжүүлсэн** (2026-08-05).
- [ ] Хэрэв хандив spam-ын түвшин өсвөл: DB-суурилсан эсвэл Redis (Upstash) rate limiter.
- [ ] Апп өсөхөд: Supabase Pro → автомат backup + PITR (`docs/BACKUP.md` §7).

## 4. Шинэчлэх журам

- Шинэ package нэмэх/шинэчлэх үед: `npm audit` ажиллуулж, шинэ өндөр/критик vuln
  гарвал энэ файлыг шинэчилнэ.
- Энэ файлын §3-ын checkbox-ыг хэрэгжүүлсэн үед тэмдэглэнэ.
