begin;
create schema daily_content_private;
revoke all on schema daily_content_private from public,anon,authenticated;
create table daily_content_private.scheduler_config(singleton boolean primary key default true check(singleton),api_url text not null check(api_url in ('https://sucoijqzhfifwmwrprww.supabase.co','https://aryzgrgjwjdxumbddank.supabase.co')));
alter table daily_content_private.scheduler_config enable row level security;
revoke all on daily_content_private.scheduler_config from public,anon,authenticated;
do $$ begin
 if not exists(select 1 from vault.secrets where name='daily_content_scheduler_token') then
 perform vault.create_secret(encode(extensions.gen_random_bytes(32),'hex'),'daily_content_scheduler_token','Daily content scheduler authentication');
 end if;
end $$;
create function daily_content_private.invoke_scheduler() returns bigint language plpgsql security definer set search_path='' as $$
declare endpoint text;token text;request_id bigint;
begin
 select api_url into endpoint from daily_content_private.scheduler_config where singleton;
 if endpoint is null then raise exception 'Daily content endpoint not configured';end if;
 select decrypted_secret into token from vault.decrypted_secrets where name='daily_content_scheduler_token';
 select net.http_post(url:=endpoint||'/functions/v1/daily-content',headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||token),body:='{}'::jsonb,timeout_milliseconds:=55000) into request_id;
 return request_id;
end $$;
revoke all on function daily_content_private.invoke_scheduler() from public,anon,authenticated;
-- Enable cron only after deployment verification. 21:00 UTC = 00:00 Europe/Istanbul.
commit;
