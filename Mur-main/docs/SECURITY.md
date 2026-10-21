# Аюулгүй байдал ба нууцлал

Энэ баримт security certification биш. Snapshot код, production policy болон бодит эрхийн шалгалт гурвуулаа хэрэгтэй.

## Итгэлийн хил

Browser anon key нь нууц биш; RLS ба column/table grant өгөгдлийг хамгаална. Service-role key зөвхөн серверт байна. UI дээр товч нуух нь API authorization биш.

Нууц: service role, QPay password, Groq key, VAPID private key, webhook/cron secret, Sentry auth token. Git, ZIP, screenshot болон логт нийтлэхгүй. Ил гарвал эхлээд revoke/rotate, дараа нь түүхийг зохих журмаар цэвэрлэнэ.

## Одоогийн нээлттэй шалгалт

- Snapshot-ийн QPay callback болон vaccine cron secret байхгүй үед fail-open салбар байна; deploy өмнө засах.
- Өмнөх v93–v95 patch-ууд бүгд энэ ZIP-д орсон гэж үзэхгүй.
- Хэрэглэгчийн явуулсан production grant/policy-д paid donations бүх багана, profile notification_preferences public уншигдах боломж ажиглагдсан. Дараах SQL засварууд ажилласан эсэх батлагдаагүй.
- `email_verified` өөрчлөлтийг trigger хамгаалдаг эсэхийг шалгана.
- RLS асаалттай байх нь policy зөв гэсэн баталгаа биш. FORCE RLS false нь дангаараа алдаа биш.
- In-memory limiter нь instance тус бүрд; distributed хамгаалалт батлагдаагүй.
- Утас UI-д масктай байсан ч public query-д байвал нууцлал биш.

## Шалгах арга

Staging дээр guest, A хэрэглэгч, B хэрэглэгч, admin гэсэн эрхээр ижил үйлдлийг шалга. A нь B-ийн medical record, conversation, notification/settings-ийг унших/өөрчлөхгүй байх ёстой. Storage устгал зөвхөн эзэмшигчийн объектод үйлчлэх ёстой.

Supabase policy, grants, trigger/function тодорхойлолтыг review хийнэ. TRUNCATE зэрэг шаардлагагүй эрхийг цуцлахдаа schema болон function dependency-г шалга. Нийтэд зориулсан donation/profile projection-ийг private багануудаас тусгаарлана.

## Incident

Нөлөөлсөн endpoint/үйлчилгээг хязгаарла; нууц түлхүүрийг rotate; нууц агуулаагүй лог, хугацаа, commit-ийг хадгал; засварыг staging-д шалгаад deploy хий. Public issue-д token эсвэл хэрэглэгчийн хувийн мэдээлэл оруулахгүй. Private мэдээлэх тусгай суваг repository-д тогтоогдоогүй тул эзэмшигчтэй хамгаалагдсан сувгаар тохирно.
