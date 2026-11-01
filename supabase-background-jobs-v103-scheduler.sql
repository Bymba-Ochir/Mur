-- POST-DEPLOY ONLY. Run manually after Vercel deploy succeeds.
-- In Supabase Dashboard > Vault create these two secrets first:
--   mur_background_worker_url = https://mur-chi.vercel.app/api/background-jobs
--   mur_background_worker_cron_secret = the SAME CRON_SECRET as Vercel Production
-- Do not paste the secret into this file, Git, logs, or chat.
begin;
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

do $$
begin
  if (select count(*) from vault.decrypted_secrets where name = 'mur_background_worker_url'
      and decrypted_secret = 'https://mur-chi.vercel.app/api/background-jobs') <> 1
    or (select count(*) from vault.decrypted_secrets where name = 'mur_background_worker_cron_secret'
      and char_length(trim(decrypted_secret)) >= 16) <> 1 then
    raise exception 'Configure the two v103 Vault secrets first (URL and Production CRON_SECRET)';
  end if;
end;
$$;

-- Same job name is replaced on re-run. The stored command contains no secret.
select cron.schedule('mur-background-jobs-v103','* * * * *', $job$
  select net.http_get(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'mur_background_worker_url'),
    headers := jsonb_build_object('Authorization','Bearer ' ||
      (select decrypted_secret from vault.decrypted_secrets where name = 'mur_background_worker_cron_secret')),
    timeout_milliseconds := 5000
  );
$job$);
commit;
