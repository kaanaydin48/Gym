-- Additive access migration. Apply in staging first; deployment is gated by Auth/API E2E.
-- No workout is removed or rewritten by this migration.
begin;
create schema if not exists gym_private;
revoke all on schema gym_private from public,anon;
grant usage on schema gym_private to authenticated;

alter table public.profiles drop constraint profiles_role_check;
alter table public.profiles add constraint profiles_role_check check(role in ('admin','coach','member'));
alter table public.programs add column is_active boolean not null default true;
alter table public.programs add column version integer not null default 1 check(version>0);
alter table public.assignments add column is_active boolean not null default true;
create index if not exists profiles_coach_idx on public.profiles(coach_id);
create index if not exists programs_coach_idx on public.programs(coach_id);
create index if not exists assignments_program_idx on public.assignments(program_id);
create index if not exists assignments_coach_idx on public.assignments(coach_id);
create index if not exists workout_assignment_idx on public.workout_logs(assignment_id);

-- Only these small, fixed-query helpers bypass RLS to avoid recursive policies.
create function gym_private.current_role() returns text language sql stable security definer set search_path='' as $$
 select role from public.profiles where id=auth.uid()
$$;
create function gym_private.manages_member(target uuid) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.profiles actor,public.profiles member
 where actor.id=auth.uid() and member.id=target and member.role='member'
 and (actor.role='admin' or (actor.role='coach' and member.coach_id=actor.id)))
$$;
create function gym_private.active_program(target uuid) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.assignments a join public.programs p on p.id=a.program_id
 where a.member_id=auth.uid() and a.program_id=target and a.is_active and p.is_active)
$$;
create function gym_private.manages_program(target uuid) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.programs p join public.profiles actor on actor.id=auth.uid()
 where p.id=target and (actor.role='admin' or (actor.role='coach' and (p.coach_id=actor.id or exists(
 select 1 from public.assignments owned_assignment join public.profiles owned_member on owned_member.id=owned_assignment.member_id
 where owned_assignment.program_id=p.id and owned_assignment.is_active and owned_member.coach_id=actor.id))
 and not exists(select 1 from public.assignments a join public.profiles m on m.id=a.member_id
 where a.program_id=p.id and a.is_active and m.coach_id is distinct from actor.id))))
$$;
create function gym_private.views_program(target uuid) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.programs p join public.profiles actor on actor.id=auth.uid()
 where p.id=target and (actor.role='admin' or (actor.role='coach' and (p.coach_id=actor.id or exists(
 select 1 from public.assignments a join public.profiles m on m.id=a.member_id where a.program_id=p.id and m.coach_id=actor.id)))))
$$;
revoke all on function gym_private.current_role(),gym_private.manages_member(uuid),gym_private.active_program(uuid),gym_private.manages_program(uuid),gym_private.views_program(uuid) from public,anon;
grant execute on function gym_private.current_role(),gym_private.manages_member(uuid),gym_private.active_program(uuid),gym_private.manages_program(uuid),gym_private.views_program(uuid) to authenticated;

-- Replace the exact previously audited policies; unknown policies abort deployment below.
do $$begin
 if exists(select 1 from pg_policies where schemaname='public' and tablename in ('profiles','programs','assignments','workout_logs','gym_account_state')
 and policyname not in ('profiles select v4','programs select v4','programs insert v4','programs update v4','programs delete v4','assignments select v4','assignments insert v4','assignments delete v4','logs select v4','logs insert v4','logs update v4','logs delete v4','own snapshot')) then
 raise exception 'Unreviewed policies: audit before migrating';end if;
