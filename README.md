# МӨР — MVP (Үе шат 1)

Алдсан/олдсон гэрийн тэжээвэр амьтныг олоход туслах платформ. Roadmap-ийн **Үе шат 1**
(Улаанбаатар, зөвхөн нохой/муур) шатанд тохирсон MVP код.

## Технологи

- **Next.js 14** (App Router) — зөвхөн вэб (PWA), React Native-г Үе шат 2-т
- **Supabase** — Postgres DB + Auth (имэйл magic link) + Storage, **карт шаардахгүй үнэгүй tier**
- **CLIP embedding — шууд БРАУЗЕР дотор ажиллана** (`@huggingface/transformers`,
  CDN-ээс ачаална). Hugging Face-ийн серверийн Inference API 2025-2026 онд
  архитектурын хувьд байнга өөрчлөгдөж (endpoint, эрх, дэмжигдэх загвар) тогтворгүй
  болсон тул үүнээс бүрэн ангид, серверийн зардал/токен/rate-limit шаардахгүй
  клиент талын шийдэл рүү шилжсэн. Дэлгэрэнгүй: `lib/similarity.js`.

## Яагаад Firebase биш Supabase вэ?

Firebase Storage-г 2024 оноос хойш ашиглахын тулд заавал зээлийн карт холбосон Blaze
план руу шилжих шаардлагатай болсон. Supabase бол **карт огт шаардахгүй**, мөн Auth +
Database + Storage бүгдийг нэг дор өгдөг тул хамгийн энгийн шийдэл.

**Анхаарах цорын ганц зүйл:** Supabase-ийн үнэгүй төсөл **7 хоног идэвхгүй байвал**
автоматаар "pause" болдог (мэдээлэл устахгүй, зөвхөн түр зогсдог). Хэрэв удаан хугацаанд
хэрэглэхгүй бол dashboard-с "Resume" дараад дахин ажиллуулна.

## Зардал — эхэндээ 100% үнэгүй, карт шаардахгүй

| Үйлчилгээ | Үнэгүй хязгаар |
|---|---|
| Supabase Database | 500MB |
| Supabase Storage | 1GB |
| Supabase Auth | 50,000 сарын идэвхтэй хэрэглэгч |
| Vercel Hosting (Hobby plan) | 100GB bandwidth/сар |

**Цорын ганц мөнгөтэй зүйл:** захиалсан домэйн нэр (жишээ: mur.mn) — заавал биш,
Vercel-ийн үнэгүй `*.vercel.app` домэйнээр эхэлж болно.

**Ирээдүйд анхаарах зүйлс (Үе шат 2-т мөнгөтэй болж болзошгүй):**
- Google Maps API → үүний оронд **OpenStreetMap + Leaflet.js** (үнэгүй) ашигла
- Хэрэглээ 500MB/1GB-с давсан үед Supabase Pro ($25/сар) руу шилжих шаардлагатай болно,
  гэхдээ MVP шатанд хэзээ ч хүрэхгүй хэмжээ

## Эхлэх алхамууд

### 1. Supabase төсөл үүсгэх

1. https://supabase.com → "Start your project" → GitHub эсвэл имэйлээр бүртгүүлнэ (карт хэрэггүй)
2. **"New project"** → нэр өгөөд (жишээ: `mur-mvp`), нууц үг үүсгэж, region-оо **Singapore**
   эсвэл **Tokyo** сонго (Монголд хамгийн ойр)
3. Төсөл үүсэхийг (1-2 минут) хүлээ

### 2. Өгөгдлийн сан бэлдэх

1. Зүүн цэснээс **SQL Editor** сонго
2. **"New query"** дараад энэ репо доторх `supabase-setup.sql` файлын бүх агуулгыг хуулж буулга
3. **"Run"** дар — энэ нь хүснэгт, аюулгүй байдлын дүрэм, Storage bucket-ыг бүгдийг нь нэг дор үүсгэнэ

### 3. Орчны хувьсагч авах

1. Зүүн цэснээс **Project Settings → API**
2. **"Project URL"**-ыг хуул → `.env.local`-ийн `NEXT_PUBLIC_SUPABASE_URL`
3. **"anon public"** түлхүүрийг хуул → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

```bash
cp .env.local.example .env.local
# дараа нь дээрх 2 утгыг бичиж хадгал
```

### 4. Имэйл нэвтрэлт тохируулах (анхдагчаар аль хэдийн идэвхтэй)

Supabase-д имэйл magic-link нэвтрэлт **анхдагчаар идэвхжсэн байдаг** тул нэмэлт
тохиргоо хийх шаардлагагүй. Хэрэв "Confirm email" шаардлагатай эсэхийг өөрчлөх бол
Authentication → Providers → Email тохиргооноос удирдана.

### 5. Суулгах, ажиллуулах

```bash
npm install
npm run dev
```

