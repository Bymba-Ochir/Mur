# Mur v103 — хүсэлтээс background job руу шилжүүлсэн ажил

Суурь: `bc52372` (v102). Next.js 16.3-ийн bundled `after` болон route handler зааврыг уншсан.

| Хүсэлт | Өмнө хүлээдэг байсан ажил | Одоо хариу өгөх нөхцөл |
| --- | --- | --- |
| `POST /api/notify` | Дүүргийн бүх subscription-ийг уншаад бүх төхөөрөмж рүү push илгээх | DB-д canonical pet data-тай job хадгалсны дараа `202` |
| `POST /api/sightings` | Sighting хадгалсны дараа эзнийг уншиж notification insert хийх | v99 RPC + нэг transaction-д outbox job commit болсны дараа `201` |
| `DELETE /api/content/[kind]/[id]` | Зар устгасны дараа Storage API-аар зураг цэвэрлэх | Эрх шалгалт, үндсэн delete, cleanup job нэг transaction-д commit болсон |
| `DELETE /api/account/delete` | Бүх зар/зураг татаж, зураг болон avatar устгах | Зар ба auth account устсан; file cleanup тусдаа job болсон |

Account устгах зам одоо бүх зураг/зарын ID-г application memory-д татахгүй. Delete trigger нь тухайн зарын хамгийн ихдээ 4 URL-ийг cascade болохоос өмнө хадгална.

QPay invoice/QR үүсгэх, payment verification, authorization, rate limit, үндсэн write, export response, assistant-ийн хариу нь хүсэлтийн үр дүнд шаардлагатай тул синхрон хэвээр. Vaccine/medicine reminder endpoint нь аль хэдийн cron ажил: v99/v100 claim + join + page хамгаалалтыг өөрчлөөгүй. Browser дээрх зураг шахах/embedding нь серверийн HTTP handler дотор ажилладаггүй.

## Гүйцэтгэл ба баталгаа

