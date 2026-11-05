# Нийтэд нээх бэлтгэл

Энэ жагсаалт нь код бэлэн эсэх болон provider дээрх бодит ажиллагааг тусад нь батална. Local app, test, backup tool-оос production database-д холбогдохгүй. Production SQL-ийг зөвхөн оператор Dashboard дээр review хийж ажиллуулна.

## Батлагдсан зүйл

- 2026-11-05: `762e65a` commit-ийн [GitHub CI](https://github.com/Bymba-Ochir/Mur/actions/runs/41867006497) гурван job амжилттай дууссан. Node хувилбарын эх сурвалж `.nvmrc`.
- Vercel deployment completed гэсэн check-ийн зургийг эзэмшигч ирүүлсэн. Нээлтийн өмнө Deployment Details дахь commit-ийг тухайн release-тэй тулгана.
- Утас нуух, чатын эрх, rate limit, idempotency, background queue, Sentry-ийн код бий. Энэ нь production migration, scheduler, email delivery ажиллагааны баталгаа биш.
- Нууцлалын Монгол/Англи тайлбар утас нуух, чат, Sentry, зөвшөөрөлтэй Analytics, Groq болон зураг цэвэрлэх тусдаа ажлыг тайлбарлана. Legal хуудсууд одоо байгаа Feedback сувгийг ашиглана.

- Local backup-ийн 75 хүснэгтийн мөрийн тоо, 29 migration, RLS/policy/trigger-ийг тусгаарласан restore дээр тулгасан; хүрээ болон хязгаарыг [backup тайлангаас](BACKUP.md#2026-11-05-ны-local-restore-шалгалт) харна. Production backup батлагдсан гэсэн үг биш.
- Нууцлалын хуудсанд analytics зөвшөөрөх/татгалзах сонголтоо дахин өөрчлөх удирдлага бий. Өөр tab-ийн сонголттой синхрончлогдоно.

- 2026-11-05: Local Mailpit-аас UI-д хүссэн magic link-ээр desktop/mobile browser-т нэвтэрч, үүссэн session-ийг Auth API-аар баталсан. Зөвхөн зориулалтын local account болон имэйлийг үүсгэж/устгасан. Энэ нь production SMTP-ийн баталгаа биш.

## Нээхээс өмнө

| Шалгалт | Дууссаны нотолгоо |
|---|---|
| Domain | Нэр эзэмшигчийн account-д бүртгэлтэй; сунгалт, MFA идэвхтэй; Vercel Domains дээр DNS/HTTPS зөв. Domain авахаас өмнө сул байдал, сунгалтын үнэ, эзэмшигчийг шийднэ. |
| Domain солих | `NEXT_PUBLIC_SITE_URL`, Supabase Auth Site URL/allowed redirects, QPay шинэ invoice callback, sitemap/canonical болон worker scheduler URL-ийг тулгасан. Өмнө үүссэн invoice callback болон secret-ийг зүгээр хүчингүй болгохгүй. |
| Нэвтрэх email | Custom SMTP-аас багийн гишүүн биш хоёр өөр хаягт magic link очиж, зөв domain руу нэвтрүүлсэн. SPF/DKIM болон provider-ийн заасан DNS тохиргоог баталсан. SMTP илгээгч нь support inbox-оос тусдаа үйлчилгээ байж болно. |
| Production migrations | [Deployment](DEPLOYMENT.md), [Database](DATABASE.md)-ийн дагуу өмнө хэрэглэсэн түүхтэй тулгаж, зөвхөн хэрэгтэй шинэ migration-уудыг review хийсэн. Imported history-г бүхэлд нь дахин ажиллуулахгүй. Backup болон rollback нийцлийг батална. |
| Өгөгдлийн эрх | Guest, A/B хэрэглэгч, admin эрхээр шалгасан. B нь A-ийн нуусан утас, чат, хувийн бүртгэлд хандахгүй. [Security](SECURITY.md)-ийн read-only audit-уудыг оператор ажиллуулсан. |
| Background queue | Supabase scheduler болон Vault worker URL/secret тохирсон; job queued → completed болж, failed/expired ажил өсөхгүй. Vercel-ийн өдөр тутмын recovery дангаараа минутын delivery батлахгүй. [Заавар](DEPLOYMENT.md#интеграц). |
| Backup | Managed backup-ийн огноо/retention, зураг объектын тусдаа нөөц тодорхой; тусдаа test орчинд restore хийж мөр, эрх, зураг тулгасан. [Backup](BACKUP.md). |
| Алдааны alert | Production event Sentry-д ирж, эзэмшигч мэдэгдэл авсан. Нууц болон хэрэглэгчийн өгөгдлийг тестийн алдаанд оруулахгүй. Хуучин issue-д шинэ event нэмэх нь new-issue alert-ийг дахин өдөөхгүй байж болно. [Error tracking](ERROR-TRACKING-v101.md). |
| Төлбөр | QPay merchant/live тохиргоо болон invoice → provider verification → paid урсгал шалгагдсан; callback давтахад давхар өөрчлөлт үүсэхгүй. Sandbox амжилттай байх нь live төлбөрийн баталгаа биш. |
| Модераци | Санал хүсэлт, мэдээлсэн заруудыг хэн хэзээ шалгах нь тодорхой; туршилтын зар, хувийн мэдээллийг нийтэд үлдээгээгүй. |
| Зардал | Provider тус бүрийн одоогийн plan, хэрэглээний limit, alert, төлбөрийн эзэмшигч тодорхой. Төлбөртэй plan-ийг хэрэглэгчийн шийдвэргүй идэвхжүүлэхгүй. |

2026-11-05-ны public HTTP болон dependency шалгалт, засвар, үлдсэн advisory-ийн хүрээг [техникийн тайлангаас](../audits/SECURITY-LAUNCH-20261105.md) харна.

## Mur-ийн managed орчинд тааруулах нь

- Mur нь Next.js/React, Vercel, Supabase ашиглана. VPS-ийн Nginx/Caddy, pm2, certbot, SSH/ufw тохиргоо одоогийн hosting-д хамаарахгүй. Vercel production build/deploy болон domain-ийн TLS-ийг хариуцна. Local VM-ийн аюулгүй байдал нь тусдаа, production hosting биш.
- Domain DNS-ийн A/CNAME утгыг Vercel **Settings → Domains** дээр тухайн domain-д харуулснаар оруулна. Дурын серверийн IP/AAAA бичлэг нэмэхгүй. DNS зөв болсон үед Vercel certificate үүсгэж, сунгалтыг автоматаар оролддог. Domain бүртгэлийн сунгалт нь certificate сунгалтаас тусдаа.
- `NEXT_PUBLIC_SITE_URL`-ийг шинэ domain-тай тааруулж rebuild хийнэ. Browser-ийн database guard зөвшөөрөгдсөн hostname-уудаа build үед авдаг тул зөвхөн DNS солих нь хангалтгүй.
- Supabase publishable/legacy anon key болон Sentry ingestion DSN нь browser-д харагдах public тохиргоо. Service-role/secret key, QPay/Groq credential, cron secret, Sentry auth token нь серверийн нууц. Public key харагдсаныг secret leak гэж андуурахгүй; RLS, grants, verified user болон server authorization-ийг шалгана.
- Одоогийн нэвтрэлт magic link ашиглаж, Supabase browser session ба серверээр verify хийсэн Bearer token-оор ажиллана. Cookie-auth хэрэглэдэг системийн HttpOnly/CSRF жишээг шууд хуулж authentication-ийг солихгүй. Cookie ашигладаг privileged route нэмэх бол түүнд тохирсон CSRF/origin хамгаалалтыг тусад нь загварчилна.
- Hosted Supabase-ийн public Data API нь зориуд browser-оос дуудагдана. PostgreSQL network restrictions, credential ба SSL тохиргоог Dashboard дээр шалгахын зэрэгцээ хүснэгтийн RLS/grant-ийг батална. Production database-ийн сүлжээ, эрхийг local скриптээр автоматаар өөрчлөхгүй.
- `npm run audit:security` нь moderate/high/critical advisory илэрвэл амжилтгүй гарна; CI quality job мөн ажиллуулна. 2026-11-05-ны hardening audit бүх severity 0 болсон. GitHub check унах нь Vercel automatic deploy-г дангаараа зогсоодог гэсэн баталгаа биш: release хийхдээ CI болон deployment-ийг хамтад нь батална.
- 2026-11-05-нд production-ийн HTTP → HTTPS 308 redirect, CSP/HSTS/frame/nosniff header болон `/.env`, `/.env.local`, `/.git/HEAD`, `/.git/config`-ийн 404 хариуг шалгасан. Энэ нь бүх route, Git history эсвэл нууц түлхүүрийн бүрэн аудит биш. CSP nonce hardening дууссан: production JavaScript inline/eval зөвшөөрөл хасагдсан; AI WASM болон map/React style attribute-ийн нарийн зөвшөөрөл үлдсэн. HTML dynamic/private/no-store болсон тул Vercel function usage-г хянана. JSON cap болон streamed/paged export мөн нэмэгдсэн; DB schema өөрчлөөгүй.

Эх сурвалж: [Vercel domain](https://vercel.com/docs/domains/working-with-domains/add-a-domain), [TLS](https://vercel.com/docs/domains/working-with-ssl), [Supabase API key](https://supabase.com/docs/guides/getting-started/api-keys), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).

## Хоёр хэрэглэгчтэй smoke test

1. Гаднын email-аар нэвтрэх; logout; хуучин/дахин хэрэглэсэн magic link-ийг шалгах.
2. A lost/found зар зурагтай үүсгэж, B хайлт/дэлгэрэнгүйгээс харна. A засаж, resolved болгоод шинэ sighting зөвшөөрөгдөхгүйг шалгана.
3. Lost/found, adoption, sitting тус бүр дээр A утсаа нууна. Guest болон B-ийн HTML/API response-д дугаар байхгүй; чатаар холбогдож болно. A дугаараа ил болгоод буцааж нууна.
4. A/B чатаар зурвас солилцож, unread болон block үйлдлийг шалгана. Гуравдагч account чат уншихгүй.
5. Mobile дээр зураг сонгох, ноорог сэргээх, газрын зураг, клавиатуртай form ашиглах, цуцалсан upload/retry-г шалгана.
6. Guest Feedback илгээж, admin дээр харагдсаныг шалгана. Legal хуудасны Feedback мөн нэг нийтлэг modal нээнэ.
7. Account export/delete болон зураг цэвэрлэх job-ийг зөвхөн зориулалтын туршилтын account дээр шалгана.

Production дээр эдгээр туршилтыг оператор гүйцэтгэнэ. Local acceptance test нь зөвхөн local Supabase ашиглана.

## Нээлтийн дараа

Эхлээд 20–30 хэрэглэгчтэй туршилтын нээлт хийнэ. Зар нийтэлж дууссан эсэх, нэвтрэх email delivery, failed job, report/feedback болон бодит зардлыг өдөр бүр шалгана. Алдаа гарвал [rollback](DEPLOYMENT.md#буцаах)-ийг эхэлж хийж, дараа нь шалтгааныг судална. Database schema-г app rollback автоматаар буцаахгүй.
