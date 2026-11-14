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
  await load('./membership.js?v=role-management-fix-20261031');
  await load('./contour-icons.js?v=approved-40-v1');
  await load('./motion.js?v=approved-40-v1');
  await load('./workout-metrics.js?v=quests-v4');
  await load('./workout-flex-v2.js?v=20261113-final');
  await load('./app.js?v=flex-v2-20261113-final');
  await window.gymReady;
  if(window.GYM_QUESTS_ENABLED===true){
   try{const {installQuestFeature}=await import('./quests/bootstrap.mjs');installQuestFeature(window.gymAccount);}
   catch(error){console.error('Görev geliştirme ortamı başlatılamadı:',error.message);}
  }
  document.querySelector('footer span').textContent='Bulut kayıt · 1.2';
  document.documentElement.style.visibility='visible';
 }catch(error){
  document.body.replaceChildren();const main=document.createElement('main'),h=document.createElement('h1'),p=document.createElement('p'),a=document.createElement('a');
  h.textContent='Hesap açılamadı';p.textContent=error.message;a.href='./login.html';a.textContent='Giriş ekranına dön';main.append(h,p,a);document.body.append(main);document.documentElement.style.visibility='visible';
 }
})();

