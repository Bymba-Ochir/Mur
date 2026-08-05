# Backup & Disaster Recovery (DR) төлөвлөгөө

Энэ баримт бичиг нь МӨР платформын өгөгдөл алдагдсан үед хэрхэн сэргээхийг тайлбарлана.
Аудит шаардлага: *"Supabase дата алдагдвал сэргээх стратеги баримтжуулаагүй."* — энэ нь уг
асуудлыг хаадаг.

## 1. Зорилго (RPO / RTO)

MVP шатанд тохирсон бодит хязгаар:

| Хэмжигдэхүүн | Зорилт | Тайлбар |
|---|---|---|
| **RPO** (өгөгдөл хэр их алдагдаж болох) | 24 цаг хүртэл | Өдөр бүр backup хийвэл хамгийн ихдээ сүүлийн 24 цаг алдагдана |
| **RTO** (дахин ажиллуулах хугацаа) | 15–30 мин | DB жижиг (500MB хүртэл), сэргээх нь хурдан |

> **Чухал:** Supabase-ийн **үнэгүй (Free) tier-д автомат backup БАЙХГҮЙ.** Өгөгдөл
> хамгаалах нь бидний үүрэг — доорх скрипт/журам үүнийг хийнэ. Pro планд ($25/сар)
> өдрийн автомат backup + PITR идэвхждэг (7-р хэсэг).

## 2. Юу хамгаалах вэ

| Мэдээлэл | Хаана | Backup арга |
|---|---|---|
| **Postgres DB** — `pets`, `sightings`, `volunteers`, `my_pets`, `push_subscriptions`, `reports`, `admins`, `donations` + RLS бодлого, функц, sequence, `auth.users` | Supabase Database | `pg_dump` → `scripts/backup-db.sh` |
| **Storage** — `pet-photos` bucket (зурган файлууд) | Supabase Storage | S3-compatible API (`aws s3 sync` / `rclone`), эсвэл Dashboard-оос гараар |
| **Env / нууц үг** — `NEXT_PUBLIC_SUPABASE_URL`, anon/service key, VAPID, QPay, Sentry | `.env.local` + Vercel | `.env.local`-ийг нутгийн аюулгүй газар (password manager, encrypted vault) хадгална; Vercel-ийн утгууд Vercel дээр л байна |

> ⚠️ Backup файл нь `auth.users` (имэйл хаяг) зэрэг **PII агуулна.** Иймд:
> - `/backups/` хавтас gitignored байна (`.gitignore`-д нэмсэн).
> - Backup файлыг git/GitHub эсвэл олон нийтийн санд **хэзээ ч бүү оруул.**
> - Зайнаас хадгалах газар нь private bucket байх ёстой.

## 3. Backup хийх журам

### 3.1. Бэлтгэл

`DATABASE_URL`-ээ авах:
Supabase Dashboard → Project Settings → **Database** → *Connection string* → **Direct connection** (port 5432) → `.env.local`-д нэмэх (зөвхөн серверт, `NEXT_PUBLIC_` БИШ):

```
DATABASE_URL=postgresql://postgres.xxx:ПАСС@db.xxx.supabase.co:5432/postgres
```

`pg_dump` суулгасан эсэхээ шалгах: `pg_dump --version`

### 3.2. Гараар backup

```bash
# local хавтаст (default ./backups, сүүлийн 14 хоног хадгалагдана)
DATABASE_URL="..." ./scripts/backup-db.sh

# зайнаас S3 bucket-д хуулж хадгалах
DATABASE_URL="..." BACKUP_DEST="s3://my-private-backups/mur" ./scripts/backup-db.sh
```

### 3.3. Автомат backup (схемийн хугацаанд)

**Oрон нутагт (cron):**
```cron
# өдөр бүр 02:17-д
17 2 * * * cd /path/to/mur-mvp && DATABASE_URL="$DATABASE_URL" ./scripts/backup-db.sh >> backups/backup.log 2>&1
```

**GitHub Actions** (CI-д зориулсан жишээ — `DATABASE_URL` болон `BACKUP_DEST`-ийг
GitHub Secrets-д нэмнэ; S3 bucket private байх ёстой):

```yaml
name: Daily DB backup
on:
  schedule:
    - cron: '17 2 * * *'   # UTC 02:17 (Монголын 10:17)
  workflow_dispatch: {}

jobs:
  backup:
    runs-on: ubuntu-latest
    env:
      DATABASE_URL: ${{ secrets.DATABASE_URL }}
      BACKUP_DEST: s3://my-private-backups/mur
    steps:
      - uses: actions/checkout@v4
      - run: ./scripts/backup-db.sh
        env:
          BACKUP_DIR: /tmp/backups
      # S3-руу хүргэх нь скрипт дотор BACKUP_DEST-ээр хийдэг;
      # AWS creds нь repository/оrganization secret дээр байх ёстой
```

### 3.4. Хадгалах хугацаа (retention)

- Default: **14 хоног** (`BACKUP_KEEP`). Энэ нь 2 долоо хоногийн буцаж орох боломж өгнө.
- Зайнаас хадгалах тохиолдолд ижил retention бодлого bucket-д (object lifecycle) тохируулахыг зөвлөж байна.

## 4. Сэргээх журам (Disaster Recovery)

### Тохиолдол А — хэдэн бичлэг санамсаргүй устгагдсан

Бүхэл DB-г сэргээхгүй, зөвхөн тухайн өгөгдлийг буцаана:

