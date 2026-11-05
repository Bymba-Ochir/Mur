# Шалгалт

```powershell
npm run typecheck
npm run lint
npm test
npm run build
```

Unit/component тест `tests/`, Vitest тохиргоогоор ажиллана. Давтагдах алдааг expected утгыг сулруулж нуухгүй.

## Browser E2E

```powershell
npx playwright install chromium
npm run test:e2e
```

`playwright.config.ts` нь desktop Chromium болон Pixel 7 emulation гэсэн хоёр project-той. Локалд dev server автоматаар эхлүүлнэ; CI үед урьдчилж server асаасан байх ёстой. `PLAYWRIGHT_BASE_URL` custom URL өгсөн ч локал webServer тохиргоо localhost хэвээр байдаг тул config болон target-аа тулгаж ажиллуул.

Emulation нь бодит Android/iOS төхөөрөмжийн push, keyboard, Safari болон touch зан төлөвийг бүрэн орлохгүй.

## Release test matrix

| Урсгал | Батлах зүйл |
|---|---|
| Guest | Жагсаалт үзэх, хамгаалагдсан form-д login шаардах |
| Эзэмшигч | Өөрийн зар/амьтныг засах, давхар submit хориглох |
| Өөр хэрэглэгч | Бусдын profile settings, messages, medical record-д хандахгүй |
| Admin | Энгийн хэрэглэгч admin RPC/үйлдэл хийж чадахгүй |
| Алдаа | Offline, API 401/403/429/500 үед ойлгомжтой UI |
| Хэл/theme | Монгол/англи, dark/light, keyboard focus |
| Responsive | 360, 768, 1280px; overflow, modal close, navbar overlap |
| Интеграц | AI, QPay, push, cron-ийг тусдаа үр дүнгээр батлах |

Run бүрийн commit, орчин, команд, exit code, тестийн тоо болон батлагдаагүй хэсгийг release тэмдэглэлд бич.


## Magic-link ба local email

`tests/e2e/magic-link.spec.ts` нь зөвхөн `127.0.0.1:54321` Supabase, `127.0.0.1:54324` Mailpit болон зөвшөөрөгдсөн `localhost:3000` / `127.0.0.1:3000` app ашиглана. Login UI-аас local email хүсэж, зөвхөн санамсаргүй fixture хаягийн имэйлийг уншаад бодит нэг удаагийн холбоосоор нэвтэрнэ. Browser session-ийн user-ийг Auth API-аар verify хийж шалгана. Test account болон тухайн имэйлийг дуусахад устгана; shared inbox-ийг бүхэлд нь цэвэрлэхгүй.

Local Mailpit delivery нь production SMTP, domain DNS эсвэл гаднын inbox-д email очсоны баталгаа биш. Тэдгээрийг нээлтийн checklist-ийн дагуу тусад нь батална.
