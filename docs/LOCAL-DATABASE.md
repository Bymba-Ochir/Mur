# Mur local database

Локал код production DB-д холбогдохгүй. Default API нь `http://127.0.0.1:54321`,
Postgres нь `127.0.0.1:54322`. Docker/Supabase асахгүй үед local app өгөгдөл авч
чадахгүй; hosted database руу fallback хийхгүй.

## Энэ Windows компьютер дээр асаах

Supabase-ийн Docker runtime нь `D:\Mur\mur-local-runtime` дахь Ubuntu VM-д
ажиллана. QEMU software emulation ашигладаг тул Windows feature идэвхжүүлэх
шаардлагагүй. VM диск нь Git repository-оос тусдаа хадгалагдана. Docker API-д
SSH tunnel болон TLS client certificate-ээр холбогдоно. Supabase Studio-ийн
Windows хавтас mount хийх шаардлагын улмаас VM горимд Studio алгасагдана.

```powershell
& 'D:\Mur\mur-local-runtime\Start-MurRuntime.ps1'
Set-Location 'D:\Mur\mur-mvp'
npm run db:start; if ($LASTEXITCODE -ne 0) { throw 'Local database start failed' }
npm run db:status; if ($LASTEXITCODE -ne 0) { throw 'Local database unavailable' }
npm run dev
```

Энгийн Docker engine ажилладаг компьютер дээр repository-оос `npm run db:start`
команд хангалттай. Энэ Windows компьютерийн VM-ийг зогсоохдоо эхлээд
`npm run db:stop` ажиллуулна. Дараа нь VM-ийг SSH-ээр унтраана.

```powershell
ssh.exe -F 'D:\Mur\mur-local-runtime\mur-ssh.conf' mur-local 'sudo poweroff'
```

`db:start` нь local stack-ийг асааж migrations/seed хэрэглэнэ. Дараа нь зөвхөн
local keys-ийг `.env.local`-д бичнэ; production env татахгүй. Docker network-ийн
published ports зөвхөн loopback-д bind хийгдэнэ. Local email inbox нь
`http://127.0.0.1:54324`. Энгийн Docker engine горимын Studio нь
`http://127.0.0.1:54323`. Local Auth-д өөр test account үүсгэнэ.
Production-ийн хэрэглэгч, мэдээлэл, Storage файлыг татахгүй.

`db:prepare` нь engine асахаас өмнө active env-ийг localhost + placeholder keys
болгож тусгаарлана. Өмнөх `.env.local`-ийн нэг хувийн нөөц
`.local-secrets/before-local-db-v104.env`-д хадгалагдана; Git-ignored бөгөөд код
тэр файлыг ачаалахгүй. Түүнийг active env рүү сэргээхгүй. `db:start` амжилттай
болтол placeholder keys нь API-д нэвтрэх боломж олгохгүй.

## Өдөр тутмын команд

| Команд | Үйлдэл |
| --- | --- |
| `npm run db:start` | Local stack асаах, local env тохируулах |
| `npm run db:stop` | Local stack зогсоох; өгөгдөл хадгалагдана |
| `npm run db:status` | Local endpoint бэлэн эсэх; key хэвлэхгүй |
| `npm run db:new -- add_feature` | Шинэ timestamp migration үүсгэх |
| `npm run db:diff -- describe_change` | Local schema өөрчлөлтийн SQL үүсгэх |
| `npm run db:migrate` | Pending migration-уудыг зөвхөн local DB-д хэрэглэх |
| `npm run db:reset` | Зөвхөн local өгөгдлийг устгаж migrations/seed-ээс дахин үүсгэх |
| `npm run db:test` | Local PostgreSQL дээр pgTAP invariant tests |
| `npm run db:check` | Migration дараалал, checksum, legacy SQL-ийн өөрчлөлтийг шалгах |

Wrapper нь remote URL, `--linked`, `--project-ref`, `--db-url` болон нэмэлт
аргумент дамжуулахгүй. Supabase CLI-г production project-той link хийхгүй.
`vercel link` нь өөр CLI бөгөөд env татаж remote URL оруулсан тохиолдолд local
app target guard дээр зогсоно. `npm run db:start` local env-ийг дахин тохируулна.

## Хамгаалалтын давхаргууд

- Browser, server API, metadata, sitemap нь shared guarded client factories.
- Non-Vercel runtime/default local build зөвхөн loopback API ашиглана.
  `NODE_ENV=production` нь hosted DB ашиглах зөвшөөрөл болохгүй. Windows runtime
  Vercel metadata байсан ч local. Local build/dev/start wrapper мөн guard хийнэ.
- Hosted browser bundle-г localhost/LAN дээр нээвэл target guard зогсооно.
  Hosted client зөвхөн build metadata дахь HTTPS host-ууд дээр ажиллана.
- Local Supabase fetch origin солих болон HTTP redirect хийхийг хориглоно.
  Realtime URL constructor дээр шалгагдсан local URL-ээс үүснэ.
- Local CSP болон Next image optimization production Supabase host зөвшөөрөхгүй.
- CI нь production secrets ашиглахгүй; temporary local Supabase үүсгэнэ.
- Local backup script `pg_dump` эхлэхээс өмнө PostgreSQL URI болон түүний
  connection options-ийг шалгаж, libpq-ийн host override env-ийг цэвэрлэнэ.

Энэ нь application болон repository-ийн дэмжигдсэн command-уудын хамгаалалт.
Компьютерийн firewall биш: raw third-party CLI эсвэл SQL client-ийг зориуд
remote URL-тай гараар ажиллуулахыг OS түвшинд хориглохгүй. Guard-ийг сулруулахгүй.

Vercel Preview/Production нь Linux hosted metadata-тай үед тус тусын dashboard
env-ийг ашиглана. Production env-ийг локал файл руу татахгүй; preview-д тусдаа
staging credentials ашиглах ёстой. Нууц утгуудыг repository-д нэмэхгүй.
