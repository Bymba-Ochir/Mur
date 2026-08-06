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
