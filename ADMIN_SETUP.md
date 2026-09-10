# Admin тохируулах

Database-ийн [migration зааврыг](docs/DATABASE.md) эхэлж уншина. `supabase-admin.sql` нь helper/RPC болон admin schema, `supabase-admin-upgrade.sql` нь нэмэлт audit боломжуудтай. Нэрээр нь автоматаар бүгдийг дахин ажиллуулахгүй.

Supabase Authentication хэсгээс эрх олгох хэрэглэгчийн UUID-г баталгаажуулж SQL Editor-т:

```sql
insert into public.admins (user_id)
values ('REPLACE_WITH_VERIFIED_USER_UUID')
on conflict do nothing;
```

Placeholder-ийг бодит UUID-гаар солино. Browser-оос admin хүснэгтэд insert хийх эрх олгохгүй.

Admin болон энгийн account-аар `/admin` болон холбогдох RPC-ийг тус тус шалга. UI gate-аас гадна database/API эрх шаардагдана. Админы үйлдэл audit log-д бүртгэгдэж байгаа эсэхийг шалга.

Sentry, Vercel deploy, Supabase backup-ийн бодит төлөвийг тус тусын dashboard-оос баталгаажуул. Admin UI-д нууц түлхүүр харуулахгүй.
