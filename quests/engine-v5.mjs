// V5 uses only persisted workout events. Legacy rules remain available for audit tests.
import {addDays,weekKey,levelFor,capRewards,performanceComparisons,TITLES,workoutMetrics} from './engine.mjs';
export const RULE_VERSION=5;
export const MUSCLES=[['Göğüs',4,50],['Sırt',4,60],['Omuz',3,50],['Kol',5,40],['Bacak',4,70],['Karın',1,30]];
export function muscleGroup(value){
 const key=String(value||'').trim().toLocaleLowerCase('tr-TR');
 return ({'göğüs':'Göğüs','sırt':'Sırt','omuz':'Omuz','kol':'Kol','ön kol':'Kol','arka kol':'Kol','biceps':'Kol','triceps':'Kol','bacak':'Bacak','karın':'Karın'})[key]||null;
}
function stats(day){
 if(day?.kind!=='workout')return {sets:0,finished:false,muscles:{}};
 const metrics=workoutMetrics(day),muscles={};
 for(const e of day.exercises||[]){const g=muscleGroup(e.muscle);if(g)muscles[g]=(muscles[g]||0)+globalThis.GymWorkoutMetrics.validSets(e).length;}
 return {...metrics,muscles};
}
export function evaluateV5({days={},dailyPlans=[],weeks=[],activation,today,legacyRewards=[],legacyBadges=[],legacyTitles=[]}){
 addDays(activation,0);addDays(today,0);
 const quests=[],byDay=new Map(),restCounts=new Map();
 const push=(period,start,slot,kind,title,target,xp,progress)=>quests.push({id:`v5:${period}:${start}:${slot}`,period,start,end:addDays(start,period==='daily'?1:7),slot,kind,title,target,xp,progress:Math.min(target,progress),status:progress>=target?'complete':addDays(start,period==='daily'?1:7)<=today?'expired':'active',ruleVersion:5});
 for(let date=activation;date<=today;date=addDays(date,1)){
  const m=stats(days[date]);byDay.set(date,m);
  push('daily',date,11,'workout','Antrenman tamamla',1,30,+m.finished);
  push('daily',date,12,'sets','Temel set hedefi',8,20,m.sets);
  push('daily',date,13,'sets','İleri set hedefi',16,20,m.sets);
  const plan=dailyPlans.find(p=>p.day===date),week=weekKey(date);
  // Both the immutable boundary snapshot and the current calendar must still be rest.
  if(plan?.kind==='rest'){
   const eligible=date<today&&days[date]?.kind==='rest'&&!m.finished&&(restCounts.get(week)||0)<3;
   if(eligible)restCounts.set(week,(restCounts.get(week)||0)+1);
   push('daily',date,14,'rest','Planlı dinlenme',1,15,+eligible);
  }
  if(['sets','workouts'].includes(plan?.goal?.kind))push('daily',date,15,plan.goal.kind,plan.goal.title,plan.goal.target,0,plan.goal.kind==='sets'?m.sets:+m.finished);
 }
 for(let start=weekKey(activation);start<=today;start=addDays(start,7)){
  const entries=[...byDay].filter(([d])=>d>=start&&d<addDays(start,7));
  MUSCLES.forEach(([g,target,xp],i)=>push('weekly',start,11+i,'muscle',`${g} set hedefi`,target,xp,entries.reduce((n,[,m])=>n+(m.muscles[g]||0),0)));
  const goal=weeks.find(w=>w.start===start)?.goal;
  if(['sets','workouts'].includes(goal?.kind))push('weekly',start,17,goal.kind,goal.title,goal.target,0,entries.reduce((n,[,m])=>n+(goal.kind==='sets'?m.sets:+m.finished),0));
 }
 const history=Object.entries(days).filter(([d])=>d<today&&d>=addDays(today,-28)).map(([,d])=>stats(d)).filter(m=>m.finished).map(m=>m.sets).sort((a,b)=>a-b);
 const suggestedBase=history.length?Math.max(1,Math.round(history[Math.floor(history.length/2)]/2)):8;
 const automatic=capRewards(quests.filter(q=>q.status==='complete'&&q.xp>0).map(q=>({key:`quest:${q.id}`,date:q.start,pool:q.period,xp:q.xp})));
 const rewards=[...legacyRewards,...automatic],level=levelFor(rewards.reduce((n,r)=>n+r.xp,0));
 const finished=Object.entries(days).filter(([d,x])=>d<=today&&stats(x).finished).length;
 const completed=quests.filter(q=>q.status==='complete').length;
 let streak=0;
 for(let w=addDays(weekKey(today),-7);w>=weekKey(activation);w=addDays(w,-7)){
  const tasks=quests.filter(q=>q.period==='weekly'&&q.start===w&&q.kind==='muscle');
  if(tasks.length!==6||!tasks.every(q=>q.status==='complete'))break;streak++;
 }
 const earned=[['first','İlk Adım',finished>=1],['ten','10 Antrenman',finished>=10],['hundred','100 Kulübü',finished>=100],['quests','Görev Ustası',completed>=100],['steady','İstikrar',streak>=4],['discipline','Disiplin',streak>=12],['legend','Efsane',finished>=100&&streak>=12&&level.level>=30]].filter(x=>x[2]).map(([id,name])=>({id,name}));
 const badges=[...new Map([...legacyBadges,...earned].map(b=>[b.id,b])).values()];
 return {ruleVersion:5,today,week:weekKey(today),activation,quests,rewards,level,badges,titles:[...new Set([...legacyTitles,...TITLES.filter(([l])=>l<=level.level).map(([,n])=>n),...badges.map(b=>b.name)])],streaks:{quests:streak,adherence:streak},stats:{workouts:finished,quests:completed},comparisons:performanceComparisons(days,today),personalization:{mode:'fixed',base:8,advanced:16,sampleSize:history.length,suggestedBase,suggestedAdvanced:suggestedBase*2}};
}
