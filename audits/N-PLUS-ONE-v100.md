# N+1 query audit — v100

Суурь: `ef10173e3ddbc4eb97b8b8584f47c901667d75cd` (`main`, v99).
Локал HEAD болон GitHub `refs/heads/main` таарсан.

## Илэрсэн, зассан N+1

`app/api/vaccine-reminders/route.ts` дотор хоёр урсгал:

| Урсгал | Өмнө | Одоо |
| --- | --- | --- |
| Вакцины сануулга | Claim page → хэрэглэгч бүрээр subscription SELECT → reminder бүрээр UPDATE | Claim + `JOIN LATERAL` subscription нэг RPC → page-ийн нэг UPDATE |
| Эмийн сануулга | Claim page → хэрэглэгч бүрээр subscription SELECT → reminder бүрээр UPDATE | Claim + `JOIN LATERAL` subscription нэг RPC → page-ийн нэг UPDATE |

Өмнөх request cache нь нэг хэрэглэгчийн давтан SELECT-ийг багасгадаг боловч
өөр өөр хэрэглэгчдийн тоогоор query өсдөг байсан. Одоо нэг хоосон биш page-д
нэг RPC, тэмдэглэх мөр байвал нэг UPDATE хийнэ. Хоосон төгсгөлийн page-д
зөвхөн нэг RPC хийнэ. Push provider руу төхөөрөмж бүрд илгээх хүсэлт нь DB query биш.

RPC нь 100 reminder, reminder бүрд 50 subscription хүртэл буцаана.
`(user_id, id)` index нь хэрэглэгчийн subscription lookup болон тогтвортой
эрэмбийг дэмжинэ. Бүх subscription-ийг browser эсвэл app server руу урьдчилан татахгүй.

Нийтлэг delivery/pagination/batch update логик `lib/serverReminderDelivery.ts`-д байна.
v99-ийн claim функцууд өөрчлөгдөөгүй: atomic claim, `FOR UPDATE SKIP LOCKED`,
өдрийн claim guard хэвээр. Batch UPDATE нь `reminder_claim_date`-ийн
compare-and-set шүүлтийг хадгална. Зөвшөөрөгдөх push endpoint-ийн шалгалт,
cron authentication, амжилтгүй push-ийг тэмдэглэхгүй байх дүрэм хэвээр.
Шинэ RPC-ууд зөвхөн `service_role` эрхтэй; browser-д endpoint/keys нээгдэхгүй.

## Шалгасан бусад query замууд

`app/`, `lib/`, `components/` дахь Supabase `.from()` / `.rpc()` дуудлагууд,
service дуудагдах давталтууд болон жагсаалтын child component-уудыг шалгасан.

- Pet/adoption жагсаалт, favorites, admin reports/content: зураг тус бүрээр
  SELECT хийдэггүй; `hydrateListingPhotos` нэг `.in()` batch query ашигладаг.
- Chat participant profile-ууд болон pet photo-ууд: `.in()` batch; N+1 биш.
- Account export/delete: photo repository-ууд owner ID-уудыг batch-аар авдаг.
  Тогтмол гурван хүснэгтийн DELETE давталт нь record-ийн тоогоор өсдөггүй.
- Pet/adoption/sitting/clinic card-ууд: render бүрд DB query хийдэггүй.
- `FavoriteButton`, `VolunteerBadge`, profile, health, bookings, sightings:
  одоогийн caller-ууд нэг detail/сонгосон entity дээр ажилладаг; list-ийн
  record бүрд query үүсгэдэггүй. `VerificationBadge` одоогоор caller-гүй.
- Adoption navigation restore болон reminder claim loop: жижиг page-үүдийг
  дарааллаар татдаг pagination; related row бүрийн SELECT биш.
- Upload, idempotency retry, ownership validation, conditional write query-үүд:
  entity list-ийн N+1 биш; хамгаалалтуудыг хэвээр үлдээсэн.

Нэмэлт ажиглалт: `fetchConversationList` бүх message history-г batch-аар
татаж байна. Энэ нь N+1 биш, overfetch асуудал тул энэ засварт оруулаагүй.
Тусдаа bounded conversation/message pagination болон last-message/unread
aggregate хэрэгтэй. Бүх query-г join болгон солих нь pagination болон
normalization rollout compatibility-г шаардлагагүй өөрчлөх тул хийгээгүй.

Энэ нь source audit; production query trace/EXPLAIN хэмжилт хийгээгүй.

## Нэвтрүүлэх дараалал

1. v99 pre-deploy migration суусан эсэхийг баталгаажуулна.
2. `supabase-n-plus-one-v100.sql`-ийг Supabase SQL Editor-д **гараар Run** хийнэ.
3. `audits/n-plus-one-v100-readonly.sql` ажиллуулахад бүх `passed` нь `true` байна.
4. Кодыг deploy хийнэ. Шинэ RPC байхгүй бол cron 500 буцаана;
   хуучин claim RPC рүү fallback хийж claim давхардуулдаггүй.
5. v99-ийн post-deploy/audit дарааллыг мөн баримтална.

Production DB migration, commit, push, deploy автоматаар хийгээгүй.
Production эвдэрвэл эхлээд өмнөх working deployment руу rollback хийнэ.
Migration additive тул өмнөх код хуучин RPC-уудыг үргэлжлүүлэн ашиглаж чадна.

`Get-Content ... | Set-Clipboard` нь SQL текстийг зөвхөн хуулна; SQL ажиллуулахгүй.
