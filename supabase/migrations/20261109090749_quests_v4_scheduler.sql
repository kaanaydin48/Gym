begin;
create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron;
create table quest_private.scheduler_config(singleton boolean primary key default true check(singleton), api_url text not null check(api_url in ('https://sucoijqzhfifwmwrprww.supabase.co','https://aryzgrgjwjdxumbddank.supabase.co')));
alter table quest_private.scheduler_config enable row level security;
revoke all on quest_private.scheduler_config from public,anon,authenticated;
do $$ begin
 if not exists(select 1 from vault.secrets where name='quests_scheduler_token') then
  perform vault.create_secret(encode(extensions.gen_random_bytes(32),'hex'),'quests_scheduler_token','Quest scheduler server-only authentication');
 end if;
end $$;
create function quest_private.invoke_scheduler() returns bigint language plpgsql security definer set search_path='' as $$
declare endpoint text; token text; request_id bigint;
begin
 select api_url into endpoint from quest_private.scheduler_config where singleton;
 if endpoint is null then raise exception 'Scheduler endpoint not configured'; end if;
 select decrypted_secret into token from vault.decrypted_secrets where name='quests_scheduler_token';
 select net.http_post(url:=endpoint||'/functions/v1/quests-scheduler',headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||token),body:='{}'::jsonb,timeout_milliseconds:=55000) into request_id;
 return request_id;
end $$;
revoke all on function quest_private.invoke_scheduler() from public,anon,authenticated;
-- Configure endpoint and schedule only after the matching Edge deployment is verified.
commit;
