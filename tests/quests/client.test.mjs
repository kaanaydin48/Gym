import test from 'node:test';import assert from 'node:assert/strict';
import {QuestQueue,createQuestClient} from '../../quests/client.mjs';
const memory=()=>{const m=new Map();return {getItem:k=>m.get(k),setItem:(k,v)=>m.set(k,v)};};
test('offline survives restart, retries same id, isolates accounts',async()=>{
 const storage=memory();const q=new QuestQueue({storage,userId:'a',rpc:async()=>({error:Error('offline')})});
 const first=q.enqueue('review',null,'Planımı kontrol ettim.');await assert.rejects(q.flush());
 assert.equal(new QuestQueue({storage,userId:'b'}).read().length,0);
 let seen;const restarted=new QuestQueue({storage,userId:'a',rpc:async(_,x)=>{seen=x.request_id;return {error:null};}});
 await restarted.flush();assert.equal(seen,first.request_id);assert.equal(restarted.read().length,0);
});
test('action added in flight survives acknowledgement and duplicate flush is shared',async()=>{
 const storage=memory();let ack;const q=new QuestQueue({storage,userId:'a',rpc:()=>new Promise(r=>ack=r)});
 q.enqueue('review',null,'İlk değerlendirme.');const first=q.flush();assert.equal(q.flush(),first);
 const second=q.enqueue('reflection',null,'İkinci değerlendirme.');ack({error:null});await first;
 assert.deepEqual(q.read().map(r=>r.request_id),[second.request_id]);
});
test('quota failure is surfaced and never reports queued completion',()=>{
 const q=new QuestQueue({storage:{getItem:()=>null,setItem:()=>{throw Error('quota');}},userId:'a'});
 assert.throws(()=>q.enqueue('review',null,'Planımı kontrol ettim.'),/quota/);
});
test('read invokes authenticated server reconciliation; changed account is rejected before request',async()=>{
 let id='a',calls=0;const query={select(){return this;},eq(){return this;},async maybeSingle(){return {data:{generation:2,processed_generation:2,result:{level:{xp:100}}}};}};
 const api=createQuestClient({user:{id:'a'},client:{auth:{async getSession(){return {data:{session:{user:{id}}}};}},async rpc(){return {error:null};},functions:{async invoke(name){assert.equal(name,'quests-refresh');calls++;return {error:null};}},from(){return query;}}},memory());
 assert.equal((await api.read()).level.xp,100);assert.equal(calls,1);
 id='b';await assert.rejects(api.read(),/Hesap değişti/);assert.equal(calls,1);
});
test('expired offline evidence is retained without blocking the next action',async()=>{
 const storage=memory();const q=new QuestQueue({storage,userId:'a',rpc:async(_,row)=>row.kind==='submission'?{error:{code:'P0001',message:'Görev başvuruya kapalı'}}:{error:null}});
 const old=q.enqueue('submission','old-task','Dün hazırladığım kanıt.');q.enqueue('review',null,'Bugünkü planı kontrol ettim.');
 await q.flush();assert.equal(q.read().length,1);assert.equal(q.read()[0].request_id,old.request_id);assert.equal(q.read()[0].failed,true);
});
