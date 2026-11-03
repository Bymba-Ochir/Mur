# Баримт бичгийн индекс

[Төслийн README](../README.md)-д суулгалтын команд болон өдөр тутмын зааврын холбоосууд бий.

| Байршил | Агуулга |
| --- | --- |
| [docs/](./) | Идэвхтэй заавар. [Локал DB](LOCAL-DATABASE.md), [deploy](DEPLOYMENT.md), [backup ба restore](BACKUP.md), [admin](ADMIN_SETUP.md). |
| [docs/archive/](archive/) | Өмнөх release checklist, snapshot тайлан, түүхэн төлөвлөгөө. |
| [audits/](../audits/) | Аудитын тайлан болон read-only SQL шалгалтууд. |
| [supabase/migrations/](../supabase/migrations/) | Timestamp-тай schema migration-ууд. |
| [supabase/legacy/](../supabase/legacy/) | Migration-д хөрвүүлсэн хуучин SQL эх файлууд. |
| [supabase/tests/](../supabase/tests/) | pgTAP шалгалтууд. |
| [supabase/seed.sql](../supabase/seed.sql) | Локал seed. |

Шинэ production release-д [deploy](DEPLOYMENT.md) болон [migration](DATABASE.md) зааврыг ашиглана.

`wireframes.html` нь дизайны лавлагаа; live UI баталгаа биш.
