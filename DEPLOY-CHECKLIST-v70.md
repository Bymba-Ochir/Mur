# МӨР v70 — Mobile UI deployment checklist

## Энэ хувилбарын зорилго

v70 нь шинэ feature нэмээгүй. Одоо байгаа бүх public, authenticated, admin болон legal route-ийн mobile layout-ийг 360–430px өргөнд шалгаж, shared mobile суурийн зөрчлүүдийг зассан.

## Гол өөрчлөлт

- Horizontal overflow болон safe-area хамгаалалт
- iOS дээр input focus хийхэд автоматаар zoom хийхээс хамгаалсан 16px mobile input
- Бодитоор ашиглагдаагүй bottom navigation-ийн 58/76px phantom offset-ийг арилгасан
- Analytics, install prompt, toast-ийг жижиг дэлгэц дээр compact, давхцахгүй болгосон
- Floating notice байхад хуудасны хамгийн доод content хүрэх нэмэлт scroll зай
- Onboarding bottom sheet: Escape, background scroll lock, sticky action, safe-area
- Modal/drawer-ийн viewport ба focus хамгаалалтыг хадгалсан
- Pet profile detail: зураг, tab, vaccine, health, phone/contact хэсгийн mobile layout
- Activity summary-г 360px дээр нэг урт багана болгохгүй compact 3 үзүүлэлттэй хадгалсан
- Notifications card icon тусдаа мөр эзлэхгүй; toolbar болон touch target зассан
- Footer холбоос бүр 44px touch target
- Donation QR/error/paid state болон global error дэлгэцийн mobile төлөв
- Existing Indigo/Coral/Sky palette, dark/light theme, MN/EN текст хадгалагдсан

## Суулгах

```powershell
Expand-Archive `
  -Path "C:\Users\LENOVO\Downloads\mur-complete-upgrade-v70.zip" `
  -DestinationPath "D:\Mur\mur-mvp" `
  -Force

cd D:\Mur\mur-mvp

npm install
npm run typecheck
npm run lint
npm test
npm run build
```

## Git repository байхгүй бол

ZIP нь `.git` түүх агуулахгүй. Шинэ repository үүсгэх бол:

```powershell
cd D:\Mur\mur-mvp
git init
git branch -M main
git add .
git commit -m "Complete mobile UI audit and v70 improvements"
git remote add origin YOUR_GITHUB_REPOSITORY_URL
git push -u origin main
```

Хэрэв `origin` өмнө нь байгаа бол `git remote add origin` мөрийг дахин ажиллуулахгүй.

## Deploy хийсний дараах mobile smoke test

Chrome DevTools → Toggle device toolbar ашиглан дараах хэмжээгээр шалгана:

- 360 × 800
- 375 × 812
- 393 × 852
- 412 × 915
- Tablet: 768 × 1024

Route бүр дээр hamburger/account menu, form keyboard, modal close, image, long Mongolian/English text, dark/light theme, loading/empty/error state-ийг шалгана. Vercel deploy дууссаны дараа browser дээр `Ctrl + Shift + R` дарна.

## Автомат шалгалтын үр дүн

- TypeScript: амжилттай
- ESLint: 0 error, 0 warning
- Vitest: 96/96
- `git diff --check`: амжилттай

Энэ workspace-ийн production build Google Fonts домэйн руу сүлжээний хүсэлт гаргах үед орчны network policy-д хаагдсан. Source compile, TypeScript, lint болон test цэвэр; Windows/Vercel дээр `.env.local`-тай `npm run build`-ийг дээрх дарааллаар ажиллуулна.
