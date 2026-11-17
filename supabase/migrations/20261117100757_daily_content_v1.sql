begin;
create table public.daily_content_sources(
 id text primary key, card jsonb not null check(jsonb_typeof(card)='object'),
 verified_at timestamptz not null default now(), active boolean not null default true
);
create table public.daily_content_days(
 user_id uuid not null references auth.users(id), day date not null,
 cards jsonb not null check(jsonb_typeof(cards)='array' and jsonb_array_length(cards)=3),
 created_at timestamptz not null default now(), primary key(user_id,day)
);
create table public.daily_content_preferences(
 user_id uuid not null references auth.users(id), content_id text not null,
 topic text not null, reaction smallint not null default 0 check(reaction in(-1,0,1)),
 saved boolean not null default false, card jsonb not null check(jsonb_typeof(card)='object'),
 updated_at timestamptz not null default now(), primary key(user_id,content_id)
);
alter table public.daily_content_sources enable row level security;
alter table public.daily_content_days enable row level security;
alter table public.daily_content_preferences enable row level security;
revoke all on public.daily_content_sources,public.daily_content_days,public.daily_content_preferences from public,anon,authenticated;
grant select on public.daily_content_sources,public.daily_content_days to authenticated;
grant select,insert,update on public.daily_content_preferences to authenticated;
create policy active_sources on public.daily_content_sources for select to authenticated using(active);
create policy own_daily on public.daily_content_days for select to authenticated using(user_id=(select auth.uid()));
create policy own_preferences_read on public.daily_content_preferences for select to authenticated using(user_id=(select auth.uid()));
create policy own_preferences_insert on public.daily_content_preferences for insert to authenticated with check(user_id=(select auth.uid()));
create policy own_preferences_update on public.daily_content_preferences for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
-- No references, triggers or writes to workouts, plans, XP or quests.
commit;
