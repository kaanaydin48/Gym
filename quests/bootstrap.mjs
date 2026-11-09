import {assertDevelopmentApi} from './isolation.mjs';
import {createQuestClient} from './client.mjs';
import {mountQuestUI} from './ui.mjs';
import {mountCoachQuests} from './coach.mjs';
export function installQuestFeature(account) {
  // Deliberately fail closed until an explicitly approved hosted rollout exists.
  assertDevelopmentApi(account.client.supabaseUrl);
  const api=createQuestClient(account),cacheKey=`gym-quests-view-v1:${account.user.id}`;
  let model={quests:[],pending:true},ui,host,profileHost,coachHost,disposeCoach,stopped=false;
  try{const cached=JSON.parse(localStorage.getItem(cacheKey));if(cached)model={...cached,pending:true,error:'Son doğrulanmış kayıt. Bağlantı bekleniyor.'};}catch{}
  const css=document.createElement('link');css.rel='stylesheet';css.href=new URL('./quests.css',import.meta.url).href;document.head.append(css);
  function mount(){
    if(stopped)return;
    const area=document.querySelector('.home-insights');
    if(!area){
      if(document.querySelector('#app h1')?.textContent==='Hesabım'){
        if(!profileHost?.isConnected){profileHost=document.createElement('section');profileHost.className='q-card';document.getElementById('app').append(profileHost);}
        profileHost.replaceChildren();const heading=document.createElement('h2');heading.textContent='Görev profilim';
        const info=document.createElement('p');info.textContent=`Seviye ${model.level?.level||1} · ${model.activeTitle||model.level?.title||'Başlangıç'}`;
        const select=document.createElement('select');select.setAttribute('aria-label','Profilde gösterilen unvan');
        for(const title of model.titles||[]){const option=document.createElement('option');option.textContent=title;option.selected=title===(model.activeTitle||model.level?.title);select.append(option);}
        select.onchange=async()=>{try{const {error}=await api.rpc('quest_select_title',{title:select.value});if(error)throw error;model.activeTitle=select.value;info.textContent=`Seviye ${model.level?.level||1} · ${select.value}`;}catch(error){info.textContent=error.message;}};
        profileHost.append(heading,info,select);
      }
      if(['coach','admin'].includes(account.role)&&document.querySelector('#app h1')?.textContent==='Hesabım'&&!coachHost?.isConnected){
        disposeCoach?.();coachHost=document.createElement('div');document.getElementById('app').append(coachHost);disposeCoach=mountCoachQuests(coachHost,account);
      }
      return;
    }
    if(host?.parentElement===area)return;
    ui?.destroy();host=document.createElement('div');host.id='questCardHost';area.prepend(host);
    ui=mountQuestUI({host,model,onAction:async(q,evidence)=>{
      api.queue.enqueue(q.kind==='manual'?'submission':q.kind,q.id,evidence);
      model={...model,pending:true};ui.update(model);
      // Local queue succeeds even offline; do not claim a confirmed reward.
      try{await api.queue.flush();await refresh();}catch{model={...model,error:'İşlem cihazda saklandı. Bağlantı gelince doğrulanacak.'};ui.update(model);}
    },onGoal:async args=>{const {error}=await api.rpc('quest_personal_goal',args);if(error)throw error;},onTitle:async title=>{const {error}=await api.rpc('quest_select_title',{title});if(error)throw error;},
    onAcknowledge:async reward_key=>{const {data,error}=await api.rpc('quest_acknowledge',{reward_key});return !error&&data===true;}});
  }
  async function refresh(){
    if(stopped)return;
    try{await api.queue.flush();const next=await api.read();if(stopped)return;model=next;try{localStorage.setItem(cacheKey,JSON.stringify(model));}catch{};mount();ui?.update(model);
      if(ui&&host?.isConnected&&!model.pending&&!document.getElementById('questDetail')?.open){
        const rewards=[...(model.badges||[]).map(b=>[`badge:${b.id}`,b.name]),...(model.level?.level>1?[[`level:${model.level.level}`,`Seviye ${model.level.level}`]]:[])];
        for(const [key,title] of rewards)if(await ui.celebrate(key,title))break;
      }
    }
    catch{model={...model,pending:true,error:'Bağlantı kurulamadı. Son doğrulanmış ilerleme gösteriliyor.'};mount();ui?.update(model);}
  }
  const observer=new MutationObserver(mount);observer.observe(document.getElementById('app'),{childList:true});
  const visible=()=>{if(document.visibilityState==='visible')refresh();};
  document.addEventListener('visibilitychange',visible);window.addEventListener('online',refresh);
  const timer=setInterval(refresh,60000);mount();refresh();
  const stop=()=>{stopped=true;clearInterval(timer);observer.disconnect();document.removeEventListener('visibilitychange',visible);window.removeEventListener('online',refresh);ui?.destroy();disposeCoach?.();host?.remove();profileHost?.remove();};
  const {data:subscription}=account.client.auth.onAuthStateChange((event,session)=>{if(event==='SIGNED_OUT'||session?.user&&session.user.id!==account.user.id)stop();});
  return ()=>{stop();subscription?.subscription?.unsubscribe();};
}
