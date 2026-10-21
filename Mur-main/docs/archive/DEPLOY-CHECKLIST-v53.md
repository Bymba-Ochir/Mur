> ТҮҮХЭН ЛАВЛАГА: одоогийн заавар биш. [Нэгтгэсэн deploy заавар](../DEPLOYMENT.md)-ыг ашиглана.

# МӨР v53 — суулгах ба deploy хийх дараалал

## 1. Git-тэй цэвэр хавтас бэлтгэх

ZIP файл `.git`, `.env.local`, `node_modules`, `.next` агуулахгүй. Тиймээс GitHub repository-г эхлээд clone хийгээд ZIP-ийг clone хийсэн хавтас дээр задлана.

```powershell
cd D:\Mur
git clone https://github.com/Bymba-Ochir/Mur.git Mur-v53

Expand-Archive `
  -Path "C:\Users\LENOVO\Downloads\mur-complete-upgrade-v53.zip" `
  -DestinationPath "D:\Mur\Mur-v53" `
  -Force

Copy-Item "D:\Mur\Mur\.env.local" "D:\Mur\Mur-v53\.env.local"
cd D:\Mur\Mur-v53
```

Хэрэв `Mur-v53` хавтас өмнө нь байгаа бол өөр шинэ нэр ашиглана. Хуучин хавтсыг устгах шаардлагагүй.

## 2. Supabase migration

Supabase Dashboard → SQL Editor дээр дарааллаар ажиллуулна:

1. `supabase-user-account-v52.sql` — өмнө нь ажиллуулаагүй бол
2. `supabase-workflows-v53.sql`

v53 migration нь:

- үрчлүүлэх хүсэлт;
- асрах захиалга;
- үйлчилгээний үнэлгээ;
- дотоод notification;
- оролцогч талын RLS ба төлөв шилжилтийн хамгаалалт;
- давхардсан хугацаатай асрах захиалгыг зөвшөөрөхөөс хамгаалах дүрэм нэмнэ.

## 3. Local шалгалт

```powershell
npm install
npm run typecheck
npm run lint
npm test
npm run build
```

`.env.local`-д хамгийн багадаа дараах public утгууд байна:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_SITE_URL=https://mur-chi.vercel.app
```

Secret утгуудыг Git-д commit хийхгүй. Vercel Dashboard → Settings → Environment Variables хэсэгт хадгална.

Өмнөх VAPID key нийтэд ил болсон тул хуучныг дахин ашиглахгүй. Шинэ key pair үүсгээд Vercel-д солино:

```powershell
npx web-push generate-vapid-keys
```

## 4. GitHub руу push

```powershell
git status
git add .
git commit -m "Add adoption and sitting workflows with notifications"
git push origin main
```

`git status` ажиллаж байвал `.git` зөв байна. `not a git repository` гэвэл clone хийсэн `D:\Mur\Mur-v53` хавтас дотор ороогүй байна.

## 5. Vercel

GitHub push хийсний дараа Vercel deployment дуусахыг хүлээнэ. Дараа нь:

- `/notifications`
- `/activity`
- нэг adoption detail дээр хүсэлт илгээх/зөвшөөрөх;
- нэг sitting detail дээр захиалга илгээх/зөвшөөрөх/дуусгах/үнэлэх;
- navbar unread badge

урсгалуудыг хоёр тусдаа test account-аар шалгана.

## Profile заавал хэрэгтэй юу?

Нэвтрэхэд profile заавал урьдчилж бөглөсөн байх шаардлагагүй. Account үүсэхэд хоосон profile автоматаар бэлтгэгдэнэ. Харин adoption/sitting хүсэлтийг зөв шийдэхийн тулд display name, дүүрэг, товч танилцуулгаа бөглөхийг зөвлөсөн UI хэвээр байна.
