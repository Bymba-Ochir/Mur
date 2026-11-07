# Deploy ба буцаах

## Deploy-оос өмнө

- [Аюулгүй байдлын шалгалт](SECURITY.md) болон [release тестүүдийг](TESTING.md) хий.
- [Database backup](BACKUP.md) болон staging migration үр дүнг хадгал.
- [ENVIRONMENT](ENVIRONMENT.md)-ийн шаардлагатай утгыг Vercel дээр тохируул.
- Supabase Auth redirect URL бодит домэйнтэй нийцсэн эсэхийг шалга.
- `npm ci`, `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` амжилттай байх.

## Git ба Vercel

ZIP-ээс задласан хавтас Git repository биш байж болно. Existing clone-оо ашигла; origin-ийг мэдэхгүйгээр `git init`/force push хийхгүй.

```powershell
npm run db:check; if ($LASTEXITCODE -ne 0) { throw 'Migration check failed' }
npm run typecheck; if ($LASTEXITCODE -ne 0) { throw 'Typecheck failed' }
npm run lint; if ($LASTEXITCODE -ne 0) { throw 'Lint failed' }
npm test; if ($LASTEXITCODE -ne 0) { throw 'Tests failed' }
npm run build; if ($LASTEXITCODE -ne 0) { throw 'Build failed' }
git add -A; if ($LASTEXITCODE -ne 0) { throw 'Git add failed' }
git commit -m "chore: describe this release"; if ($LASTEXITCODE -ne 0) { throw 'Commit failed' }
git push origin main
```

v104: Local app/CI нь production DB ашиглахгүй. Local setup болон migration
workflow-г [LOCAL-DATABASE](LOCAL-DATABASE.md), [DATABASE](DATABASE.md)-аас хар.
Одоогийн production DB дээр imported migration history-г бүхэлд нь ажиллуулахгүй.
Production schema/history reconciliation нь тусдаа manual review; CI нь зөвхөн
local DB үүсгэж шалгана, production migration автоматаар ажиллуулахгүй.

Санал хүсэлтийн урсгалыг deploy хийхээс өмнө [site feedback migration](../supabase/migrations/20261103141000_site_feedback.sql)-ийг Supabase SQL Editor-д ажиллуул. Deploy-ийн дараа footer-оос туршилтын санал илгээж, `/admin` дахь **Санал хүсэлт** таб дээр харагдаж байгааг шалга.

Админы устгах үйлдлийг deploy хийхээс өмнө [admin delete feedback](../supabase/migrations/20261103142500_admin_delete_feedback.sql) болон [feedback audit засвар](../supabase/migrations/20261103143000_fix_feedback_delete_audit.sql)-ыг энэ дарааллаар SQL Editor-д ажиллуул.

Vercel дээр deploy commit, environment, build log-ийг тулгана. Өмнөх release checklist-ууд [архивт](archive/) бий.

## Интеграц

### Google-ээр нэвтрэх

