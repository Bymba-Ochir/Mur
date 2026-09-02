# МӨР v63 — Эмнэлэг болон AI туслахын detail UI

## Энэ багцад

- Эмнэлгийн search, дүүрэг, үйлчилгээ болон ойр байршлын харагдах label бүхий filter
- Filter цэвэрлэх, үр дүнгийн тоо, responsive empty state
- Desktop list + sticky map, tablet/mobile map-first layout
- Clinic card-ийн semantic бүтэц, тусдаа map/call/appointment action
- Appointment form-ийн pet loading/error, validation, disabled болон responsive төлөв
- Захиалгын loading skeleton, error/retry, empty, status болон cancel төлөв
- AI conversation-ийн semantic live log, severity badge, source болон feedback action
- AI composer-ийн textarea, keyboard send, character count, disabled болон retry төлөв
- Pet context, quick suggestions, conversation clear болон medical disclaimer
- Эмнэлэг болон AI-ийн шинэ текстийн Монгол/англи орчуулга
- AI server prompt-ийн Монгол/англи тусдаа хувилбар
- Dark/light theme, focus-visible, reduced-motion болон touch target сайжруулалт
- Inline layout style болон nested main landmark цэвэрлэгээ

## Шалгалтын үр дүн

- TypeScript: амжилттай
- ESLint: 0 error, 0 warning
- Vitest: 81/81
- Next.js production build: 35/35 route

## Windows дээр суулгах

```powershell
Expand-Archive `
  -Path "C:\Users\LENOVO\Downloads\mur-complete-upgrade-v63.zip" `
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
git commit -m "Polish clinic and AI assistant detail UI"
git push origin main
```

Хэрэв `fatal: not a git repository` гарвал ZIP задалсан хавтас Git history агуулаагүй байна. GitHub repository-г тусад нь clone хийгээд v63 файлуудыг clone хийсэн хавтас руу задлана.

Vercel deploy дууссаны дараа `Ctrl + Shift + R` дарж cache-гүй шинэчилнэ.

Энэ UI багцад нэмэлт Supabase SQL ажиллуулах шаардлагагүй.
