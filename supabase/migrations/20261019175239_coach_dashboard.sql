begin;
alter table public.profiles add column is_active boolean not null default true;
grant update(is_active) on public.profiles to authenticated;
create policy profiles_activity on public.profiles for update to authenticated using(gym_private.manages_member(id)) with check(gym_private.manages_member(id));

create table public.coach_notes(
 id uuid primary key default gen_random_uuid(),member_id uuid not null references public.profiles(id),
 author_id uuid not null references public.profiles(id),body text not null check(length(trim(body)) between 1 and 5000),
 created_at timestamptz not null default now()
);
alter table public.coach_notes enable row level security;
revoke all on public.coach_notes from public,anon,authenticated;
grant select,insert on public.coach_notes to authenticated;
create index coach_notes_member_created on public.coach_notes(member_id,created_at);
create index coach_notes_author on public.coach_notes(author_id);
create policy coach_notes_read on public.coach_notes for select to authenticated using(gym_private.manages_member(member_id));
create policy coach_notes_create on public.coach_notes for insert to authenticated with check(gym_private.manages_member(member_id) and author_id=(select auth.uid()));

-- Auth metadata is read only here, never returned wholesale or used for authorization.
-- Authorization is checked against current DB relationships on every call.
create function gym_private.member_overview() returns table(id uuid,display_name text,email text,is_active boolean,last_workout date,active_programs bigint,invite_status text)
language sql stable security definer set search_path='' as $$
 select p.id,p.display_name,coalesce(u.email,''),p.is_active,
 (select max(w.workout_date) from public.workout_logs w where w.member_id=p.id and w.sets->>'kind'='workout'
 and (w.sets->>'finished' is not null or exists(select 1 from jsonb_array_elements(coalesce(w.sets->'exercises','[]')) e cross join lateral jsonb_array_elements(coalesce(e->'logs','[]')) s where s->>'done'='true'))),
 (select count(*) from public.assignments a join public.programs pr on pr.id=a.program_id where a.member_id=p.id and a.is_active and pr.is_active),
 case when u.invited_at is not null and u.email_confirmed_at is null then 'pending' when u.invited_at is not null then 'accepted' else 'existing' end
 from public.profiles p left join auth.users u on u.id=p.id
 where auth.uid() is not null and p.role='member' and gym_private.manages_member(p.id)
 order by p.display_name,p.id
$$;
create function public.coach_member_overview() returns table(id uuid,display_name text,email text,is_active boolean,last_workout date,active_programs bigint,invite_status text)
language sql stable security invoker set search_path='' as $$select * from gym_private.member_overview()$$;

create function gym_private.member_profile(target uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
 if auth.uid() is null or not gym_private.manages_member(target) then raise exception 'Not authorized' using errcode='42501';end if;
 select jsonb_build_object('id',p.id,'display_name',p.display_name,'email',coalesce(u.email,''),'is_active',p.is_active,
 'profile',jsonb_build_object('name',s.state->'profile'->>'name','goal',s.state->'profile'->>'goal','height',s.state->'profile'->>'height'),
 'latest_weight',(select x->'kg' from jsonb_array_elements(coalesce(s.state->'bodyweights','[]')) x order by x->>'date' desc limit 1)) into result
 from public.profiles p left join auth.users u on u.id=p.id left join public.gym_account_state s on s.member_id=p.id where p.id=target;
 return result;
end$$;
create function public.coach_member_profile(target uuid) returns jsonb language sql stable security invoker set search_path='' as $$select gym_private.member_profile(target)$$;
revoke all on function gym_private.member_overview(),gym_private.member_profile(uuid),public.coach_member_overview(),public.coach_member_profile(uuid) from public,anon;
grant execute on function gym_private.member_overview(),gym_private.member_profile(uuid),public.coach_member_overview(),public.coach_member_profile(uuid) to authenticated;
commit;
