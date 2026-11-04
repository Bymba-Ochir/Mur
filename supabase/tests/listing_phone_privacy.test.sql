begin;
create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions;
select no_plan();
select ok(not has_schema_privilege('anon','mur_private','USAGE'),'private phones are not in a public API schema');
select ok(not has_table_privilege('authenticated','mur_private.hidden_listing_phones','SELECT'),'authenticated clients cannot select private contacts');
select ok(not has_function_privilege('anon','public.get_own_listing_phone(text,uuid)','EXECUTE'),'anonymous users cannot call owner contact RPC');
select ok(not has_function_privilege('service_role','public.get_own_listing_phone(text,uuid)','EXECUTE'),'owner contact RPC does not trust the service identity');
insert into auth.users(id,email) values
('50000000-0000-4000-8000-000000000001','privacy-owner@example.invalid'),
('50000000-0000-4000-8000-000000000002','privacy-viewer@example.invalid'),
('50000000-0000-4000-8000-000000000003','privacy-other@example.invalid');

set local role authenticated;
set local "request.jwt.claim.sub"='50000000-0000-4000-8000-000000000001';
select lives_ok($$insert into public.pets(id,status,type,created_by,phone,phone_hidden) values
('50000000-0000-4000-8000-000000000011','lost','Муур',auth.uid(),'88112233',true)$$,'owner creates hidden lost/found phone');
select lives_ok($$insert into public.adoptions(id,type,created_by,phone,phone_hidden) values
('50000000-0000-4000-8000-000000000012','Муур',auth.uid(),'88112233',true)$$,'owner creates hidden adoption phone');
select lives_ok($$insert into public.sitting_listings(id,user_id,phone,phone_hidden) values
('50000000-0000-4000-8000-000000000013',auth.uid(),'88112233',true)$$,'owner creates hidden sitting phone');
select lives_ok($$insert into public.pets(id,status,type,created_by,phone_hidden,created_at) values
('50000000-0000-4000-8000-000000000014','found','Муур',auth.uid(),true,'2000-01-01')$$,'browser can create a chat-only listing without entering a phone');
select ok((select created_at > now()-interval '1 minute' from public.pets where id='50000000-0000-4000-8000-000000000014'),'browser cannot backdate a listing to bypass its quota');
select lives_ok($$update public.pets set created_at='2000-01-01' where id='50000000-0000-4000-8000-000000000014'$$,'browser timestamp edits are ignored');
select ok((select created_at > now()-interval '1 minute' from public.pets where id='50000000-0000-4000-8000-000000000014'),'listing timestamp remains server-owned after edits');
select is(public.get_own_listing_phone('pet','50000000-0000-4000-8000-000000000011'),'88112233','only owner can retrieve the original pet contact');
select is(public.get_own_listing_phone('adoption','50000000-0000-4000-8000-000000000012'),'88112233','owner retrieves adoption contact');
select is(public.get_own_listing_phone('sitting','50000000-0000-4000-8000-000000000013'),'88112233','owner retrieves sitting contact');
select lives_ok($$update public.pets set name='Edited' where id='50000000-0000-4000-8000-000000000011'$$,'ordinary edits preserve hidden contact');
select is(public.get_own_listing_phone('pet','50000000-0000-4000-8000-000000000011'),'88112233','hidden number survives text edit');
select lives_ok($$update public.pets set phone_hidden=false where id='50000000-0000-4000-8000-000000000011'$$,'owner restores public contact atomically');
select is((select phone from public.pets where id='50000000-0000-4000-8000-000000000011'),'88112233','unhiding restores the retained number');
select lives_ok($$update public.pets set phone_hidden=true where id='50000000-0000-4000-8000-000000000011'$$,'owner hides an existing public phone');
select lives_ok($$update public.pets set phone='99112233' where id='50000000-0000-4000-8000-000000000011'$$,'owner changes private phone without exposing it');
select is(public.get_own_listing_phone('pet','50000000-0000-4000-8000-000000000011'),'99112233','new private number retained');

