# Локал орчин

CI нь Node.js 20 ашигладаг. Node/npm хувилбарыг CI болон хөгжүүлэгчийн орчинд тохируул; lockfile-тай суулгахдаа `npm ci` ашигла. Dependency өөрчлөхдөө л `npm install` ажиллуулж lockfile diff-ийг шалгана.

1. Repository-г clone хийх эсвэл ZIP задлах. ZIP-д Git history байхгүй.
2. Төслийн `package.json` байгаа хавтас руу орно.
3. `npm ci` ажиллуулаад [локал Supabase](LOCAL-DATABASE.md)-ийг асаана. `db:start` нь `.env.local`-г локал DB-д тохируулна.
4. Локал test account-аар нэвтэрч, email шалгах бол Mailpit ашиглана.
5. Schema өөрчлөлтийг [migration заавраар](DATABASE.md) хийнэ.

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
