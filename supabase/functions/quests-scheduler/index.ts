import pg from 'npm:pg@8.16.3';
import {runtimeConfig,PRODUCTION_PROJECT} from '../../../quests/runtime-config.mjs';
import {runTick} from '../../../quests/scheduler.mjs';
const apiUrl=Deno.env.get('SUPABASE_URL')||'';
const production=apiUrl===`https://${PRODUCTION_PROJECT}.supabase.co`;
const config=runtimeConfig({apiUrl,databaseUrl:Deno.env.get('SUPABASE_DB_URL')||'',allowProduction:true,origin:production?'https://kaanaydin48.github.io':'http://127.0.0.1:8080'});
pg.types.setTypeParser(1082,(v:string)=>v);
const pool=new pg.Pool({connectionString:config.databaseUrl,ssl:{rejectUnauthorized:true},max:2,connectionTimeoutMillis:5000,statement_timeout:20000});
Deno.serve(async req=>{
 if(req.method!=='POST')return new Response(null,{status:405});
 const token=req.headers.get('Authorization')?.match(/^Bearer ([a-f0-9]{64})$/)?.[1];
 if(!token)return new Response(null,{status:401});
 try{
  const {rows}=await pool.query("select exists(select 1 from vault.decrypted_secrets where name='quests_scheduler_token' and decrypted_secret=$1) as valid",[token]);
  if(!rows[0].valid)return new Response(null,{status:401});
  const result=await runTick(pool);return Response.json(result,{status:result.failed.length?503:200});
 }catch{return Response.json({error:'Scheduler failed; pending work retained'},{status:503});}
});
