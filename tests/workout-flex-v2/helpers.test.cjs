const test=require('node:test');const assert=require('node:assert/strict');
const f=require('../../workout-flex-v2.js');
test('first set fills empty remaining rows, not done rows',()=>{
 const e={logs:[{kg:60,reps:10,done:true},{kg:'',reps:'',done:false},{kg:40,reps:8,done:true}]};
 f.copyFirst(e);assert.deepEqual([e.logs[1].kg,e.logs[1].reps],[60,10]);assert.equal(e.logs[2].kg,40);
});
test('manual override persists when first set changes',()=>{
 const e={logs:[{kg:50,reps:8},{kg:'',reps:''},{kg:'',reps:''}]};
 f.copyFirst(e);f.edit(e,1,'kg',45);f.edit(e,0,'kg',55);
 assert.equal(e.logs[1].kg,45);assert.equal(e.logs[2].kg,55);
});
test('clearing first set removes auto values only',()=>{
 const e={logs:[{kg:50,reps:8},{kg:'',reps:''}]};f.copyFirst(e);f.edit(e,0,'kg','');
 assert.equal(e.logs[1].kg,'');assert.equal(e.logs[1].reps,8);
});
test('replacement preserves completed historical sets and clears pending weight',()=>{
 const e={name:'Dumbbell Bench',reps:'8-12',logs:[{kg:30,reps:10,done:true,rir:2},{kg:30,reps:10,done:false}]};
 const x=f.change(e,{name:'Barbell Bench',sets:4});
 assert.equal(x.historical.logs[0].rir,2);assert.equal(x.replacement.logs[0].kg,'');
 assert.equal(x.replacement.logs[0].reps,10);assert.equal(x.replacement.name,'Barbell Bench');
});
test('added set inherits first row and provenance survives serialization',()=>{
 const e={logs:[{kg:70,reps:7,done:true}]};f.append(e);
 const copy=JSON.parse(JSON.stringify(e));f.edit(copy,0,'reps',8);assert.equal(copy.logs[1].reps,8);
});
