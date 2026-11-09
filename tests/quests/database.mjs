import EmbeddedPostgres from 'embedded-postgres';
import pg from 'pg';
import {mkdtemp,readFile,readdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createServer} from 'node:net';
import {createServer as httpServer} from 'node:http';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
import {processAccount} from '../../quests/worker.mjs';
import {assertLocalDatabase} from '../../quests/isolation.mjs';
import {addDays} from '../../quests/engine.mjs';
import {runTick} from '../../quests/scheduler.mjs';
pg.types.setTypeParser(1082,x=>x);
const dir=await mkdtemp(join(tmpdir(),'gym-quests-pg-'));
const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));
const port=server.address().port;await new Promise(r=>server.close(r));
const config=assertLocalDatabase({host:'127.0.0.1',port,user:'postgres',password:'local-test-only',database:'gym_quests_test'});
const db=new EmbeddedPostgres({databaseDir:dir,user:config.user,password:config.password,port,persistent:false,postgresFlags:['-h','127.0.0.1','-k',''],onLog:m=>{if(/FATAL/.test(m))console.error(m)},onError:console.error});
const clients=[];let count=0;
const ids={member:'10000000-0000-4000-8000-000000000001',other:'10000000-0000-4000-8000-000000000002',coach:'10000000-0000-4000-8000-000000000003',outsider:'10000000-0000-4000-8000-000000000004'};
async function client(role,user){const c=new pg.Client(config);await c.connect();clients.push(c);if(role)await c.query(`set role ${role}`);if(user)await c.query("select set_config('request.jwt.claim.sub',$1,false)",[user]);return c;}
const check=(name,fn)=>fn().then(()=>{count++;console.log('PASS '+name);});
try{
 await db.initialise();await db.start();await db.createDatabase(config.database);
 const admin=await client();
 await admin.query(`
 create role anon nologin;create role authenticated nologin;create role service_role nologin bypassrls;
 create schema auth;grant usage on schema auth to authenticated,service_role;
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 create table public.profiles(id uuid primary key,display_name text default '',role text not null,coach_id uuid references public.profiles(id));
 alter table public.profiles enable row level security;grant select on public.profiles to authenticated;
 create policy own_profile on public.profiles for select to authenticated using(id=auth.uid());
 create table public.programs(id uuid primary key);create table public.assignments(id uuid primary key);
 create table public.workout_logs(id uuid primary key default gen_random_uuid(),member_id uuid references public.profiles(id),workout_date date,sets jsonb,notes text,updated_at timestamptz default now());
 alter table public.workout_logs enable row level security;
 create policy own_logs on public.workout_logs for all to authenticated using(member_id=auth.uid()) with check(member_id=auth.uid());
 grant select,insert,update,delete on public.workout_logs to authenticated;
 create table public.coach_program_assignments(member_id uuid primary key,coach_id uuid,program jsonb);
 grant all on public.coach_program_assignments to authenticated;
 `);
 await admin.query(await readFile('supabase/cloud-sync.sql','utf8'));
 await admin.query('grant select on public.gym_account_state to service_role');
 const files=(await readdir('supabase/migrations')).filter(f=>f.endsWith('_quests_v4_foundation.sql'));
 assert.equal(files.length,1);await admin.query(await readFile('supabase/migrations/'+files[0],'utf8'));
 await admin.query("insert into profiles(id,role) values($1,'coach'),($2,'coach')",[ids.coach,ids.outsider]);
 await admin.query("insert into profiles(id,role,coach_id) values($1,'member',$3),($2,'member',$4)",[ids.member,ids.other,ids.coach,ids.outsider]);
 const member=await client('authenticated',ids.member),other=await client('authenticated',ids.other),coach=await client('authenticated',ids.coach),outsider=await client('authenticated',ids.outsider),anon=await client('anon'),worker1=await client('service_role'),worker2=await client('service_role');
 const today=(await admin.query("select (now() at time zone 'Europe/Istanbul')::date::text as day")).rows[0].day;
 const snapshot={schema:'gym-tracker-pro',days:{[today]:{kind:'workout',programId:'pull',finished:Date.now(),exercises:[{id:'row',name:'Row',type:'external',factor:1,logs:[{kg:20,reps:10,rir:2,done:true}]}]}}};
 await member.query('select save_gym_state($1,0)',[snapshot]);
 await member.query('select quest_enroll()');await other.query('select quest_enroll()');
 await check('migration applies; real PostgreSQL version 17',async()=>assert.match((await admin.query('select version()')).rows[0].version,/PostgreSQL 17/));
 await check('anonymous RPC blocked; member cannot directly grant or rewrite XP',async()=>{
  await assert.rejects(anon.query('select quest_enroll()'),/permission denied/);
  await assert.rejects(member.query("insert into xp_ledger(user_id,reward_key,effective_date,pool,delta,generation,operation_key,reason) values($1,'fake',current_date,'daily',100,1,'fake','fake')",[ids.member]),/permission denied/);
  await assert.rejects(member.query("update quest_accounts set result='{}' where user_id=$1",[ids.member]),/permission denied/);
 });
 await check('two concurrent worker sessions serialize; no duplicate XP',async()=>{
  const [a,b]=await Promise.all([processAccount(worker1,ids.member),processAccount(worker2,ids.member)]);
  assert.equal(a.level.xp,510);assert.equal(b.level.xp,510);
  assert.equal(+(await admin.query('select sum(delta) n from xp_ledger')).rows[0].n,510);
  assert.equal(+(await admin.query('select count(*) n from xp_ledger')).rows[0].n,4);
 });
 await check('same event retries idempotently and preserves persisted workout',async()=>{
  await processAccount(worker1,ids.member);
  assert.equal(+(await admin.query('select count(*) n from xp_ledger')).rows[0].n,4);
  assert.deepEqual((await member.query('select state from gym_account_state')).rows[0].state,snapshot);
 });
 await check('RLS owner/assigned coach/other coach boundaries',async()=>{
  assert.equal((await member.query('select * from user_quests')).rowCount,7);
  assert.equal((await other.query('select * from user_quests')).rowCount,0);
  assert.equal((await coach.query('select * from user_quests')).rowCount,7);
  assert.equal((await outsider.query('select * from user_quests')).rowCount,0);
  assert.equal((await coach.query('select * from xp_ledger')).rowCount,0);
 });
 await check('historical edit reverses via append-only delta; original rows survive',async()=>{
  snapshot.days[today].exercises[0].logs[0].done=false;
  await member.query('select save_gym_state($1,1)',[snapshot]);
  const r=await processAccount(worker1,ids.member);assert.equal(r.level.xp,0);
  const rows=(await admin.query('select delta from xp_ledger order by id')).rows;
  assert.deepEqual(rows.map(r=>r.delta),[100,40,250,120,-100,-40,-250,-120]);
  await assert.rejects(worker1.query('delete from xp_ledger'),/Append-only/);
 });
 await check('re-earning after correction and stale workout revision rejection',async()=>{
  snapshot.days[today].exercises[0].logs[0].done=true;
  await assert.rejects(member.query('select save_gym_state($1,1)',[snapshot]),/GYM_CONFLICT/);
  await member.query('select save_gym_state($1,2)',[snapshot]);
  assert.equal((await processAccount(worker1,ids.member)).level.xp,510);
 });
 await check('manual action receipt idempotency; evidence required',async()=>{
  const args=['reflection',null,'Bugünkü antrenmanı ve toparlanmayı değerlendirdim.','20000000-0000-4000-8000-000000000001'];
  const a=await member.query('select quest_record_action($1,$2,$3,$4)',args);
  const b=await member.query('select quest_record_action($1,$2,$3,$4)',args);
  assert.deepEqual(a.rows,b.rows);
  await assert.rejects(member.query("select quest_record_action('reflection',null,'x',gen_random_uuid())"),/8–2000/);
  assert.equal((await processAccount(worker1,ids.member)).level.xp,540);
 });
 await check('coach edit scoped, cannot alter completed goal or raise XP',async()=>{
  const key=`weekly:${(await admin.query("select date_trunc('week',now() at time zone 'Europe/Istanbul')::date::text as w")).rows[0].w}:4`;
  await assert.rejects(outsider.query('select quest_edit($1,$2,$3,2,0)',[ids.member,key,'Planı iki gün kontrol et']),/Forbidden/);
  assert.equal((await coach.query('select quest_edit($1,$2,$3,2,0)',[ids.member,key,'Planı iki gün kontrol et'])).rows[0].quest_edit,1);
  await assert.rejects(coach.query('select quest_edit($1,$2,$3,2,0)',[ids.member,key,'Planı iki gün kontrol et']),/QUEST_CONFLICT/);
  const r=await processAccount(worker1,ids.member);assert.equal(r.quests.find(q=>q.id===key).target,2);
 });
 await check('celebration receipt consumed once across sessions',async()=>{
  assert.equal((await member.query("select quest_acknowledge('badge:first')")).rows[0].quest_acknowledge,true);
  assert.equal((await member.query("select quest_acknowledge('badge:first')")).rows[0].quest_acknowledge,false);
  await assert.rejects(member.query("select quest_acknowledge('badge:legend')"),/not earned/);
 });
 await check('unneeded TRUNCATE privilege removed',async()=>{
  const rows=(await admin.query("select has_table_privilege('authenticated','gym_account_state','TRUNCATE') a,has_table_privilege('anon','gym_account_state','TRUNCATE') b,has_table_privilege('authenticated','coach_program_assignments','TRUNCATE') c")).rows[0];
  assert.deepEqual(rows,{a:false,b:false,c:false});
 });
 await check('coach directory exposes only assigned members; overrides readable by assigned coach',async()=>{
  assert.deepEqual((await coach.query('select id from profiles where id<>$1',[ids.coach])).rows.map(r=>r.id),[ids.member]);
  assert.equal((await coach.query('select * from quest_overrides')).rowCount,1);
 });
 await check('manual assignment, evidence, authorized approval and revocation',async()=>{
  await processAccount(worker1,ids.other);const key=`daily:${today}:3`;
  await outsider.query('select quest_assign_manual($1,$2,$3,0)',[ids.other,key,'Teknik videosunu değerlendir']);
  await processAccount(worker1,ids.other);
  const id=(await other.query("select quest_record_action('submission',$1,'Teknik kaydını koçuma sundum.',gen_random_uuid()) as id",[key])).rows[0].id;
  await assert.rejects(other.query("select quest_approve($1,true,'Kendim onay verdim.',gen_random_uuid())",[id]),/Forbidden/);
  await assert.rejects(coach.query("select quest_approve($1,true,'Başka koç onay verdi.',gen_random_uuid())",[id]),/Forbidden/);
  await outsider.query("select quest_approve($1,true,'Tekniği kontrol ettim.',gen_random_uuid())",[id]);
  assert.equal((await processAccount(worker1,ids.other)).level.xp,30);
  await outsider.query("select quest_approve($1,false,'Hatalı önceki onayı geri aldım.',gen_random_uuid())",[id]);
  const revoked=await processAccount(worker1,ids.other);assert.equal(revoked.level.xp,0);
  assert.deepEqual(revoked.verifications.filter(v=>v.kind==='approval').map(v=>v.approved),[true,false]);
  assert.equal(revoked.verifications.find(v=>v.kind==='submission').evidence,'Teknik kaydını koçuma sundum.');
  await assert.rejects(outsider.query('select quest_assign_manual($1,$2,$3,1)',[ids.other,key,'Başka bir görev']),/Doğrulaması/);
 });
 await check('personal goals are prospective and cannot overwrite current rewards',async()=>{
  const effective=(await member.query("select quest_personal_goal('weekly','sets','Planlı set hedefim',10) as day")).rows[0].day;
  assert.ok(effective>today);assert.equal((await member.query('select * from quest_personal_goals')).rowCount,1);
  assert.equal((await other.query('select * from quest_personal_goals')).rowCount,0);
 });
 await check('workout correction retains before/after audit; user cannot rewrite it',async()=>{
  const rows=(await member.query('select * from quest_source_events order by id')).rows;
  assert.equal(rows.length,2);assert.equal(rows[0].before_day.exercises[0].logs[0].done,true);assert.equal(rows[0].after_day.exercises[0].logs[0].done,false);
  await assert.rejects(member.query('delete from quest_source_events'),/permission denied/);
 });
 await check('unearned title rejected; earned title can be selected',async()=>{
  assert.equal((await member.query("select quest_select_title('İlk Adım')")).rows[0].quest_select_title,'İlk Adım');
  await assert.rejects(member.query("select quest_select_title('Efsane')"),/not earned/);
 });
 await check('worker failure rolls back XP but never loses the already saved workout',async()=>{
  const prior=+(await admin.query('select sum(delta) n from xp_ledger where user_id=$1',[ids.member])).rows[0].n;
  await admin.query("create function quest_private.test_failure() returns trigger language plpgsql as $$begin raise exception 'Synthetic failure';end$$;create trigger test_failure before insert on xp_ledger for each row execute function quest_private.test_failure()");
  snapshot.days[today].exercises[0].logs[0].done=false;
  await member.query('select save_gym_state($1,3)',[snapshot]);
  await assert.rejects(processAccount(worker1,ids.member),/Synthetic failure/);
  assert.equal(+(await admin.query('select sum(delta) n from xp_ledger where user_id=$1',[ids.member])).rows[0].n,prior);
  const state=(await member.query('select state from gym_account_state')).rows[0].state;assert.equal(state.days[today].exercises[0].logs[0].done,false);
  const account=(await member.query('select generation,processed_generation from quest_accounts')).rows[0];assert.notEqual(account.generation,account.processed_generation);
  await admin.query('drop trigger test_failure on xp_ledger;drop function quest_private.test_failure()');
  assert.equal((await processAccount(worker1,ids.member)).level.xp,30);
  assert.equal((await member.query('select active_title from quest_accounts')).rows[0].active_title,'Başlangıç');
 });
 await check('missed periods catch up, closed quests expire and streaks remain independent',async()=>{
  const id='10000000-0000-4000-8000-000000000005';const monday=(await admin.query("select date_trunc('week',now() at time zone 'Europe/Istanbul')::date::text as day")).rows[0].day;
  const activation=addDays(monday,-14),plans={};for(let date=activation;date<monday;date=addDays(date,1))plans[date]={kind:'rest'};
  await admin.query("insert into profiles(id,role) values($1,'member')",[id]);
  await admin.query('insert into quest_accounts(user_id,activation,enrolled_at,initial_plan) values($1,$2,$3,$4)',[id,activation,activation+'T00:00:00+03:00',plans]);
  const r=await processAccount(worker1,id);
  assert.equal(r.streaks.adherence,2);assert.equal(r.streaks.quests,0);
  assert.equal(r.quests.filter(q=>q.period==='daily').length,(Math.round((Date.parse(today)-Date.parse(activation))/86400000)+1)*3);
  assert.ok(r.quests.some(q=>q.status==='expired'));assert.equal(r.level.xp,2300);
 });
 await check('scheduler only picks pending/date-expired accounts; repeated tick is quiet',async()=>{
  await admin.query('update quest_accounts set generation=generation+1 where user_id=$1',[ids.member]);
  const pool=new pg.Pool({...config,options:'-c role=service_role'});
  try{const first=await runTick(pool);assert.ok(first.processed>=1);assert.deepEqual(first.failed,[]);assert.equal((await runTick(pool)).processed,0);}finally{await pool.end();}
 });
 await check('Deno HTTP entrypoint + real PostgreSQL; fixture Auth validates caller and rejects forged identity',async()=>{
  const auth=httpServer((req,res)=>{res.setHeader('Content-Type','application/json');if(req.headers.authorization==='Bearer fixture-valid'){res.end(JSON.stringify({id:ids.member}));}else{res.statusCode=401;res.end('{}');}});
  await new Promise(r=>auth.listen(0,'127.0.0.1',r));
  const probe=createServer();await new Promise(r=>probe.listen(0,'127.0.0.1',r));const edgePort=probe.address().port;await new Promise(r=>probe.close(r));
  const child=spawn('node_modules/.bin/deno',['run','--allow-env','--allow-net','--allow-read','--allow-sys','supabase/functions/quests-refresh/index.ts'],{env:{...process.env,PORT:String(edgePort),SUPABASE_URL:`http://127.0.0.1:${auth.address().port}`,SUPABASE_ANON_KEY:'fixture-public-key',QUESTS_DATABASE_URL:`postgresql://${config.user}:${config.password}@127.0.0.1:${port}/${config.database}`},stdio:['ignore','pipe','pipe']});
  try{
   await new Promise((resolve,reject)=>{let log='';const timeout=setTimeout(()=>reject(Error('Deno startup timed out: '+log)),20000);const observe=b=>{log+=b.toString();if(log.includes('Listening on')){clearTimeout(timeout);resolve();}};child.stderr.on('data',observe);child.stdout.on('data',observe);child.once('error',e=>{clearTimeout(timeout);reject(e)});child.once('exit',()=>{clearTimeout(timeout);reject(Error(log))});});
   const url=`http://127.0.0.1:${edgePort}`;
   assert.equal((await fetch(url,{method:'POST'})).status,401);
   assert.equal((await fetch(url,{method:'POST',headers:{Authorization:'Bearer invalid'}})).status,401);
   const r=await fetch(url,{method:'POST',headers:{Authorization:'Bearer fixture-valid'},body:JSON.stringify({user_id:ids.other,xp:999999})});
   assert.equal(r.status,200);assert.equal((await r.json()).result.level.xp,30);
  }finally{child.kill('SIGTERM');await new Promise(r=>child.exitCode!==null?r():child.once('exit',r));await new Promise(r=>auth.close(r));}
 });
 console.log(`${count}/${count} PostgreSQL integration scenarios passed; synthetic fixtures only, no hosted connections.`);
}catch(error){console.error(error||"Postgres failed to start");process.exitCode=1;}finally{
 await Promise.allSettled(clients.map(c=>c.end()));if(db.process && db.process.exitCode===null)await db.stop();await rm(dir,{recursive:true,force:true});
}
