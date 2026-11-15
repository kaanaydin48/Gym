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
import {addDays,weekKey} from '../../quests/engine.mjs';
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
 // Seed an already-earned V4 reward, then prove migration freezes it without rewriting.
 await admin.query("insert into xp_ledger(user_id,reward_key,effective_date,pool,delta,generation,operation_key,reason) values($1,'quest:daily:legacy:1',current_date,'daily',100,0,'legacy-seed','earned')",[ids.other]);
 await admin.query("update quest_accounts set result=$2 where user_id=$1",[ids.other,{badges:[{id:'old',name:'Eski rozet'}],titles:['Eski unvan']}]);
 const v5=(await readdir('supabase/migrations')).find(f=>f.endsWith('_quests_v5_automation.sql'));
 await admin.query(await readFile('supabase/migrations/'+v5,'utf8'));

 await check('pre-award rollback is transactional and retains all existing rows',async()=>{
 await admin.query('begin');
 await admin.query(await readFile('supabase/rollback/quests_v5_before_rewards.sql','utf8'));
 assert.equal((await admin.query("select count(*) n from xp_ledger")).rows[0].n,'1');
 assert.equal((await admin.query("select has_function_privilege('authenticated','public.quest_record_action(text,text,text,uuid)','execute') ok")).rows[0].ok,true);
 await admin.query('rollback');
 });
 await check('V5 migration preserves legacy XP, badges and starts rewarded accounts tomorrow',async()=>{
 const r=await processAccount(worker1,ids.other);assert.equal(r.level.xp,100);assert.equal(r.activation,addDays(today,1));assert.equal(r.badges[0].id,'old');
 assert.equal((await admin.query("select delta from xp_ledger where user_id=$1",[ids.other])).rows[0].delta,100);
 });
 await check('two concurrent workers and reload give exactly one 30 XP reward',async()=>{
 const [a,b]=await Promise.all([processAccount(worker1,ids.member),processAccount(worker2,ids.member)]);
 assert.equal(a.level.xp,30);assert.equal(b.level.xp,30);
 await processAccount(worker1,ids.member);
 assert.equal((await admin.query('select * from xp_ledger where user_id=$1',[ids.member])).rowCount,1);
 });
 await check('8 and 16 completed sets reconcile automatically, weekly reward is separate',async()=>{
 const d=snapshot.days[today];d.finished=null;d.exercises[0].muscle='Göğüs';
 d.exercises[0].logs=Array.from({length:8},()=>({kg:20,reps:10,done:true}));
 await member.query('select save_gym_state($1,1)',[snapshot]);
 let r=await processAccount(worker1,ids.member);assert.equal(r.level.xp,70);
 d.exercises[0].logs.push(...Array.from({length:8},()=>({kg:20,reps:10,done:true})));
 await member.query('select save_gym_state($1,2)',[snapshot]);r=await processAccount(worker1,ids.member);assert.equal(r.level.xp,90);
 d.finished=Date.now();await member.query('select save_gym_state($1,3)',[snapshot]);assert.equal((await processAccount(worker1,ids.member)).level.xp,120);
 });
 await check('historical correction appends reversals; source and original ledger remain intact',async()=>{
 snapshot.days[today].exercises[0].logs.forEach(s=>s.done=false);
 await member.query('select save_gym_state($1,4)',[snapshot]);assert.equal((await processAccount(worker1,ids.member)).level.xp,0);
 assert.ok((await admin.query('select * from xp_ledger where user_id=$1 and delta<0',[ids.member])).rowCount>0);
 assert.deepEqual((await member.query('select state from gym_account_state')).rows[0].state,snapshot);
 await assert.rejects(worker1.query('delete from xp_ledger'),/Append-only/);
 });
 await check('user isolation, stale revision conflict, direct XP writes and manual RPCs rejected',async()=>{
 assert.equal((await other.query('select * from user_quests')).rowCount,0);
 assert.equal((await outsider.query('select * from user_quests')).rowCount,0);
 await assert.rejects(member.query('select save_gym_state($1,1)',[snapshot]),/GYM_CONFLICT/);
 await assert.rejects(member.query("update quest_accounts set result='{}'"),/permission denied/);
 await assert.rejects(member.query("insert into xp_ledger(user_id,reward_key,effective_date,pool,delta,generation,operation_key,reason) values($1,'fake',current_date,'daily',100,1,'fake','fake')",[ids.member]),/permission denied/);
 await assert.rejects(member.query("select quest_record_action('reflection',null,'long evidence',gen_random_uuid())"),/permission denied/);
 await assert.rejects(coach.query("select quest_approve(gen_random_uuid(),true,'long reason',gen_random_uuid())"),/permission denied/);
 await assert.rejects(anon.query('select quest_enroll()'),/permission denied/);
 await assert.rejects(member.query("select quest_personal_goal('daily','review','My review',1)"),/Invalid goal/);
 });
 await check('stale V4 worker cannot insert legacy rewards; duplicate operation rejected in database',async()=>{
 await assert.rejects(worker1.query("insert into xp_ledger(user_id,reward_key,effective_date,pool,delta,generation,operation_key,reason) values($1,'old',current_date,'daily',10,1,'old','old')",[ids.member]),/Legacy XP/);
 const r=(await admin.query('select * from xp_ledger where user_id=$1 order by id limit 1',[ids.member])).rows[0];
 await assert.rejects(worker1.query('insert into xp_ledger(user_id,reward_key,effective_date,pool,delta,generation,operation_key,reason) values($1,$2,$3,$4,$5,$6,$7,$8)',[r.user_id,r.reward_key,r.effective_date,r.pool,r.delta,r.generation,r.operation_key,r.reason]),/duplicate key/);
 });
 await check('scheduler processes pending and missed day automatically',async()=>{
 await admin.query("update quest_accounts set processed_day=current_date-1 where user_id=$1",[ids.member]);
 const pool={query:(...args)=>worker1.query(...args),connect:async()=>({query:(...args)=>worker2.query(...args),release(){}})};
 const r=await runTick(pool);assert.equal(r.failed.length,0);assert.ok(r.processed>=1);
 });
 await check('missed-day catchup: planned rest 15, fourth/unplanned zero, edits reconcile',async()=>{
 const start=weekKey(addDays(today,-14)),dates=[0,1,2,3].map(n=>addDays(start,n));
 const rests=Object.fromEntries(dates.map(d=>[d,{kind:'rest'}]));
 await admin.query('update quest_accounts set activation=$2,v5_activation=$2,enrolled_at=$3,initial_plan=$4,generation=generation+1 where user_id=$1',[ids.member,start,`${start}T00:00:00+03:00`,rests]);
 snapshot.days={...rests,[addDays(start,4)]:{kind:'rest'}};
 await member.query('select save_gym_state($1,5)',[snapshot]);
 let r=await processAccount(worker1,ids.member);assert.equal(r.level.xp,45);
 assert.equal(r.quests.find(q=>q.start===dates[3]&&q.kind==='rest').progress,0);
 delete snapshot.days[dates[0]];
 await member.query('select save_gym_state($1,6)',[snapshot]);r=await processAccount(worker1,ids.member);assert.equal(r.level.xp,45);
 assert.equal(r.quests.find(q=>q.start===dates[3]&&q.kind==='rest').progress,1);
 delete snapshot.days[dates[1]];
 await member.query('select save_gym_state($1,7)',[snapshot]);assert.equal((await processAccount(worker1,ids.member)).level.xp,30);
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
 await check('rollback refuses to erase or reinterpret awarded V5 XP',async()=>{
 await admin.query('begin');
 await assert.rejects(admin.query(await readFile('supabase/rollback/quests_v5_before_rewards.sql','utf8')),/V5 rewards exist/);
 await admin.query('rollback');
 });
 console.log(`${count}/${count} V5 PostgreSQL scenarios passed`);
}catch(error){console.error(error||"Postgres failed to start");process.exitCode=1;}finally{
 await Promise.allSettled(clients.map(c=>c.end()));if(db.process && db.process.exitCode===null)await db.stop();await rm(dir,{recursive:true,force:true});
}
