// Run against the separately checked-out V5 rules; never deploy or modify V5 here.
import assert from 'node:assert/strict';import {pathToFileURL} from 'node:url';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),flex=require('../../workout-flex-v2.js');
const {evaluateV5}=await import(pathToFileURL(process.argv[2]).href);const date='2026-11-13';
const e={id:'bench',name:'Bench',muscle:'Göğüs',type:'external',factor:1,logs:Array.from({length:16},(_,i)=>({kg:i? '':30,reps:i?'':10,done:false}))};flex.copyFirst(e);
const evaluate=exercises=>evaluateV5({activation:date,today:date,plans:[{day:date,kind:'workout',targets:{basic:8,advanced:16}}],days:{[date]:{kind:'workout',finished:Date.now(),exercises}}});
assert.equal(evaluate([e]).level.xp,0);e.logs.forEach(s=>s.done=true);const baseline=evaluate([e]);assert.deepEqual(baseline.quests.filter(q=>q.period==='daily').map(q=>q.awardedXp),[30,20,20]);
const linked=structuredClone(e);linked.superset='A';assert.deepEqual(evaluate([linked]),baseline);
e.logs[15].done=false;const changed=flex.change(e,{id:'machine',name:'Machine',muscle:'Göğüs',type:'external',factor:1});const result=evaluate([changed.historical,changed.replacement]);assert.equal(result.quests.filter(q=>q.period==='daily')[2].status,'active');assert.equal(result.quests.find(q=>q.muscle==='Göğüs').progress,4);assert(result.level.xp<=250);
console.log('PASS: V5 30/20/20, 250 cap, unchecked auto fills zero XP, grouping no reward, replacement no double count');
