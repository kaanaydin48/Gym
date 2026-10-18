-- Atomic account snapshot + queryable day logs. No existing records are erased.
create table if not exists public.gym_account_state (
 member_id uuid primary key references public.profiles(id),
 state jsonb not null,
 revision bigint not null default 0,
 updated_at timestamptz not null default now()
);
alter table public.gym_account_state enable row level security;
create policy "own snapshot" on public.gym_account_state for all to authenticated
 using (member_id=(select auth.uid())) with check (member_id=(select auth.uid()));
grant select,insert,update on public.gym_account_state to authenticated;
create unique index if not exists workout_logs_member_day_unique on public.workout_logs(member_id,workout_date);
create or replace function public.save_gym_state(payload jsonb, expected_revision bigint)
returns bigint language plpgsql security invoker set search_path = '' as $$
declare who uuid := auth.uid(); current_revision bigint; previous_state jsonb; entry record;
begin
 if who is null then raise exception 'Authentication required'; end if;
 if payload->>'schema' is distinct from 'gym-tracker-pro' or jsonb_typeof(payload->'days') is distinct from 'object' then raise exception 'Invalid backup'; end if;
 insert into public.gym_account_state(member_id,state,revision) values(who,'{}',0) on conflict do nothing;
 select revision,state into current_revision,previous_state from public.gym_account_state where member_id=who for update;
 if current_revision is distinct from expected_revision then raise exception 'GYM_CONFLICT: another device saved changes'; end if;
 for entry in select key,value from jsonb_each(payload->'days') loop
  if entry.key !~ '^\d{4}-\d{2}-\d{2}$' or entry.value->>'kind' not in ('rest','workout') then raise exception 'Invalid day'; end if;
  insert into public.workout_logs(member_id,workout_date,sets,notes)
   values(who,entry.key::date,entry.value,coalesce(entry.value->>'note',''))
   on conflict(member_id,workout_date) do update set sets=excluded.sets,notes=excluded.notes,updated_at=now();
 end loop;
 -- Only delete days previously managed by this snapshot and explicitly removed.
 delete from public.workout_logs where member_id=who
  and workout_date::text in (select jsonb_object_keys(coalesce(previous_state->'days','{}')))
  and not (payload->'days' ? workout_date::text);
 update public.gym_account_state set state=payload,revision=current_revision+1,updated_at=now() where member_id=who;
 return current_revision+1;
end $$;
revoke all on function public.save_gym_state(jsonb,bigint) from public,anon;
grant execute on function public.save_gym_state(jsonb,bigint) to authenticated;
-- TRUNCATE bypasses RLS and must never be granted to browser roles.
revoke truncate,references,trigger on public.profiles,public.programs,public.assignments,public.workout_logs from authenticated,anon;
