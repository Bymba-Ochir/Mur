# МӨР v54.1 — суулгах, migration, deploy

## 1. Git-тэй цэвэр хавтас бэлтгэх

ZIP файлд `.git`, `.env.local`, `node_modules`, `.next` орохгүй. Repository-г clone хийгээд ZIP-ийг clone хийсэн хавтас дээр задлана.

```powershell
cd D:\Mur
git clone https://github.com/Bymba-Ochir/Mur.git Mur-v54

Expand-Archive `
  -Path "C:\Users\LENOVO\Downloads\mur-complete-upgrade-v54.1.zip" `
  -DestinationPath "D:\Mur\Mur-v54" `
  -Force

Copy-Item "D:\Mur\Mur\.env.local" "D:\Mur\Mur-v54\.env.local"
cd D:\Mur\Mur-v54
git status
```

`git status` ажиллахгүй бол clone хийсэн `D:\Mur\Mur-v54` хавтас дотор ороогүй байна.

## 2. Supabase SQL migration

Одоогийн database v53 хүртэл шинэчлэгдсэн бол зөвхөн дараах файлыг SQL Editor дээр ажиллуулна:

```text
supabase-production-hardening-v54.sql
```

Хэрэв өмнөх migration-уудыг ажиллуулаагүй бол дарааллаар:

1. `supabase-pet-photos-upgrade.sql`
2. `supabase-adoption-photos-upgrade.sql`
3. `supabase-user-account-v52.sql`
4. `supabase-workflows-v53.sql`
5. `supabase-production-hardening-v54.sql`

v54 нь sightings, reports, push subscription, donation direct public insert-ийг хааж server API руу шилжүүлнэ. SQL ажиллуулахаас өмнө шинэ frontend deploy хийвэл эдгээр үйлдэл түр алдаж болох тул migration болон deploy-ийг нэг удаад хийнэ.

## 3. Environment variables

Local `.env.local` болон Vercel Environment Variables-д:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_SITE_URL=https://mur-chi.vercel.app
SUPABASE_SERVICE_ROLE_KEY
```

Push, AI, cron болон QPay ашиглавал `.env.local.example`-д байгаа холбогдох хувьсагчдыг мөн тохируулна. `.env.local` болон secret утгыг Git-д commit хийхгүй.

## 4. Local шалгалт

```powershell
npm install
npm run typecheck
npm run lint
npm test
npm run build
```

## 5. GitHub ба Vercel

```powershell
git add .
git commit -m "Harden public writes and add message unread notifications"
git push origin main
```

## 6. Deploy дараах smoke test

Хоёр тусдаа test account ашиглан:

1. Мессеж илгээхэд нөгөө account дээр notification болон unread count гарч буй эсэх.
2. Thread нээхэд unread count арилж буй эсэх.
3. “Би харсан” мэдээлэл нэмэхэд зарын эзэнд notification ирэх эсэх.
4. Зар report хийхэд admin dashboard-д харагдах эсэх.
5. Pet, adoption, sitting зар устгахад Supabase Storage дахь зураг хамт устаж буй эсэх.
6. Nearby болон vaccine push subscription шинэчлэгдэж буй эсэх.
