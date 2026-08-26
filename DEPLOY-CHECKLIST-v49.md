# МӨР v49 deploy checklist

## 1. Supabase security migration

Supabase → SQL Editor дээр `supabase-security-upgrade-v49.sql` файлыг бүхэлд нь
ажиллуулна. Энэ migration өгөгдөл устгахгүй; browser-оос шууд хийдэг хамгаалалтгүй
insert-үүдийг хааж, зөвхөн server API-аар бичдэг болгоно.

## 2. Vercel environment variables

Production болон Preview орчинд дараах утгууд байна:

- `SUPABASE_SERVICE_ROLE_KEY`
- `GROQ_API_KEY`
- `CRON_SECRET`
- `NOTIFY_WEBHOOK_SECRET`
- `QPAY_CALLBACK_SECRET`
- `VAPID_PRIVATE_KEY`
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`

Server-only утгуудад `NEXT_PUBLIC_` угтвар нэмж болохгүй. Өмнө repository-д орсон
VAPID private key-г дахин ашиглахгүй, шинэ хос үүсгэнэ:

```powershell
npx web-push generate-vapid-keys
```

Supabase webhook-ийн `x-webhook-secret` header нь `NOTIFY_WEBHOOK_SECRET`-тэй
яг ижил байна. Environment variable өөрчилсний дараа шинэ Production deployment
үүсгэнэ.

## 3. Шалгах

```powershell
npm install
npm run typecheck
npm run lint
npm test
npm run build
```

Дараа нь дараах урсгалыг нэг нэгээр шалгана:

- Нэвтэрч алдсан/олдсон зар нэмэх, устгахад зураг Storage-оос хамт арилах
- Зар мэдээлэх болон “Би харсан” мэдээлэл нэмэх
- Push дүүрэг сонгох, дараа нь өөр дүүрэг рүү солих
- QPay invoice үүсгэх, callback-аар төлбөрийн төлөв шинэчлэгдэх
- AI-д бэлэн жагсаалтад байхгүй асуулт тавих
- Cron endpoint secret-гүй хүсэлтэд 401, буруу server config үед 503 буцаах

## 4. Мал эмнэлгийн мэдээлэл

Өмнөх demo нэр, утас, хаягийг v49-д нийтэд харуулахгүй болгосон. Зөвхөн албан
эх сурвалжаар баталгаажсан нэр, утас, хаяг, ажиллах цаг, баталгаажуулсан огноотой
өгөгдөл бэлтгэсний дараа жагсаалтыг дахин идэвхжүүлнэ.
