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


## v96 normalization

`supabase-normalization-v96.sql` нь application-ийн core schema-г давтагдсан болон хуулбарласан утгуудаас салгана. Энэ migration-ийг application-ийн v96-compatible код deploy хийсний **дараа** staging дээр шалгаж байж production-д ажиллуулна.

Canonical relation-ууд:

- `pet_photos` → `pets`-ийн 1:N зураг. `pets.photo_url` / `pets.photo_urls` legacy багануудыг verified backfill-ийн дараа устгана.
- `adoption_photos` → `adoptions`-ийн 1:N зураг. Legacy photo багануудыг verified backfill-ийн дараа устгана.
- `vet_services` + `vet_clinic_services` → clinic-ийн `services text[]` repeating group-ийг service catalog болон join table болгоно.
- `appointments.service_id` → service display text-ийг appointment бүр дээр давтаж хадгалахгүй.
- `profiles` → conversation participant-ийн нэрийн source of truth. `conversations` дээр participant email-ийг дахин хуулж хадгалахгүй.
- `pet_favorites` → favorite relation-ийн source of truth. `pets.favorite_count`-ийг тусдаа mutable aggregate болгон хадгалахгүй.

Migration нь photo backfill болон appointment service backfill-ийг шалгаад дараа нь legacy column-уудыг drop хийнэ. Алдагдах өгөгдөл илэрвэл `NORMALIZATION_ABORT` exception-оор transaction бүхэлдээ rollback болно. Production дээр SQL ажиллуулахаас өмнө database backup/restore боломж болон staging smoke test заавал шалгана. Migration-ийн дараа `audits/normalization-v96-readonly.sql`-ийг ажиллуулахад legacy column болон orphan relation үлдсэн эсэхийг data өөрчлөхгүйгээр шалгана.

JSONB-г бүхэлд нь хориглоогүй: push subscription cryptographic keys, audit metadata, notification preference зэрэг application-д нэг document/value байдлаар хэрэглэгддэг өгөгдөл нь relation болгон задлах шаардлагагүй тул хэвээр үлдэнэ.

## SQL inventory

- [`supabase-admin-upgrade.sql`](../supabase-admin-upgrade.sql)
- [`supabase-admin.sql`](../supabase-admin.sql)
- [`supabase-adoption-photos-upgrade.sql`](../supabase-adoption-photos-upgrade.sql)
- [`supabase-ai-upgrade.sql`](../supabase-ai-upgrade.sql)
- [`supabase-booking-integrity-v89.sql`](../supabase-booking-integrity-v89.sql)
- [`supabase-breed-migration.sql`](../supabase-breed-migration.sql)
- [`supabase-listing-upgrade.sql`](../supabase-listing-upgrade.sql)
- [`supabase-normalization-v96.sql`](../supabase-normalization-v96.sql)
- [`supabase-pet-photos-upgrade.sql`](../supabase-pet-photos-upgrade.sql)
- [`supabase-production-hardening-v54.sql`](../supabase-production-hardening-v54.sql)
- [`supabase-production-hardening.sql`](../supabase-production-hardening.sql)
- [`supabase-saved-searches-v55.sql`](../supabase-saved-searches-v55.sql)
- [`supabase-security-upgrade-v49.sql`](../supabase-security-upgrade-v49.sql)
- [`supabase-setup.sql`](../supabase-setup.sql)
- [`supabase-user-account-v52.sql`](../supabase-user-account-v52.sql)
- [`supabase-workflows-v53.sql`](../supabase-workflows-v53.sql)

Storage backup нь database dump-ээс тусдаа. RLS, grant, security-definer function болон trigger-ийг хамтад нь review хийнэ. [SECURITY](SECURITY.md), [BACKUP](BACKUP.md)-ийг үзнэ.
