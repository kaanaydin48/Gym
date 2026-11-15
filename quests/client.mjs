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
  return {rpc,async read(){
    await identity();
    const {error:enrollError}=await rpc('quest_enroll',{});if(enrollError)throw enrollError;
    const {error:refreshError}=await client.functions.invoke('quests-refresh',{body:{}});if(refreshError)throw refreshError;
    await identity();
    const {data,error}=await client.from('quest_accounts').select('result,generation,processed_generation,processed_day,active_title').eq('user_id',userId).maybeSingle();
    if(error)throw error;
    if(!data)return {pending:true,quests:[]};
    return {...data.result,pending:data.generation!==data.processed_generation,activeTitle:data.active_title};
  }};
}
