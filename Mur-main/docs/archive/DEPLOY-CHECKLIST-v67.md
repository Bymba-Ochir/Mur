> ТҮҮХЭН ЛАВЛАГА: одоогийн заавар биш. [Нэгтгэсэн deploy заавар](../DEPLOYMENT.md)-ыг ашиглана.

# МӨР v67 — Admin detail UI deploy checklist

## Энэ багцын өөрчлөлт

- Admin dashboard-ийн hierarchy, responsive 6-stat summary
- Keyboard болон screen reader дэмжлэгтэй 6 tab
- Зарын report, хэрэглэгчийн report, бүх контентын detail queue
- Browser confirm-ийн оронд focus trap, Esc, scroll lock бүхий delete modal
- Loading skeleton, empty, persistent error, retry төлөв
- `/api/health` дээр тулгуурласан configuration/database system status
- Audit log-ийн desktop table болон mobile stack layout
- Монгол/англи текст, dark/light theme, focus/hover/disabled төлөв
- Inline layout style болон emoji ашиглаагүй

## Суулгах, шалгах

```powershell
Expand-Archive `
  -Path "C:\Users\LENOVO\Downloads\mur-complete-upgrade-v67.zip" `
  -DestinationPath "D:\Mur\mur-mvp" `
  -Force

cd D:\Mur\mur-mvp

npm install
npm run typecheck
npm run lint
npm test
npm run build
```

## Supabase

v67-д шинэ SQL migration байхгүй.

Audit log харагдахгүй байвал өмнөх багцын дараах файлыг Supabase SQL Editor дээр нэг удаа ажиллуулсан эсэхээ шалгана:

```text
D:\Mur\mur-mvp\supabase-admin-upgrade.sql
```

## Admin эрх

Admin хуудас зөвхөн `admins` хүснэгтэд тухайн хэрэглэгчийн UUID бүртгэлтэй үед нээгдэнэ.

## Deploy

```powershell
git status
git add .
git commit -m "Polish admin moderation and system health UI"
git push origin main
```

Vercel deploy дууссаны дараа `/admin` дээр desktop, tablet, mobile хэмжээнд tab бүрийг шалгана.

## Баталгаажсан шалгалт

- TypeScript: амжилттай
- ESLint: 0 error, 0 warning
- Vitest: 90/90
- Next.js production build: 35/35 route
