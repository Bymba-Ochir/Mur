# МӨР v73

- Вакцины огноог сонгох бүрд хадгалахыг болиулж Хадгалах/Цуцлах нэмсэн.
- Хадгалалт алдаатай бол оруулсан утга үлдэж, дахин оролдоно.
- Хадгалсны дараа бүтэн жагсаалтыг дахин татаж анивчуулахгүй.
- 976-аар эхэлсэн дотоодын 8 оронтой утасны дугаарыг зөв хүлээн авна.
- Аравтын тооны бинар нарийвчлалаас үүсэх буруу validation зассан.

TypeScript, lint амжилттай; 105 тест амжилттай. JSDOM shared Button-ийн CSS nesting-ийг parse хийх warning гардаг; interaction тестүүд амжилттай. Browser/mobile болон production build энэ багцад дахин баталгаажаагүй.
Нэмэлт SQL шаардлагагүй. Өмнөх .env.local файлаа хадгална.

```powershell
Expand-Archive `
  -Path "C:\Users\LENOVO\Downloads\mur-complete-upgrade-v73.zip" `
  -DestinationPath "D:\Mur\mur-mvp" `
  -Force
cd D:\Mur\mur-mvp
npm install
npm run typecheck
npm run lint
npm test
npm run build
```
