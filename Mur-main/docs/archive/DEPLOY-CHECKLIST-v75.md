> ТҮҮХЭН ЛАВЛАГА: одоогийн заавар биш. [Нэгтгэсэн deploy заавар](../DEPLOYMENT.md)-ыг ашиглана.

# МӨР v75 — зураг болон хуваалцах

- Зургийн жагсаалт цөөрөхөд хүчингүй индексээс үүдэх хоосон харагдацыг зассан.
- Босоо scroll хийхэд зураг солигдохгүй; зөвхөн давамгай хэвтээ swipe-ийг тооцно.
- Touch cancel цэвэрлэгдэнэ; сумны товчоор зураг сольж болно.
- Далд зургуудыг screen reader-д давхар уншуулахгүй.
- Mobile сумны товч 44px болсон.
- Clipboard/native share алдаатай үед гараар сонгож хуулах холбоос гарна.
- Хуваалцах товч form submit хийхгүй; copy timer unmount үед цэвэрлэгдэнэ.

TypeScript, lint болон 114 тест амжилттай. Энэ хувилбарт production build/mobile browser-ийг дахин ажиллуулаагүй.
Нэмэлт SQL шаардлагагүй; .env.local файлаа хадгална.

```powershell
Expand-Archive `
  -Path "C:\Users\LENOVO\Downloads\mur-complete-upgrade-v75.zip" `
  -DestinationPath "D:\Mur\mur-mvp" `
  -Force
cd D:\Mur\mur-mvp
npm install
npm run typecheck
npm run lint
npm test
npm run build
```
