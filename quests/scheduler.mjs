import {processAccount} from './worker.mjs';
export async function runTick(pool) {
  const {rows}=await pool.query("select user_id from public.quest_accounts where generation<>processed_generation or processed_day is distinct from (now() at time zone 'Europe/Istanbul')::date order by updated_at limit 50");
  let processed=0;const failed=[];
  for(const {user_id} of rows){const client=await pool.connect();try{await processAccount(client,user_id);processed++;}catch{failed.push(user_id);}finally{client.release();}}
  return {processed,failed};
}
