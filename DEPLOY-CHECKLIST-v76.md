# МӨР v76 — Navbar засвар

Navbar-ийн styled-jsx дүрмийг .navbar-wrap-аар хязгаарласан global CSS болгож Next Link болон child component-ууд дээр мөр, зай, байрлал зөв үйлчлэхээр зассан.
Нэмэлт desktop цэсийн урт нэрүүдийг tooltip-тэй icon хэлбэрт оруулсан. Dropdown мөрүүд grid байрлалтай; өндөр нь viewport-д багтаж scroll хийнэ. Mobile цэс нээлттэй үед desktop хэмжээ рүү шилжвэл хаагдаж scroll lock тайлагдана.

TypeScript, lint, 114 тест амжилттай. Live URL web хэрэгслээр нээгдээгүй. Build-ийг automatic approval review Sentry рүү өгөгдөл дамжуулж болзошгүй шалтгаанаар зогсоосон; build/mobile visual баталгаажаагүй.
Нэмэлт SQL шаардлагагүй. .env.local файлаа хадгална.

```powershell
Expand-Archive `
  -Path "C:\Users\LENOVO\Downloads\mur-complete-upgrade-v76.zip" `
  -DestinationPath "D:\Mur\mur-mvp" `
  -Force
cd D:\Mur\mur-mvp
npm install
npm run typecheck
npm run lint
npm test
npm run build
```

Амжилттай build хийсний дараа өөрийн Git repository-оос deploy хийнэ.
