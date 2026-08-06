---
name: deploy
description: Vercel руу deploy хийх (build + push + шалгалт)
---

# Deploy to Vercel

Төслийг Vercel руу deploy хийх алхмууд:

## Алхам 1: Шалгалт
```bash
npx tsc --noEmit          # TypeScript шалгалт
npm run lint               # ESLint
npm test                   # Unit + component тест
```

## Алхам 2: Build
```bash
npm run build              # Production build
```
Build амжилттай болсон эсэхийг шалга. Алдаа гарвал засаад дахин build.

## Алхам 3: Git
```bash
git add -A
git status                 # Өөрчлөлтүүдийг хар
git commit -m "descriptive message"
git push origin main       # Vercel автомат deploy хийнэ
```

## Алхам 4: Vercel Dashboard шалгалт
- https://vercel.com → project → Deployments хар
- Build log-д алдаа байгаа эсэхийг шалга
- Preview URL-д шинэчлэлт харагдаж байгаа эсэхийг шалга

## Алдаа гарсан үед
- `npm run build` алдаа гарвал → TypeScript эсвэл import алдаа
- Vercel build алдаа гарвал → env variable дутуу байж болзошгүй
- Deploy success боловч алдаа гарвал → runtime error, Vercel logs шалга

## Env variables шалгах
Vercel Dashboard → Settings → Environment Variables:
- `NEXT_PUBLIC_SUPABASE_URL` — заавал
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — заавал
- `GROQ_API_KEY` — сонголттой (AI зөвлөх)
- `SENTRY_DSN` — сонголттой (error tracking)
