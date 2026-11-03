#!/usr/bin/env bash
# =====================================================================
# scripts/backup-db.sh — Supabase Postgres өгөгдлийн сангийн backup
#
# Бүх хүснэгт, өгөгдөл, функц, RLS бодлого, sequence-ийг plain SQL-ээр
# gzip хийж хадгална. Restore хийх Postgres-д тухайн schema-ийн extension-үүд
# суусан байна. `--no-owner` нь эх өгөгдлийн сангийн өмчлөгчийг сэргээхгүй.
#
# Шаардлага:
#   - pg_dump (PostgreSQL client) суулгасан байх
#   - DATABASE_URL env-д заасан байх (серверийн нууц — NEXT_PUBLIC_ БИШ!)
#
# Ашиглах жишээ:
#   DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
#     ./scripts/backup-db.sh
#
# Тохиргоо (env):
#   DATABASE_URL  — loopback port 54322 дээрх local Postgres URI.
#   BACKUP_DIR    — local хадгалах хавтас     (default: ./backups)
#   BACKUP_KEEP   — хэдэн хоногийн backup хадгалах (default: 14)
#   BACKUP_DEST   — (сонголт) зайнаас хадгалах газар:
#                     s3://bucket/prefix → aws s3 cp
#                     gs://bucket/prefix → gsutil cp
#                     /local/path        → cp (өөр mount эсвэл нөөц сервер)
#
# АНХААР: backup файл auth.users (имэйл) зэрэг PII агуулж болно — нууцалж
# хадгалаарай, git эсвэл олон нийтийн сан руу бүү оруул (/backups gitignored).
# =====================================================================
set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL env өгнө — local Postgres URI}"
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
node "$SCRIPT_DIR/assert-local-postgres.cjs"
# libpq can take hostaddr or a service definition independently of the URI host.
unset PGHOST PGHOSTADDR PGPORT PGDATABASE PGSERVICE PGSERVICEFILE PGSYSCONFDIR
BACKUP_DIR="${BACKUP_DIR:-./backups}"
BACKUP_KEEP="${BACKUP_KEEP:-14}"
BACKUP_DEST="${BACKUP_DEST:-}"

if ! command -v pg_dump >/dev/null 2>&1; then
  echo "pg_dump олдсонгүй. PostgreSQL client суулгана уу: https://www.postgresql.org/download/" >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"

STAMP="$(date +%Y%m%d-%H%M%S)"
FILE="$BACKUP_DIR/mur-${STAMP}.sql.gz"

echo "==> Backup хийж байна: $FILE"
# --no-owner/--no-acl: өөр төсөлд restore хийхэд рол/эрхийн зөрчил үүсгэхгүй
pg_dump --dbname="$DATABASE_URL" --no-owner --no-acl | gzip > "$FILE"

# Backup амжилттай болсон эсэхийг шалгах (файл хоосон биш)
if [ ! -s "$FILE" ]; then
  echo "Алдаа: backup файл хоосон байна." >&2
  exit 1
fi
echo "    Хэмжээ: $(du -h "$FILE" | cut -f1)"

# Хуучин backup-уудыг өдрөөр цэвэрлэх
find "$BACKUP_DIR" -name 'mur-*.sql.gz' -mtime +"$BACKUP_KEEP" -delete 2>/dev/null || true
echo "    Хадгалагдана: сүүлийн $BACKUP_KEEP хоног"

# (Сонголт) зайнаас хадгалах
if [ -n "$BACKUP_DEST" ]; then
  case "$BACKUP_DEST" in
    s3://*)
      command -v aws >/dev/null 2>&1 || { echo "aws CLI суулгаагүй байна" >&2; exit 1; }
      aws s3 cp "$FILE" "$BACKUP_DEST/"
      ;;
    gs://*)
      command -v gsutil >/dev/null 2>&1 || { echo "gsutil суулгаагүй байна" >&2; exit 1; }
      gsutil cp "$FILE" "$BACKUP_DEST/"
      ;;
    *)
      mkdir -p "$BACKUP_DEST"
      cp "$FILE" "$BACKUP_DEST/"
      ;;
  esac
  echo "==> $BACKUP_DEST руу хууллаа"
fi

echo "==> Backup дууслаа ✅"
