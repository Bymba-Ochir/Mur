# МӨР v60 — Lost/found report form detail UI

Энэ багц зөвхөн `/report-lost`, `/report-found` болон тэдгээрийн шууд
ашигладаг form UI-г detail түвшинд сайжруулсан. Шинэ feature нэмээгүй,
Indigo/Coral/Sky palette болон одоогийн загварыг хадгалсан.

## Суулгах

```powershell
Expand-Archive `
  -Path "C:\Users\LENOVO\Downloads\mur-complete-upgrade-v60.zip" `
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
git commit -m "Polish lost and found report forms"
git push origin main
```

`not a git repository` гарвал `git init` хийхээс өмнө зөв GitHub repository-ийн
clone эсвэл remote тохиргоог шалгана.

## Баталгаажуулалт

- TypeScript: амжилттай
- ESLint: 0 error, 0 warning
- Vitest: 75/75
- Next.js production build: 35/35 route
- Нэмэлт Supabase SQL шаардлагагүй
