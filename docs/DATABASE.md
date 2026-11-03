# Database ба migrations

Canonical schema history нь `supabase/migrations/` доторх timestamp-тай SQL.
Supabase CLI `2.122.0` dev dependency-д яг хувилбараар pin хийсэн. Local
workflow: [LOCAL-DATABASE](LOCAL-DATABASE.md).

## Existing SQL-ийг migrations болгосон нь

Өмнөх 23 SQL эх файлыг `supabase/legacy/`-д хадгалж, migration-д дараах дарааллаар бүртгэсэн.

1. Base setup, photo/breed/AI/listing upgrades.
2. Admin, production hardening, v49 → v52 → v53 → v54 → v55.
3. v89 booking exclusion → v96 normalization → v98 browser trust.
4. v99 pre/post → v100 joined reminders → v102 rate limits → v103 jobs.
5. v103 scheduler-ийн opt-in migration.

Historical source → canonical migration mapping/checksum нь
`supabase/legacy-sql-manifest.json`. [Архивын SQL](../supabase/legacy/) нь
өмнөх release болон audit-ын лавлагаа. Эх SQL-ийг өөрчлөхгүй. Imported
migration-ууд `migration-lock.json`-д checksum-тай. Line-ending ялгааг normalize
хийнэ. CI нь өмнөх Git commit дахь migrations-ийг давхар тулгаж edit/delete-ийг
хориглоно; шинэ forward migration нэмэх шаардлагатай.

Migration түүхийг хоосон локал Supabase PostgreSQL 17 дээр replay хийж,
pgTAP шалгалтаар баталгаажуулсан. GitHub CI шинээр үүсгэсэн локал stack дээр
үүнийг давтана. Production schema-тай тулгах ажлыг тусад нь хийнэ.

## Шинэ өөрчлөлт

Schema, RLS/grants, RPC, trigger, constraint, index, reference-data өөрчлөлт
бүгд шинэ migration болно. Application-ийн ердийн хэрэглэгчийн INSERT/UPDATE нь
schema migration биш. Нууц key, production user data нь migrations/seed-д орохгүй.

```powershell
npm run db:new -- add_example_feature
```

Үүссэн `supabase/migrations/<timestamp>_add_example_feature.sql`-д SQL бич.
Local Studio-оор public schema зассан бол `npm run db:diff -- describe_change`
ашиглаад generated SQL-ээ review хийнэ. Schema diff нь өгөгдлийн INSERT/UPDATE
эсвэл Vault зэрэг external configuration-ийг автоматаар capture хийхгүй;
Auth/Storage custom policy/trigger болон reference-data өөрчлөлтөө SQL migration-д
тусад нь бичиж шалгана.

```powershell
npm run db:check; if ($LASTEXITCODE -ne 0) { throw 'Migration check failed' }
npm run db:migrate; if ($LASTEXITCODE -ne 0) { throw 'Local migration failed' }
npm run db:reset; if ($LASTEXITCODE -ne 0) { throw 'Fresh replay failed' }
npm run db:test; if ($LASTEXITCODE -ne 0) { throw 'Database tests failed' }
```

`db:reset` local өгөгдлийг устгана. Хэрэгтэй local data-гаа нөөцөлсний дараа
fresh replay хийхдээ хэрэглэ. Applied migration-ийг өөрчлөхгүй; асуудлыг шинэ
forward migration-ээр засна.

## Existing production DB

Энэ шинэ migration history-г existing production DB дээр шууд `db push`,
`db reset`, эсвэл архивын SQL-ийг цувуулан ажиллуулж болохгүй. Локал код
production DB-д холбогдохгүй учраас `db pull`/production dump ч ажиллуулахгүй.

Production baseline/history reconciliation нь тусдаа manual release ажил:
Supabase Dashboard-оос owner schema/grants/RLS/functions/triggers-ийн metadata
экспорт гаргаж, production data-гүйгээр repository history-тай review хийнэ.
Яг аль migration аль хэдийн хэрэгжсэнийг нотолж байж ledger-ийг тусад нь
тааруулна. Тэр хүртэл зөвхөн шинэ, review хийсэн шаардлагатай migration-ийг
SQL Editor-д гараар ажиллуулж, version/checksum/гүйцэтгэгчийг бүртгэнэ.
CI/Vercel нь production migration автоматаар ажиллуулахгүй.

Scheduler migration нь default/local replay үед HTTP cron нэмэхгүй. Production
operator зориуд `SET app.mur_environment = 'production'` хийж, Vault secrets
бэлдсэн session-д тухайн SQL-ийг ажиллуулна. Local DB production worker URL руу
хүсэлт явуулах хуваарьгүй байна. Vault secret-ийн утгыг SQL файлд бичихгүй.

Production migration-ийн өмнө managed backup/restore боломж болон staging
үр дүнг шалгана. Vercel code rollback нь DB migration/data-г буцаахгүй.

### v99 release-ийн дараалал

1. Код deploy хийхээс өмнө [v99 pre-deploy SQL](../supabase/legacy/supabase-race-condition-hardening-v99.sql)-ийг Supabase SQL Editor-д ажиллуулна.
2. Vercel deploy амжилттай болсны дараа [v99 post-deploy SQL](../supabase/legacy/supabase-race-condition-hardening-v99-postdeploy.sql)-ийг ажиллуулна.
3. [Read-only audit](../audits/race-condition-v99-readonly.sql)-аар давхардсан идэвхтэй цаг, давхар зөвшөөрсөн үрчлэлт, давхцсан асаргааны захиалга тус бүр 0 байгааг шалгана.

`Get-Content ... | Set-Clipboard` нь SQL текстийг хуулна. Ажиллуулахдаа Supabase Dashboard → SQL Editor → Run ашиглана.
