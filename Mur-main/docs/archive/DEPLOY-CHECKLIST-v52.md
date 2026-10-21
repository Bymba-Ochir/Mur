> ТҮҮХЭН ЛАВЛАГА: одоогийн заавар биш. [Нэгтгэсэн deploy заавар](../DEPLOYMENT.md)-ыг ашиглана.

# МӨР v52 — Profile ба account суулгах дараалал

## 1. Кодоо Git repository руу хуулах

ZIP-ийг Git repository-оос тусдаа задалсан бол шинэ кодыг жинхэнэ repository руу хуулна. `.git`, `.env.local`, `node_modules`, `.next`-ийг солихгүй.

## 2. Supabase migration

Supabase Dashboard → SQL Editor дээр дараах файлыг бүхэлд нь ажиллуулна:

```text
supabase-user-account-v52.sql
```

Энэ migration:

- `profiles`, `user_blocks`, `user_reports` хүснэгт үүсгэнэ;
- хуучин болон шинэ хэрэглэгчдэд profile автоматаар үүсгэнэ;
- `avatars` Storage bucket үүсгэнэ;
- profile болон account RLS policy тохируулна;
- хаасан хэрэглэгчийн зар, шинэ чат, мессежийг хязгаарлана.

## 3. Environment variables

Local `.env.local` болон Vercel дээр:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

`SUPABASE_SERVICE_ROLE_KEY` нь зөвхөн server API-д ашиглагдана. `NEXT_PUBLIC_` prefix нэмж болохгүй.

## 4. Шалгалт

```powershell
npm install
npm run typecheck
npm run lint
npm test
npm run build
```

## 5. Турших урсгал

1. Нэвтэрч `/profile` нээх.
2. `/profile/edit` дээр нэр, зураг, дүүрэг, танилцуулга хадгалах.
3. `/settings` дээр notification сонголт хадгалах.
4. Өөр хэрэглэгчийн `/users/[id]` profile-ийг зарын дэлгэрэнгүйгээс нээх.
5. Хэрэглэгч хаасны дараа шинэ чат/мессеж хориглогдохыг шалгах.
6. Admin → Хэрэглэгч tab дээр report харагдахыг шалгах.
7. `/settings` дээр JSON export татах.
8. Account delete-ийг зөвхөн туршилтын хэрэглэгчээр шалгах.

## 6. Commit

```powershell
git add .
git commit -m "Add user profiles settings and account privacy"
git push origin main
```

`.env.local` Git status-д ороогүйг commit хийхээс өмнө заавал шалгана.
