// Temporary test-only harness. Deployment injects a random authorization token and
// a ten-minute expiry; the endpoint is retired after invocation. No emails sent.
const TOKEN='__EPHEMERAL_TOKEN__';
const EXPIRES=Number('__EXPIRY__');
if(!Number.isFinite(EXPIRES)||!/^([a-f0-9]{64})$/.test(TOKEN))throw Error('Harness requires short-lived deployment credentials');
const base=Deno.env.get('SUPABASE_URL');
if(base!=='https://sucoijqzhfifwmwrprww.supabase.co')throw Error('Test project only');
const service=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const anon=Deno.env.get('SUPABASE_ANON_KEY')!;
Deno.serve(async req=>{
 if(req.method!=='POST'||Date.now()>EXPIRES||req.headers.get('Authorization')!==`Bearer ${TOKEN}`)return new Response(null,{status:403});
 const passed:string[]=[],users:{id:string;token:string}[]=[];
 const check=(ok:boolean,label:string)=>{if(!ok)throw Error(label);passed.push(label);};
 async function api(path:string,method:string,key:string,body?:unknown,token=key){
  const r=await fetch(base+path,{method,headers:{apikey:key,Authorization:`Bearer ${token}`,'Content-Type':'application/json'},...(body!==undefined?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(25000)});
  const text=await r.text();let data;try{data=JSON.parse(text)}catch{data=null}return {status:r.status,data};
 }
 try{
  for(let i=0;i<2;i++){
   const password=crypto.randomUUID()+crypto.randomUUID(),email=`quest-v5-${crypto.randomUUID()}@example.invalid`;
   const created=await api('/auth/v1/admin/users','POST',service,{email,password,email_confirm:true,user_metadata:{display_name:'Quest V5 sentetik test'}});
   check(created.status===200||created.status===201,`create fixture ${i}`);
   const id=created.data.id;users.push({id,token:''});
   const profile=await api('/rest/v1/profiles?on_conflict=id','POST',service,{id,display_name:'Quest V5 sentetik test',role:'member'});
   // A project auth trigger may already have created this exact profile.
   check(profile.status===201||profile.status===409,`profile fixture ${i}`);
   const login=await api('/auth/v1/token?grant_type=password','POST',anon,{email,password});
   check(login.status===200&&Boolean(login.data.access_token),`real Auth sign-in ${i}`);users[i].token=login.data.access_token;
   const enroll=await api('/rest/v1/rpc/quest_enroll','POST',anon,{},users[i].token);check(enroll.status===204,`enroll ${i}`);
  }
  const [a,b]=users;
  const refresh=()=>api('/functions/v1/quests-refresh','POST',anon,{userId:b.id,xp:999999},a.token);
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Istanbul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const configured=await api(`/rest/v1/quest_accounts?user_id=eq.${a.id}`,'PATCH',service,{v5_start:today,activation:today});
  check(configured.status===204,'activate V5 for synthetic account only');
  const legacy=await api('/rest/v1/xp_ledger','POST',service,{user_id:a.id,reward_key:'synthetic-legacy',effective_date:today,pool:'daily',delta:300,generation:0,operation_key:'synthetic-legacy',reason:'test fixture'});
  check(legacy.status===201,'seed synthetic legacy XP');
  const initial=await refresh();check(initial.status===200,`Edge initial status ${initial.status}`);
  check(initial.data.result.ruleVersion===5&&initial.data.result.level.xp===300,'forged XP ignored; legacy preserved');
  const foreign=await api(`/rest/v1/quest_accounts?user_id=eq.${b.id}`,'GET',anon,undefined,a.token);
  check(foreign.status===200&&foreign.data.length===0,'other member hidden by real PostgREST RLS');
  const direct=await api('/rest/v1/xp_ledger','POST',anon,{user_id:a.id,delta:9999},a.token);
  check(direct.status===403,'direct XP insert rejected');
  const manual=await api('/rest/v1/rpc/quest_record_action','POST',anon,{kind:'reflection',quest_key:null,evidence:'Sentetik değerlendirme',request_id:crypto.randomUUID()},a.token);
  check(manual.status>=400,'manual action rejected');
  const workout={kind:'workout',finished:Date.now(),exercises:[{id:'chest',name:'Chest',muscle:'Göğüs',type:'external',logs:Array.from({length:16},()=>({done:true,kg:20,reps:10,rir:2}))}]};
  const coach=await api(`/rest/v1/profiles?id=eq.${b.id}`,'PATCH',service,{role:'coach'});
  check(coach.status===204,'synthetic coach role');
  await api(`/rest/v1/profiles?id=eq.${a.id}`,'PATCH',service,{coach_id:b.id});
  const programId=crypto.randomUUID(),assignmentId=crypto.randomUUID();
  Object.assign(workout,{programId,assignmentId,name:'V5 synthetic program',version:1});
  Object.assign(workout.exercises[0],{sets:16,equipment:'Makine',reps:'8–12',superset:'',rir:2,rest:90,factor:1});
  const {logs:_,...exercise}=workout.exercises[0];
  const program=await api('/rest/v1/programs','POST',service,{id:programId,coach_id:b.id,title:'V5 synthetic program',version:1,exercises:[exercise]});
  check(program.status===201,`synthetic assigned program ${program.status}: ${JSON.stringify(program.data)}`);
  const assigned=await api('/rest/v1/assignments','POST',service,{id:assignmentId,coach_id:b.id,member_id:a.id,program_id:programId});
  check(assigned.status===201,'synthetic assignment');
  const payload={schema:'gym-tracker-pro',programs:[],library:[],days:{[today]:workout}};
  const save=await api('/rest/v1/rpc/save_gym_state','POST',anon,{payload,expected_revision:0},a.token);
  check(save.status===200,`save workout ${save.status}: ${JSON.stringify(save.data)}`);
  const results=await Promise.all([refresh(),refresh()]);
  check(results.every(r=>r.status===200&&r.data.result.level.xp===420),'parallel Edge refresh grants exactly 120 new XP');
  check(results[0].data.result.quests.filter((q:{period:string})=>q.period==='weekly').length===6,'six weekly quests persisted');
  const before=await api(`/rest/v1/xp_ledger?select=delta&user_id=eq.${a.id}`,'GET',anon,undefined,a.token);
  check(before.status===200&&before.data.reduce((n:number,r:{delta:number})=>n+r.delta,0)===420,'persisted ledger total 420');
  workout.exercises[0].logs.forEach(s=>s.done=false);
  const edit=await api('/rest/v1/rpc/save_gym_state','POST',anon,{payload,expected_revision:save.data},a.token);
  check(edit.status===200,'edit workout through real API');
  const corrected=await refresh();check(corrected.status===200&&corrected.data.result.level.xp===300,'correction preserves legacy 300 XP');
  const old=await api(`/rest/v1/xp_ledger?reward_key=eq.synthetic-legacy&user_id=eq.${a.id}`,'GET',anon,undefined,a.token);
  check(old.status===200&&old.data.length===1&&old.data[0].delta===300,'legacy ledger row unchanged');
  const hidden=await api(`/rest/v1/quest_v5_day_plans?user_id=eq.${a.id}`,'GET',anon,undefined,b.token);
  check(hidden.status===200&&hidden.data.length===0,'adaptive targets isolated');
  return Response.json({ok:true,passed,fixtureIds:users.map(u=>u.id)});
 }catch(e){return Response.json({ok:false,passed,failed:e instanceof Error?e.message:'test failure',fixtureIds:users.map(u=>u.id)},{status:500});}
 finally{
  for(const user of users){
   if(user.token)await api('/auth/v1/logout?scope=global','POST',anon,{},user.token);
   await api(`/auth/v1/admin/users/${user.id}`,'PUT',service,{ban_duration:'876000h'});
  }
 }
});

