export class QuestQueue {
  constructor({storage,userId,rpc}) {this.storage=storage;this.key=`gym-quest-actions-v1:${userId}`;this.rpc=rpc;this.running=null;}
  read(){const rows=JSON.parse(this.storage.getItem(this.key)||'[]');if(!Array.isArray(rows))throw Error('Görev kuyruğu okunamadı');return rows;}
  enqueue(kind,questKey,evidence){
    if(!['review','reflection','submission'].includes(kind))throw Error('Geçersiz eylem');
    if(evidence.trim().length<8||evidence.length>2000)throw Error('Açıklama 8–2000 karakter olmalı.');
    const item={kind,quest_key:questKey,evidence,request_id:crypto.randomUUID()};
    const rows=this.read();rows.push(item);this.storage.setItem(this.key,JSON.stringify(rows));return item;
  }
  flush(){
    if(this.running)return this.running;
    this.running=(async()=>{
      for(const item of this.read().filter(r=>!r.failed)){
        const {kind,quest_key,evidence,request_id}=item;
        const {error}=await this.rpc('quest_record_action',{kind,quest_key,evidence,request_id});
        if(error){
          if(error.code==='P0001'){
            // Preserve rejected evidence, but don't let an expired submission block later actions.
            this.storage.setItem(this.key,JSON.stringify(this.read().map(r=>r.request_id===item.request_id?{...r,failed:true,lastError:error.message}:r)));
            continue;
          }
          throw error;
        }
        // Read again: never discard actions added while a request was in flight.
        this.storage.setItem(this.key,JSON.stringify(this.read().filter(r=>r.request_id!==item.request_id)));
      }
    })().finally(()=>{this.running=null;});return this.running;
  }
}
export function createQuestClient(account,storage=localStorage) {
  const userId=account.user.id,client=account.client;
  const identity=async()=>{
    const {data}=await client.auth.getSession();
    if(data.session?.user?.id!==userId)throw Error('Hesap değişti. Görev işlemi durduruldu.');
  };
  const rpc=async(name,args)=>{
    await identity();
    return client.rpc(name,args);
  };
  const queue=new QuestQueue({storage,userId,rpc});
  return {queue,rpc,async read(){
    await identity();
    const {error:enrollError}=await rpc('quest_enroll',{});if(enrollError)throw enrollError;
    const {error:refreshError}=await client.functions.invoke('quests-refresh',{body:{}});if(refreshError)throw refreshError;
    await identity();
    const {data,error}=await client.from('quest_accounts').select('result,generation,processed_generation,processed_day,active_title').eq('user_id',userId).maybeSingle();
    if(error)throw error;
    if(!data)return {pending:true,quests:[]};
    const rejected=queue.read().filter(r=>r.failed).length;
    return {...data.result,pending:data.generation!==data.processed_generation,activeTitle:data.active_title,...(rejected?{error:`${rejected} görev başvurusu kabul edilmedi; açıklamalar cihazda korunuyor.`}:{})};
  }};
}
