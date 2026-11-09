import pg from 'npm:pg@8.16.3';
import {processAccount} from '../../../quests/worker.mjs';
import {questHandler} from '../../../quests/http.mjs';

// This entry point is intentionally loopback-only during V4 development.
// Hosted activation requires a reviewed deployment configuration, never a browser key.
const apiUrl=Deno.env.get('SUPABASE_URL')||'';
const databaseUrl=Deno.env.get('QUESTS_DATABASE_URL')||'';
const origin=Deno.env.get('QUESTS_APP_ORIGIN')||'http://127.0.0.1:8080';
const local=(value:string)=>['localhost','127.0.0.1','[::1]'].includes(new URL(value).hostname);
if(!local(apiUrl)||!local(databaseUrl)||!local(origin))throw Error('Quest V4 development refuses hosted connections');
pg.types.setTypeParser(1082,(value:string)=>value);
const pool=new pg.Pool({connectionString:databaseUrl,max:2,connectionTimeoutMillis:5000,statement_timeout:20000});
const handler=questHandler({origin,
  authenticate:async(authorization:string)=>{
    const response=await fetch(`${apiUrl}/auth/v1/user`,{headers:{Authorization:authorization,apikey:Deno.env.get('SUPABASE_ANON_KEY')||''},signal:AbortSignal.timeout(5000)});
    if(!response.ok)return null;return response.json();
  },
  refresh:async(userId:string)=>{const client=await pool.connect();try{return await processAccount(client,userId);}finally{client.release();}}
});
Deno.serve({port:Number(Deno.env.get('PORT')||8000)},handler);
