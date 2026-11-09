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
   const password=crypto.randomUUID()+crypto.randomUUID(),email=`quest-v4-${crypto.randomUUID()}@example.invalid`;
   const created=await api('/auth/v1/admin/users','POST',service,{email,password,email_confirm:true,user_metadata:{display_name:'Quest V4 sentetik test'}});
   check(created.status===200||created.status===201,`create fixture ${i}`);
   const id=created.data.id;users.push({id,token:''});
   const profile=await api('/rest/v1/profiles?on_conflict=id','POST',service,{id,display_name:'Quest V4 sentetik test',role:'member'});
   // A project auth trigger may already have created this exact profile.
   check(profile.status===201||profile.status===409,`profile fixture ${i}`);
   const login=await api('/auth/v1/token?grant_type=password','POST',anon,{email,password});
   check(login.status===200&&Boolean(login.data.access_token),`real Auth sign-in ${i}`);users[i].token=login.data.access_token;
   const enroll=await api('/rest/v1/rpc/quest_enroll','POST',anon,{},users[i].token);check(enroll.status===204,`enroll ${i}`);
  }
  const [a,b]=users;
  const refresh=()=>api('/functions/v1/quests-refresh','POST',anon,{userId:b.id,xp:999999},a.token);
  const initial=await refresh();check(initial.status===200,`Edge initial status ${initial.status}`);
  check(initial.data.result.level.xp===0,'forged XP ignored');
  const foreign=await api(`/rest/v1/quest_accounts?user_id=eq.${b.id}`,'GET',anon,undefined,a.token);
  check(foreign.status===200&&foreign.data.length===0,'other member hidden by real PostgREST RLS');
  const direct=await api('/rest/v1/xp_ledger','POST',anon,{user_id:a.id,delta:9999},a.token);
  check(direct.status===403,'direct XP insert rejected');
  const request=crypto.randomUUID();const args={kind:'reflection',quest_key:null,evidence:'Sentetik günlük değerlendirme kaydı.',request_id:request};
  const one=await api('/rest/v1/rpc/quest_record_action','POST',anon,args,a.token);
  const two=await api('/rest/v1/rpc/quest_record_action','POST',anon,args,a.token);
  check(one.status===200&&two.status===200&&one.data===two.data,'real API retry idempotency');
  const results=await Promise.all([refresh(),refresh()]);
  check(results.every(r=>r.status===200&&r.data.result.level.xp===30),'parallel Edge refresh grants exactly 30 XP');
  const ledger=await api(`/rest/v1/xp_ledger?select=delta&user_id=eq.${a.id}`,'GET',anon,undefined,a.token);
  check(ledger.status===200&&ledger.data.reduce((n:number,r:{delta:number})=>n+r.delta,0)===30,'persisted ledger total 30');
  return Response.json({ok:true,passed,fixtureIds:users.map(u=>u.id)});
 }catch(e){return Response.json({ok:false,passed,failed:e instanceof Error?e.message:'test failure',fixtureIds:users.map(u=>u.id)},{status:500});}
 finally{
  for(const user of users){
   if(user.token)await api('/auth/v1/logout?scope=global','POST',anon,{},user.token);
   await api(`/auth/v1/admin/users/${user.id}`,'PUT',service,{ban_duration:'876000h'});
  }
 }
});
