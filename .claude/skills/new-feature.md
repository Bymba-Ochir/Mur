---
name: new-feature
description: Шинэ функц нэмэх — загварын дагуу файлууд үүсгэх
---

# New Feature Scaffolding

Шинэ функц нэмэхэд туслах алхмууд. МӨР-ийн батлагдсан загварыг дагана.

## Алхам 1: Файлын бүтэц тодорхойлох
Жишээ: "Асрах үйлчилгээ" функц шиг:

```
app/feature-name/
  page.tsx                    — Жагсаалт (client)
  new/page.tsx                — Шинэ нэмэх (client)
  [id]/page.tsx               — Дэлгэрэнгүй (server, metadata)
  [id]/FeatureDetailClient.tsx — Дэлгэрэнгүй (client)
components/
  FeatureCard.tsx              — Карт
  FeatureCardView.tsx          — Картын харагдац
  FeatureForm.tsx              — Форм
  FeatureEditForm.tsx          — Засах форм
lib/
  featureService.ts            — CRUD
```

## Алхам 2: Дүрэм дагах

### DB хүснэгт
```sql
CREATE TABLE IF NOT EXISTS features (...);
ALTER TABLE features ADD COLUMN IF NOT EXISTS ...;
ALTER TABLE features ENABLE ROW LEVEL SECURITY;
-- RLS дүрэм: Public read, Auth insert, Owner update/delete
```

### Types (`lib/types.ts`)
```ts
export interface Feature { id: string; userId: string; ... }
export interface FeatureInput { ... }
export interface FeatureFilters { ... }
```

### i18n (`lib/i18n.tsx`)
MN блокт нэмэх → Дараа нь заавал EN блокт хөрвүүлэх.

### Service (`lib/featureService.ts`)
- `createFeature`, `fetchFeatureById`, `fetchFeatures`, `updateFeature`, `deleteFeature`
- `requireUserId()` ашиглах
- Row → Domain mapping хийх

### Form (`components/FeatureForm.tsx`)
- 3 алхамт wizard (PawTrail ашиглах)
- Photo upload + compress
- Preview card (≥860px дэлгэцэнд)
- LocationMap (байршил бүртгэх бол)

### Detail (`FeatureDetailClient.tsx`)
- `useSyncExternalStore` — URL share
- Phone mask reveal (`maskPhone`/`formatPhone`)
- Owner actions (edit/delete)
- ShareButtons
- LocationMap (coords байвал)

## Алхам 3: Тест
- Unit test: `tests/unit/featureService.test.ts`
- Component test: `tests/component/FeatureCard.test.tsx`
- E2E test: `tests/e2e/feature.spec.ts`

## Алхам 4: Навигаци
- `components/Navbar.tsx` → `navLinks`-д нэмэх
- `app/sitemap.ts` → static routes-д нэмэх

## Анхааруулга
- `typeof window !== 'undefined'` render path дээр бүү ашигла
- `Date.now()`, `new Date()` render path дээр бүү ашигла
- `District`-ийг `lib/districts`-оос импортлох
- Leaflet-ийг `import('leaflet')` динамикаар ачаалах
- `next/image` ашиглах (WebP, responsive sizes)
