> ТҮҮХЭН ЛАВЛАГА: одоогийн заавар биш. [Нэгтгэсэн deploy заавар](../DEPLOYMENT.md)-ыг ашиглана.

# МӨР v66 — Notifications, Activity, Settings detail UI

## 1. ZIP задлах

```powershell
Expand-Archive `
  -Path "C:\Users\LENOVO\Downloads\mur-complete-upgrade-v66.zip" `
  -DestinationPath "D:\Mur\mur-mvp" `
  -Force

cd D:\Mur\mur-mvp
```

## 2. Шалгалт

```powershell
npm install
npm run typecheck
npm run lint
npm test
npm run build
```

Хүлээгдэх үр дүн: TypeScript болон ESLint алдаагүй, 89/89 тест амжилттай, Next.js production build 35/35 route-тай амжилттай.

Хэрэв Turbopack cache-ийн `sst block header truncated` алдаа гарвал зөвхөн build cache-ийг цэвэрлээд дахин build хийнэ:

```powershell
Remove-Item -Recurse -Force .next
npm run build
```

## 3. Deploy

```powershell
git status
git add .
git commit -m "Polish notifications activity and settings detail UI"
git push origin main
```

Vercel deploy дууссаны дараа дараах хуудсуудыг desktop болон mobile дээр шалгана:

- `/notifications`
- `/activity`
- `/settings`

## 4. Энэ хувилбарын өөрчлөлт

- Notifications: unread summary, all/unread filter, realtime silent refresh, mark-all busy state, skeleton/empty/error/login states
- Activity: total/pending/accepted summary, sent/received role, localized workflow status, date/period/price details
- Settings: load/retry, accessible switches, independent save/export/delete states, JSON download feedback
- Account deletion: browser prompt-гүй, focus trap болон inline validation-тай modal
- Монгол/англи хэл, light/dark theme, keyboard focus, reduced motion, responsive layout

Энэ хувилбарт нэмэлт Supabase SQL ажиллуулах шаардлагагүй.
