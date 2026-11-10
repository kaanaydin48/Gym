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

 const migration=(await readdir('supabase/migrations')).find(f=>f.endsWith('_quests_v5_transition.sql'));
 await admin.query(await readFile('supabase/migrations/'+migration,'utf8'));
 const monday=(await admin.query("select date_trunc('week',now() at time zone 'Europe/Istanbul')::date::text as day")).rows[0].day;
 const start=addDays(monday,-7);
 const workout={kind:'workout',finished:Date.now(),exercises:[{id:'chest',name:'Chest',muscle:'Göğüs',logs:Array.from({length:16},()=>({done:true,kg:20,reps:10,rir:2}))}]};
 const snapshot={schema:'gym-tracker-pro',days:{[today]:workout}};
 await member.query('select save_gym_state($1,0)',[snapshot]);
 await member.query('select quest_enroll()');await other.query('select quest_enroll()');
 await admin.query("update quest_accounts set activation=$2,v5_start=$2,enrolled_at=$3,result=$4 where user_id=$1",[ids.member,start,start+'T00:00:00+03:00',{badges:[{id:'legacy',name:'Eski rozet'}],titles:['Eski unvan']}]);
 await admin.query("insert into xp_ledger(user_id,reward_key,effective_date,pool,delta,generation,operation_key,reason) values($1,'legacy',$2,'daily',300,0,'legacy','earned')",[ids.member,addDays(start,-1)]);
 await check('V5 migration preserves history and supports six weekly slots',async()=>{
  const r=await processAccount(worker1,ids.member);assert.equal(r.level.xp,420);assert.equal(r.ruleVersion,5);assert.ok(r.badges.some(b=>b.id==='legacy'));
  assert.equal(r.quests.filter(q=>q.period==='weekly'&&q.start===monday).length,6);
  assert.equal(+(await admin.query("select sum(delta) n from xp_ledger where reward_key='legacy'")).rows[0].n,300);
 });
 await check('V5 concurrent retries are idempotent',async()=>{
  const before=(await admin.query('select count(*) n from xp_ledger')).rows[0].n;
  const [a,b]=await Promise.all([processAccount(worker1,ids.member),processAccount(worker2,ids.member)]);assert.equal(a.level.xp,b.level.xp);
  assert.equal((await admin.query('select count(*) n from xp_ledger')).rows[0].n,before);
 });
 await check('V5 target snapshots immutable and isolated by RLS',async()=>{
  assert.ok((await member.query('select * from quest_v5_day_plans')).rows.length>0);
  assert.equal((await other.query('select * from quest_v5_day_plans')).rows.length,0);
  await assert.rejects(member.query("update quest_v5_day_plans set plan='{}'"),/permission denied/);
  await assert.rejects(admin.query("update quest_v5_day_plans set plan='{}'"),/Append-only/);
  await assert.rejects(anon.query('select * from quest_v5_day_plans'),/permission denied/);
 });
 await check('V5 manual evidence and personal goal RPCs rejected server-side',async()=>{
  await assert.rejects(member.query("select quest_record_action('review',null,'valid evidence',gen_random_uuid())"),/automatik|otomatik/);
  await assert.rejects(member.query("select quest_personal_goal('daily','sets','Target test',8)"),/otomatik/);
 });
 await check('V5 correction changes only new rewards; workouts retained',async()=>{
  const before=(await admin.query("select jsonb_agg(to_jsonb(x)) x from xp_ledger x where reward_key='legacy'")).rows[0].x;
  snapshot.days[today].exercises[0].logs.forEach(s=>s.done=false);
  await member.query('select save_gym_state($1,1)',[snapshot]);
  assert.equal((await processAccount(worker1,ids.member)).level.xp,300);
  assert.deepEqual((await admin.query("select jsonb_agg(to_jsonb(x)) x from xp_ledger x where reward_key='legacy'")).rows[0].x,before);
  assert.deepEqual((await member.query('select state from gym_account_state')).rows[0].state,snapshot);
 });
 await check('V5 re-earning and failed write rollback',async()=>{
  snapshot.days[today].exercises[0].logs.forEach(s=>s.done=true);await member.query('select save_gym_state($1,2)',[snapshot]);
  await admin.query("create function quest_private.test_failure() returns trigger language plpgsql as $$begin raise exception 'Synthetic failure';end$$;create trigger test_failure before insert on xp_ledger for each row execute function quest_private.test_failure()");
  await assert.rejects(processAccount(worker1,ids.member),/Synthetic failure/);
  assert.equal(+(await admin.query('select sum(delta) n from xp_ledger where user_id=$1',[ids.member])).rows[0].n,300);
  await admin.query('drop trigger test_failure on xp_ledger;drop function quest_private.test_failure()');
  assert.equal((await processAccount(worker1,ids.member)).level.xp,420);
 });
 console.log(`${count}/${count} V5 PostgreSQL scenarios passed; local synthetic fixtures only.`);
}catch(error){console.error(error||'Postgres failed');process.exitCode=1;}finally{
 await Promise.allSettled(clients.map(c=>c.end()));if(db.process && db.process.exitCode===null)await db.stop();await rm(dir,{recursive:true,force:true});
}
