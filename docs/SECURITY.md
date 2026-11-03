# Аюулгүй байдал ба нууцлал

Release бүрт кодын хамгаалалт, production policy болон хэрэглэгчийн бодит эрхийг тусад нь шалгана.

## Итгэлийн хил

Browser anon key нь нууц биш; RLS ба column/table grant өгөгдлийг хамгаална. Service-role key зөвхөн серверт байна. UI дээр товч нуух нь API authorization биш.

Нууц: service role, QPay password, Groq key, VAPID private key, webhook/cron secret, Sentry auth token. Git, ZIP, screenshot болон логт нийтлэхгүй. Ил гарвал эхлээд revoke/rotate, дараа нь түүхийг зохих журмаар цэвэрлэнэ.

## Код дахь хамгаалалт

- QPay callback болон vaccine cron нь серверийн нууц утгыг шалгана. [Төлбөрийн callback](DEPLOYMENT.md#интеграц) нь төлбөрийн төлөвийг QPay API-аар баталгаажуулна.
- API хүсэлтийн хязгаар нь [PostgreSQL counter](../audits/API-RATE-LIMITS-v102.md)-т тулгуурлана. Counter ажиллахгүй үед хамгаалагдсан хүсэлт 503 авна.
- [Локал DB guard](LOCAL-DATABASE.md) нь хөгжүүлэлт болон тестийн процессыг production Supabase-ээс тусгаарлана.
- Production grant, RLS болон public projection-ийг [read-only audit](../audits/security-readonly-v95.sql)-аар шалгана.

## Шалгах арга

Staging дээр guest, A хэрэглэгч, B хэрэглэгч, admin гэсэн эрхээр ижил үйлдлийг шалга. A нь B-ийн medical record, conversation, notification/settings-ийг унших/өөрчлөхгүй байх ёстой. Storage устгал зөвхөн эзэмшигчийн объектод үйлчлэх ёстой.

Supabase policy, grants, trigger/function тодорхойлолтыг review хийнэ. TRUNCATE зэрэг шаардлагагүй эрхийг цуцлахдаа schema болон function dependency-г шалга. Нийтэд зориулсан donation/profile projection-ийг private багануудаас тусгаарлана.

## Incident

Нөлөөлсөн endpoint/үйлчилгээг хязгаарла; нууц түлхүүрийг rotate; нууц агуулаагүй лог, хугацаа, commit-ийг хадгал; засварыг staging-д шалгаад deploy хий. Public issue-д token эсвэл хэрэглэгчийн хувийн мэдээлэл оруулахгүй. Private мэдээлэх тусгай суваг repository-д тогтоогдоогүй тул эзэмшигчтэй хамгаалагдсан сувгаар тохирно.
