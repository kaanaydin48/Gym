import test from 'node:test';import assert from 'node:assert/strict';import {createRequire} from 'node:module';
import {workoutMetrics,performanceComparisons} from '../../quests/engine.mjs';
const require=createRequire(import.meta.url);const {boot}=require('../sync-harness.cjs');
test('edited Dips and dumbbells share valid set/volume totals across graph, summary and quest engine',()=>{
 const app=boot();app.ctx.GymWorkoutMetrics=globalThis.GymWorkoutMetrics;
 const day={kind:'workout',name:'Test',finished:Date.now(),exercises:[
 {id:'dips',name:'Dips',muscle:'Arka kol',type:'body',factor:1,logs:[{kg:0,reps:10,done:true}]},
 {id:'bench',name:'Bench',muscle:'Göğüs',type:'external',factor:2,logs:[{kg:35,reps:3,done:true},{kg:-10,reps:5,done:true}]}]};
 app.ctx.fixture=day;
 assert.equal(app.run('growthFlowData([[today,fixture]]).volume'),210);
 day.exercises[0].logs[0].kg=70;
 const m=workoutMetrics(day),flow=app.run('growthFlowData([[today,fixture]])'),totals=app.run('totals(fixture)');
 assert.equal(flow.volume,910);assert.equal(flow.movements.find(e=>e.name==='Dips').max,70);
 assert.equal(flow.volume,m.externalVolume+m.bodyVolume);assert.equal(flow.sets,m.sets);
 assert.equal(totals.ext+totals.body,flow.volume);
 const date='2026-11-04';assert.equal(performanceComparisons({[date]:day},date).week.current.volume,910);
 app.run("state.days[today]=fixture;selected=today;renderDailySummaryModal()");
 assert.match(app.e('dailySummaryOverlay').innerHTML,/910 kg/);
 day.exercises[0].logs[0].done=false;
 assert.equal(app.run('growthFlowData([[today,fixture]]).volume'),210);
});
