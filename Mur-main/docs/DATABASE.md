# Database ба migration

Энэ repository-д нэг migration runner/ledger байхгүй; root дахь SQL файлууд нь олон үеийн өөрчлөлт. Бүгдийг alphabetical дарааллаар production-д ажиллуулж болохгүй. `IF NOT EXISTS` нь policy/trigger-ийн хуучин хувилбарыг сэргээхээс хамгаалахгүй.

## Шинэ database

Тусгаарласан Supabase staging project дээр `supabase-setup.sql`-ийг суурь болгон review хий. Дараах dependency-уудыг хангаж файлуудын бүх агуулгыг шалга:

- `supabase-admin.sql` → `supabase-production-hardening.sql`.
- `supabase-user-account-v52.sql` → `supabase-workflows-v53.sql` → `supabase-production-hardening-v54.sql` → `supabase-saved-searches-v55.sql`.
- `supabase-workflows-v53.sql` → `supabase-booking-integrity-v89.sql`.
- Photo, breed, listing, AI болон admin upgrade-уудыг ашиглах feature/schema-тай тулга.

Энэ нь баталгаажсан автомат bootstrap дараалал биш. Бүх SQL-ийн нийлбэрийг хоосон database дээр энэ task-д ажиллуулаагүй. Амжилттай staging суулгалтын дарааллыг commit болон checksum-тай бүртгэж байж production-д хэрэглэ.

## Existing database

1. Backup/restore боломжоо шалга.
2. Existing schema, policy, grants, trigger/function-ийг экспортлон diff хий.
3. Зөвхөн дутуу migration-ийг staging-д ажиллуул.
4. Өөр өөр хэрэглэгчийн эрх болон application smoke test хий.
5. Production-д ажиллуулсан файл, checksum, огноо, гүйцэтгэгчийг бүртгэ.

v89 exclusion constraint нь хуучин accepted booking давхцал байвал transaction-ийг зогсооно. Давхардлыг таамгаар устгахгүй, эзэмшигчийн шийдвэрээр засна.

## SQL inventory

- [`supabase-admin-upgrade.sql`](../supabase-admin-upgrade.sql)
- [`supabase-admin.sql`](../supabase-admin.sql)
- [`supabase-adoption-photos-upgrade.sql`](../supabase-adoption-photos-upgrade.sql)
- [`supabase-ai-upgrade.sql`](../supabase-ai-upgrade.sql)
- [`supabase-booking-integrity-v89.sql`](../supabase-booking-integrity-v89.sql)
- [`supabase-breed-migration.sql`](../supabase-breed-migration.sql)
- [`supabase-listing-upgrade.sql`](../supabase-listing-upgrade.sql)
- [`supabase-pet-photos-upgrade.sql`](../supabase-pet-photos-upgrade.sql)
- [`supabase-production-hardening-v54.sql`](../supabase-production-hardening-v54.sql)
- [`supabase-production-hardening.sql`](../supabase-production-hardening.sql)
- [`supabase-saved-searches-v55.sql`](../supabase-saved-searches-v55.sql)
- [`supabase-security-upgrade-v49.sql`](../supabase-security-upgrade-v49.sql)
- [`supabase-setup.sql`](../supabase-setup.sql)
- [`supabase-user-account-v52.sql`](../supabase-user-account-v52.sql)
- [`supabase-workflows-v53.sql`](../supabase-workflows-v53.sql)

Storage backup нь database dump-ээс тусдаа. RLS, grant, security-definer function болон trigger-ийг хамтад нь review хийнэ. [SECURITY](SECURITY.md), [BACKUP](BACKUP.md)-ийг үзнэ.
