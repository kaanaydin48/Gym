import test from 'node:test';import assert from 'node:assert/strict';
import {createQuestClient} from '../../quests/client.mjs';
const memory=()=>({getItem:()=>null,setItem:()=>{}});
test('read invokes authenticated server reconciliation; changed account is rejected before request',async()=>{
 let id='a',calls=0;const query={select(){return this;},eq(){return this;},async maybeSingle(){return {data:{generation:2,processed_generation:2,result:{level:{xp:100}}}};}};
 const api=createQuestClient({user:{id:'a'},client:{auth:{async getSession(){return {data:{session:{user:{id}}}};}},async rpc(){return {error:null};},functions:{async invoke(name){assert.equal(name,'quests-refresh');calls++;return {error:null};}},from(){return query;}}},memory());
 assert.equal((await api.read()).level.xp,100);assert.equal(calls,1);
 id='b';await assert.rejects(api.read(),/Hesap değişti/);assert.equal(calls,1);
});
test('V5 client has no action queue and leaves old evidence storage untouched',()=>{
 const storage={getItem(){throw Error('must not read evidence');},setItem(){throw Error('must not write evidence');}};
 const api=createQuestClient({user:{id:'a'},client:{}},storage);
 assert.equal(api.queue,undefined);
});
