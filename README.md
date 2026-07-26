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
- CLIP embedding API → үнэгүй эхлэхэд **Hugging Face Inference API**-ийн free tier
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

## Файлын бүтэц

```
app/
  page.js              — Нүүр хуудас
  report-lost/page.js  — Алдсан амьтан мэдэгдэх
  report-found/page.js — Олдсон амьтан мэдэгдэх
  listings/page.js     — Жагсаалт, шүүлтүүр, төстэй байдлаар эрэмбэлэх
components/
  Navbar.js            — Навигац + имэйл magic-link login
  PetForm.js           — Дахин ашиглагдах бүртгэлийн форм
  PetCard.js           — Жагсаалтын карт
lib/
  supabase.js          — Supabase client тохиргоо
  useAuth.js            — Auth hook
  petService.js        — Supabase CRUD
  similarity.js        — Зурган төстэй байдал (MVP: өнгөний histogram)
supabase-setup.sql      — Өгөгдлийн сан, RLS дүрэм, Storage bucket үүсгэх SQL
```

## Дараагийн алхмууд (Үе шат 2)

- [x] `lib/similarity.js`-г CLIP embedding-тэй солих ✅ (browser-based, `@huggingface/transformers`, CDN)
- [ ] Facebook/Messenger руу Share товч нэмэх
- [ ] Push мэдэгдэл (Nearby Alert)
- [ ] Сүүлд харагдсан газрын зураг (OpenStreetMap + Leaflet)
- [ ] Вакцины сануулга feature (retention)
- [ ] React Native апп (iOS/Android)