- Shared `lib/backgroundJobs.ts`: Next.js `after()` нь response явсны дараа worker ажиллуулна. Жирийн detached Promise эсвэл `setTimeout` ашиглахгүй. `after` нь function duration-аар хязгаарлагддаг тул ажил өөрөө DB queue-д хадгалагдана. [Next.js after](https://nextjs.org/docs/app/api-reference/functions/after).
- `background_jobs` нь RLS-тэй, browser role-уудад унших/бичих/execute эрхгүй. Job owner, payload, bucket, path, төлбөрийн төлөвийг browser-оос авахгүй.
- Sighting INSERT, content DELETE болон auth user DELETE-ийн trigger нь queue row-оо үндсэн mutation-тай нэг transaction-д бичнэ. Rollback бол job ч rollback болно. v99 RPC болон row lock-уудыг солихгүй.
- Nearby webhook нь secret + v102 rate limit шалгасны дараа зөвхөн `record.id`-г хэрэглэнэ. Recipient/content-ийг DB-ээс уншина. Enqueue унавал `503`; хадгалаагүй ажлыг амжилттай гэж хүлээн авахгүй. Webhook дамжуулагчийн delivery/retry баталгааг энэ өөрчлөлт шинээр бий болгохгүй.
- Claim нь `FOR UPDATE SKIP LOCKED`, нэг удаад нэг job, 120 секунд lease, UUID fencing token ашиглана. 60 секундийн function lifetime дууссаны дараа lease сэргээгдэх боломжтой. Хуучин/хугацаа дууссан lease ack/checkpoint хийж чадахгүй. [PostgreSQL SELECT](https://www.postgresql.org/docs/current/sql-select.html).
- Нэг invocation хамгийн ихдээ 10 job/page, шинэ claim хийх 20 секундийн budget-тэй. Эхэлсэн page дуусах хугацаа нэмэгдэж болно; бүх route `maxDuration = 60`.
- Push keyset page 20, зэрэг илгээх тоо 5, нэг outbound push timeout 3 секунд. Invalid endpoint рүү хүсэлт гаргахгүй; 404/410 endpoint-ийг ID + endpoint compare-and-delete хийнэ. Resolved/deleted pet-д илгээхээ зогсооно.
- Алдаа гарвал cursor-ийг урагшлуулахгүй; 20 секундээс exponential backoff, хамгийн ихдээ 8 оролдлого. Амжилттай page-ийн дараа attempt counter reset болно. Terminal `failed` job нь автоматаар алга болохгүй, Sentry болон audit-аар шалгана.
- Гаднын push delivery нь **at least once**. Push provider амжилттай авсны дараа worker crash бол дахин илгээж болно; stable push topic + service worker notification tag нь харагдах давталтыг багасгана. Яг нэг удаагийн delivery гэж амлахгүй.
- In-app notification нь sighting UUID-ийн unique constraint-аар давхардалгүй. Cleanup нь зөвхөн existing `ownedPetPhotoStoragePath`-аар баталсан project/owner folder-т хийгдэнэ. Одоо бусад зар ашиглаж буй URL-ийг distinct bounded RPC-ээр шалгаж хадгална; Storage service нь PostgreSQL transaction-д ордоггүй.
- Дууссан job-ийн payload арилна; dedupe key tombstone хадгалагдсанаар webhook retry дахин push үүсгэхгүй. Failed job payload нь асуудал засаж retry хийхэд хадгалагдана. Audit output-д payload/URL/token оруулахгүй.
- Worker болон job алдаа Sentry-д хувийн payload/endpoint/provider body-гүй очно. v101-ийн шинэ error email alert хэвээр ашиглагдана.

## Hobby deployment дараалал

Production DB/cron/Vault-д агент автоматаар өөрчлөлт оруулаагүй.

1. **Deploy-ээс өмнө** `supabase-background-jobs-v103.sql`-ийг Supabase SQL Editor-д ажиллуул. v96/v99/v100/v102 өмнөх migrations ажилласан байх ёстой. Энэ нь шинэ хүснэгт/RPC/trigger нэмнэ; хуучин application code-той нийцтэй. Missing migration-тай deploy хийхгүй.
2. Дөрвөн локал шалгалт тэнцсэний дараа commit/push, Vercel deploy.
3. **Deploy амжилттай болсны дараа** Supabase Dashboard → Vault-д дараах нэрээр secrets үүсгэ:
   - `mur_background_worker_url`: `https://mur-chi.vercel.app/api/background-jobs`
   - `mur_background_worker_cron_secret`: Vercel Production дахь **яг ижил** `CRON_SECRET` (16-аас доошгүй тэмдэгт). Нууцыг файл/Git/chat-д хуулж болохгүй.
4. `supabase-background-jobs-v103-scheduler.sql`-ийг SQL Editor-д ажиллуул. Энэ нь `pg_cron` + `pg_net`-ээр минут тутам private worker endpoint-ийг сэрээнэ; secret нь Vault-оос уншигдана. [Supabase scheduling + Vault](https://supabase.com/docs/guides/functions/schedule-functions), [Cron install](https://supabase.com/docs/guides/cron/install).
5. `audits/background-jobs-v103-readonly.sql`-ийг ажиллуул. Эхний 4 invariant `true`, scheduler тохируулсан үед overdue/expired/failed job өсөхгүй байх ёстой. Supabase Cron history болон `pg_net` HTTP response-ийг шалга: `202` нь worker сэрэх хүсэлт хүлээн авсныг илэрхийлнэ; delivery дууссаны баталгаа нь queue status юм.

Vercel Hobby нь өдөрт нэгээс олон ажиллах cron expression-ийг deploy дээр хориглодог. Тиймээс `vercel.json` дахь шинэ worker cron **өдөрт нэг удаагийн recovery**, минутын scheduler нь Supabase талд байна. Supabase scheduler тохируулаагүй бол queued job-ууд request wake-up эсвэл өдөр тутмын recovery хүртэл хүлээж болно. [Vercel cron limits](https://vercel.com/docs/cron-jobs/usage-and-pricing).

Clipboard команд нь SQL-ийг **зөвхөн хуулна**. Supabase SQL Editor → Paste → Run хийж байж ажиллана.

```powershell
Set-Location 'D:\Mur\mur-mvp'
Get-Content .\supabase-background-jobs-v103.sql -Raw | Set-Clipboard
```

Pre-deploy SQL амжилттай болсны дараа:

```powershell
npm run typecheck; if ($LASTEXITCODE -ne 0) { throw 'Typecheck failed' }
npm run lint; if ($LASTEXITCODE -ne 0) { throw 'Lint failed' }
npm test; if ($LASTEXITCODE -ne 0) { throw 'Tests failed' }
npm run build; if ($LASTEXITCODE -ne 0) { throw 'Build failed' }
git add -A; if ($LASTEXITCODE -ne 0) { throw 'Git add failed' }
git commit -m "perf: move notification delivery and file cleanup to background jobs"; if ($LASTEXITCODE -ne 0) { throw 'Commit failed' }
git push origin main
```

Deploy-ийн дараах scheduler SQL:

```powershell
Get-Content .\supabase-background-jobs-v103-scheduler.sql -Raw | Set-Clipboard
```

## Локал шалгалт

- `npm run typecheck` — PASS.
- `npm run lint` — PASS.
- `npm test` — 54 файл / 312 тест PASS.
- `npm run build` — PASS; шинэ private worker route build-д орсон.
- PGlite/PostgreSQL: migration хоёр удаа ажиллах, transaction rollback/outbox, v99 inactive/retry invariant, dedupe, live/expired/replaced lease fencing, cursor progress, 8-attempt backoff, cascade-ийн өмнөх photo snapshot, auth cleanup trigger, RLS/service-only RPC, read-only audit — PASS.

PGlite нь нэг backend ашигладаг. Олон connection-ийн зэрэгцээ locking, Supabase `pg_cron`/`pg_net`/Vault integration, Vercel-ийн бодит after lifetime болон бодит push provider delivery-г production дээр туршаагүй. Production SQL, commit, push, deploy хийгээгүй.