set local role anon;
select is((select phone from public.pets where id='50000000-0000-4000-8000-000000000011'),'','anonymous pet API read is redacted');
select is((select phone from public.adoptions where id='50000000-0000-4000-8000-000000000012'),'','anonymous adoption API read is redacted');
select is((select phone from public.sitting_listings where id='50000000-0000-4000-8000-000000000013'),'','anonymous sitting API read is redacted');
select ok(not exists(select 1 from public.pets where id='50000000-0000-4000-8000-000000000011' and to_jsonb(pets)::text like '%99112233%'),'JSON / joined pet payload contains no private contact');
set local role authenticated;
set local "request.jwt.claim.sub"='50000000-0000-4000-8000-000000000002';
select throws_ok($$select public.get_own_listing_phone('pet','50000000-0000-4000-8000-000000000011')$$,'42501','OWNER_REQUIRED','other account cannot request private phone');
select is((select phone from public.pets where id='50000000-0000-4000-8000-000000000011'),'','signed-in viewers cannot bypass hiding');
reset role;
select is((select count(*)::integer from mur_private.hidden_listing_phones where pet_id='50000000-0000-4000-8000-000000000011'
  or adoption_id='50000000-0000-4000-8000-000000000012' or sitting_id='50000000-0000-4000-8000-000000000013'),3,'private phones have one normalized storage location each');

set local role authenticated;
set local "request.jwt.claim.sub"='50000000-0000-4000-8000-000000000002';
select isnt(public.start_listing_conversation('pet','50000000-0000-4000-8000-000000000011'),null::uuid,'pet visitor can start chat');
select isnt(public.start_listing_conversation('adoption','50000000-0000-4000-8000-000000000012'),null::uuid,'adoption visitor can start chat');
select isnt(public.start_listing_conversation('sitting','50000000-0000-4000-8000-000000000013'),null::uuid,'sitting visitor can start chat');
select is(public.start_listing_conversation('adoption','50000000-0000-4000-8000-000000000012'),
  (select id from public.conversations where adoption_id='50000000-0000-4000-8000-000000000012'), 'retry returns the same conversation');
select is((select count(*)::integer from public.list_conversation_page()),3,'small inbox joins each chat latest-message summary');
select throws_ok($$insert into public.conversations(adoption_id,initiator_id,owner_id) values
('50000000-0000-4000-8000-000000000012',auth.uid(),'50000000-0000-4000-8000-000000000003')$$,'42501',null,'browser cannot forge listing owner');
insert into public.messages(conversation_id,sender_id,content) select id,auth.uid(),'Chat-only contact works'
from public.conversations where adoption_id='50000000-0000-4000-8000-000000000012';
select is((select last_message->>'content' from public.list_conversation_page() where conversation->>'adoption_id'='50000000-0000-4000-8000-000000000012'),
  'Chat-only contact works','inbox returns the latest message without reading all histories');
set local "request.jwt.claim.sub"='50000000-0000-4000-8000-000000000003';
select is((select count(*)::integer from public.list_conversation_page()),0,'unrelated viewer cannot read conversations');
select is((select count(*)::integer from public.messages where content='Chat-only contact works'),0,'unrelated viewer cannot read messages');
set local "request.jwt.claim.sub"='50000000-0000-4000-8000-000000000001';
select throws_ok($$select public.start_listing_conversation('sitting','50000000-0000-4000-8000-000000000013')$$,'P0001','SELF_CHAT','owner cannot start self chat');
insert into public.user_blocks(blocker_id,blocked_id) values(auth.uid(),'50000000-0000-4000-8000-000000000002');
set local "request.jwt.claim.sub"='50000000-0000-4000-8000-000000000002';
select throws_ok($$select public.start_listing_conversation('adoption','50000000-0000-4000-8000-000000000012')$$,'42501','INTERACTION_DENIED','blocked visitor cannot start or reopen listing chat');
select throws_ok($$insert into public.messages(conversation_id,sender_id,content) select id,auth.uid(),'Blocked message'
from public.conversations where adoption_id='50000000-0000-4000-8000-000000000012'$$,'42501',null,'existing message RLS still rejects blocked users');
reset role;
delete from public.sitting_listings where id='50000000-0000-4000-8000-000000000013';
select is((select count(*)::integer from mur_private.hidden_listing_phones where sitting_id='50000000-0000-4000-8000-000000000013'),0,'deleting listing cascades private contact');
select is((select count(*)::integer from public.conversations where sitting_id='50000000-0000-4000-8000-000000000013'),0,'deleting listing cascades listing chat');
select * from finish();
rollback;
