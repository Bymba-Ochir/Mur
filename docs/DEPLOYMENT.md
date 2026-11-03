# Deploy ба буцаах

## Deploy-оос өмнө

- [STATUS](STATUS.md)-ийн security зөрүүг шийдсэн эсэхийг шалга.
- Database backup болон staging migration үр дүнг хадгал.
- [ENVIRONMENT](ENVIRONMENT.md)-ийн шаардлагатай утгыг Vercel дээр тохируул.
- Supabase Auth redirect URL бодит домэйнтэй нийцсэн эсэхийг шалга.
- `npm ci`, `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` амжилттай байх.

## Git ба Vercel

ZIP-ээс задласан хавтас Git repository биш байж болно. Existing clone-оо ашигла; origin-ийг мэдэхгүйгээр `git init`/force push хийхгүй.

```powershell
npm run db:check; if ($LASTEXITCODE -ne 0) { throw 'Migration check failed' }
npm run typecheck; if ($LASTEXITCODE -ne 0) { throw 'Typecheck failed' }
npm run lint; if ($LASTEXITCODE -ne 0) { throw 'Lint failed' }
npm test; if ($LASTEXITCODE -ne 0) { throw 'Tests failed' }
npm run build; if ($LASTEXITCODE -ne 0) { throw 'Build failed' }
git add -A; if ($LASTEXITCODE -ne 0) { throw 'Git add failed' }
git commit -m "chore: isolate local database and version schema migrations"; if ($LASTEXITCODE -ne 0) { throw 'Commit failed' }
git push origin main
```

v104: Local app/CI нь production DB ашиглахгүй. Local setup болон migration
workflow-г [LOCAL-DATABASE](LOCAL-DATABASE.md), [DATABASE](DATABASE.md)-аас хар.
Одоогийн production DB дээр imported migration history-г бүхэлд нь ажиллуулахгүй.
Production schema/history reconciliation нь тусдаа manual review; CI нь зөвхөн
local DB үүсгэж шалгана, production migration автоматаар ажиллуулахгүй.

`DEPLOY-CHECKLIST-v*.md` redirect-уудыг өөрчилсөн бол тэдгээрийг мөн review хийгээд stage хийнэ. Vercel дээр deploy commit, environment, build log-ийг тулгана.

## Интеграц

`vercel.json`: `/api/vaccine-reminders`, `0 2 * * *` — 02:00 UTC буюу Улаанбаатарын 10:00 цагийн хуваарь. Энэ нь хүргэлтийн баталгаа биш.

Pets INSERT webhook: `/api/notify`, header `x-webhook-secret` нь `NOTIFY_WEBHOOK_SECRET`-тэй таарна. Cron-д `Authorization: Bearer ...` шаардлагатай. Хүсэлт хаах логикийн ZIP дэх зөрүүг STATUS-д тэмдэглэсэн.

QPay merchant тохиргоо, invoice/callback/status урсгалыг provider-ийн sandbox боломжтой бол тусгаарласан орчинд шалга. Dev mock нь бодит төлбөрийн баталгаа биш.

## Deploy дараах шалгалт

Нүүр, жагсаалт, login/logout, зар оруулах, өөрийн зар засах, өөр хэрэглэгчийн мэдээлэлд хандахыг хориглох, messages, profile/settings, push, AI, төлбөрийг тус тус шалгана. Нэвтрэх болон төлбөрийн token логт үлдэхгүйг шалга.

## Буцаах

Өмнөх баталгаажсан deploy-г сэргээ. Database өөрчлөлтийг application rollback автоматаар буцаахгүй. Schema backward compatibility-г шалгаж, шаардлагатай бол тусдаа засварын migration хэрэглэ. Production database-г setup SQL-ээр дахин үүсгэхгүй.
