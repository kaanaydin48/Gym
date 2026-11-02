const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict'),{webcrypto}=require('node:crypto');
let remote=null,fail=false,rpcCalls=0;
const clone=x=>JSON.parse(JSON.stringify(x));
const client={from(){const q={select(){return q},eq(){return q},async maybeSingle(){return fail?{error:Error('offline')}:{data:clone(remote)}},async single(){return q.maybeSingle()}};return q},async rpc(name,{payload,expected_revision}){rpcCalls++;if(fail)return {error:Error('offline')};if(expected_revision!==(remote?.revision||0))return {error:Error('GYM_CONFLICT: conflict')};remote={state:clone(payload),revision:expected_revision+1};return {data:remote.revision}}};
function boot(storage=new Map()){
 const elements=new Map();const element=id=>{if(!elements.has(id))elements.set(id,{value:'',style:{},hidden:false,open:false,textContent:'',innerHTML:'',classList:{toggle(){},remove(){},add(){}},addEventListener(){},setAttribute(){},removeAttribute(){},querySelector(){return element(id+' child')},querySelectorAll(){return []},closest(){return element('row')},showModal(){this.open=true},close(){this.open=false},click(){}});return elements.get(id)};
 const ctx={console,crypto:webcrypto,Date,Map,Set,JSON,Math,Number,String,Array,Object,RegExp,Error,Promise,Blob,URL,setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,confirm:()=>true,matchMedia:()=>({matches:false}),document:{getElementById:element,querySelector:element,querySelectorAll:()=>[],addEventListener(){},body:{classList:{toggle(){},remove(){},add(){}}},createElement:element},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},sessionStorage:{getItem:()=>null,setItem(){}},gymAccount:{user:{id:'audit-user',email:'audit@example.invalid',user_metadata:{}},role:'admin',client},addEventListener(){},scrollTo(){}};ctx.window=ctx;
 vm.createContext(ctx);for(const f of ['membership.js','motion.js','app.js'])vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'..',f),'utf8'),ctx);return {ctx,storage,e:element,run:s=>vm.runInContext(s,ctx)};
}

(async()=>{
 const a=boot();await a.ctx.gymReady;
 const oldPrograms=a.run('JSON.stringify(state.programs)');
 a.run("state.days['2020-01-01']={id:'past',kind:'rest',note:'keep'};gymAccount.role='member';coachProgramLoaded=true");
 assert.equal(a.run('selectablePrograms().length'),1);
 let html=a.run('programsView()');assert.match(html,/Başlangıç – Full Body/);assert.doesNotMatch(html,/Hazır şablonlar|Hareket kütüphanesi|Düzenle|Göğüs \+ Arka Kol/);
 a.e('assignProgram').value='0';a.run('assignWorkout()');assert.equal(a.run('state.days[selected]'),undefined);
 a.run('editProgram(0);duplicateProgram(0);addTemplate("Pull");customExercise();saveProgram()');assert.equal(a.run('draft'),null);assert.equal(a.run('JSON.stringify(state.programs)'),oldPrograms);
 a.e('assignProgram').value='beginner';a.run('assignWorkout()');
 assert.equal(a.run('state.days[selected].exercises.length'),8);assert(a.run('state.days[selected].exercises.every(e=>e.logs.length===2)'));
 assert.equal(a.run('state.days[selected].programNote'),a.run('beginnerProgram.note'));
 html=a.run('workoutView()');assert(html.indexOf('Uygulama ve İlerleme')<html.indexOf('Leg Press'));assert.match(html,/SÜRE \(sn\)/);
 a.run("startWorkout();updateSet(7,0,'reps','25');updateSet(7,0,'done',true)");assert.equal(a.run('state.days[selected].exercises[7].logs[0].reps'),25);assert.equal(a.run('totals(state.days[selected]).body'),0);
 const day=a.run('JSON.stringify(state.days[selected])');
 a.run("coachAssignedProgram={...clone(state.programs[0]),id:'coach-assigned',name:'Özel Program'}");
 assert.equal(a.run('selectablePrograms().length'),2);html=a.run('programsView()');assert.match(html,/Başlangıç – Full Body/);assert.match(html,/Özel Program/);
 a.run("selectDate('2099-02-01')");a.e('assignProgram').value='coach';a.run('assignWorkout()');assert.equal(a.run('state.days[selected].name'),'Özel Program');
 a.run('coachAssignedProgram=null');assert.equal(a.run('selectablePrograms().length'),1);assert.equal(a.run('state.days["2020-01-01"].note'),'keep');assert.equal(a.run('JSON.stringify(state.programs)'),oldPrograms);
 a.run('showBeginnerProgram()');html=a.e('modalBody').innerHTML;assert.match(html,/İlk 2 hafta/);assert.match(html,/60–90/);
 for(const view of ['calendarView','workoutView','programsView'])for(const m of a.run(`${view}()`).matchAll(/on(?:click|input|change)="([^"]*)"/g))new Function('event',m[1].replaceAll('&quot;','"'));
 assert.equal(await a.run('saveAll()'),true);const b=boot();await b.ctx.gymReady;assert.equal(b.run('state.days["2020-01-01"].note'),'keep');assert.equal(b.run('state.days["2099-02-01"].name'),'Özel Program');
 b.run("gymAccount.role='admin';editProgram(0)");assert(b.run('draft'));assert.match(b.run('programsView()'),/Düzenle/);
 console.log('PASS: starter persists with and without assignment; member filtering and edit guards; notes and 8x2 sets; plank seconds; cloud round-trip; history and admin editing preserved');
})().catch(e=>{console.error(e);process.exitCode=1});
