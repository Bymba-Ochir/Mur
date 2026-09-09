# v88 — хэл, title, accessibility

v87-ийн дараа одоогийн төсөл дээр задлах нэмэлт patch.

- Browser title нь орчуулагдсан h1-тэй синхрончлогдоно. Зар оруулах form тусгай, ялгаатай title-тай.
- Skip link, PawTrail болон Toast хаах шошго монгол/англи хэлтэй.
- Server SEO metadata-ийн locale routing шинэчлэл биш; JavaScript ачаалсны дараах browser title засвар.

Шалгах: npm run typecheck, npm run lint, npm test, npm run build.

Үлдсэн ажлууд: бодит mobile шалгалт; нэвтэрсэн хэрэглэгчийн зураг/зар/зурвасын урсгал; эмнэлгийн эх сурвалжийн баталгаажуулалт; эзэмшигчтэй өгөгдөл цэвэрлэх; AI/QPay/push/cron хүргэлт; build болон deploy. Supabase/Vercel удирдлагын холболт энэ орчинд олдоогүй. Өмнөх Sentry дамжуулалтын автомат approval хоригийг тойрч build хийгээгүй.
