-- TEST FIRST. Not authorized for production in this session.
begin;
lock table public.quest_accounts in share row exclusive mode;
alter table public.quest_accounts add column v5_start date;
alter table public.quest_accounts add column v5_baseline jsonb;
-- Full week boundary avoids overlap with V4's weekly slots/rewards.
do $$ declare cutover date:=date_trunc('week',now() at time zone 'Europe/Istanbul')::date+7; begin
 execute format('alter table public.quest_accounts alter column v5_start set default greatest((now() at time zone ''Europe/Istanbul'')::date,%L::date)',cutover);
end $$;
update public.quest_accounts set v5_start=date_trunc('week',now() at time zone 'Europe/Istanbul')::date+7;
alter table public.user_quests drop constraint user_quests_check;
alter table public.user_quests add constraint user_quests_check check(slot between 1 and case when period='daily' then 3 else 6 end);
create table public.quest_v5_day_plans (
 user_id uuid not null references public.quest_accounts(user_id),day date not null,
 plan jsonb not null check(jsonb_typeof(plan)='object'),primary key(user_id,day)
);
alter table public.quest_v5_day_plans enable row level security;
revoke all on public.quest_v5_day_plans from public,anon,authenticated;
grant select on public.quest_v5_day_plans to authenticated;
grant select,insert on public.quest_v5_day_plans to service_role;
create policy owner_read on public.quest_v5_day_plans for select to authenticated using(user_id=(select auth.uid()));
create trigger v5_plan_no_rewrite before update or delete on public.quest_v5_day_plans for each row execute function quest_private.immutable_log();
-- Legacy evidence/history remains readable. Disable all manual mutation paths
-- for V5 accounts, including direct private-function calls through wrapper grants.
create function quest_private.reject_v5_manual() returns trigger language plpgsql set search_path='' as $$
begin
 if exists(select 1 from public.quest_accounts a where a.user_id=new.user_id and a.v5_start<=(now() at time zone 'Europe/Istanbul')::date) then
  raise exception 'V5 görevleri yalnız otomatik doğrulanır';
 end if;
 return new;
end $$;
revoke all on function quest_private.reject_v5_manual() from public,anon,authenticated;
create trigger v5_no_actions before insert on public.quest_actions for each row execute function quest_private.reject_v5_manual();
create trigger v5_no_overrides before insert or update on public.quest_overrides for each row execute function quest_private.reject_v5_manual();
create trigger v5_no_goals before insert or update on public.quest_personal_goals for each row execute function quest_private.reject_v5_manual();
commit;
