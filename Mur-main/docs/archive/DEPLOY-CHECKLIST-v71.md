> ТҮҮХЭН ЛАВЛАГА: одоогийн заавар биш. [Нэгтгэсэн deploy заавар](../DEPLOYMENT.md)-ыг ашиглана.

# МӨР v71 — Мал эмнэлгийн мэдээллийн шинэчлэл

## Хийгдсэн өөрчлөлт

- Хуучин demo эмнэлгүүдийг Google Maps болон эмнэлгийн нийтэлсэн эх сурвалжаар шалгасан 6 бодит эмнэлгээр сольсон.
- Эмнэлэг бүрийн утасны дугаар card дээр шууд харагдаж, дарахад залгана.
- Эмнэлэг бүр Google Maps холбоостой болсон.
- Албан сайт эсвэл Facebook хуудас олдсон эмнэлэгт тусдаа холбоос нэмсэн.
- Рентген, ЭХО, цусны шинжилгээ, микрочип, туулгалт, арчилгааны filter нэмсэн.
- Үйлчилгээний жагсаалт баталгаатай эсэхийг card дээр ялгаж харуулдаг болсон.
- Мэдээллийг 2026-09-03-нд шалгасныг card бүр дээр харуулна.

## Ашигласан гол эх сурвалж

- Энэрэх: https://www.vetnetmn.org/work/6
- UB Vet: https://www.facebook.com/UBVet/
- SOS Pet Care: https://www.facebook.com/S.O.S.emneleg
- Эмнэлэг бүрийн Google Maps place page

Цагийн хуваарь болон оношилгооны төхөөрөмж өөрчлөгдөж болдог тул очихын өмнө утсаар баталгаажуулна.

## Суулгах

```powershell
Expand-Archive `
  -Path "C:\Users\LENOVO\Downloads\mur-complete-upgrade-v71.zip" `
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

```powershell
git add .
git commit -m "Verify veterinary clinics and improve clinic contacts"
git push origin main
```

Энэ хувилбарт Supabase SQL migration шаардлагагүй.
