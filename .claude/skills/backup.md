---
name: backup
description: Mur-ийн локал өгөгдлийн санг нөөцлөх, сэргээж шалгах
---

# Database backup

[Backup ба restore зааврыг](../../docs/BACKUP.md) ашиглана. Локал backup-д зөвхөн loopback PostgreSQL ашиглана. Restore-ийг тусгаарласан туршилтын санд хийж, dump-ийн бүрэн байдал, schema, мөрийн тоо, RLS-ийг шалгана.

Production backup-ийн огноо, сэргээх боломжийг Supabase Dashboard → Database → Backups дээр шалгана. Нууц утга, SQL dump-ийн агуулгыг лог эсвэл чатад хэвлэхгүй.
