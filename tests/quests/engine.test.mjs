import test from 'node:test';
import assert from 'node:assert/strict';
import {dayKey,weekKey,addDays,levelFloor,levelFor,dailyQuests,weeklyQuests,workoutMetrics,personalRecords,adherence,capRewards,ledgerDiff,evaluate} from '../../quests/engine.mjs';
import {freezeWeek,knownPlanAt,periodCutoff} from '../../quests/worker.mjs';
import {assertLocalDatabase,assertDevelopmentApi} from '../../quests/isolation.mjs';
const day='2026-11-02';
const workout=(kg=20,reps=10)=>({kind:'workout',programId:'pull',finished:1793642400000,exercises:[{id:'row',name:'Row',type:'external',factor:2,logs:[{done:true,kg,reps,rir:2}]}]});
const plan=(date,kind='workout')=>({day:date,kind,sets:1,programId:'pull'});

test('Istanbul midnight, Monday, month/year rollover independent of device timezone',()=>{
 assert.equal(dayKey('2026-11-01T20:59:59Z'),'2026-11-01');
 assert.equal(dayKey('2026-11-01T21:00:00Z'),'2026-11-02');
 assert.equal(weekKey('2027-01-01'),'2026-12-28');
 assert.equal(addDays('2026-12-31',1),'2027-01-01');
 assert.throws(()=>addDays('2026-02-30',0));
});
test('3 daily / 4 weekly; rest and unknown days never prescribe workouts',()=>{
 for(const kind of ['workout','rest','none'])assert.equal(dailyQuests(plan(day,kind)).length,3);
 assert.equal(dailyQuests(plan(day,'rest'))[0].kind,'rest');
 assert.equal(dailyQuests(plan(day,'none'))[0].kind,'review');
 const q=weeklyQuests({start:day,days:[plan(day),plan(addDays(day,2)),plan(addDays(day,4))]});
 assert.equal(q.length,4);assert.equal(q[0].target,3);assert.equal(q[2].target,3);
 const rest=weeklyQuests({start:day,days:[plan(day,'rest')]});
 assert.equal(rest.length,4);assert.ok(rest.every(q=>!['workouts','sets'].includes(q.kind)));
});
test('zero targets require a plan; no free weekly completion or bonus',()=>{
 const result=evaluate({activation:day,today:day,weeks:[{start:day,days:[plan(day,'none')]}]});
 assert.equal(result.quests.filter(q=>q.period==='weekly'&&q.status==='needs_plan').length,3);
 assert.equal(result.level.xp,0);
});
test('valid sets, numeric legacy timestamps, body volume and dumbbell factor',()=>{
 const d=workout(); d.exercises[0].logs.push({done:true,kg:-5,reps:10},{done:true,kg:20,reps:''},{done:false,kg:100,reps:20});
 assert.equal(workoutMetrics(d).sets,1);assert.equal(workoutMetrics(d).externalVolume,400);assert.equal(workoutMetrics(d).finished,true);
 d.exercises[0].type='body';assert.equal(workoutMetrics(d).externalVolume,0);assert.equal(workoutMetrics(d).bodyVolume,400);
});
test('first observation is baseline; duplicate rows cannot create PR; history correction recomputes chain',()=>{
 const first=workout(20), second=workout(25);first.exercises.push(structuredClone(first.exercises[0]));first.exercises[1].logs[0].kg=22;
 const days={[day]:first,[addDays(day,1)]:second};
 assert.equal(personalRecords(days,addDays(day,1),day).length,1);
 first.exercises[0].logs[0].kg=30;
 assert.equal(personalRecords(days,addDays(day,1),day).length,0);
 second.finished=null;assert.equal(personalRecords(days,addDays(day,1),day).length,0);
});
test('daily cap 250, weekly pool independent; clipping never carries to next day',()=>{
 const r=capRewards([{key:'a',date:day,pool:'daily',xp:200},{key:'b',date:day,pool:'daily',xp:75},{key:'c',date:day,pool:'weekly',xp:250},{key:'d',date:addDays(day,1),pool:'daily',xp:30}]);
 assert.deepEqual(r.map(x=>x.xp),[200,50,250,30]);
 assert.throws(()=>capRewards([r[0],r[0]]));
});
test('ledger idempotence, correction, cap reallocation and re-earning',()=>{
 const original=[{key:'a',date:day,pool:'daily',xp:200},{key:'b',date:day,pool:'daily',xp:75}];
 let ledger=ledgerDiff([],capRewards(original),'1');
 assert.equal(ledgerDiff(ledger,capRewards(original),'1').length,0);
 const correction=ledgerDiff(ledger,capRewards([original[1]]),'2');
 assert.deepEqual(correction.map(r=>r.delta),[-200,25]);
 ledger.push(...correction);
 const reearned=ledgerDiff(ledger,capRewards(original),'3');
 assert.deepEqual(reearned.map(r=>r.delta),[200,-25]);
 assert.ok(reearned.every(r=>r.date===day));
});
test('levels: exact boundary below/at/above for first 100 levels',()=>{
 for(let l=2;l<=100;l++){const n=levelFloor(l);assert.equal(levelFor(n-1).level,l-1);assert.equal(levelFor(n).level,l);assert.equal(levelFor(n+1).level,l);}
 assert.equal(levelFloor(5),1100);assert.equal(levelFloor(30),26100);
});
test('80% success, below fails, planned rest counts, unplanned blanks excluded',()=>{
 const plans=Array.from({length:5},(_,i)=>plan(addDays(day,i),i===4?'rest':'workout'));
 const days=Object.fromEntries(plans.slice(0,3).map(p=>[p.day,workout()]));
 const a=adherence(plans,days,'2026-11-09');assert.equal(a.ratio,.8);assert.equal(a.success,true);
 delete days[day];assert.equal(adherence(plans,days,'2026-11-09').success,false);
 assert.equal(adherence([],{},'2026-11-09').success,false);
 assert.equal(adherence([plan(day,'rest')],{},day).planned,0);
});
test('4/4 bonus, expiration and independent weekly streaks; no circular dependency',()=>{
 const weeks=[{start:day,days:[plan(day)]}];const days={[day]:workout()};
 const incomplete=evaluate({days,weeks,activation:day,today:'2026-11-09'});
 assert.equal(incomplete.streaks.adherence,1);assert.equal(incomplete.streaks.quests,0);
 assert.equal(incomplete.quests.find(q=>q.period==='weekly'&&q.slot===4).status,'expired');
 const complete=evaluate({days,weeks,activation:day,today:'2026-11-09',actions:[{kind:'review',date:day,accepted:true}]});
 assert.equal(complete.streaks.quests,1);assert.equal(complete.rewards.find(r=>r.key.startsWith('weekly-bonus')).xp,100);
 assert.equal(complete.rewards.filter(r=>r.pool==='weekly').reduce((n,r)=>n+r.xp,0),820);
});
test('manual task requires approval; false latest approval reverses completion',()=>{
 const opts={days:{},weeks:[{start:day,days:[{...plan(day,'rest'),goal:{kind:'manual',target:1,title:'Koç kontrolü'}}]}],activation:day,today:day};
 const id=`daily:${day}:3`;
 assert.equal(evaluate({...opts,actions:[{kind:'submission',questId:id,accepted:true}]}).quests.find(q=>q.id===id).status,'active');
 assert.equal(evaluate({...opts,actions:[{kind:'approval',questId:id,approved:true}]}).quests.find(q=>q.id===id).status,'complete');
});
test('freeze ignores backdated plans and isolates immutable baseline',()=>{
 const days={[day]:workout(),[addDays(day,2)]:workout()};const frozen=freezeWeek(days,day,addDays(day,1));
 assert.equal(frozen.days[0].kind,'none');assert.equal(frozen.days[2].sets,1);
 days[addDays(day,2)].exercises[0].logs=[];assert.equal(frozen.days[2].sets,1);
});
test('production and alternate connection strings blocked in development',()=>{
 assert.throws(()=>assertLocalDatabase({host:'db.aryzgrgjwjdxumbddank.supabase.co',database:'postgres'}));
 assert.throws(()=>assertLocalDatabase({host:'localhost',database:'gym_quests_test',connectionString:'postgres://remote'}));
 assert.throws(()=>assertDevelopmentApi('https://aryzgrgjwjdxumbddank.supabase.co'));
 assert.equal(assertDevelopmentApi('http://127.0.0.1:54321'),'http://127.0.0.1:54321');
});
test('missed-day plan reconstruction accepts prospective changes but rejects retroactive ones',()=>{
 const initial={'2026-11-04':{kind:'workout',programId:'old'}};
 const events=[{day:'2026-11-04',after_day:{kind:'workout',programId:'new'},created_at:'2026-11-03T10:00:00Z'},
 {day:'2026-11-04',after_day:{kind:'rest'},created_at:'2026-11-05T10:00:00Z'}];
 const cutoff=periodCutoff('2026-11-04','2026-11-02T10:00:00Z');
 assert.equal(cutoff,'2026-11-03T21:00:00.000Z');
 assert.equal(knownPlanAt(initial,events,cutoff)['2026-11-04'].programId,'new');
 assert.equal(initial['2026-11-04'].programId,'old');
 assert.equal(periodCutoff('2026-11-02','2026-11-02T10:00:00Z'),'2026-11-02T10:00:00.000Z');
});
