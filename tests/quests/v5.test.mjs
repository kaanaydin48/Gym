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

test('15 November activation shows incomplete daily/weekly tasks and preserves level 4 progress',()=>{
 const r=calc({'2026-11-14':workout(16),'2026-11-15':{kind:'rest'}},{activation:'2026-11-15',today:'2026-11-15',dailyPlans:[{day:'2026-11-15',kind:'rest'}],legacyRewards:[{key:'old',date:'2026-11-14',pool:'daily',xp:975}]});
 assert.equal(r.level.xp,975);assert.equal(r.level.level,4);assert.equal(r.level.xp-r.level.floor,225);
 assert.equal(r.quests.filter(q=>q.period==='daily').length,4);assert.equal(r.quests.filter(q=>q.period==='weekly').length,6);
 assert.match(cardMarkup(r),/Dinlenme Günü/);assert.doesNotMatch(cardMarkup(r),/tarihinde başlayacak|hazırlanıyor/);
 assert.match(cardMarkup({pending:true}),/Görevler yükleniyor/);
});
test('15 November rest settles after midnight, without replaying earlier workouts',()=>{
 const options={activation:'2026-11-15',today:'2026-11-16',dailyPlans:[{day:'2026-11-15',kind:'rest'}],legacyRewards:[{key:'old',date:'2026-11-14',pool:'daily',xp:975}]};
 const days={'2026-11-14':workout(16),'2026-11-15':{kind:'rest'}};
 assert.equal(calc(days,options).level.xp,990);
 assert.equal(calc(days,{...options,workedDays:['2026-11-15']}).level.xp,975);
 assert.equal(calc(days,{...options,excludedRewardDays:['2026-11-15']}).level.xp,975);
});
test('cutover days already rewarded by V4 cannot earn daily or weekly V5 rewards',()=>{
 const r=calc({'2026-11-15':workout(16)},{activation:'2026-11-15',today:'2026-11-16',excludedRewardDays:['2026-11-15'],legacyRewards:[{key:'old',date:'2026-11-15',pool:'daily',xp:100}]});
 assert.equal(r.level.xp,100);assert.ok(r.quests.every(q=>q.progress===0));
});
test('global 250 cap includes weekly awards on completion day and immutable legacy XP',()=>{
 const d=workout(16);d.exercises=[['Göğüs',4],['Sırt',4],['Omuz',3],['Kol',5],['Bacak',4],['Karın',1]].map(([g,n])=>workout(n,true,g).exercises[0]);
 const r=calc({[start]:d});assert.equal(r.level.xp,250);
 assert.equal(r.rewards.reduce((n,x)=>n+x.xp,0),250);assert.ok(r.quests.some(q=>q.awardedXp<q.xp));
 const old={key:'old',date:start,pool:'weekly',xp:240};const capped=calc({[start]:d},{legacyRewards:[old]});assert.equal(capped.level.xp,250);assert.deepEqual(capped.rewards[0],old);
 const later=calc({'2026-11-03':workout(4)},{today:'2026-11-03'});assert.equal(later.rewards.find(r=>r.pool==='weekly').date,'2026-11-03');
});
test('first set updates both progress counters without completion reward',()=>{
 const r=calc({[start]:workout(1,false)});assert.equal(r.quests[1].progress,1);assert.equal(r.quests.find(q=>q.period==='weekly').progress,1);assert.equal(r.level.xp,0);
});
