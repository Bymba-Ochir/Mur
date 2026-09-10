# Алдаа оношлох

| Шинж | Шалгах зүйл |
|---|---|
| `supabaseUrl is required` | `package.json`-тай хавтас дахь `.env.local`, URL/key; server restart/build |
| `not a git repository` | ZIP history агуулахгүй. Existing clone ашиглаж өөрчлөлтөө шилжүүлэх |
| `npm ci` lockfile зөрүү | Зөв Node/npm ба package-lock; dependency update-ийг review хийх |
| TypeScript/lint fail | Эхний бодит error; тест/дүрмийг шууд унтраахгүй |
| Form хадгалах 401/403 | Session, RLS, created_by/user_id, migration |
| Хуудас хоосон | Network response, error UI, Supabase schema/cache |
| Navbar spacing эвдрэх | globals.css cascade layer, computed styles, давхар CSS |
| AI similarity ачаалахгүй | CDN/model request, CSP, browser memory/WebGPU fallback |
| Push ирэхгүй | Permission, service worker, VAPID хос, subscription, server secret/log |
| QPay pending | Invoice тохиргоо, callback auth, provider response; dev mock-оос ялгах |
| Build Sentry дээр зогсох | Upload тохиргоо, зөвшөөрөл, CI log; автомат хоригийг тойрохгүй |

Алдааны мэдээлэл явуулахдаа команд, эхний error, хувилбар, route-ийг өг. Нууц env утга, bearer token, хэрэглэгчийн мессежийг арилгана.
