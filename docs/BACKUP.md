# Backup ба сэргээх

`scripts/backup-db.sh` нь `pg_dump --no-owner --no-acl | gzip` ашигладаг. Dump-д мэдээлэл болон schema орно, харин ACL grant-ууд `--no-acl`-аар хасагдана. Storage bucket доторх бодит зураг, Vercel env, provider тохиргоог энэ script backup хийхгүй.

v104: Энэ local script нь Node target guard-аар зөвхөн `localhost:54322`
PostgreSQL хүлээн авна. Remote/production URL-тай бол `pg_dump` эхлэхээс өмнө
зогсоно. Production backup-ийг Supabase Dashboard-ийн managed backup/PITR
ажлын урсгалаар тусад нь удирдана; local code production DB-д холбогдохгүй.

## Бэлтгэл

PostgreSQL client, Bash (Windows дээр WSL/Git Bash), database нууц холболтыг хамгаалагдсан environment-аар өгнө. Script `.env.local` автоматаар уншихгүй. `DATABASE_URL` утгыг командын жишээ, commit-д хадгалахгүй.

```bash
bash scripts/backup-db.sh
```

`BACKUP_DIR` default `./backups`, `BACKUP_KEEP` default 14 хоног. Script хуучин dump-уудыг устгадаг тул retention-оо ажиллуулахын өмнө шалга. `BACKUP_DEST` S3/GCS/local destination дэмждэг; холбогдох CLI болон эрх хэрэгтэй.

## Нэмэлт нөөц

Storage объектууд, table/column grants, role тохиргоо, extension хувилбар, webhook/cron/Auth redirect тохиргоог тусад нь хадгал. `pgvector`, `btree_gist` хэрэглэх migration байгаа тул дурын хоосон Postgres-д шууд сэргээнэ гэж үзэхгүй.

## Restore rehearsal

1. Production-оос тусдаа test database сонго.
2. Dump-ийн бүтэн байдал, timestamp, хэмжээ, шаардлагатай extension/role-ийг шалга.
3. Тохирох PostgreSQL хэрэгслээр алдаа дээр зогсдог restore хий.
4. Grant/RLS/trigger болон Storage объектуудыг тусад нь сэргээж тулга.
5. Мөрийн тоо, login, private record access, sample зураг, application smoke test хий.
6. Сэргээхэд зарцуулсан хугацаа, сүүлийн backup-аас алдагдах боломжтой хугацааг тэмдэглэ.

## Windows VM дээрх тусгаарласан restore

[Локал Supabase](LOCAL-DATABASE.md) ажиллаж байхад PowerShell-оос VM рүү орно.

```powershell
ssh.exe -F 'D:\Mur\mur-local-runtime\mur-ssh.conf' mur-local
```

VM-ийн терминалд backup үүсгээд ижил PostgreSQL image ашигласан, сүлжээгүй түр container-д сэргээнэ.

```bash
set -euo pipefail
umask 077
mkdir -p "$HOME/mur-backups"
stamp=$(date +%Y%m%d-%H%M%S)
backup="$HOME/mur-backups/mur-$stamp.sql.gz"
source_db=supabase_db_mur-local
test_db="mur-restore-$stamp"

docker exec "$source_db" pg_dump -U postgres -d postgres --no-owner --no-acl | gzip > "$backup.part"
gzip -t "$backup.part"
mv "$backup.part" "$backup"
image=$(docker inspect --format '{{.Config.Image}}' "$source_db")
docker run --pull=never --rm -d --network none --name "$test_db" \
  -e POSTGRES_PASSWORD="$(cat /proc/sys/kernel/random/uuid)" "$image" >/dev/null
timeout 240s bash -c 'until docker exec "$1" pg_isready -h 127.0.0.1 -U supabase_admin -d postgres >/dev/null 2>&1; do sleep 2; done' _ "$test_db"
docker exec "$test_db" createdb -U supabase_admin -T template0 mur_restore_test
gzip -dc "$backup" | docker exec -i "$test_db" \
  psql -X -U supabase_admin -d mur_restore_test -v ON_ERROR_STOP=1 --single-transaction -q
docker exec "$test_db" psql -X -U supabase_admin -d mur_restore_test -Atc \
  "select current_database(); select count(*) from supabase_migrations.schema_migrations; select count(*) from pg_tables where schemaname='public' and rowsecurity;"
printf 'Backup: %s\nTest container: %s\n' "$backup" "$test_db"
```

2026-11-03-ны локал туршилтаар `mur_restore_test`, 23 migration бүртгэл, RLS идэвхтэй 37 хүснэгт гарсан. Шалгалтын дараа `docker stop "$test_db"` ажиллуулбал container устаж, dump VM-д үлдэнэ.
