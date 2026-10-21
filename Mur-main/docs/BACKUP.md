# Backup ба сэргээх

`scripts/backup-db.sh` нь `pg_dump --no-owner --no-acl | gzip` ашигладаг. Dump-д мэдээлэл болон schema орно, харин ACL grant-ууд `--no-acl`-аар хасагдана. Storage bucket доторх бодит зураг, Vercel env, provider тохиргоог энэ script backup хийхгүй.

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

Файл үүссэн нь сэргээх боломж батлагдсан гэсэн үг биш. Энэ шинэчлэлд backup/restore ажиллуулаагүй.
