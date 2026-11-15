// Trusted worker only: never import this module into a browser.
// Database client must be a server credential. No user-supplied result/XP is accepted.
import {ledgerDiff,dayKey,weekKey,addDays} from './engine.mjs';
import {evaluateV5,RULE_VERSION} from './engine-v5.mjs';

export function freezeWeek(days,start,today) {
  return {start,days:Array.from({length:7},(_,i)=>{
    const date=addDays(start,i),d=days[date];
    // No retroactive plans at enrollment. Future weeks remain untouched until they start.
    const kind=date>=today&&['workout','rest'].includes(d?.kind)?d.kind:'none';
    const sets=kind==='workout'?(d.exercises||[]).reduce((n,e)=>n+(Array.isArray(e.logs)?e.logs.length:0),0):0;
    return {day:date,kind,sets,programId:kind==='workout'?d.programId:null};
  })};
}

export function knownPlanAt(initial,events,cutoff){
  const days=structuredClone(initial);
  for(const event of events){
    if(new Date(event.created_at)>new Date(cutoff))continue;
    if(event.after_day===null)delete days[event.day];else days[event.day]=event.after_day;
  }
  return days;
}
export function periodCutoff(day,enrolled){return new Date(Math.max(+new Date(`${day}T00:00:00+03:00`),+new Date(enrolled))).toISOString();}

export async function processAccount(client,userId) {
  await client.query('begin');
  try {
    // Serialize all generation/reconciliation/actions per user. No lost acknowledgements.
    const account=(await client.query('select *, (now() at time zone \'Europe/Istanbul\')::date::text as today from public.quest_accounts where user_id=$1 for update',[userId])).rows[0];
    if(!account)throw Error('Quest account required');
    const today=account.today;
    if(account.processed_generation===account.generation&&account.processed_day===today&&account.result?.ruleVersion===RULE_VERSION){
      await client.query('commit');return account.result;
    }
    const saved=(await client.query('select state, revision from public.gym_account_state where member_id=$1',[userId])).rows[0];
    const days=saved?.state?.days||{};
    const activation=typeof account.activation==='string'?account.activation:dayKey(account.activation);
    const events=(await client.query('select day,after_day,created_at from public.quest_source_events where user_id=$1 order by id',[userId])).rows;
    const goals=(await client.query('select effective_week::text,period,definition from public.quest_personal_goals where user_id=$1 order by effective_week',[userId])).rows;
    const goalAt=(period,date)=>goals.filter(g=>g.period===period&&g.effective_week<=date).at(-1)?.definition;
    // Catch up missed periods using only plans the server had seen at their boundary.
    for(let start=weekKey(activation);start<=today;start=addDays(start,7)){
      const known=knownPlanAt(account.initial_plan,events,periodCutoff(start,account.enrolled_at));
      const plan=freezeWeek(known,start,start<activation?activation:start);plan.goal=goalAt('weekly',start);
      await client.query('insert into public.quest_plan_snapshots(user_id,week_start,plan) values($1,$2,$3) on conflict do nothing',[userId,start,plan]);
    }
    for(let date=activation;date<=today;date=addDays(date,1)){
      const cutoff=periodCutoff(date,account.enrolled_at),known=knownPlanAt(account.initial_plan,events,cutoff);
      const plan=freezeWeek(known,weekKey(date),date).days.find(p=>p.day===date);plan.goal=goalAt('daily',date);
      await client.query('insert into public.quest_day_plans(user_id,day,plan,cutoff) values($1,$2,$3,$4) on conflict do nothing',[userId,date,plan,cutoff]);
    }
    const weeks=(await client.query('select plan from public.quest_plan_snapshots where user_id=$1 order by week_start',[userId])).rows.map(r=>r.plan);
    const dailyPlans=(await client.query('select plan,cutoff from public.quest_day_plans where user_id=$1 order by day',[userId])).rows.map(r=>r.plan.kind==='rest'&&new Date(r.cutoff)>new Date(`${r.plan.day}T00:00:00+03:00`)?{...r.plan,kind:'none'}:r.plan);
    const previous=(await client.query('select reward_key as key,effective_date::text as date,pool,delta from public.xp_ledger where user_id=$1 order by id',[userId])).rows;
    if(!account.v5_activation)throw Error('V5 migration required');
    const legacy=new Map();
    for(const r of previous.filter(r=>!r.key.startsWith('quest:v5:'))){const old=legacy.get(r.key);legacy.set(r.key,{key:r.key,date:r.date,pool:r.pool,xp:(old?.xp||0)+r.delta});}
    const result=evaluateV5({days,weeks,dailyPlans,activation:account.v5_activation,today,legacyRewards:[...legacy.values()],legacyBadges:account.v5_legacy?.badges||[],legacyTitles:account.v5_legacy?.titles||[]});
    // Day progression can change rest/expiry/streak without any workout revision.
    const generation=`${account.generation}:${today}:v${result.ruleVersion}`;
    const changes=ledgerDiff(previous,result.rewards,generation);
    for(const r of changes)await client.query('insert into public.xp_ledger(user_id,reward_key,effective_date,pool,delta,generation,operation_key,reason) values($1,$2,$3,$4,$5,$6,$7,$8)',[userId,r.key,r.date,r.pool,r.delta,account.generation,r.operationKey,r.reason]);
    for(const q of result.quests)await client.query('insert into public.user_quests(user_id,quest_key,period,start_date,slot,detail,generation) values($1,$2,$3,$4,$5,$6,$7) on conflict(user_id,quest_key) do update set detail=excluded.detail,generation=excluded.generation',[userId,q.id,q.period,q.start,q.slot,q,account.generation]);
    const total=+(await client.query('select coalesce(sum(delta),0) as xp from public.xp_ledger where user_id=$1',[userId])).rows[0].xp;
    if(total!==result.level.xp)throw Error('XP reconciliation invariant failed');
    if(changes.length||account.processed_generation!==account.generation||account.processed_day!==today)await client.query('insert into public.quest_audit_log(user_id,action,detail) values($1,$2,$3)',[userId,'reconciled',{generation,sourceRevision:saved?.revision??null,changes:changes.length,xp:total}]);
    result.sourceRevision=saved?.revision??null;
    const title=result.titles.includes(account.active_title)?account.active_title:result.level.title;
    await client.query('update public.quest_accounts set result=$2,processed_generation=generation,processed_day=$3,active_title=$4,updated_at=now() where user_id=$1',[userId,result,today,title]);
    await client.query('commit');
    return result;
  }catch(error){await client.query('rollback');throw error;}
}
