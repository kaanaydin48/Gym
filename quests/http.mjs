// Authenticated entrypoint policy, independently testable without hosted Auth.
export function questHandler({authenticate,refresh,origin}) {
  return async request=>{
    const cors={'Access-Control-Allow-Origin':origin,'Vary':'Origin','Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info','Access-Control-Allow-Methods':'POST,OPTIONS'};
    const reply=(body,status)=>Response.json(body,{status,headers:cors});
    if(request.headers.get('Origin')&&request.headers.get('Origin')!==origin)return reply({error:'Origin denied'},403);
    if(request.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
    if(request.method!=='POST')return reply({error:'Method denied'},405);
    const authorization=request.headers.get('Authorization');
    if(!authorization?.startsWith('Bearer '))return reply({error:'Authentication required'},401);
    try{
      const user=await authenticate(authorization);
      if(!user?.id)return reply({error:'Authentication required'},401);
      // Request body cannot choose user, source revision, target, XP, or result.
      const result=await refresh(user.id);return reply({result},200);
    }catch{return reply({error:'Görevler doğrulanamadı. Antrenman kaydın korunuyor.'},503);}
  };
}
