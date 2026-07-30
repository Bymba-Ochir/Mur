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

### 7. Вакцины сануулга (retention feature) тохируулах

**А. Vercel дээр `CRON_SECRET` нэмэх:**
1. Дурын нууц урт мөр зохио (жишээ: `openssl rand -hex 16`)
2. Vercel Dashboard → Settings → Environment Variables → `CRON_SECRET` нэрээр нэм
3. Redeploy хий

Vercel Hobby (үнэгүй) план дээр **`vercel.json`-д тохируулсан cron job** (`/api/vaccine-reminders`, өдөр бүр 02:00 UTC) автоматаар ажиллана — нэмэлт тохиргоо хийх шаардлагагүй, зөвхөн deploy хийхэд л идэвхждэг.

**Б. Хэрэглээ:**
1. Хэрэглэгч нэвтэрч, **"Миний амьтад"** цэс рүү орно
2. **"Сануулгын мэдэгдэл идэвхжүүлэх"** дараад push зөвшөөрөл өгнө
3. Амьтныхаа нэр, төрөл, дараагийн вакцины огноог бүртгэнэ
4. Тухайн огноо болмогц (эсвэл хэтэрвэл), Vercel Cron өдөр бүр шалгаж push мэдэгдэл илгээнэ

**Анхаарах зүйл:** Vercel Hobby план дээр Cron Job-ууд **өдөрт нэг удаа** ажиллах хугацааны нарийвчлалтай (яг тухайн минутад биш, ойролцоогоор ажиллаж болно) — энэ бол үнэгүй tier-ийн хязгаарлалт, вакцины сануулгад хангалттай.

### 8. SEO болон PWA суулгах санал

**А. Домэйнээ тохируулах:** `.env.local`-д (болон Vercel Environment Variables-д)
`NEXT_PUBLIC_SITE_URL`-г таны бодит Vercel/өөрийн домэйноор бич (жишээ:
`https://mur-chi.vercel.app`). Энэ нь `sitemap.xml`, `robots.txt`, OG зурган
линкүүдэд ашиглагдана.

**Б. Google Search Console-д бүртгүүлэх** (заавал биш ч зөвлөж байна):
1. https://search.google.com/search-console → домэйнээ нэмнэ
2. Sitemap URL-аа илгээ: `https://<таны-домэйн>/sitemap.xml`
3. Google энэ файлыг уншиж, таны идэвхтэй "Алдсан/Олдсон" бичлэг бүрийг тусад нь индекслэж эхэлнэ

**В. PWA install санал:** Нэмэлт тохиргоо шаардахгүй, deploy хийсний дараа
шинэ хэрэглэгчид (аль хэдийн апп болгож суулгаагүй бол) доод хэсэгт
"Гэрийн дэлгэц рүү нэмэх" санал автоматаар харагдана. Android/Chrome дээр
шууд "Нэмэх" товчтой, iOS Safari дээр гарын авлага заавартай харагдана.

### 9. Admin dashboard тохируулах

1. `supabase-setup.sql`-ийг дахин ажиллуулсны дараа, **өөрийгөө admin болгох**:
   - Эхлээд танай апп дээр нэвтэрч (имэйл magic link) байгаа эсэхээ шалга
   - SQL Editor дээр (имэйлээ солиод):
   ```sql
   insert into admins (user_id)
   select id from auth.users where email = 'таны@имэйл.com';
   ```
2. Navbar дээр **"🛡️ Админ"** линк харагдана (зөвхөн admin хэрэглэгчид)
3. `/admin` хуудсанд мэдээлэгдсэн бичлэгүүдийг **"Үл хэрэгсэх"** (report арилгах) эсвэл
   **"Бичлэг устгах"** (pet + report хоёуланг нь устгах) хийж болно

### 10. Spam хамгаалалт, agуулгын шүүлт

- **Rate limiting**: Постгресийн trigger-ээр хэрэгжсэн (`check_pet_rate_limit`) — нэг
  утасны дугаар 1 цагт 5-аас олон удаа бичлэг нийтэлж чадахгүй. Клиент талаас
  тойрч болохгүй, `supabase-setup.sql`-ийг дахин ажиллуулахад автоматаар идэвхжинэ.
