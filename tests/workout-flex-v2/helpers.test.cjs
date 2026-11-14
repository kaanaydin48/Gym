const test=require('node:test');const assert=require('node:assert/strict');
const f=require('../../workout-flex-v2.js');
test('replacement preserves completed historical sets and clears pending weight',()=>{
 const e={name:'Dumbbell Bench',reps:'8-12',logs:[{kg:30,reps:10,done:true,rir:2},{kg:30,reps:10,done:false}]};
 const x=f.change(e,{name:'Barbell Bench',sets:4});
 assert.equal(x.historical.logs[0].rir,2);assert.equal(x.replacement.logs[0].kg,'');
 assert.equal(x.replacement.logs[0].reps,10);assert.equal(x.replacement.name,'Barbell Bench');
});
test('added set is blank and existing set values are preserved',()=>{
 const e={smartFill:true,logs:[{kg:70,reps:7,rir:2,done:true}]};const before={...e.logs[0]};f.append(e);
 assert.deepEqual(e.logs[0],before);assert.deepEqual(e.logs[1],{kg:'',reps:'',rir:'',done:false});
});
