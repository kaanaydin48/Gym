import test from 'node:test';import assert from 'node:assert/strict';
import {evaluateV5,muscleGroup} from '../../quests/engine-v5.mjs';
import {ledgerDiff,capRewards,dayKey,weekKey} from '../../quests/engine.mjs';
import {cardMarkup} from '../../quests/ui.mjs';
const start='2026-11-02';
const workout=(n,finished=true,muscle='Göğüs')=>({kind:'workout',finished:finished?1793642400000:null,exercises:[{muscle,logs:Array.from({length:n},()=>({kg:20,reps:10,done:true}))}]});
const calc=(days={},extra={})=>evaluateV5({activation:start,today:start,days,...extra});
test('completion is 30 XP; 8th and 16th sets award independently before finish',()=>{
 for(const [n,xp] of [[7,0],[8,20],[15,20],[16,40]]){
  const r=calc({[start]:workout(n,false)});assert.equal(r.rewards.filter(r=>r.pool==='daily').reduce((n,r)=>n+r.xp,0),xp);
 }
 assert.equal(calc({[start]:workout(1)}).level.xp,30);
 assert.equal(calc({[start]:workout(16)}).rewards.filter(r=>r.pool==='daily').reduce((n,r)=>n+r.xp,0),70);
});
test('six weekly muscle targets; arm aliases; unknown muscle grants no regional XP',()=>{
 for(const [muscle,n,xp] of [['Göğüs',4,50],['Sırt',4,60],['Omuz',3,50],['Ön kol',5,40],['Bacak',4,70],['Karın',1,30]]){
  const r=calc({[start]:workout(n)});const actual=calc({[start]:workout(n,true,muscle)});
  assert.equal(actual.rewards.find(r=>r.pool==='weekly').xp,xp);
 }
 assert.equal(muscleGroup('Arka kol'),'Kol');assert.equal(muscleGroup('unknown'),null);
});
test('invalid and unchecked sets never contribute; input remains unchanged',()=>{
 const d=workout(8);d.exercises[0].logs[0].done=false;d.exercises[0].logs[1].reps=0;
 const before=JSON.stringify(d);const r=calc({[start]:d});assert.equal(r.quests[1].progress,6);assert.equal(JSON.stringify(d),before);
});
test('rest requires boundary plan and elapsed day; fourth rest and unplanned rest do not award',()=>{
 const dates=['2026-11-02','2026-11-03','2026-11-04','2026-11-05'];
 const days=Object.fromEntries(dates.map(d=>[d,{kind:'rest'}]));const dailyPlans=dates.map(day=>({day,kind:'rest'}));
 assert.equal(calc(days,{today:'2026-11-06',dailyPlans}).level.xp,45);
 assert.equal(calc(days,{today:'2026-11-06'}).level.xp,0);
 assert.equal(calc(days,{dailyPlans}).level.xp,0);
 days[dates[0]]=workout(1);assert.equal(calc(days,{today:'2026-11-06',dailyPlans}).rewards.filter(r=>r.xp===15).length,3);
 delete days[dates[1]];assert.equal(calc(days,{today:'2026-11-06',dailyPlans}).rewards.filter(r=>r.xp===15).length,2);
});
test('reload is idempotent; historical edits reverse rewards and can re-earn',()=>{
 const r=calc({[start]:workout(16)}),existing=r.rewards.map(r=>({...r,delta:r.xp}));
 assert.deepEqual(ledgerDiff(existing,r.rewards,'same'),[]);
 assert.ok(ledgerDiff(existing,calc().rewards,'edit').every(r=>r.delta<0));
});
test('legacy XP/badges survive; earlier workouts do not earn V5 XP',()=>{
 const r=calc({'2026-11-01':workout(16)},{legacyRewards:[{key:'old',date:'2026-11-01',pool:'daily',xp:100}],legacyBadges:[{id:'old',name:'Eski'}]});
 assert.equal(r.level.xp,100);assert.ok(r.badges.some(b=>b.id==='old'));
});
test('daily cap excludes weekly rewards; Istanbul midnight and Monday boundaries',()=>{
 assert.deepEqual(capRewards([{key:'a',date:start,pool:'daily',xp:240},{key:'b',date:start,pool:'daily',xp:40},{key:'c',date:start,pool:'weekly',xp:70}]).map(r=>r.xp),[240,10,70]);
 assert.equal(dayKey('2026-11-01T21:00:00Z'),start);assert.equal(weekKey('2026-11-08'),start);
 const r=calc({[start]:workout(16)},{today:'2026-11-09'});assert.ok(r.quests.filter(q=>q.start==='2026-11-09').every(q=>q.progress===0));
});
test('rest never contributes to streak; personal goals are automatic and grant no extra XP',()=>{
 const r=calc({[start]:workout(4)},{dailyPlans:[{day:start,goal:{kind:'sets',title:'Dört set',target:4}}]});
 assert.equal(r.quests.find(q=>q.slot===15).status,'complete');assert.equal(r.level.xp,80);
 assert.equal(calc({[start]:{kind:'rest'}},{today:'2026-11-09',dailyPlans:[{day:start,kind:'rest'}]}).streaks.quests,0);
});
test('cards expose progress with no evidence or manual approval',()=>{
 const html=cardMarkup(calc({[start]:workout(8)}));
 assert.ok(html.includes('✓'));assert.doesNotMatch(html,/textarea|Doğrulamaya gönder|kanıt/);assert.match(html,/Kişisel hedef/);
});
