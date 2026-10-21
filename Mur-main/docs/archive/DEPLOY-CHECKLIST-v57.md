> ТҮҮХЭН ЛАВЛАГА: одоогийн заавар биш. [Нэгтгэсэн deploy заавар](../DEPLOYMENT.md)-ыг ашиглана.

# МӨР v57 — UI detail pass 1

Энэ багц зөвхөн дараах хэсгийг сайжруулсан:

1. Нүүр хуудас
2. Navbar
3. Footer

Шинэ feature болон database schema нэмээгүй.

## Зассан зүйлс

- 1041–1180px өргөнд үндсэн navigation холбоосууд алга болдог асуудлыг зассан.
- Desktop, tablet, mobile navbar breakpoint-уудыг нэг мөр болгосон.
- Mobile menu-д backdrop, доторх close товч, Esc хаалт, focus trap болон focus return нэмсэн.
- Давхар `<header>` semantic алдааг арилгасан.
- Nested route дээр navbar/footer active төлөв зөв харагдана.
- Home hero, services, how-it-works section-ийн давхар зай болон mobile уртыг багасгасан.
- Service card болон step card-ийн desktop/tablet/mobile grid-ийг тогтворжуулсан.
- Hover, active, focus-visible болон reduced-motion төлөвүүдийг нэмсэн.
- Hero preview, navigation болон footer-ийн Монгол/Англи текстийг бүрэн холбосон.
- Footer mobile дээр хоёр баганатай, touch-friendly link layout-тай болсон.
- Footer болон main хоорондын илүүдэл зай, mobile bottom padding-ийг зассан.
- Navbar-ийн давхардсан global CSS-ийг зөвхөн no-script fallback болгон тусгаарласан.

## Суулгах

```powershell
Expand-Archive `
  -Path "C:\Users\LENOVO\Downloads\mur-complete-upgrade-v57.zip" `
  -DestinationPath "D:\Mur\mur-mvp" `
  -Force

cd D:\Mur\mur-mvp

npm install
npm run typecheck
npm run lint
npm test
npm run build
```

## GitHub/Vercel deploy

```powershell
cd D:\Mur\mur-mvp
git status
git add .
git commit -m "Polish home navbar and footer details"
git push origin main
```

Vercel deploy дууссаны дараа `Ctrl + Shift + R` дарж cache-гүй шинэчилнэ.

## Шалгалтын үр дүн

- TypeScript: амжилттай
- ESLint: 0 error, 0 warning
- Vitest: 67/67
- Next.js production build: 35/35 route
- Шинэ Supabase SQL migration: байхгүй
