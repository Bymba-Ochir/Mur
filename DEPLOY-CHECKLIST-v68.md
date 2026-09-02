# МӨР v68 — Privacy, Terms, 404 detail UI

## Өөрчлөлт

- Privacy болон Terms-д нэгдсэн responsive legal layout
- Desktop sticky, mobile expandable агуулгын жагсаалт
- Section anchor болон keyboard focus төлөв
- Шинэчилсэн огноо, холбоо барих email link
- Privacy/Terms хоорондын related navigation
- SVG icon; emoji болон inline layout style байхгүй
- 404 дээр нүүр, бүх зар, алдсан/олдсон form руу сэргээх зам
- MN/EN болон dark/light theme
- Privacy/Terms metadata description

## Суулгах

```powershell
Expand-Archive `
  -Path "C:\Users\LENOVO\Downloads\mur-complete-upgrade-v68.zip" `
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
git status
git add .
git commit -m "Polish legal and not found detail UI"
git push origin main
```

v68-д шинэ SQL migration болон environment variable байхгүй.

## Баталгаажсан шалгалт

- TypeScript: амжилттай
- ESLint: 0 error, 0 warning
- Vitest: 91/91
- Next.js production build: 35/35 route
