> ТҮҮХЭН ЛАВЛАГА: одоогийн заавар биш. [Нэгтгэсэн deploy заавар](../DEPLOYMENT.md)-ыг ашиглана.

# МӨР v69 — Navbar болон shared overlay засвар

## Зассан асуудлууд

- Next `Link` component дээр Navbar-ийн scoped style алдагддаг үндсэн шалтгааныг зассан
- Profile dropdown-ийг тусдаа identity header, icon column, тогтмол item spacing-тэй болгосон
- Dropdown-д `menu` / `menuitem`, keyboard focus болон бүтэн email tooltip нэмсэн
- Өргөн desktop дээр secondary navigation icon + label харуулна
- Compact desktop дээр tooltip бүхий icon хэлбэрээр багасна
- 1040px-ээс доош accessible mobile drawer ашиглана
- Profile pill дээр урт email navbar-ийг сунгахгүй
- Install болон analytics notice зэрэг гарвал хоорондоо давхцахгүй stack болно
- Install notice-ийн Монгол/Англи текст бүрэн болсон
- Install, Avatar, Onboarding-ийн үлдсэн emoji fallback-ийг SVG icon болгосон
- Language болон theme товчны keyboard focus төлөвийг нэмсэн

## Суулгах

```powershell
Expand-Archive `
  -Path "C:\Users\LENOVO\Downloads\mur-complete-upgrade-v69.zip" `
  -DestinationPath "D:\Mur\mur-mvp" `
  -Force

cd D:\Mur\mur-mvp

npm install
npm run typecheck
npm run lint
npm test
npm run build
```

## Deploy

```powershell
cd D:\Mur\mur-mvp

git status
git add .
git commit -m "Fix navbar links account menu and shared overlays"
git push origin main
```

Хэрэв `fatal: not a git repository` гарвал ZIP задласан хавтас Git history агуулаагүй гэсэн үг. Тэр үед GitHub repository-г эхлээд clone хийгээд v69 ZIP-ийг clone хийсэн хавтас руу задлана.

## Баталгаажсан шалгалт

- TypeScript: амжилттай
- ESLint: 0 error, 0 warning
- Vitest: 93/93
- PostCSS parse: амжилттай
- Diff whitespace: алдаагүй
- Энэ Codex орчин дахь build: Google Fonts network хаалттай тул font download дээр зогссон
- Windows/Vercel: `npm run build`-ийг дээрх дарааллаар ажиллуулж баталгаажуулна

v69-д шинэ SQL migration болон environment variable байхгүй.
