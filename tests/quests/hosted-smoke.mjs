// Explicit test project only. Does not create users or write data.
import assert from 'node:assert/strict';
import {TEST_PROJECT} from '../../quests/runtime-config.mjs';
const url=`https://${TEST_PROJECT}.supabase.co/functions/v1/quests-refresh`;
for(const [name,method,headers,status] of [
 ['anonymous','POST',{},401],['invalid token','POST',{Authorization:'Bearer invalid'},401],
 ['foreign origin','POST',{Origin:'https://example.invalid'},403],['method','GET',{},405],
 ['preflight','OPTIONS',{Origin:'http://127.0.0.1:8080'},204]
]){
 const r=await fetch(url,{method,headers,...(method==='POST'?{body:'{}'}:{}),signal:AbortSignal.timeout(20000)});
 assert.equal(r.status,status,name);console.log(`PASS ${name}: ${status}`);
}
