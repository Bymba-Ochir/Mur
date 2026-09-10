# Архитектур

`app/`: App Router page болон server API. `components/`: reusable UI, form, modal. `lib/`: Supabase service, mapping, validation, хэл, AI болон интеграц. `public/`: static asset/service worker. `tests/`: unit/component/E2E.

Browser service-үүд Supabase Auth session ба RLS-ээр ажиллана. Privileged API нь сервер дээр эрх шалгаж admin client хэрэглэнэ. Иймээс service-role API бүр ownership шалгалттай байх ёстой.

Зургийн төстэй эрэмбэ нь browser DINOv2 embedding; Groq нь туслахын текст хариу. Model ачаалалт, network болон browser хүчин чадлаас хамаарна.

## Page inventory

- `/`
- `/activity`
- `/admin`
- `/adoptions`
- `/adoptions/[id]`
- `/adoptions/new`
- `/assistant`
- `/clinics`
- `/listings`
- `/messages`
- `/messages/[id]`
- `/my-pets`
- `/notifications`
- `/pets/[id]`
- `/privacy`
- `/profile`
- `/profile/edit`
- `/profiles/adoption/[id]`
- `/profiles/mypet/[id]`
- `/report-found`
- `/report-lost`
- `/saved`
- `/settings`
- `/sitting`
- `/sitting/[id]`
- `/sitting/new`
- `/terms`
- `/users/[id]`

## Route handler inventory

- `/api/account/delete`
- `/api/account/export`
- `/api/assistant`
- `/api/content/[kind]/[id]`
- `/api/donations/create`
- `/api/donations/status`
- `/api/health`
- `/api/notify`
- `/api/push-subscriptions`
- `/api/qpay/callback`
- `/api/reports`
- `/api/sightings`
- `/api/vaccine-reminders`

Энэ жагсаалт нь код дахь зам; бүх route-ийн production ажиллагааг батлахгүй.