1. Backup файлыг задлаад: `gunzip -c backups/mur-YYYYMMDD-HHMMSS.sql.gz > restore.sql`
2. Устгагдсан бичлэгийг `restore.sql`-оос олж (`INSERT INTO public.pets ...` хэсэг).
3. Supabase Dashboard → SQL Editor → тухайн `INSERT`-ийг буулгаж Run.
   (Эсвэл `psql "$DATABASE_URL" -f` дээр зөвхөн тухайн INSERT-ийг ажиллуулна.)

### Тохиолдол Б — бүх өгөгдлийн сан сэргээх (хамгийн сүүлийн backup)

Дараах хоёр аргаас нэгийг сонгоно:

**Арга 1 (зөвлөмж) — шинэ Supabase төсөлд сэргээх:**
> pg_dump-ийн `CREATE TABLE` нь `IF NOT EXISTS`гүй байдаг тул одоо байгаа төсөлд
> шууд ажиллуулбал "relation already exists" алдаа гарна. Хамгийн аюулгүй нь
> шинэ төсөлд сэргээгээд env-ийг шинэчилэх явдал.

1. Шинэ Supabase төсөл үүсгэх (region: Singapore/Tokyo).
2. `supabase-setup.sql`-ийг SQL Editor дээр ажиллуулах (схем, RLS, bucket сэргээнэ).
3. Data-г restore хийх:
   ```bash
   gunzip -c backups/mur-YYYYMMDD-HHMMSS.sql.gz | psql "postgresql://postgres.НЭГДЭЛ:ПАСС@db.ШИНЭ.supabase.co:5432/postgres"
   ```
4. `photo_url`-ийн төслийн ref шинэ төсөлд өөрчлөгдөнө — Storage restore-ийн дараа
   `pets.photo_url`-ийг шинэчлэх шаардлагатай (5-р хэсэг).
5. `.env.local`/Vercel-ийн `NEXT_PUBLIC_SUPABASE_URL`, anon key, service role key-ийг шинэ төсөл рүү солих.

**Арга 2 — одоо байгаа төсөлд restore (болгоомжтой):**
```bash
# public схемийг буулгаж, дахин үүсгэнэ (зөвхөн public — auth/storage-д хүрэхгүй)
psql "$DATABASE_URL" -c "drop schema if exists public cascade; create schema public;"
gunzip -c backups/mur-YYYYMMDD-HHMMSS.sql.gz | psql "$DATABASE_URL"
```
> АНХААР: `public` схемийг буулгах нь хэт өндөр эрхтэй үйлдэл — эхлээд backup
> зөв/шинэ гэдгийг баталгаажуулж, тестийн төсөлд эхлээд туршаад үзнэ.

### Тохиолдол В — төсөл бүрэн устаж катастроф (project deleted)

1. Шинэ Supabase төсөл үүсгэх (region: Singapore/Tokyo).
2. `supabase-setup.sql` ажиллуулах (Б-ийн алхам 2-той адил).
3. Data-г restore хийх (Б-ийн алхам 3-той адил).
4. Storage зургуудыг буцаах (5-р хэсэг) + `photo_url` шинэчлэх.
5. Vercel env-ийг шинэ утгаар солих → redeploy.
6. Push мэдэгдэл: `push_subscriptions` шинэ төсөлд буцаж ирэх бөгөөд VAPID түлхүүр
   хэвээр байвал мэдэгдэл ажиллана (түлхүүрээ солихгүй бол).

## 5. Storage (зураг) backup / restore

`pet-photos` bucket нь S3-compatible endpoint-той:

```bash
# Backup (тухайн төсөл рүү): Dashboard → Storage → S3 Access Keys-ээс key/secret авах
aws s3 sync s3://pet-photos ./storage-backup \
  --endpoint-url "https://<project-ref>.supabase.co/storage/v1/s3"

# Restore (шинэ төсөл рүү)
aws s3 sync ./storage-backup s3://pet-photos \
  --endpoint-url "https://<new-project-ref>.supabase.co/storage/v1/s3"
```

> `pets.photo_url` нь хуучин төслийн URL-г агуулна. Restore-ийн дараа:
> ```sql
> update pets set photo_url = replace(photo_url, '<old-ref>.supabase.co', '<new-ref>.supabase.co');
> ```
> Хэрэв зурган файлын path хэвээр байвал (ижил file name) энэ update хангалттай.

## 6. Тогтмол шалгалт (backup drill)

Backup нь сэргээх боломжгүй бол үнэ цэнэгүй. Сард нэг удаа:

1. Хамгийн сүүлийн backup-оос **тестийн шинэ Supabase төсөлд** restore хийх (Б арга).
2. Жагсаалт/дэлгэрэнгүй хуудас ажиллаж, зураг харагдаж байгааг шалгах.
3. Restore хийхэд авсан цаг, асуудлуудыг тэмдэглэх.

## 7. Өгөгдөл өсөхөд сайжруулах сонголтууд

| Шийдэл | Хэзээ | Үр дүн |
|---|---|---|
| **Supabase Pro** ($25/сар) | Өгөгдөл 500MB-с давж, алдагдлын хүлцэл багасахад | Өдрийн **автомат backup** + **PITR** (секундээр буцах) |
| **Backup-г өөр region-ийн S3/R2** | Backup гэмтэх (ransomware/delete) эрсдэлээс | 3-2-1 дүрэм: 2 өөр media, 1 нь алслагдсан |
| **Sentry/healthcheck** | Backups цаг тухайд нь болж байгааг хянах | Схемийн job амжилтгүй болсон үед алерт |

---

*Сүүлийн шинэчлэл: 2026-08-05. Энэ баримт бичгийг өөрчлөх үед README-д холбоос нь хэвээр байгаа эсэхийг шалгана уу.*
