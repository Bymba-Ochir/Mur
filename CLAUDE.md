# МӨР — Claude Code заавар

## Төсөл

МӨР бол Монголын гэрийн тэжээвэр амьтантай холбоотой вэб платформ:
алдсан/олдсон амьтан хайх, үрчлүүлэх, эрүүл мэндийн бүртгэл, мал эмнэлэг,
AI зөвлөх, асрах үйлчилгээ.

## Технологи

- **Next.js 16** (App Router) + **React 19** — PWA, React Native үе шат 2-т
- **Supabase** — DB + Auth + Storage (үнэгүй tier, карт шаардагүй)
- **TypeScript** — бүх эх код .ts/.tsx (JS→TS миграци дууссан)
- **Leaflet** — газрын зураг (client-only dynamic import)
- **Vitest + Playwright** — тест

## Код бичих дүрэм

### TS import
```
import type { District } from '../lib/districts';   ← ЗӨВ
import type { District } from '../lib/types';         ← БУРУУ (re-export хийгээгүй)
```
- `District` зөвхөн `lib/districts.ts`-оос import хийнэ (types.ts-д зөвхөн import, re-export алга)
- `PetType`, `SittingPetType` зэрэг type-уудыг `lib/types`-оос импортлоно
- `DISTRICTS` массивийг `lib/districts`-оос импортлоно

### i18n (хэл солилт)
- Бүх текстийг `lib/i18n.tsx`-ийн MN блокт нэмнэ
- Дараа нь заавал EN блокт хөрвүүлнэ (MN+EN хамт)
- `TranslationKey = keyof typeof MN` — шинэ түлхүүр нэмэхэд энэ төрөл автоматаар шинэчлэгдэнэ
- Хуудсанд `const { t } = useLanguage()` ашиглах, шууд текст бичихгүй

### DB утгууд
- DB-д хадгалагдах утгууд (District, PetType гэх мэт) **Монгол хэвээр** байна
- Зөвхөн харагдац (UI) дээр `t()` ашиглан орчуулна
- Form-д `e.target.value as PetType` гэх cast хэрэгтэй (string → Mongolian union)

### Зураг
- Leaflet-ийг `import('leaflet')` динамикаар ачаалах (client-only)
- `next/image` ашиглах (WebP, responsive sizes, lazy-load)
- Зураг upload-аас өмнө `compressImage()`-ээр шахах

### Алдаа барих
- `getErrorMessage(err)` (lib/utils.ts) — unknown catch err-д ашиглах
- Toast: `useToast()` hook ашиглах (alert()-ийн оронд)

## Тест

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # ESLint
npm test            # vitest (unit + component)
npm run test:e2e    # Playwright (dev server шаардлагатай)
```

## Үүсгэх зүйлс

- `createSittingListing`, `createPetReport`, `createAdoption` гэх мэт CRUD функцууд
- RLS дүрэм — `supabase-setup.sql` дээр засвар хийх бол **drop + create** хийнэ (IF NOT EXISTS ашиглах)
- Vercel cron job — `vercel.json`-д бүртгэгдсэн `/api/vaccine-reminders`

## Хийхгүй зүйлс

- `localStorage`-ийг render path дээр `typeof window`-тэй хамт ашиглахгүй (hydration error)
- `Date.now()`, `Math.random()`, `new Date()` render path дээр ашиглахгүй
- `window.matchMedia`-ийг render path дээр шууд шалгахгүй (`useSyncExternalStore` ашиглах)
- Бусад хүний `lib/` файлуудыг өөрчлөхгүй (адил файлууд бий болохоос сэргийлэх)

## Deploy

- **Vercel** — автомат deploy (main руу push → deploy)
- `.env.local` дахь нууцуудыг GitHub-д бүү оруул
- `GROQ_API_KEY` — сонголттой (AI зөвлөхийн Groq)
- `NEXT_PUBLIC_SUPABASE_URL/ANON_KEY` — заавал

## Next.js 16 анхааруулга

Энэ хувилбар нь standard Next.js-ээс ялгаатай — `params` нь Promise байна:
```tsx
// ЗӨВ (Next.js 16)
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
}

// БУРУУ (Next.js 14)
export default function Page({ params }: { params: { id: string } }) {
  const { id } = params;
}
```
`node_modules/next/dist/docs/` дээрх зааврыг уншиж, deprecation-ийг анхаар.

# МӨР — Frontend Redesign Төлөвлөгөө

> Энэ баримт бичгийг Claude Code-д шууд өгч болно. Доор `## Claude Code-д өгөх заавар`
> хэсэгт бэлэн prompt байгаа.

---

## 0. Одоогийн байдлын аудит

**Tech stack:** Next.js 16 (App Router) + React 19 + TypeScript, Tailwind config алга
(зөвхөн `app/globals.css`-д CSS variables + custom class ашигласан).

