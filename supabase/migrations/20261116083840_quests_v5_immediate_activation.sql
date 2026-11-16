-- Prepared only. Deploy with both V5 workers paused; never run automatically on main.
begin;
lock table public.quest_accounts in share row exclusive mode;
-- Only the original deferred cohort is moved back by exactly one day.
-- Later enrollments and any different activation dates remain untouched.
update public.quest_accounts a
set v5_activation=date '2026-11-15', generation=generation+1,
    v5_legacy=v5_legacy || jsonb_build_object(
      'immediate_activation_fix',true,
      'excluded_reward_days',case when exists(
        select 1 from public.xp_ledger l where l.user_id=a.user_id
        and l.effective_date=date '2026-11-15' and l.reward_key not like 'quest:v5:%'
        and l.pool='daily' and l.delta>0
      ) then jsonb_build_array('2026-11-15') else '[]'::jsonb end)
where a.v5_activation=date '2026-11-16'
  and (a.enrolled_at at time zone 'Europe/Istanbul')::date<=date '2026-11-15'
  and not (a.v5_legacy ? 'immediate_activation_fix');
-- New enrollments already default to today's Istanbul date. Preserve source and ledger.
commit;
