# МӨР v74 — Shared Button

- Button-ийн хэв маягийг CSS Module болгон тусгаарлаж динамик raw CSS/nesting warning арилгасан.
- aria-expanded, aria-controls, aria-pressed болон бусад ARIA утгыг дамжуулна.
- Disabled link/anchor шилжилт, callback, disabled label файл сонголтыг хаана.
- Touch төхөөрөмж дээр жижиг товч хамгийн багадаа 44px өндөртэй.
- Урт текст мөр шилжинэ; keyboard focus болон reduced-motion төлөвтэй.

TypeScript, ESLint, 110 тест амжилттай. Webpack production build exit 0.
Build-д зөвхөн шалгалтын Supabase утга ашигласан. Бодит backend болон mobile browser харагдац баталгаажаагүй. Sentry/cache-ийн өмнөх warning build log-д үлдсэн.
SQL өөрчлөлтгүй. .env.local файлаа хадгална.

```powershell
Expand-Archive `
  -Path "C:\Users\LENOVO\Downloads\mur-complete-upgrade-v74.zip" `
  -DestinationPath "D:\Mur\mur-mvp" `
  -Force
cd D:\Mur\mur-mvp
npm install
npm run typecheck
npm run lint
npm test
npm run build
```
