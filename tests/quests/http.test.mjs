import test from 'node:test';import assert from 'node:assert/strict';
import {questHandler} from '../../quests/http.mjs';
const origin='http://127.0.0.1:8080';
test('refresh authenticates first and ignores forged user/XP in body',async()=>{
 let seen;const h=questHandler({origin,authenticate:async t=>t==='Bearer valid'?{id:'real-user'}:null,refresh:async id=>{seen=id;return {level:{xp:100}};}});
 const r=await h(new Request(origin,{method:'POST',headers:{Authorization:'Bearer valid',Origin:origin},body:JSON.stringify({user_id:'victim',xp:9999})}));
 assert.equal(r.status,200);assert.equal(seen,'real-user');assert.equal((await r.json()).result.level.xp,100);
 assert.equal((await h(new Request(origin,{method:'POST'}))).status,401);
 assert.equal((await h(new Request(origin,{method:'POST',headers:{Authorization:'Bearer bad'}}))).status,401);
});
test('denied origin/method and server failures never expose internals',async()=>{
 const h=questHandler({origin,authenticate:async()=>({id:'x'}),refresh:async()=>{throw Error('secret-connection-string');}});
 assert.equal((await h(new Request(origin))).status,405);
 assert.equal((await h(new Request(origin,{method:'POST',headers:{Origin:'https://evil.invalid'}}))).status,403);
 const r=await h(new Request(origin,{method:'POST',headers:{Authorization:'Bearer valid'}}));assert.equal(r.status,503);assert.ok(!(await r.text()).includes('secret'));
});
