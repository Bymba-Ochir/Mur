-- Historical source: supabase-background-jobs-v103-scheduler.sql.
-- Unlike the old operational script, replaying this migration locally is safe.
-- A production operator must explicitly SET app.mur_environment = 'production'
-- in the same SQL session and configure the two Vault secrets before applying.
do $migration$
begin
  if current_setting('app.mur_environment',true) is distinct from 'production' then
    raise notice 'Background HTTP scheduler disabled for local/default migration replay';
    return;
  end if;
  execute 'create extension if not exists pg_cron';
  execute 'create extension if not exists pg_net with schema extensions';
  if (select count(*) from vault.decrypted_secrets where name='mur_background_worker_url'
      and decrypted_secret='https://mur-chi.vercel.app/api/background-jobs') <> 1
    or (select count(*) from vault.decrypted_secrets where name='mur_background_worker_cron_secret'
      and char_length(trim(decrypted_secret)) >= 16) <> 1 then
    raise exception 'Configure production worker URL and CRON_SECRET in Vault first';
  end if;
  perform cron.schedule('mur-background-jobs-v103','* * * * *', $job$
    select net.http_get(
      url := (select decrypted_secret from vault.decrypted_secrets where name='mur_background_worker_url'),
      headers := jsonb_build_object('Authorization','Bearer ' ||
        (select decrypted_secret from vault.decrypted_secrets where name='mur_background_worker_cron_secret')),
      timeout_milliseconds := 5000
    );
  $job$);
end;
$migration$;
