/* Authenticated entry point. Roles are read from the server, never user metadata. */
(async()=>{
 'use strict';
 document.documentElement.style.visibility='hidden';
 const load=src=>new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=()=>reject(Error('Uygulama dosyası yüklenemedi.'));document.body.append(s);});
 try{
  if(!window.supabase)throw Error('Giriş bağlantısı yüklenemedi.');
  const client=window.supabase.createClient('https://aryzgrgjwjdxumbddank.supabase.co','sb_publishable_t2QNhjaGq0_kaY5IfsF87A_y7ep-837');
  if(navigator.onLine===false){
   const {data:cached}=await client.auth.getSession();
   if(cached.session?.user){
    window.gymAccount={client,user:cached.session.user,role:'member'};
    window.GymTheme?.restore(cached.session.user.id);
    document.getElementById('app').innerHTML='<p class="notice">Çevrimdışı içerik görünümü. Antrenman ekranı bağlantı gelince açılır.</p><div class="calendar-home"></div><section id="offlineSaved"></section>';
    document.getElementById('profileButton').hidden=true;
    const {installDailyContent}=await import('./daily-content/ui.mjs');installDailyContent(window.gymAccount);
    window.addEventListener('online',()=>location.reload(),{once:true});
    document.documentElement.style.visibility='visible';return;
   }
  }
  const {data,error}=await client.auth.getUser();
  if(error||!data.user){location.replace('./login.html');return;}
  const result=await client.from('profiles').select('role').eq('id',data.user.id).single();
  if(result.error||!['admin','coach','member'].includes(result.data?.role))throw Error('Hesap yetkin bulunamadı. Yöneticinle iletişime geç.');
  window.gymAccount={client,user:data.user,role:result.data.role};
  window.GymTheme?.restore(data.user.id);
  client.auth.onAuthStateChange(event=>{if(event==='SIGNED_OUT')location.replace('./login.html');});
  await load('./membership.js?v=flex-v2-20261114');
  await load('./contour-icons.js?v=approved-40-v1');
  await load('./motion.js?v=approved-40-v1');
  await load('./workout-metrics.js?v=quests-v4');
  await load('./workout-flex-v2.js?v=workout-rir-20261114');
  await load('./app.js?v=instagram-v3');
  await window.gymReady;
  if(window.GYM_QUESTS_ENABLED===true){
   try{const {installQuestFeature}=await import('./quests/bootstrap.mjs');installQuestFeature(window.gymAccount);}
   catch(error){console.error('Görev geliştirme ortamı başlatılamadı:',error.message);}
  }
  try{const {installDailyContent}=await import('./daily-content/ui.mjs');installDailyContent(window.gymAccount);}catch(error){console.error('Günlük içerik başlatılamadı:',error.message);}
  document.querySelector('footer span').textContent='Bulut kayıt · 1.2';
  document.documentElement.style.visibility='visible';
 }catch(error){
  document.body.replaceChildren();const main=document.createElement('main'),h=document.createElement('h1'),p=document.createElement('p'),a=document.createElement('a');
  h.textContent='Hesap açılamadı';p.textContent=error.message;a.href='./login.html';a.textContent='Giriş ekranına dön';main.append(h,p,a);document.body.append(main);document.documentElement.style.visibility='visible';
 }
})();

