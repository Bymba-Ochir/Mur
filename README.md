# МӨР — амьтны зар, үйлчилгээний платформ

Алдсан/олдсон амьтны зар, үрчлүүлэлт, асрах үйлчилгээ, мессеж, өөрийн амьтны эрүүл мэндийн бүртгэлийг нэгтгэсэн Next.js вэб төсөл.

## Шууд эхлэх — Windows PowerShell

```powershell
Set-Location 'D:\Mur\mur-mvp'
npm ci; if ($LASTEXITCODE -ne 0) { throw 'Dependency installation failed' }
& 'D:\Mur\mur-local-runtime\Start-MurRuntime.ps1'
npm run db:start; if ($LASTEXITCODE -ne 0) { throw 'Local database start failed' }
npm run dev
```

`http://localhost:3000` дээр нээнэ. `db:start` нь зөвхөн локал Supabase тохиргоог `.env.local`-д бичнэ. Өөр компьютерийн Docker тохиргоог [локал DB заавраас](docs/LOCAL-DATABASE.md) үзнэ.

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
| Admin | [ADMIN_SETUP](docs/ADMIN_SETUP.md) |
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

[Баримт бичгийн индекс](docs/README.md) нь идэвхтэй заавар, архив, SQL migration болон audit-ын байршлыг харуулна.
