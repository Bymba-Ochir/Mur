> ТҮҮХЭН ЛАВЛАГА: одоогийн заавар биш. [Нэгтгэсэн deploy заавар](../DEPLOYMENT.md)-ыг ашиглана.

# МӨР v61 — Adoption list, detail and form UI

Энэ багц `/adoptions`, `/adoptions/[id]`, `/adoptions/new` болон тэдгээрийн
шууд ашигладаг adoption UI component-уудыг detail түвшинд сайжруулсан. Шинэ
feature нэмээгүй, Indigo/Coral/Sky palette болон одоогийн логикийг хадгалсан.

## Суулгах

```powershell
Expand-Archive `
  -Path "C:\Users\LENOVO\Downloads\mur-complete-upgrade-v61.zip" `
  -DestinationPath "D:\Mur\mur-mvp" `
  -Force

cd D:\Mur\mur-mvp

npm install
npm run typecheck
npm run lint
npm test
npm run build
```

## Git repository холбоотой бол

```powershell
git status
git add .
git commit -m "Polish adoption list detail and form UI"
git push origin main
```

`not a git repository` гарвал `git init` хийхээс өмнө зөв GitHub repository-ийн
clone эсвэл remote тохиргоог шалгана.

## Баталгаажуулалт

- TypeScript: амжилттай
- ESLint: 0 error, 0 warning
- Vitest: 77/77
- Next.js production build: 35/35 route
- Нэмэлт Supabase SQL шаардлагагүй
