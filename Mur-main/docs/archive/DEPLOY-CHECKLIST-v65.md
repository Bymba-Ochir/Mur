> ТҮҮХЭН ЛАВЛАГА: одоогийн заавар биш. [Нэгтгэсэн deploy заавар](../DEPLOYMENT.md)-ыг ашиглана.

# МӨР v65 — Profile, My Pets, Saved UI

## 1. ZIP задлах

```powershell
Expand-Archive `
  -Path "C:\Users\LENOVO\Downloads\mur-complete-upgrade-v65.zip" `
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

Хүлээгдэх үр дүн: TypeScript болон ESLint алдаагүй, 86/86 тест амжилттай, Next.js production build амжилттай.

## 3. Deploy

```powershell
git add .
git commit -m "Polish profile my pets and saved detail UI"
git push origin main
```

Vercel deploy дууссаны дараа `https://mur-chi.vercel.app/profile`, `/profile/edit`, `/my-pets`, `/saved` хуудсуудыг desktop болон mobile дээр шалгана.

## 4. Энэ хувилбарын онцлог

- Profile болон profile edit-ийн responsive, loading, error, retry, validation төлөв
- Public profile report modal болон block/unblock төлөв
- My Pets semantic card, delete modal, vaccine date persistence
- Эрүүл мэндийн profile, вакцин, өвчин, эмийн responsive detail panel
- Saved favorites/searches summary, skeleton, empty/error/retry төлөв
- Монгол/англи хэл, light/dark theme, keyboard focus, reduced motion

Энэ хувилбарт нэмэлт Supabase SQL ажиллуулах шаардлагагүй.
