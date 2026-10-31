# Mur API rate-limit audit — v102

Суурь: `4bd3ad02d07ff48388c2a54b445c03a0c7cd7f22`, latest `main` (v101).

## Олдсон асуудал

13 `app/api/**/route.ts` файл дахь 14 HTTP handler-ийг шалгасан.

Өмнө нь **8 handler** explicit rate limit-гүй байсан:

- `GET /api/health`: authentication-гүй; хүсэлт бүрд DB query, шаардлагагүй exact profile count.
- `GET /api/account/export`: account шаарддаг боловч нэг account-аас олон хүсэлтээр бүх export query-г давтаж болно.
- `DELETE /api/account/delete`, `DELETE /api/content/[kind]/[id]`: эрх шалгадаг боловч auth/lookup/delete/storage ажлыг давтан өдөөх хязгааргүй.
- `GET /api/push-subscriptions`: auth provider болон subscription query-г давтан дуудаж болно.
- `POST /api/qpay/callback`, `POST /api/notify`, `GET /api/vaccine-reminders`:
  зөв secret шаарддаг. Дурын browser тэдгээрийн үндсэн ажлыг ажиллуулж чадахгүй,
  харин зөв secret-тэй sender-ийн давталтад quota байгаагүй.

Үлдсэн 6 handler нь зөвхөн process-local Map counter ашигладаг байсан.
Vercel-ийн шинэ/өөр instance дээр counter дахин эхлэх тул shared hard quota биш.
Donation/sighting duplicate retry нь шинэ operation-ийн limit-ийг зөв алгасдаг ч
урьдчилсан read/auth workload-ийг хязгаарлах тусдаа admission guard байгаагүй.

## Шинэ хязгаар

| Endpoint | IP / admission | Баталгаажсан identity / service |
| --- | --- | --- |
| `GET /api/health` | 60/минут | — |
| `GET /api/account/export` | 6/минут | account: 2/цаг |
| `DELETE /api/account/delete` | 10/минут | account: 3/цаг |
| `DELETE /api/content/[kind]/[id]` | 30/минут | account: 20/минут, бүх kind/id дундаа shared |
| `GET /api/push-subscriptions` | 60/минут | account: 30/минут |
| `POST /api/push-subscriptions` | 8/цаг | — |
| `POST /api/assistant` | 60/10 минут | account: 30/10 минут |
| `POST /api/reports` | 30/минут | account: 8/цаг |
| `POST /api/sightings` | бүх хүсэлт: 30/минут; шинэ: 20/цаг | шинэ: account 10/цаг |
| `POST /api/donations/create` | бүх хүсэлт: 30/минут; шинэ: 5/минут | — |
| `GET /api/donations/status` | 60/минут | QPay check: invoice 30/минут |
| `POST /api/qpay/callback` | зөв secret-ийн дараа 240/минут | service 300/минут; invoice 30/минут |
| `POST /api/notify` | secret баталгаажуулсны дараа | service 120/минут |
| `GET /api/vaccine-reminders` | secret/VAPID баталгаажуулсны дараа | service 2/минут |

Polling болон callback нь нэг `qpay-invoice` quota ашиглана. `DonateModal`-ийн
3 секунд тутмын хэвийн polling (20/минут) invoice quota-д багтана.

Quota нь DB clock дээр эхэлдэг хугацааны window; window дуусмагц дахин эхэлнэ.
Энэ нь rolling 60-second algorithm биш: зааг давсан хоёр window-ийн burst
нийлж болно. Гэхдээ нэг window-д 1000 үндсэн ажил ажиллуулахгүй.

## Хэрэгжүүлэлт

- `lib/apiRateLimit.ts`: ганц policy map, shared response builder, IP/user/service guards.
- `consume_api_rate_limit`: service-role-only RPC; primary key + atomic
  `INSERT ... ON CONFLICT DO UPDATE` нь бүх worker-ийн counter-ийг сериалчилна.
  Browser quota, identity, permission, payment state дамжуулж тогтоохгүй.
- Client нь raw IP/account ID бус SHA-256 bucket key илгээнэ. Table нь RLS-тай,
  `anon`/`authenticated` read/write/execute эрхгүй.
- Нэг RPC нь counter-ийн нэг мөрийг atomic шинэчилнэ; expired bucket cleanup нь
  хамгийн ихдээ 20 мөр, `SKIP LOCKED` ашиглана. Counter denied үед saturate хийнэ.
