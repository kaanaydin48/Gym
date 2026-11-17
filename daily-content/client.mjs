export function createContentClient(account,storage=localStorage){
 const uid=account.user.id,key='gym-daily-v1:'+uid;
 let data={daily:null,preferences:{},pending:{}};try{data={...data,...JSON.parse(storage.getItem(key)||'{}')};}catch{}
 let running;
 const persist=()=>storage.setItem(key,JSON.stringify(data));
 async function identity(){const {data:auth}=await account.client.auth.getSession();if(auth.session?.user?.id!==uid)throw Error('Hesap değişti');}
 return {get data(){return data;},
 set(card,field,value){
  const id=card.id,old=data.preferences[id]||{reaction:0,saved:false};
  const next={...old,user_id:uid,content_id:id,topic:card.topic,card,[field]:value,updated_at:new Date().toISOString()};
  const before=JSON.stringify(data);data.preferences[id]=next;data.pending[id]={...next,op:crypto.randomUUID()};
  try{persist();}catch(error){data=JSON.parse(before);throw error;}
 },
 async sync(){
  if(running)return running;
  running=(async()=>{await identity();
   while(Object.keys(data.pending).length)for(const [id,operation] of Object.entries(data.pending)){
    await identity();const {op,...row}=operation;
    const {error}=await account.client.from('daily_content_preferences').upsert(row,{onConflict:'user_id,content_id'});if(error)throw error;
    if(data.pending[id]?.op===op)delete data.pending[id];persist();
   }
   const {data:rows,error}=await account.client.from('daily_content_preferences').select('*').eq('user_id',uid);if(error)throw error;
   await identity();for(const row of rows||[])if(!data.pending[row.content_id])data.preferences[row.content_id]=row;persist();
  })().finally(()=>{running=null;});return running;
 },
 async refresh(){await identity();const {data:daily,error}=await account.client.functions.invoke('daily-content',{body:{}});if(error)throw error;await identity();if(!daily?.day||daily.cards?.length!==3)throw Error('İçerik yanıtı geçersiz');data.daily=daily;persist();return daily;}
 };
}
