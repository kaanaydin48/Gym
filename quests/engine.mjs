// Pure, deterministic rules. Only the server worker may turn these results into XP.
export const RULE_VERSION = 1;
export const DAILY_CAP = 250;
export const TITLES = [[1,'Başlangıç'],[5,'İstikrarlı'],[10,'Kararlı'],[20,'Disiplinli'],[30,'Usta']];
const DAY = 86400000;
export function dayKey(time) {
  const d = new Date(time);
  if (!Number.isFinite(d.getTime())) throw Error('Geçersiz zaman');
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Istanbul',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(d).map(p=>[p.type,p.value]));
  return `${p.year}-${p.month}-${p.day}`;
}
export function addDays(day,n) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) throw Error('Geçersiz gün');
  const d=new Date(day+'T00:00:00Z');
  if(!Number.isFinite(+d)||d.toISOString().slice(0,10)!==day)throw Error('Geçersiz gün');
  return new Date(+d+n*DAY).toISOString().slice(0,10);
}
export function weekKey(day) {return addDays(day,-((new Date(day+'T12:00:00Z').getUTCDay()+6)%7));}
export function levelFloor(level) {
  if(!Number.isSafeInteger(level)||level<1||level>100000)throw Error('Geçersiz seviye');
  return 200*(level-1)+25*(level-1)*(level-2);
}
export function levelFor(xp) {
  if(!Number.isSafeInteger(xp)||xp<0||xp>levelFloor(100000))throw Error('Geçersiz XP');
  let low=1,high=100000;
  while(low<high){const mid=Math.ceil((low+high)/2);if(levelFloor(mid)<=xp)low=mid;else high=mid-1;}
  const level=low, floor=levelFloor(level), next=level===100000?floor:levelFloor(level+1);
  return {level,xp,floor,next,progress:next===floor?1:(xp-floor)/(next-floor),title:TITLES.filter(([l])=>l<=level).at(-1)[1]};
}
import '../workout-metrics.js';
export const workoutMetrics=globalThis.GymWorkoutMetrics.workoutMetrics;

