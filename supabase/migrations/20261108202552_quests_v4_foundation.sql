-- DEVELOPMENT ONLY: additive foundation; tested locally and on Gym Trader Test. Never applied to production.
begin;
create schema if not exists quest_private;
revoke all on schema quest_private from public,anon;
grant usage on schema quest_private to authenticated,service_role;

create table public.quest_accounts (
 user_id uuid primary key references public.profiles(id),
 activation date not null default (now() at time zone 'Europe/Istanbul')::date,
 enrolled_at timestamptz not null default now(), initial_plan jsonb not null default '{}',
 generation bigint not null default 0, processed_generation bigint not null default -1,
 processed_day date, result jsonb not null default '{}', active_title text,
 updated_at timestamptz not null default now()
);
create table public.quest_plan_snapshots (
 user_id uuid not null references public.quest_accounts(user_id), week_start date not null,
 plan jsonb not null check(jsonb_typeof(plan)='object'), created_at timestamptz not null default now(),
 primary key(user_id,week_start), check(extract(isodow from week_start)=1)
);
create table public.quest_day_plans (
 user_id uuid not null references public.quest_accounts(user_id), day date not null,
 plan jsonb not null, cutoff timestamptz not null, primary key(user_id,day)
);
create table public.user_quests (
 user_id uuid not null references public.quest_accounts(user_id), quest_key text not null,
 period text not null check(period in ('daily','weekly')), start_date date not null,
 slot smallint not null, detail jsonb not null, generation bigint not null,
 primary key(user_id,quest_key), unique(user_id,period,start_date,slot),
 check(slot between 1 and case when period='daily' then 3 else 4 end)
);
create table public.xp_ledger (
 id bigint generated always as identity primary key,
 user_id uuid not null references public.quest_accounts(user_id), reward_key text not null,
 effective_date date not null, pool text not null check(pool in ('daily','weekly')),
 delta integer not null check(delta<>0), generation bigint not null, operation_key text not null,
 reason text not null, created_at timestamptz not null default now(),
 unique(user_id,operation_key)
);
create index xp_ledger_user_day on public.xp_ledger(user_id,effective_date,pool);
create table public.quest_actions (
 ordinal bigint generated always as identity unique,
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.quest_accounts(user_id),
 actor_id uuid not null references public.profiles(id), kind text not null check(kind in ('review','reflection','submission','approval')),
 quest_key text, day date not null default (now() at time zone 'Europe/Istanbul')::date,
 payload jsonb not null default '{}', request_id uuid not null,
 created_at timestamptz not null default now(), unique(user_id,request_id)
);
create index quest_actions_user_day on public.quest_actions(user_id,day);
create index quest_actions_actor on public.quest_actions(actor_id);
create table public.quest_overrides (
 user_id uuid not null references public.quest_accounts(user_id), quest_key text not null,
 definition jsonb not null, version integer not null default 1,
 primary key(user_id,quest_key)
);
create table public.quest_audit_log (
 id bigint generated always as identity primary key, user_id uuid not null references public.quest_accounts(user_id),
 actor_id uuid, action text not null, detail jsonb not null, created_at timestamptz not null default now()
);
create index quest_audit_user_time on public.quest_audit_log(user_id,created_at);
create table public.quest_reward_receipts (
 user_id uuid not null references public.quest_accounts(user_id), reward_key text not null,
 seen_at timestamptz not null default now(), primary key(user_id,reward_key)
);
create table public.quest_personal_goals (
 user_id uuid not null references public.quest_accounts(user_id), effective_week date not null,
 period text not null check(period in ('daily','weekly')), definition jsonb not null,
 created_at timestamptz not null default now(), primary key(user_id,effective_week,period)
);
create table public.quest_source_events (
 id bigint generated always as identity primary key,user_id uuid not null references public.quest_accounts(user_id),
 source_revision bigint, day text not null,before_day jsonb,after_day jsonb,created_at timestamptz not null default now()
);
create index quest_source_user_time on public.quest_source_events(user_id,created_at);

