---
name: backup
description: Supabase өгөгдлийн сангаас backup авах
---

# Database Backup

Supabase өгөгдлийн сангаас backup авах алхмууд:

## Алхам 1: Орчны хувьсагч шалгах
`.env.local` дотор `DATABASE_URL` байгаа эсэхийг шалга:
```bash
grep DATABASE_URL .env.local
```
Байхгүй бол:
```
DATABASE_URL="postgresql://postgres.xxx:ПАСС@db.xxx.supabase.co:5432/postgres"
```
Supabase Dashboard → Database → Connection string → Direct хэсэгтэй ижил.

## Алхам 2: Backup скрипт ажиллуулах
```bash
DATABASE_URL="postgresql://..." ./scripts/backup-db.sh
```

Скрипт нь:
- `pg_dump` ашиглан бүх өгөгдлийг gzip хийнэ
- `./backups/` дотор хадгална (14 хоног retention)
- `BACKUP_DEST` хувьсагчаар S3/GCS/local руу хуулж болно

## Алхам 3: Автомат backup тохируулах
### Option A: Cron (Linux/Mac)
```bash
crontab -e
# Өдөр бүр 02:00 UTC-д backup
0 2 * * * cd /d/Mur/mur-mvp && DATABASE_URL="..." ./scripts/backup-db.sh
```

### Option B: GitHub Actions
`.github/workflows/backup.yml` файл үүсгэх.

## Restore хийх
```bash
gunzip -c backups/YYYY-MM-DD_HH-MM-SS.sql.gz | psql $DATABASE_URL
```

## Анхааруулга
- Supabase үнэгүй tier-д автомат backup байхгүй
- Backup нь **цорын ганц** өгөгдөл хамгаалах арга
- `docs/BACKUP.md` дээрх дэлгэрэнгүй зааврыг уншина уу