**Хэмжээ:**
- 21 page (`page.tsx`)
- 51 component (`components/`)
- Аль хэдийн нэлээд бодсон "Dusk Meadow" token систем байгаа (sage ногоон `#3D7A5F` +
  terracotta коралл `#E8725C`, glassmorphism, clamp-based fluid spacing/typography)

**Дүгнэлт:** Суурь бүтэц муугүй, гэхдээ таны хүсэлтээр **бүх визуал давхаргыг
шинээр** хийнэ — доорх төлөвлөгөө үүнд зориулагдсан.

---

## 1. Зорилго

1. Нэгдсэн, баримтжуулсан **design system** (token → primitive → composite)
2. Premium, дулаан, итгэл төрүүлэхүйц харагдац — Монголын pet-care платформд тохирсон
3. Web + mobile хоёуланд нь тусад нь сайн ажилладаг responsive
4. Одоогийн 51 component / 21 page-ийг эрсдэлгүй, шат дараатай солих (нэг дор биш)

---

## 2. Технологийн шийдэл (таамаглал — өөрчилж болно)

| Асуулт | Шийдвэр | Учир шалтгаан |
|---|---|---|
| Tailwind уу, CSS variables үү? | **Одоогийн CSS variables системийг үргэлжлүүлж, сайжруулна** | Аль хэдийн ажиллаж байгаа, clamp-based fluid scale, Tailwind шилжилт нэмэлт эрсдэл/цаг шаардана |
| Визуал чиглэл | **Дулаан, органик суурийг хадгалж, "premium" түвшинд гаргах** (илүү нарийн spacing, илүү зөв typography hierarchy, илүү цэвэрхэн card/shadow систем) | Pet-care платформд хатуу/хүйтэн дизайн тохирохгүй; одоогийн sage/coral палитр аль хэдийн зөв чиглэлд байгаа, зөвхөн **гүйцэтгэл**-ийг нь premium болгоно |

*Хэрэв та эдгээрийг өөрчлөх бол баримт бичгийн энэ хэсгийг л засаад Claude Code-руу өгөөрэй.*

---

## 3. Design tokens — шинэчлэх зүйлс

`app/globals.css`-ийн `:root` дотор байгаа системийг үндэслэн:

- **Өнгө:** одоогийн sage/coral палитрыг хадгалж, semantic layer нэмэх
  (`--surface-1/2/3`, `--text-primary/secondary/tertiary`, `--border-subtle/strong`)
- **Typography:** heading (`Unbounded`) / body (`Inter`) хосыг хадгалаад,
  type scale-ийг 8-9 алхамтай clamp() системээр нарийвчлах (H1-H6, body-lg/base/sm, caption)
- **Spacing:** 4px grid суурьтай 8 алхамтай scale (одоогийн `--sp-1..8`-г шалгаж
  тэгш хэмжээст болгох)
- **Radius:** 4 түвшин (sm/md/lg/pill) — component бүрт нэг стандарт
- **Shadow:** 3 түвшин (rest/hover/lifted) — одоогийн 6 shadow variable-ийг 3 болгож
  хялбарчлах
- **Motion:** duration (`150ms/250ms/400ms`) + easing token нэмэх, бүх hover/transition
  нэг стандарттай болгох

**Гарц:** `app/globals.css` дахь `:root` блок бүрэн шинэчлэгдэнэ.

---

## 4. Primitive компонентууд (шинээр бичих, `components/ui/` доор)

| Компонент | Variant-ууд |
|---|---|
| `Button` | primary / secondary / ghost / danger, sm/md/lg |
| `Input` | text/select/textarea, error state |
| `Badge` | status (шинэ/хуучин/баталгаажсан), semantic color |
| `Card` | base wrapper (одоогийн PetCard/AdoptionCard/ClinicCard-ийн суурь болно) |
| `Modal` | одоогийн `LoginModal`, `AppointmentModal`, `DonateModal`-ийг эндээс удирдана |
| `Toast` | одоогийн `Toast.tsx`-ийг шинэ token дээр зөөнө |
| `Avatar` | pet/хэрэглэгчийн зураг эсвэл fallback icon |
| `Skeleton` | одоогийн `SkeletonCard.tsx`-ийг ерөнхий primitive болгох |

---

## 5. Layout / navigation давхарга

- `Navbar.tsx`, `BottomNav.tsx` — шинэ token дээр, mobile/desktop-д тусад нь
  тохируулсан хувилбар
- `Footer.tsx` — шинэ typography/spacing
- Container/section стандарт (`--container-sm/md/lg` одоогийн байгааг ашиглана)

---

## 6. Фазын дараалал (Claude Code-д өгөх дараалал)