create function quest_private.can_manage(target uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists (
  select 1 from public.profiles m join public.profiles c on c.id=m.coach_id
  where m.id=target and c.id=auth.uid() and c.role in ('coach','admin') and c.id<>m.id
 )
$$;
revoke all on function quest_private.can_manage(uuid) from public,anon;
grant execute on function quest_private.can_manage(uuid) to authenticated,service_role;
create policy quest_coach_directory on public.profiles for select to authenticated
 using (coach_id=(select auth.uid()) and quest_private.can_manage(id));

do $$ declare t text; begin
 foreach t in array array['quest_accounts','quest_plan_snapshots','quest_day_plans','user_quests','xp_ledger','quest_actions','quest_overrides','quest_audit_log','quest_reward_receipts','quest_personal_goals','quest_source_events'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from public,anon,authenticated',t);
  execute format('grant select on public.%I to authenticated',t);
  execute format('grant select,insert,update,delete on public.%I to service_role',t);
  execute format('create policy owner_read on public.%I for select to authenticated using (user_id=(select auth.uid()))',t);
 end loop;
end $$;
create policy coach_read on public.user_quests for select to authenticated using(quest_private.can_manage(user_id));
create policy coach_read on public.quest_actions for select to authenticated using(quest_private.can_manage(user_id));
create policy coach_read on public.quest_overrides for select to authenticated using(quest_private.can_manage(user_id));
create policy coach_read on public.quest_plan_snapshots for select to authenticated using(quest_private.can_manage(user_id));
grant usage,select on sequence public.xp_ledger_id_seq,public.quest_audit_log_id_seq,public.quest_actions_ordinal_seq,public.quest_source_events_id_seq to service_role;

create function quest_private.immutable_log() returns trigger language plpgsql set search_path='' as $$
begin raise exception 'Append-only quest history'; end $$;
revoke all on function quest_private.immutable_log() from public,anon,authenticated;
create trigger xp_no_rewrite before update or delete on public.xp_ledger for each row execute function quest_private.immutable_log();
create trigger audit_no_rewrite before update or delete on public.quest_audit_log for each row execute function quest_private.immutable_log();
create trigger action_no_rewrite before update or delete on public.quest_actions for each row execute function quest_private.immutable_log();
create trigger plan_no_rewrite before update or delete on public.quest_plan_snapshots for each row execute function quest_private.immutable_log();
create trigger day_plan_no_rewrite before update or delete on public.quest_day_plans for each row execute function quest_private.immutable_log();
create trigger source_no_rewrite before update or delete on public.quest_source_events for each row execute function quest_private.immutable_log();

-- Snapshot writes only enqueue work; reward failure must never undo a workout save.
create function quest_private.mark_pending() returns trigger language plpgsql security definer set search_path='' as $$
declare who uuid:=coalesce(new.member_id,old.member_id); k text;
begin
 update public.quest_accounts set generation=generation+1,updated_at=now() where user_id=who;
 if found then
  for k in select jsonb_object_keys(coalesce(new.state->'days','{}')) union select jsonb_object_keys(coalesce(old.state->'days','{}')) loop
   if (new.state->'days'->k) is distinct from (old.state->'days'->k) then
    insert into public.quest_source_events(user_id,source_revision,day,before_day,after_day)
    values(who,coalesce(new.revision,old.revision),k,old.state->'days'->k,new.state->'days'->k);
   end if;
  end loop;
 end if;
 return coalesce(new,old);
end $$;
revoke all on function quest_private.mark_pending() from public,anon,authenticated;
create trigger quests_snapshot_changed after insert or update or delete on public.gym_account_state
 for each row execute function quest_private.mark_pending();

-- Narrow authenticated operations. Definer implementations stay in a non-exposed schema.
create function quest_private.enroll() returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 insert into public.quest_accounts(user_id,initial_plan)
 select auth.uid(),coalesce((select jsonb_object_agg(e.key,e.value) from public.gym_account_state s,
 lateral jsonb_each(s.state->'days') e where s.member_id=auth.uid() and e.key >= (now() at time zone 'Europe/Istanbul')::date::text),'{}')
 on conflict do nothing;
end $$;
create function public.quest_enroll() returns void language sql security invoker set search_path='' as $$select quest_private.enroll()$$;

create function quest_private.record_action(kind text, quest_key text, evidence text, request_id uuid) returns uuid
language plpgsql security definer set search_path='' as $$
declare who uuid:=auth.uid(); aid uuid; q jsonb;
begin
 if who is null or kind is null or kind not in ('review','reflection','submission') or request_id is null then raise exception 'Invalid action'; end if;
 if evidence is null or length(trim(evidence))<8 or length(evidence)>2000 then raise exception 'Açıklama 8–2000 karakter olmalı'; end if;
 perform 1 from public.quest_accounts where user_id=who for update;
 if not found then raise exception 'Quest account required'; end if;
 select a.id into aid from public.quest_actions a where a.user_id=who and a.request_id=record_action.request_id;
 if aid is not null then return aid; end if;
 if kind='submission' then
  select detail into q from public.user_quests where user_id=who and user_quests.quest_key=record_action.quest_key;
  if q is null or q->>'kind'<>'manual' or (q->>'end')::date<=(now() at time zone 'Europe/Istanbul')::date then raise exception 'Görev başvuruya kapalı'; end if;
 end if;
 insert into public.quest_actions(user_id,actor_id,kind,quest_key,payload,request_id)
 values(who,who,kind,quest_key,jsonb_build_object('evidence',trim(evidence)),request_id) returning id into aid;
 update public.quest_accounts set generation=generation+1 where user_id=who;
 insert into public.quest_audit_log(user_id,actor_id,action,detail) values(who,who,'action',jsonb_build_object('id',aid));
 return aid;
end $$;
create function public.quest_record_action(kind text,quest_key text,evidence text,request_id uuid) returns uuid
language sql security invoker set search_path='' as $$select quest_private.record_action(kind,quest_key,evidence,request_id)$$;

create function quest_private.approve(submission_id uuid,approved boolean,reason text,request_id uuid) returns uuid
language plpgsql security definer set search_path='' as $$
declare s public.quest_actions; aid uuid;
begin
 select * into s from public.quest_actions where id=submission_id and kind='submission';
 if s.id is null or not quest_private.can_manage(s.user_id) then raise exception 'Forbidden'; end if;
 if approved is null or reason is null or length(trim(reason))<8 or length(reason)>2000 or request_id is null then raise exception 'Invalid approval'; end if;
 perform 1 from public.quest_accounts where user_id=s.user_id for update;
 select id into aid from public.quest_actions a where a.user_id=s.user_id and a.request_id=approve.request_id;
 if aid is not null then return aid; end if;
 insert into public.quest_actions(user_id,actor_id,kind,quest_key,day,payload,request_id)
 values(s.user_id,auth.uid(),'approval',s.quest_key,s.day,jsonb_build_object('submission',s.id,'approved',approved,'reason',reason),request_id) returning id into aid;
 update public.quest_accounts set generation=generation+1 where user_id=s.user_id;
 insert into public.quest_audit_log(user_id,actor_id,action,detail) values(s.user_id,auth.uid(),'approval',jsonb_build_object('id',aid,'submission',s.id));
 return aid;
end $$;
create function public.quest_approve(submission_id uuid,approved boolean,reason text,request_id uuid) returns uuid
language sql security invoker set search_path='' as $$select quest_private.approve(submission_id,approved,reason,request_id)$$;

create function quest_private.edit(target uuid,quest_key text,title text,goal integer,expected_version integer) returns integer
language plpgsql security definer set search_path='' as $$
declare q jsonb; v integer; def jsonb;
begin
 if not quest_private.can_manage(target) then raise exception 'Forbidden'; end if;
 if goal is null or goal<1 or goal>10000 or title is null or length(trim(title))<3 or length(title)>100 then raise exception 'Invalid goal'; end if;
 perform 1 from public.quest_accounts where user_id=target for update;
 select detail into q from public.user_quests where user_id=target and user_quests.quest_key=edit.quest_key;
 if q is null or q->>'status'='complete' or (q->>'end')::date<=(now() at time zone 'Europe/Istanbul')::date then raise exception 'Görev düzenlemeye kapalı'; end if;
 if exists(select 1 from public.quest_actions a where a.user_id=target and a.quest_key=edit.quest_key and a.kind in ('submission','approval')) then raise exception 'Doğrulaması başlayan görev değiştirilemez'; end if;
 select version into v from public.quest_overrides where user_id=target and quest_overrides.quest_key=edit.quest_key;
 v:=coalesce(v,0);
 if expected_version is distinct from v then raise exception 'QUEST_CONFLICT'; end if;
 -- Editing a target cannot lower its existing requirement or raise the server-defined XP.
 if goal<(q->>'target')::integer then raise exception 'Başlamış dönemin hedefi küçültülemez'; end if;
 def:=jsonb_build_object('id',quest_key,'title',trim(title),'target',goal);
 insert into public.quest_overrides(user_id,quest_key,definition,version) values(target,quest_key,def,v+1)
 on conflict on constraint quest_overrides_pkey do update set definition=excluded.definition,version=excluded.version;
 insert into public.quest_audit_log(user_id,actor_id,action,detail) values(target,auth.uid(),'edit',jsonb_build_object('before',q,'after',def,'version',v+1));
 update public.quest_accounts set generation=generation+1 where user_id=target;
 return v+1;
end $$;
create function public.quest_edit(target uuid,quest_key text,title text,goal integer,expected_version integer) returns integer
language sql security invoker set search_path='' as $$select quest_private.edit(target,quest_key,title,goal,expected_version)$$;

create function quest_private.acknowledge(reward_key text) returns boolean language plpgsql security definer set search_path='' as $$
declare n integer; r jsonb;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 select result into r from public.quest_accounts where user_id=auth.uid() for update;
 if not exists(select 1 from jsonb_array_elements(coalesce(r->'badges','[]')) b where 'badge:'||(b->>'id')=reward_key)
 and reward_key is distinct from 'level:'||(r->'level'->>'level') then raise exception 'Reward not earned'; end if;
 insert into public.quest_reward_receipts(user_id,reward_key) values(auth.uid(),reward_key) on conflict do nothing;
 get diagnostics n=row_count;return n=1;
end $$;
create function public.quest_acknowledge(reward_key text) returns boolean language sql security invoker set search_path='' as $$select quest_private.acknowledge(reward_key)$$;

create function quest_private.personal_goal(period text,kind text,title text,target integer) returns date
language plpgsql security definer set search_path='' as $$
declare effective date:=(date_trunc('week',now() at time zone 'Europe/Istanbul')::date+7);
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if period is null or period not in ('daily','weekly') or kind is null or kind not in ('sets','workouts','review','reflection')
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
create function public.quest_personal_goal(period text,kind text,title text,target integer) returns date
language sql security invoker set search_path='' as $$select quest_private.personal_goal(period,kind,title,target)$$;

create function quest_private.assign_manual(target uuid,quest_key text,title text,expected_version integer) returns integer
language plpgsql security definer set search_path='' as $$
declare q jsonb; v integer; def jsonb;
begin
 if not quest_private.can_manage(target) then raise exception 'Forbidden'; end if;
 if title is null or length(trim(title))<3 or length(title)>100 then raise exception 'Invalid title'; end if;
 perform 1 from public.quest_accounts where user_id=target for update;
 select detail into q from public.user_quests where user_id=target and user_quests.quest_key=assign_manual.quest_key;
 if q is null or q->>'status'='complete' or (q->>'end')::date<=(now() at time zone 'Europe/Istanbul')::date
 or not ((q->>'period'='daily' and q->>'slot'='3') or (q->>'period'='weekly' and q->>'slot'='4')) then raise exception 'Yalnızca açık kişisel görev yuvası değiştirilebilir'; end if;
 if exists(select 1 from public.quest_actions a where a.user_id=target and a.quest_key=assign_manual.quest_key and a.kind in ('submission','approval')) then raise exception 'Doğrulaması başlayan görev değiştirilemez'; end if;
 select version into v from public.quest_overrides where user_id=target and quest_overrides.quest_key=assign_manual.quest_key;
 v:=coalesce(v,0);if expected_version is distinct from v then raise exception 'QUEST_CONFLICT'; end if;
 def:=jsonb_build_object('id',quest_key,'title',trim(title),'kind','manual','target',1);
 insert into public.quest_overrides(user_id,quest_key,definition,version) values(target,quest_key,def,v+1)
 on conflict on constraint quest_overrides_pkey do update set definition=excluded.definition,version=excluded.version;
 insert into public.quest_audit_log(user_id,actor_id,action,detail) values(target,auth.uid(),'assign_manual',jsonb_build_object('before',q,'after',def));
 update public.quest_accounts set generation=generation+1 where user_id=target;return v+1;
end $$;
create function public.quest_assign_manual(target uuid,quest_key text,title text,expected_version integer) returns integer
language sql security invoker set search_path='' as $$select quest_private.assign_manual(target,quest_key,title,expected_version)$$;

create function quest_private.select_title(title text) returns text language plpgsql security definer set search_path='' as $$
declare r jsonb;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 select result into r from public.quest_accounts where user_id=auth.uid() for update;
 if title is null or not coalesce((r->'titles') ? title,false) then raise exception 'Title not earned'; end if;
 update public.quest_accounts set active_title=title where user_id=auth.uid();return title;
end $$;
create function public.quest_select_title(title text) returns text language sql security invoker set search_path='' as $$select quest_private.select_title(title)$$;

do $$ declare f regprocedure; begin
 for f in select p.oid::regprocedure from pg_proc p join pg_namespace n on n.oid=p.pronamespace where
 (n.nspname='quest_private' and p.proname in ('enroll','record_action','approve','edit','acknowledge','personal_goal','assign_manual','select_title')) or
 (n.nspname='public' and p.proname in ('quest_enroll','quest_record_action','quest_approve','quest_edit','quest_acknowledge','quest_personal_goal','quest_assign_manual','quest_select_title')) loop
  execute format('revoke all on function %s from public,anon,authenticated',f);
  execute format('grant execute on function %s to authenticated',f);
 end loop;
end $$;
-- Known overly broad privileges: narrowed only when this migration is explicitly deployed.
revoke truncate,references,trigger on public.gym_account_state from anon,authenticated;
-- Older/newer app environments may omit the legacy coach assignment table.
do $$ begin
 if to_regclass('public.coach_program_assignments') is not null then
  execute 'revoke truncate,references,trigger on public.coach_program_assignments from anon,authenticated';
 end if;
end $$;
commit;