- **AI зурган шүүлт**: `lib/contentModeration.js`, CLIP-ийн zero-shot classification
  ашиглан зохисгүй агуулга эсвэл нохой/муур бус зургийг илрүүлж, анхааруулга/хориг
  өгнө. Нэмэлт тохиргоо шаардахгүй, `similarity.js`-тэй адил CDN-ээс ачаална.

### 11. Analytics болон Error tracking тохируулах

**А. Vercel Analytics + Speed Insights (нэмэлт тохиргоо бараг хэрэггүй):**
1. Vercel Dashboard → project → **"Analytics"** таб → **"Enable"**
2. Vercel Dashboard → project → **"Speed Insights"** таб → **"Enable"**
3. Код дотор аль хэдийн холбогдсон (`<Analytics />`, `<SpeedInsights />`) — deploy хийхэд л ажиллана

**Б. Sentry (error tracking):**
1. https://sentry.io → бүртгүүлэх (карт хэрэггүй)
2. **"Create Project"** → platform: **Next.js** сонго
3. Гарч ирэх **DSN**-г хуулж `.env.local`-ийн `NEXT_PUBLIC_SENTRY_DSN`-д бич, мөн
   Vercel Dashboard → Environment Variables-д мөн адил нэм
4. (Заавал биш, зөвхөн source map upload-д хэрэгтэй) Sentry → Settings → Auth Tokens-с
   token үүсгээд `SENTRY_AUTH_TOKEN`, мөн `SENTRY_ORG`, `SENTRY_PROJECT`-ыг бөглөх

**DSN тохируулаагүй үед ч апп хэвийн ажиллана** — Sentry автоматаар idle горимд орно,
build алдаа өгөхгүй.

### 12. Хандив (QPay) тохируулах

⚠️ **Чухал ялгаа бусад үйлчилгээнээс:** QPay merchant эрх авахын тулд **бүртгэлтэй
бизнес (аж ахуйн нэгж) шаардлагатай** — өмнөх Supabase/Vercel/Resend зэрэг шиг
хувь хүний данс ашиглаж болохгүй.

1. https://qpay.mn → "Бизнесийн хэрэглэгч" бүртгүүлэх (компанийн гэрчилгээ шаардана)
2. Мерчант хэсгээс **Username, Password, Invoice Code**-оо ав
3. `.env.local`-даа:
   ```
   QPAY_USERNAME=...
   QPAY_PASSWORD=...
   QPAY_INVOICE_CODE=...
   QPAY_CALLBACK_SECRET=<дурын урт нууц мөр>
   ```
4. Vercel Environment Variables-д мөн адил нэм

**QPay мерчант эрхгүй бол:** `DonateModal.js`-г Messenger/Bank Transfer холбоос руу
чиглүүлэх энгийн хувилбараар түр орлуулж болно — хэрэгтэй бол хэлээрэй.

### 13. Англи хэл сонголт

Navbar болон Нүүр хуудас **бүрэн орчуулагдсан** (`lib/i18n.js`). Бусад хуудсыг
(жагсаалт, мэдэгдэх форм г.м.) ижил загвараар үргэлжлүүлж орчуулж болно — `DICT`
object-д шинэ түлхүүр нэмээд, тухайн хуудсанд `useLanguage()` hook-оор ашиглана.

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
  LocationMap.js        — OpenStreetMap + Leaflet газрын зураг (сонгох/харах)
lib/
  supabase.js          — Supabase client тохиргоо
  useAuth.js            — Auth hook
  petService.js        — Supabase CRUD
  similarity.js        — Зурган төстэй байдал (CLIP, browser-based, CDN-ээс ачаалдаг)
  push.js              — Push мэдэгдэлд бүртгүүлэх клиент функцууд
  vaccineService.js    — "Миний амьтад" вакцины сануулгын CRUD
