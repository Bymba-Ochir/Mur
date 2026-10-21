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

Run бүрийн commit, орчин, команд, exit code, тестийн тоо болон батлагдаагүй хэсгийг release тэмдэглэлд бич. Энэ docs шинэчлэлд application тест/build ажиллуулаагүй.
