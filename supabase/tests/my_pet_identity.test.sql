begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(9);
select has_column('public', 'my_pets', 'markings', 'reusable distinctive features exist');
insert into auth.users(id,email) values
('61000000-0000-4000-8000-000000000001','pet-identity-owner@example.invalid'),
('61000000-0000-4000-8000-000000000002','pet-identity-viewer@example.invalid');
set local role authenticated;
set local "request.jwt.claim.sub"='61000000-0000-4000-8000-000000000001';
select lives_ok($$insert into public.my_pets(id,user_id,name,type,markings) values
('61000000-0000-4000-8000-000000000011',auth.uid(),'Бор','Нохой','Цээж цагаан')$$,'owner stores identification details');
select is((select markings from public.my_pets where id='61000000-0000-4000-8000-000000000011'),'Цээж цагаан','owner reads saved features');
select throws_ok($$update public.my_pets set markings=repeat('x',101) where id='61000000-0000-4000-8000-000000000011'$$,'23514',null,'features obey the lost-report length limit');
select lives_ok($$update public.my_pets set markings='Зүүн чих сэтэрхий' where id='61000000-0000-4000-8000-000000000011'$$,'owner updates features');
set local "request.jwt.claim.sub"='61000000-0000-4000-8000-000000000002';
select is((select count(*)::integer from public.my_pets where id='61000000-0000-4000-8000-000000000011'),0,'another owner cannot read identification details');
update public.my_pets set markings='foreign edit' where id='61000000-0000-4000-8000-000000000011';
set local "request.jwt.claim.sub"='61000000-0000-4000-8000-000000000001';
select is((select markings from public.my_pets where id='61000000-0000-4000-8000-000000000011'),'Зүүн чих сэтэрхий','another owner cannot change saved features');
select lives_ok($$insert into public.my_pets(user_id,name,type) values(auth.uid(),'Хуучин бүртгэл','Муур')$$,'older clients can still omit the new optional field');
set local role anon;
select is((select count(*)::integer from public.my_pets where id='61000000-0000-4000-8000-000000000011'),0,'anonymous visitors cannot read private pet details');
reset role;
select * from finish();
rollback;
