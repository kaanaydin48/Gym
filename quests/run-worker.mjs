import pg from 'pg';
import {assertLocalDatabase} from './isolation.mjs';
import {runTick} from './scheduler.mjs';
const config=assertLocalDatabase({host:process.env.QUEST_DB_HOST||'127.0.0.1',database:'gym_quests_test',port:Number(process.env.QUEST_DB_PORT||5432),user:process.env.QUEST_DB_USER||'postgres',password:process.env.QUEST_DB_PASSWORD});
pg.types.setTypeParser(1082,value=>value);
const pool=new pg.Pool({...config,max:2,connectionTimeoutMillis:5000,statement_timeout:20000});
async function tick(){const result=await runTick(pool);console.log(JSON.stringify({processed:result.processed,failed:result.failed.length}));if(result.failed.length)process.exitCode=1;}
if(process.argv.includes('--watch')){
  let running=false;const guarded=async()=>{if(running)return;running=true;try{await tick();}catch(e){console.error(e.message);}finally{running=false;}};
  const timer=setInterval(guarded,60000);await guarded();
  const stop=async()=>{clearInterval(timer);await pool.end();};process.once('SIGINT',stop);process.once('SIGTERM',stop);
}else{try{await tick();}finally{await pool.end();}}
