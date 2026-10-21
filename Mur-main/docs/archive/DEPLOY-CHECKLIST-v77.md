> ТҮҮХЭН ЛАВЛАГА: одоогийн заавар биш. [Нэгтгэсэн deploy заавар](../DEPLOYMENT.md)-ыг ашиглана.

# МӨР v77 — Navbar keyboard

v76-ийн Navbar байрлалын засварыг агуулна.
Dropdown: ArrowUp/ArrowDown-оор нээх ба шилжих; Home/End; Escape хааж focus буцаах; focus цэснээс гарахад хаах.
TypeScript, lint болон өмнөх 114 тест, нэмэлт keyboard interaction тест амжилттай.
Бодит live/mobile харагдац баталгаажаагүй. Өмнөх build-ийн Sentry өгөгдөл дамжуулалтын automatic approval review блокийг дахин оролдоогүй.
Нэмэлт SQL шаардлагагүй.

```powershell
Expand-Archive `
  -Path "C:\Users\LENOVO\Downloads\mur-complete-upgrade-v77.zip" `
  -DestinationPath "D:\Mur\mur-mvp" `
  -Force
cd D:\Mur\mur-mvp
npm install
npm run typecheck
npm run lint
npm test
npm run build
```
