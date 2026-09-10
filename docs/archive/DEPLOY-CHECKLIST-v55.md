> ТҮҮХЭН ЛАВЛАГА: одоогийн заавар биш. [Нэгтгэсэн deploy заавар](../DEPLOYMENT.md)-ыг ашиглана.

# МӨР v55 — суулгах, migration, deploy

## 1. Git-тэй цэвэр `D:\Mur\mur-mvp` бэлтгэх

Одоогийн `D:\Mur\mur-mvp` нь `.git`-гүй бол backup болгон шилжүүлээд GitHub repository-г яг тэр замд clone хийнэ. Ингэснээр `git status`, `git add`, `git push` ажиллана.

```powershell
cd D:\Mur

$murBackupPath = "D:\Mur\mur-mvp-backup-$(Get-Date -Format yyyyMMdd-HHmmss)"
Move-Item "D:\Mur\mur-mvp" $murBackupPath

git clone https://github.com/Bymba-Ochir/Mur.git "D:\Mur\mur-mvp"

Expand-Archive `
  -Path "C:\Users\LENOVO\Downloads\mur-complete-upgrade-v55.zip" `
  -DestinationPath "D:\Mur\mur-mvp" `
  -Force

Copy-Item "$murBackupPath\.env.local" "D:\Mur\mur-mvp\.env.local"
cd D:\Mur\mur-mvp
git status
```

Хэрэв хуучин хавтас дотор `.env.local` байхгүй бол `Copy-Item` мөрийг алгасаад `.env.local.example`-оос шинэ `.env.local` үүсгэнэ. Secret утгыг Git-д commit хийхгүй.

## 2. Supabase migration

Supabase Dashboard → SQL Editor дээр эхлээд v54 migration ажилласан эсэхээ баталгаажуулна. v54 хүртэл ажилласан бол зөвхөн:

```text
supabase-saved-searches-v55.sql
```

Хэрэв өмнөх migration-ууд ажиллаагүй бол дарааллаар:

1. `supabase-pet-photos-upgrade.sql`
2. `supabase-adoption-photos-upgrade.sql`
3. `supabase-user-account-v52.sql`
4. `supabase-workflows-v53.sql`
5. `supabase-production-hardening-v54.sql`
6. `supabase-saved-searches-v55.sql`

## 3. Local шалгалт

```powershell
cd D:\Mur\mur-mvp

npm install
npm run typecheck
npm run lint
npm test
npm run build
```

## 4. GitHub болон Vercel deploy

```powershell
git add .
git commit -m "Add saved listings, saved search alerts, and health checks"
git push origin main
```

## 5. Deploy дараах шалгалт

1. `https://mur-chi.vercel.app/api/health` нь `status: ok` буцааж буй эсэх.
2. Нэвтэрсэн хэрэглэгч зарын дэлгэрэнгүйгээс “Хадгалах” дарахад `/saved` дээр харагдах эсэх.
3. Жагсаалтад шүүлтүүр сонгоод “Хайлтыг хадгалах” ажиллаж буй эсэх.
4. Өөр account-аар тохирох шинэ зар оруулахад эхний account-ын `/notifications` дээр мэдэгдэл ирэх эсэх.
5. `/settings`-ээс татсан JSON-д `petFavorites` болон `savedSearches` орсон эсэх.
