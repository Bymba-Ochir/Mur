-- Historical migration source: supabase-race-condition-hardening-v99-postdeploy.sql
-- Fresh local bootstrap; never replay this history blindly on an existing production database.

-- MUR v99 post-deploy lock-down
-- Run only AFTER the v99 application is live. The new app writes photos through
-- atomic SECURITY DEFINER RPCs, so direct multi-statement writes can be removed.
begin;
revoke insert, update, delete on public.pet_photos from authenticated;
revoke insert, update, delete on public.adoption_photos from authenticated;
notify pgrst, 'reload schema';
commit;
