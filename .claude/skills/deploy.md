---
name: deploy
description: Mur-ийн Vercel deploy болон rollback шалгах
---

# Deploy to Vercel

[Deploy зааврын](../../docs/DEPLOYMENT.md) migration check, typecheck, lint, test, build дарааллыг дагана. Аль нэг команд унавал commit болон push хийхээс өмнө зогсоно.

Шаардлагатай SQL migration-ийг Supabase Dashboard дээр тусад нь гараар баталгаажуулна. Production ажиллахгүй бол эхлээд өмнөх баталгаажсан Vercel deploy-ийг сэргээнэ.
