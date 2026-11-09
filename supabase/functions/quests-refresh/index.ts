import pg from 'npm:pg@8.16.3';
import {processAccount} from '../../../quests/worker.mjs';
import {questHandler} from '../../../quests/http.mjs';

import {runtimeConfig,PRODUCTION_PROJECT} from '../../../quests/runtime-config.mjs';

const production=Deno.env.get('SUPABASE_URL')===`https://${PRODUCTION_PROJECT}.supabase.co`;
const {apiUrl,databaseUrl,origin,hosted}=runtimeConfig({
 apiUrl:Deno.env.get('SUPABASE_URL')||'',
 databaseUrl:Deno.env.get('QUESTS_DATABASE_URL')||Deno.env.get('SUPABASE_DB_URL')||'',
 allowProduction:true,
 origin:Deno.env.get('QUESTS_APP_ORIGIN')||(production?'https://kaanaydin48.github.io':'http://127.0.0.1:8080')
});
pg.types.setTypeParser(1082,(value:string)=>value);
const pool=new pg.Pool({connectionString:databaseUrl,ssl:hosted?{rejectUnauthorized:true}:false,max:2,connectionTimeoutMillis:5000,statement_timeout:20000});
const handler=questHandler({origin,
  authenticate:async(authorization:string)=>{
    const response=await fetch(`${apiUrl}/auth/v1/user`,{headers:{Authorization:authorization,apikey:Deno.env.get('SUPABASE_ANON_KEY')||''},signal:AbortSignal.timeout(5000)});
    if(!response.ok)return null;return response.json();
  },
  refresh:async(userId:string)=>{const client=await pool.connect();try{return await processAccount(client,userId);}finally{client.release();}}
});
Deno.serve({port:Number(Deno.env.get('PORT')||8000)},handler);