public/sw.js            — Push мэдэгдэл хүлээн авах Service Worker
vercel.json             — Vercel Cron Job тохиргоо (вакцины сануулга)
supabase-setup.sql      — Өгөгдлийн сан, RLS дүрэм, Storage bucket, push_subscriptions, my_pets
```

## Дараагийн алхмууд (Үе шат 2)

- [x] `lib/similarity.js`-г CLIP embedding-тэй солих ✅ (browser-based, `@huggingface/transformers`, CDN)
- [x] Facebook/Messenger руу Share товч нэмэх ✅ (`ShareButtons.js`, `/pets/[id]` дэлгэрэнгүй хуудас)
- [x] Push мэдэгдэл (Nearby Alert) ✅ (`lib/push.js`, `public/sw.js`, `/api/notify` + Supabase Webhook)
- [x] Сүүлд харагдсан газрын зураг ✅ (`components/LocationMap.js`, OpenStreetMap + Leaflet.js — API key шаардахгүй)
- [x] Вакцины сануулга feature (retention) ✅ (`/my-pets`, Vercel Cron + push мэдэгдэл)
- [x] "Олдлоо" товч ✅ (зохиогч л тэмдэглэж чадна, RLS-ээр хамгаалагдсан)
- [x] Facebook/Messenger share-д зурган preview (og:image) ✅ (`generateMetadata`, server component)
- [x] Мэдээлэх (report) товч ✅ (`ReportButton.js`, `reports` хүснэгт)
- [x] Өөрийн бичлэгээ засах/устгах ✅ (зохиогч л, RLS-ээр хамгаалагдсан)
- [x] Текстээр хайх ✅ (нэр/өнгө/байршил/төрлөөр, debounce-той)
- [x] Утасны дугаар хэсэгчлэн нуух ✅ (`maskPhone`, "Дугаар харах" товч)
- [x] Google хайлтад олдох (SEO) ✅ (`app/sitemap.js`, `app/robots.js`, OG metadata)
- [x] PWA "Add to Home Screen" сануулга ✅ (`components/InstallPrompt.js`)
- [x] Toast мэдэгдэл (alert()-ийн оронд) ✅ (`components/Toast.js`)
- [x] Skeleton loading ✅ (`components/SkeletonCard.js`)
- [x] Сайжруулсан empty state ✅ (icon + CTA товч)
- [x] Онбординг (эхний удаад 3 алхамт танилцуулга) ✅ (`components/Onboarding.js`)
- [x] Формын алхамчилсан UI (progress indicator) ✅ (`PetForm.js`, 4 алхамт wizard)
- [x] Автомат байршил тодорхойлох (Geolocation) ✅ (`lib/districtCoords.js`, gадаад API/зардалгүй)
- [x] Харьцангуй цаг ("3 цагийн өмнө") ✅ (`lib/relativeTime.js`)
- [x] Dark mode ✅ (`ThemeToggle.js`, CSS variables, localStorage хадгалалттай)
- [x] SVG icon (нохой/муур, emoji-ийн оронд) ✅ (`components/PetIcon.js`)
- [x] Зураг compress хийх (upload-аас өмнө) ✅ (`lib/imageCompress.js`, 1200px хүртэл)
- [x] Bottom navigation ✅ (`components/BottomNav.js`, ≤640px дэлгэцэнд харагдана, SVG icon)
- [x] Admin/Модератор dashboard ✅ (`/admin`, `admins` хүснэгт, RLS-ээр хамгаалагдсан)
- [x] Rate limiting (spam хамгаалалт) ✅ (Postgres trigger, клиентээс тойрч болохгүй)
- [x] AI зурган шүүлт (зохисгүй/хамааралгүй агуулга) ✅ (`lib/contentModeration.js`, CLIP zero-shot)
- [x] Analytics ✅ (Vercel Analytics + Speed Insights, карт шаардахгүй)
- [x] Error tracking ✅ (Sentry, үнэгүй tier, DSN тохируулаагүй ч апп эвдэрдэггүй)
- [x] "Би харсан" сэтгэгдэл ✅ (`sightings` хүснэгт, `SightingsList.js`, нэвтрэлт шаардахгүй)
- [x] Сайн дурын сүлжээ ✅ (`volunteers` хүснэгт, `VolunteerBadge.js`, дүүрэг бүрийн тоог харуулна)
- [x] Screen reader дэмжлэг (a11y) ✅ (keyboard navigation, aria-label, htmlFor/id, skip-link, focus states)
- [x] Хандив (QPay) ✅ (`DonateModal.js`, QR код, автомат баталгаажуулалт — бизнесийн данс шаардана)
- [x] Англи хэл сонголт ✅ (`lib/i18n.js` — **бүх хуудас 100% орчуулагдсан**: Navbar, Нүүр, форм, Жагсаалт, дэлгэрэнгүй, Миний амьтад, Admin, Хандив (QPay))
- [ ] React Native апп (iOS/Android)
