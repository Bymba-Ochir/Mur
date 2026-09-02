# МӨР v64 — Messages болон message detail UI

## Энэ багцад

- Messages болон AI туслахын semantic tab/tab panel бүтэц
- Харилцааны жагсаалтын unread summary, responsive card болон status badge
- Login шаардлагатай, loading skeleton, empty, error болон local retry төлөв
- Устсан зар, зураггүй амьтан, сүүлийн зурвасгүй харилцааны fallback
- Харилцааны detail header, оролцогч, холбоотой зар болон олдсон төлөв
- Зурвасуудын өдөр тусгаарлалт, цаг, илгээсэн/уншсан төлөв
- Realtime зурвас ирэхэд duplicate-гүй нэмэх болон unread mark
- Хуучин зурвас уншиж байхад шинэ зурвас руу очих товч
- Олон мөрийн textarea, Enter/Shift+Enter, 2000 тэмдэгтийн тоолуур
- Илгээх loading, disabled, inline error болон дахин илгээх төлөв
- Desktop, tablet, mobile болон mobile keyboard-safe өндөр
- Монгол/англи текст, dark/light theme, focus-visible, reduced-motion
- Inline layout style болон бүтэн page reload retry-г арилгасан

## Шалгалтын үр дүн

- TypeScript: амжилттай
- ESLint: 0 error, 0 warning
- Vitest: 83/83
- Next.js production build: 35/35 route

## Windows дээр суулгах

```powershell
Expand-Archive `
  -Path "C:\Users\LENOVO\Downloads\mur-complete-upgrade-v64.zip" `
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
git commit -m "Polish messages list and conversation detail UI"
git push origin main
```

Хэрэв `fatal: not a git repository` гарвал ZIP задалсан хавтас Git history агуулаагүй байна. GitHub repository-г тусад нь clone хийгээд v64 файлуудыг clone хийсэн хавтас руу задлана.

Vercel deploy дууссаны дараа `Ctrl + Shift + R` дарж cache-гүй шинэчилнэ.

Энэ UI багцад нэмэлт Supabase SQL ажиллуулах шаардлагагүй.
