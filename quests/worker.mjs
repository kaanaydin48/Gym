// Trusted worker only: never import this module into a browser.
// Database client must be a server credential. No user-supplied result/XP is accepted.
import {evaluate,ledgerDiff,dayKey,weekKey,addDays,RULE_VERSION} from './engine.mjs';

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
    const dailyPlans=(await client.query('select plan from public.quest_day_plans where user_id=$1 order by day',[userId])).rows.map(r=>r.plan);
    const raw=(await client.query('select * from public.quest_actions where user_id=$1 order by ordinal',[userId])).rows;
    const approvals=new Map(),actions=[];
    for(const a of raw){const date=typeof a.day==='string'?a.day:dayKey(a.day);
      if(a.kind==='approval')approvals.set(a.quest_key,{kind:'approval',questId:a.quest_key,approved:a.payload.approved,date});
      else actions.push({kind:a.kind,date,accepted:true});
    }
    actions.push(...approvals.values());
    const overrides=(await client.query('select definition from public.quest_overrides where user_id=$1',[userId])).rows.map(r=>r.definition);
    const result=evaluate({days,weeks,dailyPlans,actions,overrides,activation,today});
    const previous=(await client.query('select reward_key as key,effective_date::text as date,pool,delta from public.xp_ledger where user_id=$1 order by id',[userId])).rows;
    // Day progression can change rest/expiry/streak without any workout revision.
    const generation=`${account.generation}:${today}:v${result.ruleVersion}`;
    const changes=ledgerDiff(previous,result.rewards,generation);
    for(const r of changes)await client.query('insert into public.xp_ledger(user_id,reward_key,effective_date,pool,delta,generation,operation_key,reason) values($1,$2,$3,$4,$5,$6,$7,$8)',[userId,r.key,r.date,r.pool,r.delta,account.generation,r.operationKey,r.reason]);
    for(const q of result.quests)await client.query('insert into public.user_quests(user_id,quest_key,period,start_date,slot,detail,generation) values($1,$2,$3,$4,$5,$6,$7) on conflict(user_id,quest_key) do update set detail=excluded.detail,generation=excluded.generation',[userId,q.id,q.period,q.start,q.slot,q,account.generation]);
    const total=+(await client.query('select coalesce(sum(delta),0) as xp from public.xp_ledger where user_id=$1',[userId])).rows[0].xp;
    if(total!==result.level.xp)throw Error('XP reconciliation invariant failed');
    if(changes.length||account.processed_generation!==account.generation||account.processed_day!==today)await client.query('insert into public.quest_audit_log(user_id,action,detail) values($1,$2,$3)',[userId,'reconciled',{generation,sourceRevision:saved?.revision??null,changes:changes.length,xp:total}]);
    result.sourceRevision=saved?.revision??null;
    // Own-account evidence is returned only through the account's RLS-protected result.
    result.verifications=raw.filter(a=>a.quest_key).slice(-100).map(a=>({questId:a.quest_key,kind:a.kind,at:a.created_at,evidence:a.kind==='submission'?a.payload.evidence:undefined,approved:a.kind==='approval'?a.payload.approved:undefined}));
    const title=result.titles.includes(account.active_title)?account.active_title:result.level.title;
    await client.query('update public.quest_accounts set result=$2,processed_generation=generation,processed_day=$3,active_title=$4,updated_at=now() where user_id=$1',[userId,result,today,title]);
    await client.query('commit');
    return result;
  }catch(error){await client.query('rollback');throw error;}
}
