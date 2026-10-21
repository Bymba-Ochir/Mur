> ТҮҮХЭН ЛАВЛАГА: одоогийн заавар биш. [Нэгтгэсэн deploy заавар](../DEPLOYMENT.md)-ыг ашиглана.

# МӨР v62 — Асрах үйлчилгээний detail UI

## Энэ багцад

- Асрах үйлчилгээний жагсаалтын харагдах label бүхий search/type/district filter
- Desktop 3, tablet 2, mobile 1 баганатай тогтвортой grid
- Card дотор утас болон дэлгэрэнгүй action-ууд тусдаа semantic control
- Detail хуудасны responsive media, facts grid, loading, error/retry төлөв
- Create болон edit form-ийн field-level validation, hint, focus, disabled төлөв
- Зургийн preview/remove болон object URL cleanup
- Booking/review хэсгийн loading, error/retry, empty, status болон responsive төлөв
- Sitting бүх шинэ текстийн Монгол/англи орчуулга
- Dark/light theme token-уудыг хадгалсан, inline layout style арилгасан

## Шалгалтын үр дүн

- TypeScript: амжилттай
- ESLint: 0 error, 0 warning
- Vitest: 79/79
- Next.js production build: 35/35 route

## Windows дээр суулгах

```powershell
Expand-Archive `
  -Path "C:\Users\LENOVO\Downloads\mur-complete-upgrade-v62.zip" `
  -DestinationPath "D:\Mur\mur-mvp" `
  -Force

cd D:\Mur\mur-mvp

npm install
npm run typecheck
npm run lint
npm test
npm run build
```

## Deploy

Хэрэв `D:\Mur\mur-mvp` Git repository бол:

```powershell
git status
git add .
git commit -m "Polish sitting list detail forms and bookings"
git push origin main
```

Хэрэв `fatal: not a git repository` гарвал ZIP задалсан хавтас Git history агуулаагүй байна. GitHub repository-г тусад нь clone хийгээд v62 файлуудыг clone хийсэн хавтас руу задлана.

Vercel deploy дууссаны дараа `Ctrl + Shift + R` дарж cache-гүй шинэчилнэ.

Энэ UI багцад нэмэлт Supabase SQL ажиллуулах шаардлагагүй.
