# v89 — захиалга ба жагсаалтын урсгал

v88-ийн дараа одоогийн төсөл дээр задлах нэмэлт patch. Шинэ npm dependency байхгүй.

## Кодын өөрчлөлт
- Захиалгын form болон service Улаанбаатарын календарийн огноог ашиглана.
- Үнэгүй үйлчилгээний тооцоо 0, тодорхойгүй үнэ null хэвээр.
- Account/зар солигдоход захиалгын төлөв шинээр үүснэ. Хуучирсан хүсэлтийн хариуг үл хэрэгсэнэ; давхар илгээлтийг ref-аар хаана.
- Share холбоос returnTo параметрийг дамжуулахгүй.
- Үрчлүүлэлтийн жагсаалт өмнөх ачаалсан хуудсуудыг дахин татаж, scroll сэргээнэ. Санах хугацаа 30 минут, дээд хязгаар 100 нэмэлт хуудас; sessionStorage ажиллахгүй бол хэвийн эхний жагсаалт руу орно.
- Үнэ засах form нэг өдрийн үнэ, хоосон болон 0 утгын тайлбартай.

## SQL
supabase-workflows-v53.sql суусан staging database дээр эхлээд supabase-booking-integrity-v89.sql ажиллуул.
Migration нь баталгаажсан захиалгын sitter_id + багтаасан огнооны муж давхцахыг exclusion constraint-аар хаана. Хуучин давхардал байвал transaction бүхэлдээ зогсоно; ямар ч мөр автоматаар устгахгүй. Өгөгдөл шалгаж байж production-д ажиллуул.

Хуучин давхардлыг read-only шалгах:
```sql
select a.id, b.id, a.sitter_id
from public.sitting_bookings a
join public.sitting_bookings b on a.id < b.id and a.sitter_id = b.sitter_id
and a.start_date <= b.end_date and b.start_date <= a.end_date
where a.status = 'accepted' and b.status = 'accepted';
```

Staging дээр хоёр өөр customer-ийн ижил sitter, давхардсан огноотой pending захиалга үүсгээд эзэмшигчээр хоёр DB session-оос зэрэг accepted болгоход нэг нь л амжилттай байх ёстой. Хил залгаа давхцаагүй өдрүүд зөвшөөрөгдөнө; ижил төгсөх/эхлэх өдөр нь өдөр багтаасан тооцоогоор давхцал мөн.

Энэ орчинд PostgreSQL байхгүй тул migration болон зэрэгцээ transaction тест АЖИЛЛУУЛААГҮЙ.

## Шалгалт ба үлдсэн зүйлс
npm run typecheck
npm run lint
npm test
npm run build

Mobile харагдац, нэвтэрсэн хэрэглэгчийн E2E, эмнэлгийн бодит мэдээлэл, production өгөгдөл цэвэрлэгээ, AI/QPay/push/cron хүргэлт баталгаажаагүй. Production өгөгдөл өөрчлөөгүй. Өмнөх Sentry дамжуулалтын автомат approval хоригийг тойрч build/deploy хийгээгүй. Live дээр шинэ хувилбар гарсан гэж үзэхгүй.
