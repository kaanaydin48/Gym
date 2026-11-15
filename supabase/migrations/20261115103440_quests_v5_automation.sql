-- Review-only migration. No workout, program, ledger or evidence rows are removed.
begin;
lock table public.quest_accounts in share row exclusive mode;
alter table public.quest_accounts add column v5_activation date;
alter table public.quest_accounts add column v5_legacy jsonb not null default '{}';
-- Existing rewarded accounts start at the next local midnight, avoiding double rewards
-- for today's sets. New/unrewarded accounts can start immediately.
update public.quest_accounts a set v5_activation=(now() at time zone 'Europe/Istanbul')::date+
 case when exists(select 1 from public.xp_ledger l where l.user_id=a.user_id) then 1 else 0 end,
 v5_legacy=jsonb_build_object('badges',coalesce(result->'badges','[]'::jsonb),'titles',coalesce(result->'titles','[]'::jsonb)),
 generation=generation+1;
alter table public.quest_accounts alter column v5_activation set default (now() at time zone 'Europe/Istanbul')::date;
alter table public.quest_accounts alter column v5_activation set not null;
-- Keep V4 slots (1..4) intact; V5 occupies 11..17 in the same table.
alter table public.user_quests drop constraint user_quests_check;
alter table public.user_quests add constraint user_quests_check check (
 slot between 1 and case when period='daily' then 3 else 4 end or
 slot between 11 and case when period='daily' then 15 else 17 end);
-- Disable both exposed wrappers and private entry points, retaining all history.
revoke execute on function public.quest_record_action(text,text,text,uuid),
 public.quest_approve(uuid,boolean,text,uuid),public.quest_assign_manual(uuid,text,text,integer),
 public.quest_edit(uuid,text,text,integer,integer),
 quest_private.record_action(text,text,text,uuid),quest_private.approve(uuid,boolean,text,uuid),
 quest_private.assign_manual(uuid,text,text,integer),quest_private.edit(uuid,text,text,integer,integer)
 from public,anon,authenticated,service_role;
-- A stale V4 worker cannot alter the preserved ledger after migration.
create function quest_private.v5_ledger_guard() returns trigger language plpgsql set search_path='' as $$
begin
 if new.reward_key not like 'quest:v5:%' then raise exception 'Legacy XP is frozen after V5 migration'; end if;
 return new;
end $$;
revoke all on function quest_private.v5_ledger_guard() from public,anon,authenticated;
create trigger v5_ledger_guard before insert on public.xp_ledger for each row execute function quest_private.v5_ledger_guard();
create or replace function quest_private.personal_goal(period text,kind text,title text,target integer) returns date
language plpgsql security definer set search_path='' as $$
declare effective date:=(date_trunc('week',now() at time zone 'Europe/Istanbul')::date+7);
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if period is null or period not in ('daily','weekly') or kind is null or kind not in ('sets','workouts')
 or title is null or length(trim(title))<3 or length(title)>100 or target is null or target<1 or target>1000 then raise exception 'Invalid goal'; end if;
 perform 1 from public.quest_accounts where user_id=auth.uid() for update;
 if not found then raise exception 'Quest account required'; end if;
 insert into public.quest_personal_goals(user_id,effective_week,period,definition)
 values(auth.uid(),effective,period,jsonb_build_object('kind',kind,'title',trim(title),'target',target))
 on conflict on constraint quest_personal_goals_pkey do update set definition=excluded.definition,created_at=now();
 insert into public.quest_audit_log(user_id,actor_id,action,detail)
 values(auth.uid(),auth.uid(),'personal_goal',jsonb_build_object('effective',effective,'period',period,'kind',kind,'target',target));
 update public.quest_accounts set generation=generation+1 where user_id=auth.uid();
 return effective;
end $$;

commit;