- Богино process-local burst guard болон denial cache нь DB counter-ийн ачааллыг
  бууруулна. Allowed quota-г локалаар cache хийдэггүй. DB/RPC алдаатай бол
  `503 + Retry-After: 5` буцааж, үндсэн ажил руу нэвтрүүлэхгүй.
- Limit хэтэрвэл `429 + Retry-After + Cache-Control: no-store`; хэвийн throttle-ийг
  Sentry error болгохгүй.
- Vercel дээр platform-overwritten `x-vercel-forwarded-for`/`x-forwarded-for`-ийг
  л ашиглана. Бусад deployment-д browser forwarding header-ийг шууд итгэхгүй,
  shared `unknown` bucket ашиглана. Self-hosting-д trusted ingress adapter хэрэгтэй.
- IPv6 бичлэгийг canonical болгож /64-д нэгтгэнэ; IPv4-mapped IPv6 нь IPv4-тай
  нэг budget ашиглана. `x-real-ip`, request JSON-ийн `userId`, token солих нь
  quota-г шинэчлэхгүй. User quota зөвхөн `auth.getUser()`-ийн ID ашиглана.
- Health check-ийн unnecessary `count: exact`-ийг хассан; нэг мөртэй head query хэвээр.
- Хоосон notify webhook secret-ээр ажиллахгүй; `503` буцаана.

## Хэвээр хадгалсан хамгаалалт

Idempotency retry нь admission quota-д тоологдох ч шинэ donation/sighting quota-г
давтан зарцуулахгүй. v99/v100 RPC, claim, batch, row ownership болон QPay payment
verification өөрчлөгдөөгүй. Callback limit-ээс болж ажил гүйцэтгээгүй үед хуурамч
`200 OK` өгөхгүй; `429/503` ба `Retry-After` буцаана. Sender-ийн retry/replay
нь sender талын бодлогоос хамаарна; Supabase webhook-д automatic retry-г таамаглахгүй.
Буруу callback secret-ийн хуучин `200 OK` ACK хэвээр боловч DB/payment ажил хийхгүй.

## Хамрах хүрээ

Энэ нь Next.js API-ийн үнэтэй ажлыг хамгаална; интернетээс HTTP request өөрөө
ирэхийг бүрэн хориглох DDoS firewall биш. Global traffic хэдэн мянган IP-ээс
ирвэл edge/WAF түвшний хамгаалалт мөн шаардлагатай.

Browser-ийн Supabase руу шууд явдаг PostgREST/Storage/Auth request, Next.js page,
`/_next/image` нь эдгээр 14 handler-ээр дамждаггүй. Тэдгээрийг энэ quota хамгаалсан
гэж үзэхгүй. Өмнөх Supabase RLS/trigger/write хамгаалалтуудыг хэвээр үлдээсэн.

## Нэвтрүүлэх

1. `supabase-api-rate-limits-v102.sql`-ийг Supabase SQL Editor-д **гараар Run**.
2. `audits/api-rate-limits-v102-readonly.sql`: бүх `passed = true` эсэхийг шалгана.
3. Дөрвөн code check тэнцсэний дараа commit/push/deploy.

Migration-гүйгээр deploy хийвэл хамгаалагдсан ажил `503` буцаана. SQL-ийг
clipboard-д хуулсан нь ажиллуулсан гэсэн үг биш. Migration production-д
автоматаар ажиллуулахгүй. Additive migration тул хуучин working deployment
руу rollback хийхэд хуучин код ажиллах боломжтой.

Локал PGlite/PostgreSQL дээр migration, 1000 RPC call-аас яг 30 admission,
counter saturation/reset, invalid arguments, 20-row cleanup, RLS/role execute
permission-ийг шалгасан. PGlite нэг backend ашигладаг; бодит олон connection-ийн
row-lock concurrency-г энэ smoke test симуляцлаагүй.

Эцсийн code checks (2026-10-31):

- `npm run typecheck`: PASS
- `npm run lint`: PASS
- `npm test`: 52 файл / 277 тест PASS
- `npm run build`: PASS
- 14 handler бүрийн `429` болон `503` admission denial үед үндсэн
  auth/DB/payment/storage/push ажил эхлэхгүйг regression тестээр шалгасан.
- Production load test, production SQL, commit/push/deploy хийгээгүй.

## Эх сурвалж

- [Vercel request headers](https://vercel.com/docs/headers/request-headers)
- [PostgreSQL ON CONFLICT](https://www.postgresql.org/docs/current/sql-insert.html#SQL-ON-CONFLICT)
