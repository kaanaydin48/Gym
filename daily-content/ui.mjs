import {dayKey,sharePayload} from './engine.mjs';
import {createContentClient} from './client.mjs';
const labels={message:'Günün Mesajı',tip:'Antrenman İpucu',science:'Spor Bilimi'};
const icons={save:'<path d="M6 3h12v18l-6-4-6 4z"/>',share:'<path d="M12 16V3m-4 4 4-4 4 4M5 12v9h14v-9"/>',like:'<path d="M7 21H3V10h4m0 11h11l3-11h-8l1-7h-3L7 10z"/>',dislike:'<path d="M7 3H3v11h4m0-11h11l3 11h-8l1 7h-3l-4-7z"/>'};
function el(tag,className,text){const n=document.createElement(tag);if(className)n.className=className;if(text)n.textContent=text;return n;}
function button(type,label,action,active=false){const b=el('button','dc-icon');b.type='button';b.setAttribute('aria-label',label);b.title=label;b.setAttribute('aria-pressed',String(active));b.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+icons[type]+'</svg>';b.onclick=action;return b;}
export function installDailyContent(account){
 const api=createContentClient(account);let host,profile,status='',stopped=false,refreshing=false,lastAttempt=0,page=0;
 const css=el('link');css.rel='stylesheet';css.href=new URL('./style.css',import.meta.url).href;document.head.append(css);
 async function update(card,field,value){try{api.set(card,field,value);status='Değişiklik cihazına kaydedildi.';paint();await api.sync();status='Hesabınla eşitlendi.';paint();}catch{status='Bağlantı veya depolama sorunu. Kaydedilebilen işlemler bağlantı gelince yeniden denenecek.';paint();}}
 async function share(card){
  const payload=sharePayload(card);
  try{if(navigator.share)await navigator.share(payload);else await navigator.clipboard.writeText(payload.title+'\n'+payload.text+'\n'+payload.url);status=navigator.share?'Paylaşım menüsü kapandı.':'İçerik kopyalandı.';}
  catch(e){if(e.name==='AbortError')return;const box=el('textarea');box.value=payload.title+'\n'+payload.text+'\n'+payload.url;box.setAttribute('aria-label','Paylaşmak için kopyala');host?.append(box);box.select();status='Metni seçip kopyalayabilirsin.';return;}
  paint();
 }
 function cardView(card,day){
  const item=el('article','dc-card');item.setAttribute('aria-label',labels[card.kind]||'Kaydedilen içerik');
  const top=el('div','dc-top');top.append(el('span','dc-label',labels[card.kind]));
  const prefs=api.data.preferences[card.id]||{},actions=el('div','dc-actions');
  actions.append(button('save',prefs.saved?'Kaydı kaldır':'Kaydet',()=>update(card,'saved',!prefs.saved),!!prefs.saved),button('share',card.private?'Genel mesajı paylaş; kişisel kayıtların paylaşılmaz':'Paylaş',()=>share(card)));top.append(actions);
  const cover=el('img','ig-only ig-cover');
  const imageName={message:'studio',tip:'training',science:'movement'}[card.kind]||'studio';
  cover.alt='';cover.loading='lazy';cover.dataset.src='./assets/social/'+imageName+'.jpg';
  if(document.documentElement.dataset.theme==='instagram-minimal-v3')cover.src=cover.dataset.src;
  if(day){const time=el('time','ig-only ig-date',new Date(day+'T12:00:00').toLocaleDateString('tr-TR',{day:'numeric',month:'short'}));time.dateTime=day;top.insertBefore(time,actions);}
  item.append(top,cover,el('h3' ,'',card.title),el('p','dc-body',card.body));
  if(card.kind==='science'){
   const source=el('div','dc-source');source.append(el('span','',`${card.evidence} · Yayın: ${card.published}`));
   const a=el('a','','Orijinal kaynak ↗');if(/^https:\/\/pubmed\.ncbi\.nlm\.nih\.gov\/\d+\/$/.test(card.url||'')){a.href=card.url;a.target='_blank';a.rel='noopener noreferrer';source.append(a);}
   source.append(el('small','','Bilim arşivinden · Yeni haber değildir.'));item.append(source);
  }
  const footer=el('div','dc-feedback');footer.append(el('small','','Bu içerik sana uygun mu?'),button('like','Beğendim',()=>update(card,'reaction',prefs.reaction===1?0:1),prefs.reaction===1),button('dislike','Beğenmedim',()=>update(card,'reaction',prefs.reaction===-1?0:-1),prefs.reaction===-1));item.append(footer);return item;
 }
 function paint(){
  if(stopped)return;
  if(host?.isConnected){
   host.replaceChildren();host.append(el('h2','','Senin İçin'),el('p','dc-subtitle','Her gün sana özel içerikler.'));
   const daily=api.data.daily;
   if(daily){
    const rail=el('div','dc-rail');rail.setAttribute('aria-label','Günlük içerikler');rail.setAttribute('tabindex','0');
    daily.cards.forEach(c=>rail.append(cardView(c,daily.day)));host.append(rail);
    const dots=el('div','dc-dots');daily.cards.forEach((c,i)=>{const b=el('button');b.type='button';b.setAttribute('aria-label',labels[c.kind]+' kartına git');b.setAttribute('aria-current',String(page===i));b.onclick=()=>rail.children[i].scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'nearest',inline:'start'});b.dataset.kind=c.kind;b.dataset.label=labels[c.kind];dots.append(b);});host.append(dots);
    rail.onscroll=()=>{page=Math.max(0,Math.min(2,Math.round(rail.scrollLeft/(rail.children[0].getBoundingClientRect().width+12))));[...dots.children].forEach((b,i)=>b.setAttribute('aria-current',String(i===page)));};
    requestAnimationFrame(()=>{if(rail.isConnected)rail.scrollLeft=page*(rail.children[0].getBoundingClientRect().width+12);});
    const stamp=el('p','dc-status',daily.day!==dayKey()?`${daily.day} tarihli son kayıt gösteriliyor. Bağlantı gelince yenilenecek.`:'Bugünün seçkisi · Türkiye saati');host.append(stamp);
   }else host.append(el('p','dc-status','İçeriklerin hazırlanıyor. İlk yükleme için internet bağlantısı gerekli.'));
   const note=el('p','dc-status',status);note.setAttribute('role','status');host.append(note);
  }
  if(profile?.isConnected){profile.replaceChildren(el('h2','','Kaydettiğim İçerikler'));const saved=Object.values(api.data.preferences).filter(x=>x.saved).sort((a,b)=>b.updated_at.localeCompare(a.updated_at));if(!saved.length)profile.append(el('p','','Henüz kaydettiğin içerik yok.'));saved.forEach(x=>profile.append(cardView(x.card)));}
 }
 function mount(){
  if(stopped)return;const home=document.querySelector('.calendar-home');let changed=false;
  if(home&&!host?.isConnected){host=el('section','card dc-window');host.id='dailyContent';home.prepend(host);changed=true;}
  if((document.querySelector('#app h1')?.textContent==='Hesabım'||document.getElementById('offlineSaved'))&&!profile?.isConnected){profile=el('section','card dc-saved');document.getElementById('app').append(profile);changed=true;}
  if(changed)paint();
 }
 async function refresh(force=false){
  if(stopped||refreshing||(!force&&Date.now()-lastAttempt<60000))return;
  if(navigator.onLine===false){status='Çevrimdışısın. Son kaydedilen içerikler gösteriliyor.';paint();return;}
  refreshing=true;lastAttempt=Date.now();
  try{await api.sync();if(!api.data.daily||api.data.daily.day!==dayKey())await api.refresh();status='';}catch{status='Son kayıt korunuyor. Bağlantı kurulunca tekrar denenecek.';}finally{refreshing=false;paint();}
 }
 const observer=new MutationObserver(mount);observer.observe(document.getElementById('app'),{childList:true});
 const online=()=>refresh(true),visible=()=>{if(document.visibilityState==='visible')refresh();};
 window.addEventListener('online',online);document.addEventListener('visibilitychange',visible);
 // Check the date at minute boundaries; same-day polling never requests a new selection.
 const timer=setInterval(()=>{if(api.data.daily?.day!==dayKey())refresh();},1000);
 const stop=()=>{stopped=true;clearInterval(timer);observer.disconnect();host?.remove();profile?.remove();window.removeEventListener('online',online);document.removeEventListener('visibilitychange',visible);};
 const {data:subscription}=account.client.auth.onAuthStateChange((event,session)=>{if(event==='SIGNED_OUT'||session?.user&&session.user.id!==account.user.id)stop();});
 mount();refresh(true);return ()=>{stop();subscription?.subscription?.unsubscribe();};
}
