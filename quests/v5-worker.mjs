import {addDays,dayKey,ledgerDiff} from './engine.mjs';
import {evaluateV5,adaptiveTargets,hasActivity} from './v5-engine.mjs';
// Called inside processAccount's transaction with the account row already locked.
export async function processV5Locked(client,account){
 const today=account.today,activation=typeof account.v5_start==='string'?account.v5_start:dayKey(account.v5_start);
 const saved=(await client.query('select state,revision from public.gym_account_state where member_id=$1',[account.user_id])).rows[0];
 const days=saved?.state?.days||{};
 const previous=(await client.query('select reward_key as key,effective_date::text as date,pool,delta from public.xp_ledger where user_id=$1 order by id',[account.user_id])).rows;
 let baseline=account.v5_baseline;
 if(!baseline){
  baseline={xp:previous.reduce((n,r)=>n+r.delta,0),badges:account.result?.badges||[],titles:account.result?.titles||[]};
  await client.query('update public.quest_accounts set v5_baseline=$2 where user_id=$1',[account.user_id,baseline]);
 }
 const events=(await client.query('select day,before_day,after_day,created_at from public.quest_source_events where user_id=$1 order by id',[account.user_id])).rows;
 // Reverse source history from current state to recover the exact server-known cutoff.
 const knownBefore=cutoff=>{const known=structuredClone(days);for(const e of [...events].reverse())if(+new Date(e.created_at)>=+new Date(cutoff)){if(e.before_day===null)delete known[e.day];else known[e.day]=e.before_day;}return known;};
 for(let day=activation;day<=today;day=addDays(day,1)){
  const cutoff=`${day}T00:00:00+03:00`,known=knownBefore(cutoff);
  // New enrollment after midnight cannot prove a rest plan existed before that day.
  const proven=+new Date(account.enrolled_at)<+new Date(cutoff);
  const plan={day,kind:known[day]?.kind||'none',plannedBeforeDay:proven&&known[day]?.kind==='rest',targets:adaptiveTargets(known,day)};
  await client.query('insert into public.quest_v5_day_plans(user_id,day,plan) values($1,$2,$3) on conflict do nothing',[account.user_id,day,plan]);
 }
 const plans=(await client.query('select plan from public.quest_v5_day_plans where user_id=$1 order by day',[account.user_id])).rows.map(r=>r.plan);
 const activityDays=events.filter(e=>hasActivity(e.before_day)||hasActivity(e.after_day)).map(e=>e.day);
 const result=evaluateV5({days,plans,activation,today,baseline,activityDays});
 const generation=`${account.generation}:${today}:v5`;
 const changes=ledgerDiff(previous.filter(r=>r.key.startsWith('quest:v5:')||r.key.startsWith('v5:')),result.rewards,generation);
 for(const r of changes)await client.query('insert into public.xp_ledger(user_id,reward_key,effective_date,pool,delta,generation,operation_key,reason) values($1,$2,$3,$4,$5,$6,$7,$8)',[account.user_id,r.key,r.date,r.pool,r.delta,account.generation,r.operationKey,r.reason]);
 for(const q of result.quests)await client.query('insert into public.user_quests(user_id,quest_key,period,start_date,slot,detail,generation) values($1,$2,$3,$4,$5,$6,$7) on conflict(user_id,quest_key) do update set detail=excluded.detail,generation=excluded.generation',[account.user_id,q.id,q.period,q.start,q.slot,q,account.generation]);
 const total=+(await client.query('select coalesce(sum(delta),0) as xp from public.xp_ledger where user_id=$1',[account.user_id])).rows[0].xp;
 if(total!==result.level.xp)throw Error('V5 XP reconciliation invariant failed');
 result.sourceRevision=saved?.revision??null;
 const title=result.titles.includes(account.active_title)?account.active_title:result.level.title;
 await client.query('update public.quest_accounts set result=$2,processed_generation=generation,processed_day=$3,active_title=$4,updated_at=now() where user_id=$1',[account.user_id,result,today,title]);
 await client.query('insert into public.quest_audit_log(user_id,action,detail) values($1,$2,$3)',[account.user_id,'v5_reconciled',{generation,changes:changes.length,xp:total}]);
 return result;
}
