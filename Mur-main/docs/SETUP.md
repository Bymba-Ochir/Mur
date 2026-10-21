# Локал орчин

CI нь Node.js 20 ашигладаг. Node/npm хувилбарыг CI болон хөгжүүлэгчийн орчинд тохируул; lockfile-тай суулгахдаа `npm ci` ашигла. Dependency өөрчлөхдөө л `npm install` ажиллуулж lockfile diff-ийг шалгана.

1. Repository-г clone хийх эсвэл ZIP задлах. ZIP-д Git history байхгүй.
2. Төслийн `package.json` байгаа хавтас руу орно.
3. README-ийн командуудаар dependency, `.env.local` бэлдэнэ.
4. Supabase Auth-ийн Site URL болон зөвшөөрөгдсөн redirect URL-д локал болон deploy домэйноо тохируулна.
5. Email magic link-ээр нэвтрэх, гарах, дахин нэвтрэхийг шалгана.
6. Database schema нь кодтой нийцсэн байх ёстой; [DATABASE](DATABASE.md)-ийг ашиглана.

```powershell
node --version
npm --version
npm run dev
```

Локал production шалгалт:

```powershell
npm run build
npm run start
```

Өөр терминалд зэрэг `dev` болон `start`-ыг ижил порт дээр ажиллуулахгүй. Нууц env утгыг чат, screenshot, commit-д оруулахгүй.