end$$;
drop policy "profiles select v4" on public.profiles;
create policy profiles_read on public.profiles for select to authenticated using(id=(select auth.uid()) or (select gym_private.current_role())='admin' or gym_private.manages_member(id));
drop policy "programs select v4" on public.programs;
drop policy "programs insert v4" on public.programs;
drop policy "programs update v4" on public.programs;
drop policy "programs delete v4" on public.programs;
create policy programs_read on public.programs for select to authenticated using(gym_private.views_program(id) or ((select gym_private.current_role())='member' and gym_private.active_program(id)));
create policy programs_create on public.programs for insert to authenticated with check((select gym_private.current_role())='admin' or ((select gym_private.current_role())='coach' and coach_id=(select auth.uid())));
create policy programs_edit on public.programs for update to authenticated using(gym_private.manages_program(id)) with check(gym_private.manages_program(id));
-- Deactivation replaces hard deletion; historical foreign keys remain valid.
drop policy "assignments select v4" on public.assignments;
drop policy "assignments insert v4" on public.assignments;
drop policy "assignments delete v4" on public.assignments;
create policy assignments_read on public.assignments for select to authenticated using((select gym_private.current_role())='admin' or gym_private.manages_member(member_id) or (member_id=(select auth.uid()) and is_active and gym_private.active_program(program_id)));
create policy assignments_create on public.assignments for insert to authenticated with check(gym_private.manages_member(member_id) and gym_private.manages_program(program_id) and ((select gym_private.current_role())='admin' or coach_id=(select auth.uid())));
create policy assignments_edit on public.assignments for update to authenticated using(gym_private.manages_member(member_id) and gym_private.manages_program(program_id)) with check(gym_private.manages_member(member_id) and gym_private.manages_program(program_id));
drop policy "logs select v4" on public.workout_logs;
drop policy "logs insert v4" on public.workout_logs;
drop policy "logs update v4" on public.workout_logs;
drop policy "logs delete v4" on public.workout_logs;
create policy logs_read on public.workout_logs for select to authenticated using(member_id=(select auth.uid()) or (select gym_private.current_role())='admin' or gym_private.manages_member(member_id));
drop policy "own snapshot" on public.gym_account_state;
create policy snapshot_read on public.gym_account_state for select to authenticated using(member_id=(select auth.uid()));
-- All snapshot/log writes go through the checked transaction, including direct API clients.
revoke all on public.gym_account_state,public.workout_logs from anon,authenticated;
grant select on public.gym_account_state,public.workout_logs to authenticated;
revoke all on public.programs,public.assignments from anon,authenticated;
grant select,insert,update on public.programs,public.assignments to authenticated;
revoke truncate,references,trigger on public.profiles from anon,authenticated;

-- Preserve legacy member templates privately, rather than returning unassigned plans via snapshot API.
create table gym_private.member_template_archive(member_id uuid primary key, original_state jsonb not null, archived_at timestamptz not null default now());
alter table gym_private.member_template_archive enable row level security;
revoke all on gym_private.member_template_archive from public,anon,authenticated;
insert into gym_private.member_template_archive(member_id,original_state)
 select s.member_id,s.state from public.gym_account_state s join public.profiles p on p.id=s.member_id where p.role='member';
update public.gym_account_state s set state=jsonb_set(jsonb_set(s.state,'{programs}','[]'),'{library}','[]'),revision=revision+1
 from public.profiles p where p.id=s.member_id and p.role='member';

create function gym_private.program_version() returns trigger language plpgsql set search_path='' as $$
begin
 if new.id<>old.id or new.coach_id<>old.coach_id then raise exception 'Program ownership is immutable';end if;
 new.version:=old.version+1;return new;
