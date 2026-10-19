import { createClient } from 'npm:@supabase/supabase-js@2';
const origin = 'https://kaanaydin48.github.io';
const headers = {'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'authorization, x-client-info, apikey, content-type','Access-Control-Allow-Methods':'POST, OPTIONS','Content-Type':'application/json','Vary':'Origin'};
const reply=(status:number,body:unknown)=>new Response(JSON.stringify(body),{status,headers});
Deno.serve(async(req:Request)=>{
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(req.method!=='POST')return reply(405,{error:'Yalnızca POST desteklenir.'});
 if(req.headers.get('origin')&&req.headers.get('origin')!==origin)return reply(403,{error:'İzin verilmeyen kaynak.'});
 try{
  const url=Deno.env.get('SUPABASE_URL'),key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if(!url||!key)return reply(503,{error:'Üye servisi yapılandırılmamış.'});
  const service=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const token=req.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1];
  if(!token)return reply(401,{error:'Giriş gerekli.'});
  const {data:auth,error:authError}=await service.auth.getUser(token);
  if(authError||!auth.user)return reply(401,{error:'Oturum geçersiz.'});
  const profile=await service.from('profiles').select('role').eq('id',auth.user.id).single();
  if(profile.error)return reply(503,{error:'Üye servisi yönetici profilini okuyamadı. Profil tablosunun servis izinleri kontrol edilmeli.'});
  if(profile.data?.role!=='admin')return reply(403,{error:'Bu işlem yalnızca yöneticiye açık.'});
  let body;try{body=await req.json();}catch{return reply(400,{error:'Geçersiz istek.'});}
  if(body.action==='list'){
   const profiles=await service.from('profiles').select('id').eq('role','member');
   if(profiles.error)return reply(503,{error:'Üye profilleri okunamadı.'});
   const ids=new Set((profiles.data||[]).map(p=>p.id));const members=[];
   for(let page=1;;page++){
    const result=await service.auth.admin.listUsers({page,perPage:100});
    if(result.error)return reply(503,{error:'Üye listesi okunamadı.'});
    for(const u of result.data.users)if(ids.has(u.id))members.push({id:u.id,email:u.email||'',fullName:u.user_metadata?.full_name||'',active:!!u.last_sign_in_at});
    if(result.data.users.length<100)break;
   }
   return reply(200,{members});
  }
  if(body.action!=='invite')return reply(400,{error:'Geçersiz işlem.'});
  const email=typeof body.email==='string'?body.email.trim().toLowerCase():'';
  const fullName=typeof body.fullName==='string'?body.fullName.trim():'';
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254||!fullName||fullName.length>100)return reply(400,{error:'Geçerli ad ve e-posta gerekli.'});
  // Role is fixed on the server. The request cannot grant admin or coach access.
  const invite=await service.auth.admin.inviteUserByEmail(email,{redirectTo:'https://kaanaydin48.github.io/Gym/login.html',data:{full_name:fullName}});
  if(invite.error){
   const messages:Record<string,string>={
    email_exists:'Bu e-posta adresi zaten kayıtlı. Üye giriş ekranını kullanabilir.',
    user_already_exists:'Bu e-posta adresi zaten kayıtlı. Üye giriş ekranını kullanabilir.',
    over_email_send_rate_limit:'E-posta gönderim sınırına ulaşıldı. Bir süre sonra tekrar dene.',
    email_address_not_authorized:'E-posta servisi bu alıcıya gönderime izin vermiyor. Supabase için özel SMTP kurulumu gerekli.',
    email_address_invalid:'E-posta adresi geçerli değil. Adresi kontrol et.'
   };
   return reply(invite.error.status===429?429:400,{error:messages[invite.error.code||'']||'Davet e-postası gönderilemedi. E-posta servisinin SMTP ayarlarını kontrol et.'});
  }
  if(!invite.data.user)return reply(503,{error:'Davet yanıtında üye bilgisi alınamadı.'});
  const saved=await service.from('profiles').upsert({id:invite.data.user.id,role:'member',display_name:fullName,coach_id:auth.user.id},{onConflict:'id'});
  if(saved.error)return reply(503,{error:'Davet gönderildi ancak üye profili hazırlanamadı. Yönetici Supabase profil kaydını tamamlamalı.'});
  return reply(200,{ok:true});
 }catch{return reply(500,{error:'Üye servisi işlemi tamamlayamadı.'});}
});
