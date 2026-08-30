# МӨР v56 — Page detail UI/UX checklist

## Энэ хувилбарын өөрчлөлт

- Nested detail route дээр navbar-ийн active төлөв зөв харагдана.
- Pet, adoption, sitting болон profile detail хуудсууд ижил loading/error/retry/back төлөвтэй.
- Message detail render хийх үед redirect хийхээ больж, auth хамгаалалтыг ойлгомжтой харуулна.
- Card, clinic, phone, vaccine болон assistant feedback-ийн emoji-г нэгдсэн SVG icon болгосон.
- Mobile дээр My Pets нэмэх form нэг багана болж, input/button бүтэн өргөнтэй харагдана.
- Footer-д үндсэн service route-ууд нэмэгдсэн.
- Global error болон empty state-ууд шинэ Indigo/Coral UI-тай нийцсэн.
- Tailwind cascade regression болон page detail regression тест нэмэгдсэн.
- Local/offline build-д `SKIP_SENTRY_BUILD=1` ашиглах боломжтой.

## Суулгах

PowerShell:

```powershell
Expand-Archive `
  -Path "C:\Users\LENOVO\Downloads\mur-complete-upgrade-v56.zip" `
  -DestinationPath "D:\Mur\mur-mvp" `
  -Force

cd D:\Mur\mur-mvp

npm install
npm run typecheck
npm run lint
npm test
npm run build
```

## Git шалгах ба deploy хийх

```powershell
cd D:\Mur\mur-mvp
git status
git add .
git commit -m "Polish page details and responsive states"
git push origin main
```

`git status` дээр `not a git repository` гарвал ZIP-ийг GitHub-аас clone хийсэн repository дээр задлана:

```powershell
cd D:\Mur
Rename-Item "D:\Mur\mur-mvp" "mur-mvp-files-backup"
git clone https://github.com/Bymba-Ochir/Mur.git "D:\Mur\mur-mvp"

Expand-Archive `
  -Path "C:\Users\LENOVO\Downloads\mur-complete-upgrade-v56.zip" `
  -DestinationPath "D:\Mur\mur-mvp" `
  -Force

Copy-Item "D:\Mur\mur-mvp-files-backup\.env.local" "D:\Mur\mur-mvp\.env.local"
cd D:\Mur\mur-mvp
npm install
npm run build
git add .
git commit -m "Polish page details and responsive states"
git push origin main
```

## Build орчны тэмдэглэл

- `.env.local` дотор `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` байх ёстой.
- Sentry upload-гүй local build шаардлагатай бол:

```powershell
$env:SKIP_SENTRY_BUILD="1"
npm run build
Remove-Item Env:SKIP_SENTRY_BUILD
```

- v56-д шинэ Supabase SQL migration нэмэгдээгүй. v55-ийн migration-уудыг өмнө нь ажиллуулсан байхад хангалттай.
- Vercel deploy дууссаны дараа browser дээр `Ctrl + Shift + R` дарж шинэ CSS/JS-г cache-гүй ачаална.