http://localhost:3000 дээр нээгдэнэ. "Нэвтрэх" дараад имэйлээ бичихэд холбоос ирвэл
тохиргоо зөв хийгдсэн гэсэн үг.

### 6. Deploy (жишээ нь Vercel)

```bash
npm install -g vercel
vercel
```

Vercel dashboard дээр орчны хувьсагчдаа (.env.local-той адил) нэмэхээ мартуузай.

### 6. Push мэдэгдэл (Nearby Alert) тохируулах

**А. VAPID түлхүүр** — `.env.local.example`-д аль хэдийн жишээ түлхүүрийн хос орсон,
шууд ашиглаж болно. Өөрийн шинэ түлхүүр хүсвэл:
```bash
npx web-push generate-vapid-keys
```

**Б. Supabase Service Role (secret) key авах:**
1. Project Settings → **API Keys**
2. **"secret key"** (`sb_secret_...`)-г хуулж `.env.local`-ийн `SUPABASE_SERVICE_ROLE_KEY`-д бич

⚠️ Энэ түлхүүрийг **хэзээ ч** `NEXT_PUBLIC_` угтвартай хувьсагчид бүү хий, GitHub-д бүү оруул.

**В. Webhook нууц үг:** `NOTIFY_WEBHOOK_SECRET`-д дурын урт санамсаргүй тэмдэгтийн мөр бич
(жишээ: `openssl rand -hex 16` командын гаралт).

**Г. Supabase Database Webhook тохируулах** (deploy хийсний дараа):
1. Supabase Dashboard → **Database → Webhooks**
2. **"Create a new hook"**
3. Table: `pets`, Events: **INSERT** л сонго
4. Type: **HTTP Request**, URL: `https://<таны-vercel-домэйн>/api/notify`
5. HTTP Headers-т нэм: `x-webhook-secret` = (танай `NOTIFY_WEBHOOK_SECRET`-тэй ижил утга)
6. **"Create webhook"**

Одоо шинэ "Алдсан"/"Олдсон" бичлэг үүсэх бүрд, тухайн дүүрэгт бүртгүүлсэн
хэрэглэгчид рүү push мэдэгдэл автоматаар явна.

**Анхаарах зүйл:** Push мэдэгдэл нь HTTPS шаарддаг тул **зөвхөн production
(Vercel) дээр л ажиллана**, `localhost` дээр Notification зөвшөөрөл асуух хүртэл
ажиллах ч бодит push ирэхгүй байж болно (Chrome dev тохиолдолд `localhost`-ыг
тусгайлан HTTPS мэт үзнэ, ажиллах ёстой).

## Файлын бүтэц

```
app/
  page.js              — Нүүр хуудас
  report-lost/page.js  — Алдсан амьтан мэдэгдэх
  report-found/page.js — Олдсон амьтан мэдэгдэх
  listings/page.js     — Жагсаалт, шүүлтүүр, төстэй байдлаар эрэмбэлэх
  pets/[id]/page.js    — Тухайн амьтны дэлгэрэнгүй, share хийх хуудас
  api/notify/route.js  — Push мэдэгдэл илгээх серверийн route (Webhook-оор дуудагдана)
components/
  Navbar.js            — Навигац + имэйл magic-link login
  PetForm.js           — Дахин ашиглагдах бүртгэлийн форм
  PetCard.js           — Жагсаалтын карт (дарахад дэлгэрэнгүй рүү орно)
  ShareButtons.js       — Facebook/native share/холбоос хуулах товчнууд
  NotifySubscribe.js    — "Nearby Alert" push мэдэгдэлд бүртгүүлэх товч
lib/
  supabase.js          — Supabase client тохиргоо
  useAuth.js            — Auth hook
  petService.js        — Supabase CRUD
  similarity.js        — Зурган төстэй байдал (CLIP, browser-based, CDN-ээс ачаалдаг)
  push.js              — Push мэдэгдэлд бүртгүүлэх клиент функцууд
public/sw.js            — Push мэдэгдэл хүлээн авах Service Worker
supabase-setup.sql      — Өгөгдлийн сан, RLS дүрэм, Storage bucket, push_subscriptions
```

## Дараагийн алхмууд (Үе шат 2)

- [x] `lib/similarity.js`-г CLIP embedding-тэй солих ✅ (browser-based, `@huggingface/transformers`, CDN)
- [x] Facebook/Messenger руу Share товч нэмэх ✅ (`ShareButtons.js`, `/pets/[id]` дэлгэрэнгүй хуудас)
- [x] Push мэдэгдэл (Nearby Alert) ✅ (`lib/push.js`, `public/sw.js`, `/api/notify` + Supabase Webhook)
- [ ] Сүүлд харагдсан газрын зураг (OpenStreetMap + Leaflet)
- [ ] Вакцины сануулга feature (retention)
- [ ] React Native апп (iOS/Android)
