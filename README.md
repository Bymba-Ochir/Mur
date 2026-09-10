# МӨР — амьтны зар, үйлчилгээний платформ

Алдсан/олдсон амьтны зар, үрчлүүлэлт, асрах үйлчилгээ, мессеж, өөрийн амьтны эрүүл мэндийн бүртгэлийг нэгтгэсэн Next.js вэб төсөл.

Энэ баримт нь хэрэглэгчийн өгсөн `Mur-main.zip` (Git snapshot `c7c34163debabc0b9aa98c9b277e7721fc9134ca`)-ийн кодод тулгуурлав. Код байгаа нь production урсгал баталгаажсан гэсэн үг биш. Security болон интеграцийн үлдсэн ажлыг [төлөвийн тайлангаас](docs/STATUS.md) үзнэ.

## Шууд эхлэх — Windows PowerShell

```powershell
cd D:\Mur\mur-mvp
npm ci
if (-not (Test-Path .env.local)) {
  Copy-Item .env.local.example .env.local
}
notepad .env.local
npm run dev
```

Supabase URL болон anon key-г бөглөсний дараа серверийг ажиллуулна. `http://localhost:3000` дээр нээнэ. Одоо байгаа `.env.local`-ийг жишээгээр дарж болохгүй. Database шинээр бэлдэх бол [DATABASE](docs/DATABASE.md)-ийг эхэлж уншина.

## Баримт бичгийн үндсэн холбоос

| Зорилго | Заавар |
|---|---|
| Суулгах, локал ажиллуулах | [SETUP](docs/SETUP.md) |
| Орчны хувьсагч | [ENVIRONMENT](docs/ENVIRONMENT.md) |
| SQL болон migration | [DATABASE](docs/DATABASE.md) |
| Deploy, буцаах | [DEPLOYMENT](docs/DEPLOYMENT.md) |
| Шалгалт | [TESTING](docs/TESTING.md) |
| Аюулгүй байдал | [SECURITY](docs/SECURITY.md) |
| Backup, сэргээх | [BACKUP](docs/BACKUP.md) |
| Архитектур, route | [ARCHITECTURE](docs/ARCHITECTURE.md) |
| Хэрэглэгчийн урсгал | [UX-FLOWS](docs/UX-FLOWS.md) |
| Алдаа оношлох | [TROUBLESHOOTING](docs/TROUBLESHOOTING.md) |
| Admin | [ADMIN_SETUP](ADMIN_SETUP.md) |
| Баталгаажуулалтын төлөв | [STATUS](docs/STATUS.md) |
| Хувь нэмэр оруулах | [CONTRIBUTING](CONTRIBUTING.md) |

## Технологи

`package.json`-д Next.js ^16.3.0, React ^19.2.8, TypeScript ^5.9.3, Tailwind ^4.3.3, Supabase JS ^2.45.0, Vitest ^4.1.10 байна. Яг суух хувилбарын эх сурвалж нь `package-lock.json`.

Зургийн төстэй байдал: browser дотор `Xenova/dinov2-small`, 384 хэмжээст embedding; transformers.js 3.0.2 CDN-ээс ачаална. Энэ нь амьтны identity-г баталдаг үйлчилгээ биш. AI туслахын Groq интеграц нь тусдаа.

## Шалгах команд

```powershell
npm run typecheck
npm run lint
npm test
npm run build
```

Build амжилттай болсон ч бодит төлбөр, push, database policy, mobile UX автоматаар батлагдахгүй. Тогтмол тестийн тоог README-д амлахгүй; тухайн run-ийн логийг хадгална.

## Баримт бичгийн хувилбар

`DEPLOY-CHECKLIST-v*.md` нь тухайн үеийн өөрчлөлтийн түүх. Шинэ суулгалтын нэгтгэсэн заавар нь `docs/` дотор байна. Үйлчилгээний үнэ, үнэгүй quota-г энэ төсөл баталгаажуулахгүй; provider-ийн dashboard-оос шалгана.