1. [Google Auth Platform](https://console.cloud.google.com/auth/overview) дээр External audience сонгож, Web application төрлийн OAuth client үүсгэнэ. Google-ийн Authorized redirect URIs талбарт Supabase-ийн Authentication → Sign In / Providers → Google хэсэгт үзүүлсэн .../auth/v1/callback хаягийг хуулна.
2. Supabase-ийн Google provider-д Client ID, Client Secret-ийг хадгалж идэвхжүүлнэ. Authentication → URL Configuration → Redirect URLs жагсаалтад https://mur-chi.vercel.app/auth/complete хаягийг нэмнэ.
3. Vercel-ийн Production орчинд NEXT_PUBLIC_GOOGLE_LOGIN_ENABLED=true тохируулаад шинэ build deploy хийнэ. Тохиргоо идэвхжсэн үед имэйлийн холбоосыг хүсэлт гаргасан хөтөч дээр нээнэ.
4. Өмнө нь бүртгүүлсэн баталгаажсан ижил имэйлтэй Google бүртгэлээр орж, өөрийн зар, профайл харагдаж байгааг шалгана. Нийтэд нээхдээ Google-ийн Audience → Publish app тохиргоог шалгана.

`vercel.json` дахь өдөр тутмын cron нь `/api/vaccine-reminders`-ийг 02:00 UTC, `/api/background-jobs`-ийг 03:00 UTC-д дуудна. Cron-д `Authorization: Bearer ...` шаардлагатай.

Pets INSERT webhook ашиглаж байгаа бол `/api/notify`-ийн `x-webhook-secret` header нь `NOTIFY_WEBHOOK_SECRET`-тэй таарна. Queue, scheduler болон rollback дарааллыг [background jobs тайлангаас](../audits/BACKGROUND-JOBS-v103.md) үзнэ.

QPay merchant тохиргоо, invoice/callback/status урсгалыг provider-ийн sandbox боломжтой бол тусгаарласан орчинд шалга. Dev mock нь бодит төлбөрийн баталгаа биш.

Шинэ нэхэмжлэл бүрт Mur `QPAY_CALLBACK_SECRET`-ээр гарын үсэг зурсан callback URL-ийг QPay-д бүртгэнэ. Callback нь тухайн нэхэмжлэлийн төлбөрийг QPay API-аас баталгаажуулж байж `paid` болгоно. `GET /api/donations/status` зөвхөн хадгалсан төлөвийг уншина.

Deploy-оос өмнө `NEXT_PUBLIC_SITE_URL` нь QPay-ээс хандах HTTPS хаяг мөн эсэхийг шалга. Өмнө бүртгэсэн нэхэмжлэлийн POST callback-ийг баталгаажуулахын тулд одоогийн `QPAY_CALLBACK_SECRET`-ийг хадгал. Хуучин callback URL-тэй нэхэмжлэлүүдийн төлөвийг нягтлаад, шинэ нэхэмжлэлийн callback-ийг QPay sandbox дээр шалга.

## Ноорог, зураг боловсруулах ажил, харсан мэдээлэл

[20261104120000_pet_image_jobs_and_live_sightings.sql](../supabase/migrations/20261104120000_pet_image_jobs_and_live_sightings.sql)-ийг шинэ кодоос өмнө Supabase SQL Editor дээр гараар ажиллуул. Өмнөх worker шинэ зургийн ажлыг авахгүй байхаар migration нь job төрлүүдийг тусгаарладаг. Schema буцаах SQL ажиллуулахгүйгээр өмнөх deploy-г сэргээж болно.

Шинэ worker нь одоо ашиглаж буй DINOv2-small q8 загварыг сервер дээр ажиллуулна. Эхний загвар таталт болон inference нь function-ийн хугацаа, CPU квотыг ашиглана. Жижиг зургийн ажлыг нэг нэгээр нь авч, нэг invocation-д дээд тал нь гурав боловсруулна. Model файлууд function-ийн түр хавтаст кэшлэгдэнэ. ONNX-ийн native CPU файлуудыг хоёр worker route-ийн output file tracing-д тусгайлан оруулсан. Зургийн job-д шинэ API key шаардлагагүй.

Cron-ийн одоо байгаа background-jobs endpoint өдөр бүр үлдсэн зургийн ажлыг сэргээнэ. Зар нийтлэх үеийн authenticated wake-up нь илүү эрт ажиллуулдаг. Байнгын алдаатай ажил найман оролдлогын дараа failed болно. Upload-ийн зураг солигдвол өмнөх job шинэ зургийн embedding-ийг дарж бичихгүй.

Ноорог нь browser-ийн IndexedDB-д хэрэглэгч болон lost/found төрлөөр тусдаа хадгалагдана. Зураг, талбар, байршил, алхам болон retry дугаарыг сэргээж, нийтэлсний дараа тухайн нооргийг арилгана. Хугацаа нь 7 хоног. Нууц горим, дүүрсэн storage эсвэл өөр tab-ийн зэрэгцсэн өөрчлөлтөөс хадгалж чадахгүй үед дэлгэцэд мэдэгдэнэ.

Харсан мэдээлэл Realtime-ээр шинэчлэгдэнэ. Холболт сэргээх болон харагдаж буй хуудсын fallback шалгалт нь нэг удаад 20 мөр уншина. Өмнөх мэдээллийг «Цааш үзэх»-ээр жижиг хуудсаар ачаална.

## Утасны нууцлал, бүх зарын чат

[20261104160000_listing_phone_privacy_and_chat.sql](../supabase/migrations/20261104160000_listing_phone_privacy_and_chat.sql)-ийг эхэлж, дараа нь [server timestamp guard](../supabase/migrations/20261104160500_server_listing_timestamps.sql)-ийг шинэ кодоос өмнө Supabase SQL Editor-д гараар ажиллуул. Өмнөх migration-уудыг бүхэлд нь дахин ажиллуулахгүй.

Алдсан/олдсон, үрчлүүлэх, асрах зар үүсгэх болон засахдаа «Утсаа нуух — зөвхөн чатаар холбогдох»-ыг сонгоно. Шинэ зарын энэ сонголт анх унтраалттай. Нуусан үед дугаар оруулах шаардлагагүй. Байгаа дугаарыг нуувал private schema-д хадгалж, нийтэд нээлттэй `phone` баганыг хоосолно. Эзэн засах үедээ л verified `auth.uid()`-аар хамгаалагдсан RPC-ээр өөрийн дугаарыг уншина. Нуух сонголтыг болиулахад хадгалсан дугаар сэргээнэ. Хуучин код руу rollback хийсэн ч DB trigger нууцалсан дугаарыг нийтэд гаргахгүй.

Үрчлүүлэх/асрах чат одоогийн conversations/messages болон participant/block хамгаалалтыг ашиглана. Listing-ийн эзнийг database-аас тогтооно. Нэг хэрэглэгчийн нэг зарын чат давхардахгүй; шинэ чат 20/цаг, зар нийтлэх 5/цаг хязгаар DB дээр сериалчлагдана. Inbox нэг удаад 20 харилцаа, зөвхөн сүүлийн мессеж болон unread тоог авна.

Local шалгалт: anonymous / өөр account-ийн REST, joined JSON, хувийн contact RPC болон HTML-ээс дугаар задрахгүй, эзний нуух/ил болгох, гурван төрлийн чат, block, duplicate retry болон устгалын cascade-ийг шалга.

## Deploy дараах шалгалт

Нүүр, жагсаалт, login/logout, зар оруулах, өөрийн зар засах, өөр хэрэглэгчийн мэдээлэлд хандахыг хориглох, messages, profile/settings, push, AI, төлбөрийг тус тус шалгана. Нэвтрэх болон төлбөрийн token логт үлдэхгүйг шалга.

## Буцаах

Өмнөх баталгаажсан deploy-г сэргээ. Database өөрчлөлтийг application rollback автоматаар буцаахгүй. Schema backward compatibility-г шалгаж, шаардлагатай бол тусдаа засварын migration хэрэглэ. Production database-г setup SQL-ээр дахин үүсгэхгүй.