function quest(period,start,slot,kind,title,target,xp,extra={}) {
  return {id:`${period}:${start}:${slot}`,period,start,end:addDays(start,period==='daily'?1:7),slot,kind,title,target,xp,ruleVersion:RULE_VERSION,...extra};
}
export function dailyQuests(plan) {
  const day=plan.day, workout=plan.kind==='workout';
  const primary=workout?['workout','Planlanan antrenmanı tamamla',1,100]:plan.kind==='rest'?['rest','Planlı dinlenmene uy',1,100]:['review','Antrenman planını gözden geçir',1,40];
  return [quest('daily',day,1,...primary),
    quest('daily',day,2,workout?'sets':'review',workout?'Planlanan setleri kaydet':'Sonraki antrenmanını planla',workout?plan.sets:1,40),
    quest('daily',day,3,plan.goal?.kind||'reflection',plan.goal?.title||'Günlük değerlendirmeyi kaydet',plan.goal?.target||1,30)];
}
export function weeklyQuests(week) {
  const workouts=week.days.filter(d=>d.kind==='workout');
  const rests=week.days.filter(d=>d.kind==='rest');
  if(!workouts.length&&rests.length)return [
    quest('weekly',week.start,1,'rest','Planlı toparlanma haftasını tamamla',rests.length,250),
    quest('weekly',week.start,2,'adherence','Dinlenme planına sadık kal',rests.length,200),
    quest('weekly',week.start,3,'reflection','Toparlanmanı değerlendir',Math.min(3,rests.length),120),
    quest('weekly',week.start,4,week.goal?.kind||'review',week.goal?.title||'Sonraki haftanı planla',week.goal?.target||1,150)];
  return [quest('weekly',week.start,1,'workouts','Haftalık antrenman hedefini tamamla',workouts.length,250),
    quest('weekly',week.start,2,'adherence','Programına sadık kal',week.days.filter(d=>['workout','rest'].includes(d.kind)).length,200),
    quest('weekly',week.start,3,'sets','Haftalık set hedefini tamamla',workouts.reduce((n,d)=>n+d.sets,0),120),
    quest('weekly',week.start,4,week.goal?.kind||'review',week.goal?.title||'Haftalık planını gözden geçir',week.goal?.target||1,150)];
}
export function personalRecords(days,today,activation) {
  const best=new Map(), rewards=[];
  for(const [date,day] of Object.entries(days).sort(([a],[b])=>a.localeCompare(b))) {
    if(date>today)continue;
    const m=workoutMetrics(day);if(!m.finished)continue;
    // Coalesce duplicate exercise rows before comparing, so one workout can't set its own baseline.
    const grouped=new Map();
    for(const e of m.exercises){const old=grouped.get(e.key);if(old)old.sets.push(...e.sets);else grouped.set(e.key,{...e,sets:[...e.sets]});}
    for(const e of grouped.values()) {
      const previous=best.get(e.key), next={weight:previous?.weight??0,reps:new Map(previous?.reps||[])};
      let isRecord=false;
      for(const s of e.sets){const kg=e.duration?0:+s.kg,reps=+s.reps;
        if(previous&&((!e.duration&&e.type!=='body'&&kg>previous.weight)||(previous.reps.has(kg)&&reps>previous.reps.get(kg))))isRecord=true;
        next.weight=Math.max(next.weight,kg);next.reps.set(kg,Math.max(next.reps.get(kg)||0,reps));
      }
      best.set(e.key,next);
      if(isRecord&&date>=activation)rewards.push({key:`pr:${date}:${e.key}`,date,pool:'daily',xp:75,name:e.name});
    }
  }return rewards;
}
function matches(plan,day) {return workoutMetrics(day).finished&&(!plan.programId||day.programId===plan.programId);}
export function adherence(plans,days,today) {
  const eligible=plans.filter(p=>['workout','rest'].includes(p.kind)&&p.day<today);
  const successful=eligible.filter(p=>p.kind==='rest'?!workoutMetrics(days[p.day]).finished:matches(p,days[p.day])).length;
  return {planned:eligible.length,successful,ratio:eligible.length?successful/eligible.length:0,success:eligible.length>0&&successful*5>=eligible.length*4};
}
function progressFor(q,plans,days,actions,today) {
  const relevant=plans.filter(p=>p.day>=q.start&&p.day<q.end&&p.day<=today);
  if(q.kind==='manual')return actions.some(a=>a.questId===q.id&&a.kind==='approval'&&a.approved===true)?q.target:0;
  if(q.kind==='rest')return relevant.filter(p=>p.kind==='rest'&&p.day<today&&!workoutMetrics(days[p.day]).finished).length;
  if(q.kind==='workout'||q.kind==='workouts')return relevant.filter(p=>p.kind==='workout'&&matches(p,days[p.day])).length;
  if(q.kind==='adherence')return adherence(relevant,days,today).successful;
  if(q.kind==='sets')return relevant.filter(p=>p.kind==='workout'&&matches(p,days[p.day])).reduce((n,p)=>n+Math.min(p.sets,workoutMetrics(days[p.day]).sets),0);
  if(q.kind==='review'||q.kind==='reflection')return new Set(actions.filter(a=>a.kind===q.kind&&a.date>=q.start&&a.date<q.end&&a.date<=today&&a.accepted===true).map(a=>a.date)).size;
  return 0;
}
export function capRewards(rewards) {
  const used=new Map(),seen=new Set();
  return [...rewards].sort((a,b)=>a.date.localeCompare(b.date)||a.key.localeCompare(b.key)).map(r=>{
    if(seen.has(r.key))throw Error('Tekrarlanan ödül anahtarı');seen.add(r.key);
    if(!Number.isSafeInteger(r.xp)||r.xp<0||!['daily','weekly'].includes(r.pool))throw Error('Geçersiz ödül');
    const xp=r.pool==='weekly'?r.xp:Math.min(r.xp,Math.max(0,DAILY_CAP-(used.get(r.date)||0)));
    if(r.pool==='daily')used.set(r.date,(used.get(r.date)||0)+xp);
    return {...r,eligibleXp:r.xp,xp};
  });
}
export function ledgerDiff(existing,desired,revision) {
  const nets=new Map(),metadata=new Map();
  for(const row of existing){nets.set(row.key,(nets.get(row.key)||0)+row.delta);metadata.set(row.key,row);}
  const targets=new Map(desired.map(r=>[r.key,r]));
  return [...new Set([...nets.keys(),...targets.keys()])].sort().flatMap(key=>{
    const target=targets.get(key),old=metadata.get(key),delta=(target?.xp||0)-(nets.get(key)||0);
    return delta?[{key,date:(target||old).date,pool:(target||old).pool,delta,revision,operationKey:`${revision}:${key}`,reason:delta<0?'correction':'earned_or_recalculated'}]:[];
  });
}
function streak(weeks,field,currentWeek) {
  let n=0,day=addDays(currentWeek,-7);const byDate=new Map(weeks.map(w=>[w.start,w]));
  while(byDate.get(day)?.[field]){n++;day=addDays(day,-7);}return n;
}
export function performanceComparisons(days,today) {
  const stats=(start,end)=>Object.entries(days).filter(([date,d])=>date>=start&&date<end&&workoutMetrics(d).finished)
    .reduce((a,[,d])=>{const m=workoutMetrics(d);a.workouts++;a.sets+=m.sets;a.volume+=m.externalVolume+m.bodyVolume;return a;},{workouts:0,sets:0,volume:0});
  const week=weekKey(today),month=today.slice(0,7)+'-01';
  const prevMonth=addDays(month,-1).slice(0,7)+'-01';
  const records=Object.entries(days).filter(([date,d])=>date<=today&&workoutMetrics(d).finished).map(([date,d])=>({date,...workoutMetrics(d)}));
  const best=records.reduce((a,r)=>r.externalVolume+r.bodyVolume>(a?.volume??-1)?{date:r.date,volume:r.externalVolume+r.bodyVolume,sets:r.sets}:a,null);
  return {week:{current:stats(week,addDays(today,1)),previous:stats(addDays(week,-7),week)},month:{current:stats(month,addDays(today,1)),previous:stats(prevMonth,month)},best};
}
export function evaluate({days={},weeks=[],dailyPlans,actions=[],overrides=[],activation,today}) {
  addDays(activation,0);addDays(today,0);
  const plans=dailyPlans||weeks.flatMap(w=>w.days),overrideMap=new Map(overrides.map(q=>[q.id,q]));
  const generated=[...plans.filter(p=>p.day>=activation&&p.day<=today).flatMap(dailyQuests),...weeks.filter(w=>w.start<=today).flatMap(weeklyQuests)];
  const quests=generated.map(base=>{
    const q={...base,...overrideMap.get(base.id)};
    const progress=Math.min(q.target,progressFor(q,plans,days,actions,today));
    // Zero targets never become free rewards. Manual approvals use server receipt dates.
    const complete=q.target>0&&progress>=q.target;
    return {...q,progress,status:complete?'complete':q.end<=today?'expired':q.target<=0?'needs_plan':'active'};
  });
  const rewards=quests.filter(q=>q.status==='complete').map(q=>({key:`quest:${q.id}`,date:q.start,pool:q.period==='daily'?'daily':'weekly',xp:q.xp}));
  const weekResults=weeks.filter(w=>w.start<=today).map(w=>{
    const all=quests.filter(q=>q.period==='weekly'&&q.start===w.start),a=adherence(plans.filter(p=>p.day>=w.start&&p.day<addDays(w.start,7)),days,today),done=all.length===4&&all.every(q=>q.status==='complete');
    if(done)rewards.push({key:`weekly-bonus:${w.start}`,date:w.start,pool:'weekly',xp:100});
    return {start:w.start,...a,adherenceSuccess:addDays(w.start,7)<=today&&a.success,questSuccess:addDays(w.start,7)<=today&&done,completedQuests:all.filter(q=>q.status==='complete').length};
  });
  const prs=personalRecords(days,today,activation);rewards.push(...prs);
  const capped=capRewards(rewards),xp=capped.reduce((n,r)=>n+r.xp,0),level=levelFor(xp);
  const finished=Object.entries(days).filter(([date,d])=>date<=today&&workoutMetrics(d).finished).length;
  const completed=quests.filter(q=>q.status==='complete').length,goodWeeks=weekResults.filter(w=>w.adherenceSuccess).length;
  const streaks={adherence:streak(weekResults,'adherenceSuccess',weekKey(today)),quests:streak(weekResults,'questSuccess',weekKey(today))};
  const badges=[['first','İlk Adım',finished>=1],['ten','10 Antrenman',finished>=10],['steady','İstikrar',goodWeeks>=4],['records','Rekor Avcısı',prs.length>=5],['discipline','Disiplin',goodWeeks>=12],['quests','Görev Ustası',completed>=100],['hundred','100 Kulübü',finished>=100],['legend','Efsane',finished>=100&&streaks.adherence>=12&&level.level>=30]].filter(x=>x[2]).map(([id,name])=>({id,name}));
  return {ruleVersion:RULE_VERSION,today,week:weekKey(today),quests,rewards:capped,level,streaks,weeks:weekResults,badges,records:prs,titles:[...TITLES.filter(([l])=>l<=level.level).map(([,name])=>name),...badges.map(b=>b.name)],comparisons:performanceComparisons(days,today),stats:{workouts:finished,quests:completed}};
}