end$$;
revoke all on function gym_private.program_version() from public,anon,authenticated;
create trigger program_version before update on public.programs for each row execute function gym_private.program_version();
create function gym_private.validate_program() returns trigger language plpgsql set search_path='' as $$
declare e jsonb;field text;
begin
 if length(trim(new.title))=0 or length(new.title)>200 or jsonb_typeof(new.exercises) is distinct from 'array' then raise exception 'Invalid program';end if;
 if jsonb_array_length(new.exercises)<1 or jsonb_array_length(new.exercises)>100 then raise exception 'Invalid exercise count';end if;
 for e in select value from jsonb_array_elements(new.exercises) loop
  foreach field in array array['id','name','muscle','equipment','reps','superset'] loop
   if jsonb_typeof(e->field) is distinct from 'string' then raise exception 'Invalid exercise text';end if;
  end loop;
  if coalesce(e->>'type','') not in ('body','external') or e?'logs' then raise exception 'Invalid exercise type';end if;
  foreach field in array array['sets','rir','rest','factor'] loop
   if jsonb_typeof(e->field) is distinct from 'number' then raise exception 'Invalid exercise target';end if;
  end loop;
  if (e->>'sets')::numeric<1 or (e->>'sets')::numeric>20 or mod((e->>'sets')::numeric,1)<>0 or (e->>'rir')::numeric<0 or (e->>'rir')::numeric>10 or (e->>'rest')::numeric<0 or (e->>'rest')::numeric>86400 or (e->>'factor')::numeric not in (1,2) then raise exception 'Invalid exercise range';end if;
 end loop;
 return new;
end$$;
revoke all on function gym_private.validate_program() from public,anon,authenticated;
create trigger validate_program before insert or update on public.programs for each row execute function gym_private.validate_program();
create function gym_private.assignment_identity() returns trigger language plpgsql set search_path='' as $$
begin
 if (new.id,new.member_id,new.program_id,new.coach_id) is distinct from (old.id,old.member_id,old.program_id,old.coach_id) then raise exception 'Assignment identity is immutable';end if;
 return new;
end$$;
revoke all on function gym_private.assignment_identity() from public,anon,authenticated;
create trigger assignment_identity before update on public.assignments for each row execute function gym_private.assignment_identity();

-- Structure comparison includes exercise order, every target, and the number of log slots.
create function gym_private.day_structure(day jsonb) returns jsonb language sql immutable set search_path='' as $$
 select (day-'exercises'-'note'-'started'-'finished') || jsonb_build_object('exercises',coalesce((
 select jsonb_agg((e-'logs')||jsonb_build_object('logCount',jsonb_array_length(e->'logs')) order by ord)
 from jsonb_array_elements(coalesce(day->'exercises','[]')) with ordinality as x(e,ord)), '[]'::jsonb))
$$;
revoke all on function gym_private.day_structure(jsonb) from public,anon,authenticated;

