> ТҮҮХЭН ЛАВЛАГА: одоогийн заавар биш. [Нэгтгэсэн deploy заавар](../DEPLOYMENT.md)-ыг ашиглана.

# v86 — Нууцлал, орчуулга, эмнэлгийн хүсэлт
Нэмэлт ZIP: одоогийн төсөл дээр задлах. Нэмэлт dependency/migration байхгүй.

## Хийсэн
- Кодын lat/lng хадгалалттай нийцүүлэн MN/EN нууцлалын байршлын тайлбар шинэчлэв.
- Privacy огноог шинэчлэв; legal огнооны давхар prefix арилгав, холбоотой баримтын текстийг тусдаа мөр болгов.
- Theme товч, алхмын жагсаалтын accessibility шошгыг хэлтэй холбов.
- Theme дарах талбайг touch-target болгож томруулав.
- Энэрэхийн Даваа–Баасан дотор Пүрэвийг давхар бичсэн тайлбарыг тусад нь ялгав. Цагийг гаднын эх сурвалжаар шинээр баталгаажуулаагүй; verifiedAt-ийг өөрчлөөгүй.
- Appointment хүсэлт нь баталгаатай цаг биш гэдгийг modal болон success текстэд тодруулав; залгах холбоос нэмэв.
- Илгээх үед давхар submit, modal хаах/цуцлахыг хориглов; огноо Улаанбаатарын timezone-оор гарна.
- Mobile/Desktop 360/390/768/1366px public acceptance тест бэлдэв.

## Шалгасан
TypeScript, lint амжилттай. Vitest 140/140 (27 файл).
Responsive E2E-г ажиллуулаагүй. Build/deploy хийгээгүй. Өмнөх автомат approval review Sentry source-map/telemetry эрсдэлээр build хориглосон тул дахин оролдоогүй.

## Орон нутагт mobile тест ажиллуулах
npm run test:e2e -- tests/e2e/audit-responsive.spec.ts --project=chromium
Энэ нь localhost:3000 dev server ашиглана. Browser binary байхгүй бол Playwright-ийн шаардлагатай Chromium-ийг өөрийн орчинд суулгана.
Энэ тест нь screenshot-based visual review-г орлохгүй; keyboard, dropdown, chat composer-ийг төхөөрөмж дээр давхар шалгана.

## Дуусаагүй, бодит хандалт/баталгаажуулалт шаардсан ажил
1. Тестийн зар архивлах ба нэгжгүй насыг засах: v85-ийн read-only SQL-ээр ID-уудыг шалгаж, эзэмшигчээс баталгаажуулах. Одоогоор production өөрчлөөгүй.
2. Эмнэлгийн цаг, үйлчилгээ: эмнэлэг/албан хуудаснаас дутуу мэдээллийг баталгаажуулах. Зохиомол утга нэмээгүй.
3. Эмнэлэгт хүсэлт хүргэх: clinic operator бүртгэл, delivery integration байхгүй тул одоогийн insert амжилтыг booking confirmation гэж үзэхгүй.
4. Нэвтрэх email → зар upload/save/edit → Messages → My Pets/vaccine урсгал: хэрэглэгчийн session-тай staging тест хэрэгтэй.
5. AI upstream timeout/error, QPay callback, push/cron хүргэлт: production credentials/тестийн орчинд end-to-end баталгаажуулах. Ажилласан гэж тэмдэглээгүй.
6. Privacy бусад өгүүлбэр (имэйл харагдах хүрээ, гуравдагч үйлчилгээ, холбоо барих хаяг, retention) нь операторын бодит тохиргоотой дахин тулгах шаардлагатай. Энэ багц хуулийн нийцлийг баталгаажуулаагүй.

## Суулгах
Expand-Archive ашиглан D:\Mur\mur-mvp дээр задлаад npm run typecheck, npm run lint, npm test, npm run build ажиллуулна.
