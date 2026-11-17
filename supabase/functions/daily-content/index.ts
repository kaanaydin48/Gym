import pg from 'npm:pg@8.16.3';
import {ensureDaily,verifySources} from '../../../daily-content/worker.mjs';
const url=Deno.env.get('SUPABASE_URL')||'';
const pool=new pg.Pool({connectionString:Deno.env.get('SUPABASE_DB_URL'),ssl:{rejectUnauthorized:true},max:2,connectionTimeoutMillis:5000,statement_timeout:15000});
const headers={'Access-Control-Allow-Origin':'https://kaanaydin48.github.io','Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info','Access-Control-Allow-Methods':'POST, OPTIONS','Cache-Control':'no-store'};
Deno.serve(async(req:Request)=>{
 if(req.method==='OPTIONS')return new Response(null,{headers});
 if(req.method!=='POST')return new Response(null,{status:405,headers});
 const token=req.headers.get('Authorization')?.replace(/^Bearer /,'');
 if(!token)return new Response(null,{status:401,headers});
 try{
  if(/^[a-f0-9]{64}$/.test(token)){
   const {rows:[{valid}]}=await pool.query("select exists(select 1 from vault.decrypted_secrets where name='daily_content_scheduler_token' and decrypted_secret=$1) valid",[token]);
   if(!valid)return new Response(null,{status:401,headers});
   let sourceError=false;try{await verifySources(pool);}catch{sourceError=true;}
   const {rows}=await pool.query('select id from public.profiles');const failed=[];
   for(const {id} of rows){try{await ensureDaily(pool,id);}catch{failed.push(id);}}
   return Response.json({processed:rows.length-failed.length,failed:failed.length,sourceError},{status:failed.length?503:200,headers});
  }
  const check=await fetch(url+'/auth/v1/user',{headers:{Authorization:'Bearer '+token,apikey:Deno.env.get('SUPABASE_ANON_KEY')||''},signal:AbortSignal.timeout(8000)});
  if(!check.ok)return new Response(null,{status:401,headers});
  const user=await check.json();if(!user.id)return new Response(null,{status:401,headers});
  const profile=await pool.query('select 1 from public.profiles where id=$1',[user.id]);
  if(!profile.rowCount)return new Response(null,{status:403,headers});
  return Response.json(await ensureDaily(pool,user.id),{headers});
 }catch{return Response.json({error:'İçerik şu anda yenilenemiyor. Son kayıt korunuyor.'},{status:503,headers});}
});