create function gym_private.save_checked_state(payload jsonb,expected_revision bigint) returns bigint
language plpgsql security definer set search_path='' as $$
declare who uuid:=auth.uid(); actor text; previous jsonb; rev bigint; entry record; old_day jsonb; ex jsonb; log jsonb; field text; a public.assignments; p public.programs; canonical jsonb; assignment uuid;
begin
 if who is null then raise exception 'Authentication required';end if;
 select role into actor from public.profiles where id=who;
 if actor is null then raise exception 'Profile required';end if;
 if payload->>'schema' is distinct from 'gym-tracker-pro' or jsonb_typeof(payload->'days') is distinct from 'object' then raise exception 'Invalid backup';end if;
 if actor='member' and (payload->'programs' is distinct from '[]'::jsonb or payload->'library' is distinct from '[]'::jsonb) then raise exception 'ASSIGNED_ONLY: personal templates are not accepted';end if;
 insert into public.gym_account_state(member_id,state,revision) values(who,'{}',0) on conflict do nothing;
 select state,revision into previous,rev from public.gym_account_state where member_id=who for update;
 if rev is distinct from expected_revision then raise exception 'GYM_CONFLICT: another device saved changes';end if;
 for entry in select key,value from jsonb_each(payload->'days') loop
  if entry.key !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' or coalesce(entry.value->>'kind','') not in ('rest','workout') then raise exception 'Invalid day';end if;
  old_day:=previous->'days'->entry.key; assignment:=null;
  if actor='member' and old_day->>'kind'='workout' then
   if gym_private.day_structure(entry.value) is distinct from gym_private.day_structure(old_day) then raise exception 'PROGRAM_LOCKED: saved workout structure cannot change';end if;
   if old_day->>'finished' is not null and entry.value->'finished' is distinct from old_day->'finished' then raise exception 'Completed workout must remain completed';end if;
  elsif actor='member' and entry.value->>'kind'='workout' then
   select * into a from public.assignments where id=(entry.value->>'assignmentId')::uuid and member_id=who and is_active for share;
   if not found then raise exception 'ASSIGNMENT_REQUIRED';end if;
   select * into p from public.programs where id=a.program_id and is_active for share;
   if not found then raise exception 'PROGRAM_INACTIVE';end if;
   select jsonb_agg(e-'logs' order by ord) into canonical from jsonb_array_elements(entry.value->'exercises') with ordinality as x(e,ord);
   if entry.value->>'programId' is distinct from p.id::text or entry.value->>'name' is distinct from p.title or (entry.value->>'version')::integer is distinct from p.version or canonical is distinct from p.exercises then raise exception 'PROGRAM_LOCKED: use the current assigned program';end if;
  end if;
  if entry.value->>'kind'='workout' then
   if jsonb_typeof(entry.value->'exercises') is distinct from 'array' then raise exception 'Invalid exercises';end if;
   for ex in select value from jsonb_array_elements(entry.value->'exercises') loop
    if jsonb_typeof(ex->'logs') is distinct from 'array' then raise exception 'Invalid logs';end if;
    if actor='member' and old_day->>'kind' is distinct from 'workout' and jsonb_array_length(ex->'logs') is distinct from (ex->>'sets')::integer then raise exception 'PROGRAM_LOCKED: set count';end if;
    for log in select value from jsonb_array_elements(ex->'logs') loop
     if jsonb_typeof(log) is distinct from 'object' or log-array['kg','reps','rir','done'] is distinct from '{}'::jsonb or jsonb_typeof(log->'done') is distinct from 'boolean' then raise exception 'Invalid set';end if;
     foreach field in array array['kg','reps','rir'] loop
      if log->>field is distinct from '' then
       if jsonb_typeof(log->field) is distinct from 'number' then raise exception 'Invalid number';end if;
       if (log->>field)::numeric<0 or (log->>field)::numeric>(case field when 'rir' then 10 when 'reps' then 10000 else 100000 end) then raise exception 'Invalid set range';end if;
      end if;
     end loop;
    end loop;
   end loop;
   assignment:=(entry.value->>'assignmentId')::uuid;
   if assignment is not null and not exists(select 1 from public.assignments where id=assignment and member_id=who) then raise exception 'Assignment owner mismatch';end if;
  end if;
  insert into public.workout_logs(member_id,workout_date,assignment_id,sets,notes)
   values(who,entry.key::date,assignment,entry.value,coalesce(entry.value->>'note',''))
   on conflict(member_id,workout_date) do update set assignment_id=excluded.assignment_id,sets=excluded.sets,notes=excluded.notes,updated_at=now();
 end loop;
 -- Keep the existing explicit day-removal behavior; program updates never enter this path.
 delete from public.workout_logs where member_id=who and workout_date::text in(select jsonb_object_keys(coalesce(previous->'days','{}'))) and not(payload->'days'?workout_date::text);
 update public.gym_account_state set state=payload,revision=rev+1,updated_at=now() where member_id=who;
 return rev+1;
end$$;
revoke all on function gym_private.save_checked_state(jsonb,bigint) from public,anon;
grant execute on function gym_private.save_checked_state(jsonb,bigint) to authenticated;
create or replace function public.save_gym_state(payload jsonb,expected_revision bigint) returns bigint language sql security invoker set search_path='' as $$
 select gym_private.save_checked_state(payload,expected_revision)
$$;
revoke all on function public.save_gym_state(jsonb,bigint) from public,anon;
grant execute on function public.save_gym_state(jsonb,bigint) to authenticated;
commit;
