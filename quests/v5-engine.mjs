// Trusted worker rules. Browser output is informational, never an XP authority.
import {addDays,weekKey,levelFor,personalRecords,performanceComparisons,TITLES} from './engine.mjs';
import '../workout-metrics.js';
const {workoutMetrics,validSets}=globalThis.GymWorkoutMetrics;
export const V5_VERSION=5;
export const MUSCLES=[['Göğüs',4,50],['Sırt',4,60],['Omuz',3,50],['Kol',5,40],['Bacak',4,70],['Karın',1,30]];
export function muscleGroup(value){return ['Ön kol','Arka kol','Kol'].includes(value)?'Kol':MUSCLES.some(([m])=>m===value)?value:null;}
export function adaptiveTargets(days,day){
 const values=Object.entries(days).filter(([date,d])=>date>=addDays(day,-28)&&date<day&&workoutMetrics(d).finished).map(([,d])=>workoutMetrics(d).sets).sort((a,b)=>a-b);
 if(values.length<3)return {basic:8,advanced:16,samples:values.length};
 const mid=Math.floor(values.length/2),median=values.length%2?values[mid]:(values[mid-1]+values[mid])/2;
 const basic=Math.max(4,Math.min(16,Math.round(median/2)));
 return {basic,advanced:Math.max(basic+1,Math.min(32,Math.round(median))),samples:values.length};
}
export function hasActivity(day){return !!day&&(!!day.started||!!day.finished||(day.exercises||[]).some(e=>(e.logs||[]).some(s=>s.done===true)));}
export function capAll(rewards){
 const used=new Map();return [...rewards].sort((a,b)=>a.date.localeCompare(b.date)||a.key.localeCompare(b.key)).map(r=>{
  const xp=Math.min(r.xp,Math.max(0,250-(used.get(r.date)||0)));used.set(r.date,(used.get(r.date)||0)+xp);return {...r,eligibleXp:r.xp,xp};
 });
}
export function evaluateV5({days={},plans=[],activation,today,baseline={xp:0,badges:[],titles:[]},activityDays=[]}){
 addDays(activation,0);addDays(today,0);
 const quests=[],rewards=[],restUsed=new Map(),active=new Set(activityDays);
 const finish=d=>workoutMetrics(d).finished;
 const add=(period,start,slot,kind,title,target,xp,progress,earnedDate,extra={})=>{
  const q={id:`v5:${period}:${start}:${slot}`,period,start,end:addDays(start,period==='daily'?1:7),slot,kind,title,target,xp,progress:Math.min(target,progress),ruleVersion:5,...extra};
  q.status=progress>=target?'complete':q.end<=today?'expired':'active';quests.push(q);
  if(q.status==='complete')rewards.push({key:`quest:${q.id}`,date:earnedDate,pool:period,xp});
 };
 for(const p of [...plans].sort((a,b)=>a.day.localeCompare(b.day))){
  if(p.day<activation||p.day>today)continue;
  const d=days[p.day],m=workoutMetrics(d),rest=p.kind==='rest'&&!hasActivity(d)&&!active.has(p.day);
  if(rest){
   const week=weekKey(p.day),count=restUsed.get(week)||0;
   const complete=p.plannedBeforeDay===true&&p.day<today&&count<3;
   if(complete)restUsed.set(week,count+1);
   add('daily',p.day,1,'rest','Planlı dinlenme',1,15,complete?1:0,p.day,{restLimitReached:count>=3});
  }else{
   const {basic,advanced}=p.targets;
   add('daily',p.day,1,'workout','Antrenmanını tamamla',1,30,m.finished?1:0,p.day);
   add('daily',p.day,2,'sets',`${basic} geçerli set tamamla`,basic,20,m.finished?m.sets:0,p.day);
   add('daily',p.day,3,'sets',`${advanced} geçerli set tamamla`,advanced,20,m.finished?m.sets:0,p.day);
  }
 }
 const dates=Object.keys(days).filter(date=>date>=activation&&date<=today&&finish(days[date])).sort();
 for(let week=weekKey(activation);week<=today;week=addDays(week,7)){
  for(const [i,[muscle,target,xp]] of MUSCLES.entries()){
   let total=0,earned;
   for(const date of dates.filter(d=>d>=week&&d<addDays(week,7))){
    total+=(days[date].exercises||[]).filter(e=>muscleGroup(e.muscle)===muscle).reduce((n,e)=>n+validSets(e).length,0);
    if(!earned&&total>=target)earned=date;
   }
   add('weekly',week,i+1,'muscle_sets',`${muscle} · ${target} set`,target,xp,total,earned,{muscle});
  }
 }
 const prs=personalRecords(days,today,activation).map(r=>({...r,key:`v5:${r.key}`}));rewards.push(...prs);
 const capped=capAll(rewards),level=levelFor(baseline.xp+capped.reduce((n,r)=>n+r.xp,0));
 const awarded=new Map(capped.map(r=>[r.key,r.xp]));
 for(const q of quests)q.awardedXp=awarded.get(`quest:${q.id}`)||0;
 let streak=0,cursor=finish(days[today])?today:addDays(today,-1);
 while(cursor>=activation&&finish(days[cursor])){streak++;cursor=addDays(cursor,-1);}
 const workouts=Object.entries(days).filter(([date,d])=>date<=today&&finish(d)).length;
 const earned=[['first','İlk Adım',workouts>=1],['ten','10 Antrenman',workouts>=10],['hundred','100 Kulübü',workouts>=100],['records','Rekor Avcısı',prs.length>=5]].filter(x=>x[2]).map(([id,name])=>({id,name}));
 const badges=[...new Map([...(baseline.badges||[]),...earned].map(b=>[b.id,b])).values()];
 return {ruleVersion:5,today,week:weekKey(today),quests,rewards:capped,level,badges,titles:[...new Set([...(baseline.titles||[]),...TITLES.filter(([l])=>l<=level.level).map(([,t])=>t),...badges.map(b=>b.name)])],streaks:{workouts:streak},records:prs,comparisons:performanceComparisons(days,today),stats:{workouts,quests:quests.filter(q=>q.status==='complete').length},dailyCap:250};
}
