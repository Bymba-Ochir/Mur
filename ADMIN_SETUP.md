# МӨР Admin Center тохиргоо

Admin Center нь тойм, report, зарын модераци, хэрэглэгч, мал эмнэлэг, цаг
захиалга, хандив, системийн төлөв болон audit log гэсэн хэсгүүдтэй.

## 1. Database migration ажиллуулах

Supabase Dashboard → SQL Editor хэсэгт `supabase-admin.sql` файлын бүх агуулгыг
хуулж нэг удаа ажиллуулна.

Энэ migration нь:

- модерацийн багана, RLS policy;
- хэрэглэгч warn/ban/unban хийх хамгаалалттай RPC;
- admin audit log;
- database-д хадгалагдах мал эмнэлгийн жагсаалт;
- dashboard статистик болон system health RPC-г нэмнэ.

## 2. Өөрийн хэрэглэгчид admin эрх өгөх

Supabase Dashboard → Authentication → Users хэсгээс өөрийн user UUID-г аваад SQL
Editor-т дараах query-г ажиллуулна:

```sql
insert into public.admins (user_id)
values ('ЭНД-ӨӨРИЙН-USER-UUID');
```

Хэрэв өмнө нь admin болсон бол дахин нэмэх шаардлагагүй.

## 3. Шалгах

```powershell
npm run typecheck
npm test -- --run
npm run dev
```

Дараа нь admin хэрэглэгчээр нэвтэрч `/admin` хуудсыг нээнэ.

## Аюулгүй ажиллагаа

- `SUPABASE_SERVICE_ROLE_KEY`-г browser орчин эсвэл `NEXT_PUBLIC_*` хувьсагчид
  хэзээ ч бүү байрлуул.
- Admin эрхийг зөвхөн `public.admins` хүснэгтээр олгоно.
- Бүх чухал admin үйлдэл `admin_audit_logs` хүснэгтэд бүртгэгдэнэ.
