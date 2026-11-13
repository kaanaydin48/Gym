import test from 'node:test';
import assert from 'node:assert/strict';
import {adaptiveTargets,evaluateV5,capAll,MUSCLES} from '../../quests/v5-engine.mjs';
import {dayKey,ledgerDiff} from '../../quests/engine.mjs';
import {cardMarkup} from '../../quests/ui.mjs';
const start='2026-11-09';
const workout=(n=16,muscle='Göğüs')=>({kind:'workout',finished:1,exercises:[{id:'e',muscle,name:'Test',logs:Array.from({length:n},()=>({done:true,reps:10,kg:20,rir:2}))}]});
const plan=(day=start,kind='workout')=>({day,kind,plannedBeforeDay:true,targets:{basic:8,advanced:16}});
const evaluate=(args={})=>evaluateV5({activation:start,today:start,days:{[start]:workout()},plans:[plan()],...args});
test('V5 daily rewards 30/20/20 and exact six muscle targets',()=>{
 const r=evaluate();assert.deepEqual(r.quests.filter(q=>q.period==='daily').map(q=>q.xp),[30,20,20]);
 assert.deepEqual(r.quests.filter(q=>q.period==='weekly').map(q=>[q.muscle,q.target,q.xp]),MUSCLES);
 assert.equal(r.level.xp,120);
});
test('adaptive default, median, bounds; ignores today and unfinished',()=>{
 assert.deepEqual(adaptiveTargets({},start),{basic:8,advanced:16,samples:0});
 const days={'2026-11-01':workout(20),'2026-11-02':workout(20),'2026-11-03':workout(100),[start]:workout(100)};
 assert.deepEqual(adaptiveTargets(days,start),{basic:10,advanced:20,samples:3});
});
test('invalid/unchecked sets and unfinished workouts never earn',()=>{
 const d=workout(8);d.exercises[0].logs[0].done=false;d.exercises[0].logs[1].reps=0;
 const r=evaluate({days:{[start]:d}});assert.equal(r.quests[1].progress,6);assert.equal(r.quests[1].status,'active');
 delete d.finished;assert.equal(evaluate({days:{[start]:d}}).level.xp,0);
});
test('arms combine; unknown muscles do not gain weekly credit',()=>{
 const d=workout(3,'Ön kol');d.exercises.push(...workout(2,'Arka kol').exercises,...workout(20,'Unknown').exercises);
 const r=evaluate({days:{[start]:d}});assert.equal(r.quests.find(q=>q.muscle==='Kol').progress,5);assert.equal(r.quests.find(q=>q.muscle==='Göğüs').progress,0);
});
test('all reward pools share 250 cap on actual earning date',()=>{
 const capped=capAll([{key:'a',date:start,pool:'weekly',xp:200},{key:'b',date:start,pool:'daily',xp:70},{key:'c',date:'2026-11-10',pool:'weekly',xp:60}]);
 assert.deepEqual(capped.map(r=>r.xp),[200,50,60]);
 const r=evaluate({days:{'2026-11-10':workout()},today:'2026-11-10',plans:[plan('2026-11-10')]});
 assert.equal(r.rewards.find(r=>r.pool==='weekly').date,'2026-11-10');
});
test('rest requires prior plan and closed day; max three; excludes streak',()=>{
 const dates=['2026-11-09','2026-11-10','2026-11-11','2026-11-12'];
 const args={days:Object.fromEntries(dates.map(d=>[d,{kind:'rest'}])),plans:dates.map(d=>plan(d,'rest')),today:'2026-11-13'};
 const r=evaluate(args);assert.equal(r.level.xp,45);assert.equal(r.streaks.workouts,0);
 assert.equal(evaluate({...args,today:start}).level.xp,0);
 assert.equal(evaluate({...args,plans:args.plans.map(p=>({...p,plannedBeforeDay:false}))}).level.xp,0);
});
test('deleted workout event blocks rest reward',()=>{
 const r=evaluate({today:'2026-11-10',days:{[start]:{kind:'rest'}},plans:[plan(start,'rest')],activityDays:[start]});assert.equal(r.level.xp,0);
});
test('legacy XP badges titles preserved; V5 correction does not touch legacy',()=>{
 const baseline={xp:1234,badges:[{id:'legacy',name:'Eski rozet'}],titles:['Eski unvan']};
 const a=evaluate({baseline}),b=evaluate({baseline,days:{}});
 assert.equal(b.level.xp,1234);assert.ok(b.badges.some(b=>b.id==='legacy'));assert.ok(b.titles.includes('Eski unvan'));
 const diff=ledgerDiff(a.rewards.map(r=>({...r,delta:r.xp})),b.rewards,'2');assert.ok(diff.every(r=>r.key.includes('v5:')&&r.delta<0));
});
test('Türkiye midnight and V5 UI contain no manual action',()=>{
 assert.equal(dayKey('2026-11-09T20:59:59Z'),start);assert.equal(dayKey('2026-11-09T21:00:00Z'),'2026-11-10');
 const html=cardMarkup(evaluate());assert.ok(!html.includes('data-q-goal'));assert.match(html,/Otomatik doğrulama/);
 assert.equal((cardMarkup(evaluate(),'weekly').match(/data-q-id/g)||[]).length,6);
});
