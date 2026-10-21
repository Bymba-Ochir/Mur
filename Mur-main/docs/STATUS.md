# Snapshot-ийн төлөв

Эх сурвалж: Mur-main.zip, commit c7c34163debabc0b9aa98c9b277e7721fc9134ca. Энэ docs багц application код, SQL-ийг өөрчлөөгүй.

| Хэсэг | Төлөв |
|---|---|
| Package scripts, route, env, cron | Snapshot кодоос тулгасан |
| README-ийн CLIP / Dusk Meadow / 10 clinic / бүх функц ажиллана | Хуучирсан тайлбарыг сольсон |
| Зургийн загвар | DINOv2-small, 384 хэмжээст |
| QPay callback / vaccine cron | Secret байхгүй үеийн хамгаалалт дутуу салбар snapshot-д байна |
| Production RLS/grants | Өмнөх хэрэглэгчийн үр дүнд privacy эрсдэл бий; засварын execution батлагдаагүй |
| v93–v95 security patch | Энэ archive-тай ижил гэж батлаагүй; тусад нь code diff шаардлагатай |
| Unit/lint/build/E2E | Энэ documentation task-д ажиллуулаагүй |
| SQL migration, backup restore | Энэ task-д ажиллуулаагүй |
| Mobile/auth/AI/QPay/push delivery | Энэ snapshot дээр end-to-end батлаагүй |

## Дараагийн release gate

Security patch reconciliation → staging SQL review → хоёр хэрэглэгчийн эрхийн тест → typecheck/lint/unit/build → mobile/auth smoke → integrations → deploy → production smoke.

Өмнөх checklist-ийн тестийн тоо, "бэлэн" төлөв нь тухайн үеийн мэдээлэл; энэ snapshot-ийн баталгаа болгож хэрэглэхгүй.
