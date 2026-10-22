const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict'),{webcrypto}=require('node:crypto');
let remote=null,fail=false,rpcCalls=0;
const clone=x=>JSON.parse(JSON.stringify(x));
const client={from(){const q={select(){return q},eq(){return q},async maybeSingle(){return fail?{error:Error('offline')}:{data:clone(remote)}},async single(){return q.maybeSingle()}};return q},async rpc(name,{payload,expected_revision}){rpcCalls++;if(fail)return {error:Error('offline')};if(expected_revision!==(remote?.revision||0))return {error:Error('GYM_CONFLICT: conflict')};remote={state:clone(payload),revision:expected_revision+1};return {data:remote.revision}}};
function boot(storage=new Map()){
 const elements=new Map();const element=id=>{if(!elements.has(id))elements.set(id,{value:'',style:{},hidden:false,open:false,textContent:'',innerHTML:'',classList:{toggle(){}},addEventListener(){},setAttribute(){},removeAttribute(){},querySelector(){return element(id+' child')},querySelectorAll(){return []},closest(){return element('row')},showModal(){this.open=true},close(){this.open=false},click(){}});return elements.get(id)};
 const ctx={console,crypto:webcrypto,Date,Map,Set,JSON,Math,Number,String,Array,Object,RegExp,Error,Promise,Blob,URL,setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,confirm:()=>true,matchMedia:()=>({matches:false}),document:{getElementById:element,querySelector:element,querySelectorAll:()=>[],addEventListener(){},body:{classList:{toggle(){}}},createElement:element},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},sessionStorage:{getItem:()=>null,setItem(){}},gymAccount:{user:{id:'audit-user',email:'audit@example.invalid',user_metadata:{}},role:'admin',client},addEventListener(){},scrollTo(){}};ctx.window=ctx;
 vm.createContext(ctx);for(const f of ['membership.js','motion.js','app.js'])vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'..',f),'utf8'),ctx);return {ctx,storage,e:element,run:s=>vm.runInContext(s,ctx)};
}
(async()=>{
 let a=boot();await a.ctx.gymReady;
 assert.equal(a.run('state.library.length'),40);
 // Upgrade a saved 16-movement account without touching history or custom settings.
 const old=a.run('clone(state)');old.library=old.library.slice(0,16);
 old.library.push({...clone(old.library[0]),id:'custom-bench',name:'Barbell Bench Press',sets:3});
 old.days['2026-10-16']={id:'keep-day',kind:'rest',note:'Keep this record'};
 remote={state:old,revision:7};
 const upgraded=boot();await upgraded.ctx.gymReady;
 assert.equal(upgraded.run('state.library.length'),40);
 assert.equal(upgraded.run('state.library.find(e=>e.id==="custom-bench").sets'),3);
 assert.equal(upgraded.run('JSON.stringify(state.days)'),JSON.stringify(old.days));
 assert.equal(upgraded.run('JSON.stringify(state.programs)'),JSON.stringify(old.programs));
 upgraded.run('render();render()');assert.equal(upgraded.run('state.library.length'),40);
 assert.equal(await upgraded.run('saveAll()'),true);
 const reload=boot();await reload.ctx.gymReady;assert.equal(reload.run('state.library.length'),40);
 remote=null;

 for(const tab of ['calendar','workout','progress','programs','settings'])a.run(`go('${tab}')`);
 a.e('assignProgram').value='0';a.run('assignWorkout()');
 a.run("updateSet(0,0,'kg','30');updateSet(0,0,'reps','8');updateSet(0,0,'rir','2');updateSet(0,0,'done',true)");
 assert.equal(a.run('totals(state.days[selected]).ext'),480);
 a.run("updateSet(0,1,'done',true)");
 assert.equal(a.run('state.days[selected].exercises[0].logs[1].done'),true);
 assert.equal(a.run('state.days[selected].exercises[0].logs[1].kg'),'');
 assert.equal(a.run('totals(state.days[selected]).sets'),2);
 assert.equal(a.run('totals(state.days[selected]).ext'),480);
 assert.ok(a.run('state.days[selected].started'));
 a.run("updateSet(0,1,'reps','');updateSet(0,1,'kg','')");
 assert.equal(a.run('state.days[selected].exercises[0].logs[1].done'),true);

 a.run("state.days[selected].note='test note';state.profile.name='Audit';save()");
 assert.equal(await a.run('saveAll()'),true);assert.equal(remote.state.profile.name,'Audit');assert.equal(a.run('dirty'),false);
 let b=boot();await b.ctx.gymReady;assert.equal(b.run('state.profile.name'),'Audit');assert.equal(b.run('state.days[selected].exercises[0].logs[0].kg'),30);
 a.run("state.profile.goal='new';save()");await a.run('saveAll()');
 b.run("state.profile.goal='stale';save()");assert.equal(await b.run('saveAll()'),false);assert.equal(remote.state.profile.goal,'new');
 fail=true;a.run("state.profile.name='Offline';save()");assert.equal(await a.run('saveAll()'),false);assert.equal(a.run('dirty'),true);
 assert.equal(JSON.parse(a.storage.get('gym-tracker-pro-v1:audit-user')).profile.name,'Offline');fail=false;
 let c=boot(a.storage);await c.ctx.gymReady;assert.equal(c.run('cloudReconcile'),true);const calls=rpcCalls;assert.equal(await c.run('saveAll()'),false);assert.equal(rpcCalls,calls);c.run('mergeBackup()');assert.equal(await c.run('saveAll()'),true);
 c.run("updateSet(0,0,'rir','11')");assert.equal(await c.run('saveAll()'),false);c.run("updateSet(0,0,'rir','1')");
 await c.run('finishWorkout()');assert.ok(c.run('state.days[selected].finished'));
 assert.ok(remote.state.days[c.run('selected')].finished);
 fail=true;c.run("updateSet(0,2,'done',true)");assert.equal(await c.run('finishWorkout()'),false);
 assert.equal(c.run('dirty'),true);fail=false;assert.equal(await c.run('finishWorkout()'),true);
 assert.equal(remote.state.days[c.run('selected')].exercises[0].logs[2].done,true);

 c.run("selectDate('2099-01-01');setRest()");assert.equal(c.run('state.days[selected].kind'),'rest');c.run('removeDay()');assert.equal(c.run('state.days[selected]'),undefined);
 c.run('editProgram(0);moveExercise(0,1);saveProgram();duplicateProgram(0)');for(const t of ['Full Body','Upper','Lower','Push','Pull','Legs'])c.run(`addTemplate('${t}')`);
 c.run("chooseRest(60);startRest();pauseRest();addRestTime();stopRest()");assert.equal(c.run('restTimer.status'),'idle');
 c.e('bodyDate').value='2026-10-18';c.e('bodyKg').value='74';c.run('addBodyweight()');assert.equal(c.run('state.bodyweights[0].kg'),74);
 // Compile every generated inline handler; catch missing function references.
 for(const view of ['calendarView','workoutView','progressView','programsView','settingsView']){
  const html=c.run(`${view}()`);for(const m of html.matchAll(/on(?:click|input|change)="([^"]*)"/g)){new Function('event',m[1]);for(const f of m[1].matchAll(/(?<![.\w])([A-Za-z_$][\w$]*)\(/g)){if(['if'].includes(f[1]))continue;assert.equal(c.run(`typeof ${f[1]}`),'function',f[1]);}}
 }
 const before=c.run('JSON.stringify(state)');
 assert.equal(c.run('GymMotion.names.length'),40);
 assert.equal(c.run('library.every(e=>GymMotion.card(e).includes("exercise-preview"))'),true);
 for(const [name,id] of c.ctx.GymMotion.names){assert.ok(fs.existsSync(require('node:path').join(__dirname,'../assets/exercises',id+'.webp')));c.ctx.GymMotion.open(id);}
 c.ctx.GymMotion.toggle();c.ctx.GymMotion.toggle();c.ctx.GymMotion.refresh();
 assert.equal(c.run('JSON.stringify(state)'),before,'Opening/pausing animations must not mutate workout data');
 assert.ok(!c.ctx.GymMotion.card({name:'Custom unknown move',equipment:'Dambıl'}).includes('exercise-preview'));
 console.log('PASS: navigation, sets/volume, cloud save/readback, second device reload, conflict, offline retry, reconciliation, validation, finish, rest/delete, programs/templates, timer, bodyweight, inline handlers');
})().catch(e=>{console.error(e);process.exit(1)});
