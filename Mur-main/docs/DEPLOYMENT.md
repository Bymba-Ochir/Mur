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
git status
git diff --stat
git add README.md docs ADMIN_SETUP.md CONTRIBUTING.md
git commit -m "Consolidate project documentation"
git push
```

`DEPLOY-CHECKLIST-v*.md` redirect-уудыг өөрчилсөн бол тэдгээрийг мөн review хийгээд stage хийнэ. Vercel дээр deploy commit, environment, build log-ийг тулгана.

## Интеграц

`vercel.json`: `/api/vaccine-reminders`, `0 2 * * *` — 02:00 UTC буюу Улаанбаатарын 10:00 цагийн хуваарь. Энэ нь хүргэлтийн баталгаа биш.

Pets INSERT webhook: `/api/notify`, header `x-webhook-secret` нь `NOTIFY_WEBHOOK_SECRET`-тэй таарна. Cron-д `Authorization: Bearer ...` шаардлагатай. Хүсэлт хаах логикийн ZIP дэх зөрүүг STATUS-д тэмдэглэсэн.

QPay merchant тохиргоо, invoice/callback/status урсгалыг provider-ийн sandbox боломжтой бол тусгаарласан орчинд шалга. Dev mock нь бодит төлбөрийн баталгаа биш.

## Deploy дараах шалгалт

Нүүр, жагсаалт, login/logout, зар оруулах, өөрийн зар засах, өөр хэрэглэгчийн мэдээлэлд хандахыг хориглох, messages, profile/settings, push, AI, төлбөрийг тус тус шалгана. Нэвтрэх болон төлбөрийн token логт үлдэхгүйг шалга.

## Буцаах

Өмнөх баталгаажсан deploy-г сэргээ. Database өөрчлөлтийг application rollback автоматаар буцаахгүй. Schema backward compatibility-г шалгаж, шаардлагатай бол тусдаа засварын migration хэрэглэ. Production database-г setup SQL-ээр дахин үүсгэхгүй.
