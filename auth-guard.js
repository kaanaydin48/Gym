/* Authenticated entry point. Roles are read from the server, never user metadata. */
(async()=>{
 'use strict';
 document.documentElement.style.visibility='hidden';
 const load=src=>new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=()=>reject(Error('Uygulama dosyası yüklenemedi.'));document.body.append(s);});
 try{
  if(!window.supabase)throw Error('Giriş bağlantısı yüklenemedi.');
  const client=window.supabase.createClient('https://aryzgrgjwjdxumbddank.supabase.co','sb_publishable_t2QNhjaGq0_kaY5IfsF87A_y7ep-837');
  const {data,error}=await client.auth.getUser();
  if(error||!data.user){location.replace('./login.html');return;}
  const result=await client.from('profiles').select('role').eq('id',data.user.id).single();
  if(result.error||!['admin','coach','member'].includes(result.data?.role))throw Error('Hesap yetkin bulunamadı. Yöneticinle iletişime geç.');
  window.gymAccount={client,user:data.user,role:result.data.role};
  client.auth.onAuthStateChange(event=>{if(event==='SIGNED_OUT')location.replace('./login.html');});
  await load('./membership.js?v=1');
  await load('./app.js?v=membership-1');
  document.querySelector('.side-bottom').textContent='Hesap bağlı · Antrenmanlar bu cihazda';
  document.querySelector('footer span').textContent='Üyelik · 1.1';
  document.documentElement.style.visibility='visible';
 }catch(error){
  document.body.replaceChildren();const main=document.createElement('main'),h=document.createElement('h1'),p=document.createElement('p'),a=document.createElement('a');
  h.textContent='Hesap açılamadı';p.textContent=error.message;a.href='./login.html';a.textContent='Giriş ekranına dön';main.append(h,p,a);document.body.append(main);document.documentElement.style.visibility='visible';
 }
})();
