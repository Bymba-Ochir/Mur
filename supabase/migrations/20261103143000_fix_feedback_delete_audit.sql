begin;

create or replace function public.admin_delete_feedback(target_id uuid)
returns void
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  if not public.is_current_admin() then
    raise exception using errcode = '42501', message = 'ADMIN_REQUIRED';
  end if;

  delete from public.site_feedback where id = target_id;
  if found then
    insert into public.admin_audit_logs (admin_id, action, target_type, target_id)
    values (auth.uid(), 'delete', 'site_feedback', target_id);
  end if;
end;
$$;

revoke all on function public.admin_delete_feedback(uuid) from public, anon, authenticated, service_role;
grant execute on function public.admin_delete_feedback(uuid) to authenticated;

commit;
