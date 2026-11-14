const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {boot,setRemote,setFail}=require('../sync-harness.cjs');
function app(){setRemote(null);setFail(false);const a=boot();for(const file of ['workout-metrics.js','workout-flex-v2.js'])vm.runInContext(fs.readFileSync(file,'utf8'),a.ctx);a.run("selected=today;state.days={};state.migrations=['shoulder-legs-v2-20261028'];");a.e('assignProgram').value='0';a.run('assignWorkout()');return a;}
const data=(a,expr)=>JSON.parse(a.run('JSON.stringify('+expr+')'));
test('session changes preserve identity, completed RIR, legacy history, and only valid metrics',()=>{
 const a=app();const prior=data(a,'state.programs');
 a.run("updateSet(0,0,'kg',30);updateSet(0,0,'reps',10);state.days[today].exercises[0].logs[0].rir=2;updateSet(0,0,'done',true)");
 const oldId=a.run('state.days[today].exercises[0].id');
 a.e('flexReplacement').value=a.run("String(state.library.findIndex(e=>e.name==='Barbell Bench Press'))");
 a.run('replaceWorkoutExercise(0)');
 assert.equal(a.run('state.days[today].exercises[0].id'),oldId);
 assert.equal(a.run('state.days[today].exercises[0].logs[0].rir'),2);
 assert.equal(a.run('state.days[today].exercises[1].id'),'catalog-v2-0');
 assert.equal(a.run('state.days[today].exercises[1].logs.length'),3);
 assert.equal(a.run('state.days[today].exercises[1].logs[0].kg'),'');
 assert.equal(a.run('totals(state.days[today]).sets'),1);
 assert.equal(a.run('totals(state.days[today]).ext'),600);
 assert.deepEqual(data(a,'state.programs'),prior);
 assert.doesNotThrow(()=>a.run('validateBackup(state)'));
 a.e('flexReplacement').value=a.run("String(state.library.findIndex(e=>e.name==='Chest Press Makine'))");a.run('replaceWorkoutExercise(1)');
 assert.equal(a.run('state.days[today].exercises[1].id'),'catalog-v2-1');
 assert.equal(a.run('totals(state.days[today]).sets'),1);
});
test('manual field clearing, fill toggle, completion, append and serialized recovery',()=>{
 const a=app();a.run("updateSet(0,0,'kg',30);updateSet(0,0,'reps',10);updateSet(0,1,'reps',8);updateSet(0,2,'kg','');updateSet(0,3,'done',true);updateSet(0,0,'kg',35);updateSet(0,0,'reps',12)");
 assert.equal(a.run('state.days[today].exercises[0].logs[1].reps'),8);
 assert.equal(a.run('state.days[today].exercises[0].logs[2].kg'),'');
 assert.equal(a.run('state.days[today].exercises[0].logs[3].kg'),30);
 a.run('toggleWorkoutSmartFill(0);updateSet(0,0,"kg",40)');
 assert.equal(a.run('state.days[today].exercises[0].logs[1].kg'),35);
 a.run('state=JSON.parse(localStorage.getItem(KEY));toggleWorkoutSmartFill(0);updateSet(0,0,"kg",45);adjustWorkoutSets(0,1)');
 assert.equal(a.run('state.days[today].exercises[0].logs[1].kg'),45);
 assert.equal(a.run('state.days[today].exercises[0].logs[2].kg'),'');
 assert.equal(a.run('state.days[today].exercises[0].logs[4].kg'),45);
 assert.equal(a.run('totals(state.days[today]).sets'),1);
});
test('three movement grouping, progress, remove one and unlink preserve set totals',()=>{
 const a=app();a.ctx.document.querySelectorAll=selector=>selector.includes('flexGroup')?[{value:0},{value:1},{value:2}]:[];
 a.run('saveWorkoutSuperset()');const group=a.run('state.days[today].exercises[0].superset');assert(group);
 assert.equal(a.run('state.days[today].exercises.filter(e=>e.superset).length'),3);
 a.run("for(let i=0;i<3;i++){updateSet(i,0,'kg',30);updateSet(i,0,'reps',10);updateSet(i,0,'done',true)}");
 assert.match(a.run('workoutSupersetStatus(state.days[today].exercises[0].superset)'),/1\/4 tamamlandı/);
 a.run('unlinkWorkoutSuperset(1,false)');assert.equal(a.run('state.days[today].exercises.filter(e=>e.superset).length'),2);
 a.run('unlinkWorkoutSuperset(0,true)');assert.equal(a.run('state.days[today].exercises.filter(e=>e.superset).length'),0);assert.equal(a.run('totals(state.days[today]).sets'),3);
});
test('remove keeps completed evidence; add accepts position and targets; empty session can add',()=>{
 const a=app();a.run("updateSet(0,0,'kg',30);updateSet(0,0,'reps',10);updateSet(0,0,'done',true);removeWorkoutExercise(0)");assert.equal(a.run('state.days[today].exercises[0].logs.length'),1);assert.equal(a.run('totals(state.days[today]).sets'),1);
 a.e('flexReplacement').value='0';a.e('flexSets').value='3';a.e('flexReps').value='12';a.e('flexPosition').value='1';a.run('addWorkoutExercise()');assert.equal(a.run('state.days[today].exercises[1].logs.length'),3);assert.equal(a.run('state.days[today].exercises[1].reps'),'12');
 a.run('state.days[today].exercises=[];addWorkoutExercise()');assert.equal(a.run('state.days[today].exercises.length'),1);
});
test('template opt-in, member denial, coach access and no weights or logs copied',()=>{
 const a=app();const before=data(a,'state.programs[0]');
 a.run("updateSet(0,0,'kg',30);updateSet(0,0,'reps',10);updateSet(0,0,'done',true)");a.e('flexReplacement').value='16';a.run('replaceWorkoutExercise(0);state.days[today].finished=Date.now();gymAccount.role="member";applyWorkoutChangesToTemplate()');assert.deepEqual(data(a,'state.programs[0]'),before);
 a.run('gymAccount.role="coach";applyWorkoutChangesToTemplate()');assert.equal(a.run('state.programs[0].version'),2);assert.equal(a.run('state.programs[0].exercises[0].sets'),4);assert.equal(a.run('state.programs[0].exercises[0].logs'),undefined);assert.equal(a.run('state.programs[0].exercises[0].kg'),undefined);assert.deepEqual(data(a,'state.programs[0].history[0].exercises'),before.exercises);
 a.run('applyWorkoutChangesToTemplate()');assert.equal(a.run('state.programs[0].version'),2);
});
test('offline finish is local first; provenance survives cloud round trip and second device',async()=>{
 const a=app();await a.ctx.gymReady;a.run("updateSet(0,0,'kg',30);updateSet(0,0,'reps',10);updateSet(0,1,'reps',8);state.days[today].flexChanged=true;startWorkout()");setFail(true);assert.equal(await a.run('finishWorkout()'),false);assert(a.run('state.days[today].finished'));assert.match(a.e('modalBody').innerHTML,/Yalnızca bugün/);
 setFail(false);assert.equal(await a.run('saveAll({silentSuccess:true})'),true);const b=boot();await b.ctx.gymReady;assert.equal(b.run('state.days[today].exercises[0].logs[1].reps'),8);assert.equal(b.run('state.days[today].exercises[0].logs[2]._flexOrigin.kg'),'auto');
});