### Phase 1 — Foundation
- [ ] `app/globals.css` — tokens бүрэн шинэчлэх (§3)
- [ ] `components/ui/` шинэ folder — Button, Input, Badge, Card, Modal, Toast,
      Avatar, Skeleton (§4)

### Phase 2 — Reference page (баталгаажуулах цэг)
- [ ] `app/page.tsx` (нүүр хуудас) — бүрэн шинэ дизайнаар
- [ ] Navbar, BottomNav, Footer — шинэчлэх
- ⚠️ **Энэ фазын дараа зогсоод харах** — чиглэл зөв эсэхийг батал, дараа нь үргэлжлүүл

### Phase 3 — Гол composite компонентууд
- [ ] `PetCard`, `PetCardView`, `PetPreviewCard`
- [ ] `AdoptionCard`, `AdoptionCardView`, `AdoptionPreviewCard`
- [ ] `SittingCard`, `SittingCardView`
- [ ] `ClinicCard`
- [ ] `MyPetCard`

### Phase 4 — Өндөр хэрэглээтэй page-үүд
- [ ] `listings/page.tsx`
- [ ] `pets/[id]/page.tsx`
- [ ] `adoptions/page.tsx`, `adoptions/[id]/page.tsx`
- [ ] `clinics/page.tsx`

### Phase 5 — Form/action-heavy page-үүд
- [ ] `report-lost/page.tsx`, `report-found/page.tsx`
- [ ] `adoptions/new/page.tsx`, `sitting/new/page.tsx`
- [ ] Холбогдох Form компонентууд (`PetForm`, `AdoptionForm`, `SittingForm`,
      `PetEditForm`, `AdoptionEditForm`, `SittingEditForm`)

### Phase 6 — Хэрэглэгчийн профайл/эрүүл мэнд
- [ ] `my-pets/page.tsx`, `PetHealthPanel`, `VaccinationsSection`,
      `MedicationsSection`, `ConditionsSection`, `AppointmentsSection`
- [ ] `profiles/mypet/[id]`, `profiles/adoption/[id]`

### Phase 7 — Мессеж/бусад
- [ ] `messages/page.tsx`, `messages/[id]/page.tsx`, `MessageButton`
- [ ] `assistant/page.tsx`
- [ ] `sitting/page.tsx`, `sitting/[id]/page.tsx`
- [ ] `admin/page.tsx`

### Phase 8 — Static/legal + QA
- [ ] `privacy/page.tsx`, `terms/page.tsx`, `LegalContent`
- [ ] Бусад жижиг компонент (`Onboarding`, `InstallPrompt`, `LanguageToggle`,
      `ThemeToggle`, `ShareButtons`, `DonateButton`, `ReportButton`, `PawTrail`,
      `ScrollReveal`, `PageTransition`, `NotifySubscribe`, `VolunteerBadge`,
      `PetIcon`, `AnalyticsNotice`)
- [ ] Mobile (390px) / tablet (768px) / desktop (1280px+) бүрэн QA

---

## 7. Хийхгүй зүйлс (CLAUDE.md-с өвлөгдсөн)

- `lib/` доторх бизнес логик (service файлууд) **өөрчлөхгүй** — зөвхөн UI/component давхарга
- i18n: шинэ текст нэмвэл `lib/i18n.tsx`-ийн MN **болон** EN блокт хоёуланд нь нэмэх
- `localStorage`/`Date.now()`/`window.matchMedia`-г render path дээр шууд ашиглахгүй
  (hydration error) — CLAUDE.md-ийн дүрмийг дага
- Next.js 16: `params` бол Promise гэдгийг мартахгүй

---

## Claude Code-д өгөх заавар

```
Энэ бол МӨР төслийн frontend redesign. Энэ файл дахь §0-7 төлөвлөгөөг дага.

Дараалал: Phase 1 → Phase 2 (зогсож батал) → Phase 3 → ... → Phase 8.
Фаз бүрийн дараа зогсож надад харуул, батлуулаад дараагийн фаз руу шил.

Дүрэм:
- CLAUDE.md-ийн бүх дүрмийг дага (i18n MN+EN, import дүрэм, hydration аюулгүй байдал)
- lib/ доторх файлуудыг бүү өөрчил (зөвхөн components/ болон app/**/page.tsx-ийн UI давхарга)
- components/ui/ доор шинэ primitive-үүдийг эхлээд бий болго, дараа нь бусад бүх
  компонент үүнийг ашиглана
- Фаз бүр дуусах бүрд npm run typecheck болон npm run lint ажиллуулж алдаагүйг батал
```

---
дээрх зааврыг уншиж, deprecation-ийг анхаар.

*Энэ баримт бичгийг шаардлагатай үед засварлаад дахин Claude Code-д өгч болно.*
