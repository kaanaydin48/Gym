-- Execute inside a transaction, only with workers stopped, before restoring V4 code.
-- Once V5 awards exist, preserve the ledger and use a forward correction instead.
do $$ begin
 if exists(select 1 from public.xp_ledger where reward_key like 'quest:v5:%') then
 raise exception 'V5 rewards exist: stop workers and use forward recovery; rollback refused';
 end if;
end $$;
drop trigger v5_ledger_guard on public.xp_ledger;
drop function quest_private.v5_ledger_guard();
grant execute on function public.quest_record_action(text,text,text,uuid),
 public.quest_approve(uuid,boolean,text,uuid),public.quest_assign_manual(uuid,text,text,integer),
 public.quest_edit(uuid,text,text,integer,integer),
 quest_private.record_action(text,text,text,uuid),quest_private.approve(uuid,boolean,text,uuid),
 quest_private.assign_manual(uuid,text,text,integer),quest_private.edit(uuid,text,text,integer,integer)
 to authenticated,service_role;
-- Additive columns and slots intentionally remain; no user data is removed.
create or replace function quest_private.personal_goal(period text,kind text,title text,target integer) returns date
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
