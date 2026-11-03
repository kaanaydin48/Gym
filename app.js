'use strict';
const $=id=>document.getElementById(id), clone=o=>JSON.parse(JSON.stringify(o)), uid=()=>crypto.randomUUID(), esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dateKey=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const today=dateKey(new Date()), KEY='gym-tracker-pro-v1:'+window.gymAccount.user.id;
const exercise=(name,muscle,equipment,type='external',factor=1)=>({id:uid(),name,muscle,equipment,type,factor,sets:4,reps:'8–12',rir:2,rest:90,superset:''});
const library=[exercise('Dumbbell Bench Press','Göğüs','Dambıl','external',2),exercise('Incline Dumbbell Bench Press','Göğüs','Dambıl','external',2),exercise('Chest Fly Makine','Göğüs','Makine'),exercise('Dips','Arka kol','Vücut ağırlığı','body'),exercise('Cable Triceps Pushdown','Arka kol','Kablo'),exercise('Overhead Cable Triceps Extension','Arka kol','Kablo'),exercise('Dumbbell Curl','Ön kol','Dambıl','external',2),exercise('Hammer Curl','Ön kol','Dambıl','external',2),exercise('Lat Pulldown','Sırt','Makine'),exercise('Seated Cable Row','Sırt','Kablo'),exercise('Dumbbell Shoulder Press','Omuz','Dambıl','external',2),exercise('Lateral Raise','Omuz','Dambıl','external',2),exercise('Leg Press','Bacak','Makine'),exercise('Leg Curl','Bacak','Makine'),exercise('Goblet Squat','Bacak','Dambıl'),exercise('Plank','Karın','Vücut ağırlığı','body')];
// Additional catalog entries keep stable IDs across devices and backups.
const additionalLibrary=[
 exercise('Barbell Bench Press','Göğüs','Barbell'),
 exercise('Chest Press Makine','Göğüs','Makine'),
 exercise('Cable Crossover','Göğüs','Kablo'),
 exercise('Barfiks','Sırt','Vücut ağırlığı','body'),
 exercise('Assisted Pull-up','Sırt','Makine'),
 exercise('Tek Kol Dumbbell Row','Sırt','Dambıl'),
 exercise('Chest-Supported Row','Sırt','Dambıl','external',2),
 exercise('Reverse Pec Deck','Omuz','Makine'),
 exercise('Cable Lateral Raise','Omuz','Kablo'),
 exercise('Face Pull','Omuz','Kablo'),
 exercise('Smith Squat','Bacak','Makine'),
 exercise('Bulgarian Split Squat','Bacak','Dambıl','external',2),
 exercise('Romanian Deadlift','Bacak','Barbell'),
 exercise('Leg Extension','Bacak','Makine'),
 exercise('Hip Thrust','Bacak','Barbell'),
 exercise('Cable Glute Kickback','Bacak','Kablo'),
 exercise('Standing Calf Raise','Bacak','Makine'),
 exercise('Seated Calf Raise','Bacak','Makine'),
 exercise('Preacher Curl','Ön kol','Barbell'),
 exercise('Incline Dumbbell Curl','Ön kol','Dambıl','external',2),
 exercise('Rope Triceps Pushdown','Arka kol','Kablo'),
 exercise('Dead Bug','Karın','Vücut ağırlığı','body'),
 exercise('Cable Crunch','Karın','Kablo'),
 exercise('Reverse Crunch','Karın','Vücut ağırlığı','body')
].map((e,i)=>({...e,id:'catalog-v2-'+i}));
library.push(...additionalLibrary);
function extendExerciseLibrary(){
 const normalize=name=>name.trim().toLocaleLowerCase('tr').replace(/\s+/g,' ');
 const names=new Set(state.library.map(e=>normalize(e.name)));
 const ids=new Set(state.library.map(e=>e.id));
 for(const e of additionalLibrary){
  if(ids.has(e.id)||names.has(normalize(e.name)))continue;
  state.library.push(clone(e));names.add(normalize(e.name));ids.add(e.id);dirty=true;
 }
}
const program=(name,indices)=>({id:uid(),name,version:1,exercises:indices.map(i=>clone(library[i])),history:[]});
// Shared starter program stays available independently of coach assignments.
const beginnerProgram={id:'beginner-full-body-v1',name:'Başlangıç – Full Body',version:1,history:[],
 note:`Haftada 3 gün, arada bir gün dinlenerek aynı programı uygula (ör. Pazartesi–Çarşamba–Cuma).
Isınma: 5–8 dakika yürüyüş veya bisiklet. İlk bacak, göğüs ve sırt hareketinden önce hafif ağırlıkla 1–2 hazırlık seti yap; bunlar tabloda sayılan setlere dahil değil.
İlk 2 hafta: Tablodaki 2 setle devam et, hareketlerin tekniğini öğren.
3. haftadan itibaren: Toparlanma iyiyse ilk 3 hareketi 3 sete çıkar. Diğerleri 2 set kalsın. Set artışı otomatik uygulanmaz; koçunla düzenle.
Ağırlık artırma: Bir hareketin bütün setlerinde üst tekrar sınırına hedef RIR ile iki antrenman üst üste ulaşırsan en küçük ağırlık artışını yap.
Plank: Belin çökmeden durabildiğin süreyi kaydet. Form bozulmadan bitir.
RIR 3: Set sonunda düzgün teknikle yaklaşık 3 tekrar daha yapabilecek durumda ol.`,
 exercises:[
 ['Leg Press','Bacak','Makine','10–12',3,120],
 ['Machine Chest Press','Göğüs','Makine','8–12',3,120],
 ['Lat Pulldown','Sırt','Makine','10–12',3,120],
 ['Seated Leg Curl','Bacak','Makine','10–15','2–3',90],
 ['Seated Cable Row','Sırt','Kablo','10–12','2–3',90],
 ['Dumbbell Lateral Raise','Omuz','Dambıl','12–15','2–3',90],
 ['Standing Calf Raise','Bacak','Makine','12–15','2–3',90],
 ['Plank','Karın','Vücut ağırlığı','20–30','',60]
 ].map(([name,muscle,equipment,reps,rir,rest],i)=>({id:'beginner-full-body-ex-'+i,name,muscle,equipment,reps,rir:rir==='2–3'?3:rir,rirLabel:rir,rest,restLabel:i===5||i===6?'60–90':String(rest),sets:2,type:i===7?'body':'external',factor:i===5?2:1,superset:'',duration:i===7}))};
function programNote(p){
 if(!p?.note)return '';
 const labels=['Isınma:','İlk 2 hafta:','3. haftadan itibaren:','Ağırlık artırma:','Plank:','RIR 3:'];
 const lines=String(p.note).split('\n').map(line=>line.trim()).filter(Boolean);
 const intro=[],items=[];
 for(const line of lines){
  const label=labels.find(label=>line.startsWith(label));
  if(label)items.push('<li style="margin:0 0 14px;padding-left:4px"><strong style="font-weight:700">'+esc(label)+'</strong> '+esc(line.slice(label.length).trim())+'</li>');
  else intro.push('<p style="white-space:pre-line;margin:0 0 18px;line-height:1.6">'+esc(line)+'</p>');
 }
 return '<section class="card program-guidance"><h3 style="font-weight:700;margin-bottom:18px">Uygulama ve İlerleme:</h3>'+intro.join('')+(items.length?'<ul style="list-style:disc;padding-left:22px;margin:0;line-height:1.6">'+items.join('')+'</ul>':'')+'</section>';
}
function beginnerCard(){return `<section class="card"><span class="badge">HER ZAMAN KULLANILABİLİR</span><h2>${esc(beginnerProgram.name)}</h2><p>Haftada 3 gün · 8 hareket · 16 set</p><button onclick="showBeginnerProgram()">Programı görüntüle</button></section>`;}
function showBeginnerProgram(){show(`<h2>${esc(beginnerProgram.name)}</h2>${programNote(beginnerProgram)}${beginnerProgram.exercises.map(e=>`<div class="list-item"><h3>${esc(e.name)}</h3><p>${e.sets} × ${esc(e.reps)} ${e.duration?'sn':'tekrar'} · RIR ${esc(e.rirLabel||'—')} · ${esc(e.restLabel)} sn dinlenme</p></div>`).join('')}<button onclick="$('modal').close();go('workout')">Antrenmanda seç</button>`);}
function selectablePrograms(){
 if(gymAccount.role==='member')return [{value:'beginner',p:beginnerProgram},...(coachAssignedProgram?[{value:'coach',p:coachAssignedProgram}]:[])];
 return [...state.programs.map((p,i)=>({value:String(i),p})),{value:'beginner',p:beginnerProgram}];
}
const initial=()=>({schema:'gym-tracker-pro',version:1,programs:[program('Göğüs + Arka Kol',[0,1,2,3,4,5]),program('Sırt + Ön Kol',[6,7,8,9]),program('Omuz + Bacak',[10,11,12,13])],active:0,library:clone(library),days:{},profile:{name:window.gymAccount.user.user_metadata?.full_name||'Sporcu',goal:'Düzenli ve güçlü',weight:'',height:''},settings:{theme:'light',unit:'kg',week:'monday'},bodyweights:[]});
let state,storageError=false;try{state=JSON.parse(localStorage.getItem(KEY))||initial();if(state.schema!=='gym-tracker-pro')throw Error();}catch{state=initial();storageError=true;}

// Recover the known archive once, without replacing any existing day.
function recoverOctober16(){
  const marker='archive-2026-10-16-v1';
  if(storageError||state.migrations?.includes(marker))return;
  const next=clone(state);
  if(!Object.prototype.hasOwnProperty.call(next.days,'2026-10-16')){
    const rows=[[[20,15,8],[25,10,4],[27.5,8,2],[30,6,0]],[[25,8,2],[27.5,4,0],[27.5,3,0]],[[44,12,3],[49,8,2]],[[70,12,3],[70,12,1],[70,12,0],[70,8,0]],[[35,12,2],[30,10,'']],[]];
    const reps=['8–12','6–10','10–15','8–12','10–12','10–15'];
    const rests=[90,120,60,90,60,60];
    next.days['2026-10-16']={id:'archive-2026-10-16',kind:'workout',name:'Göğüs + Arka Kol',programId:'archive-chest-2026-10-16',version:1,
      exercises:rows.map((sets,i)=>({...clone(library[i]),id:'archive-oct16-ex-'+i,reps:reps[i],rest:rests[i],logs:Array.from({length:4},(_,j)=>sets[j]?{kg:sets[j][0],reps:sets[j][1],rir:sets[j][2],done:true}:{kg:'',reps:'',rir:'',done:false})})),
      started:null,finished:null,note:'16 Ekim sohbet arşivinden bilinen 15 set geri yüklendi. Cable Triceps Pushdown 2. set RIR bilgisi bilinmiyor. Overhead Cable Triceps Extension set değerleri ve antrenman süresi arşivde yok; boş bırakıldı. Boş setler yapılmadı anlamına gelmez.'};
  }
  next.migrations=[...(next.migrations||[]),marker];
  try{localStorage.setItem(KEY,JSON.stringify(next));state=next;}catch{storageError=true;}
}
// Legacy archives are imported explicitly from the account screen.
let tab='calendar',selected=today,month=new Date(new Date().getFullYear(),new Date().getMonth(),1),draft=null,pending=null;
let cloudReconcile=false;
let dirty=false, saving=false, cloudReady=false, cloudRevision=0, cloudMessage='Bulut kontrol ediliyor…';
const SYNC_KEY=KEY+':sync';
const invalidSets=new Map();
let autoSaveTimer=null;
function queueCloudSave(){
 clearTimeout(autoSaveTimer);
 autoSaveTimer=setTimeout(async()=>{
  if(!dirty||cloudReconcile||invalidSets.size||draft)return;
  if(saving){queueCloudSave();return;}
  if(!cloudReady)return;
  await saveAll({silentSuccess:true});
  if(dirty&&!cloudReconcile&&cloudReady)queueCloudSave();
 },1800);
}
function save(){
 dirty=true;
 try{
  localStorage.setItem(SYNC_KEY,JSON.stringify({pending:true,revision:cloudRevision}));
  localStorage.setItem(KEY,JSON.stringify(state));
  storageError=false;
 }catch(e){
  storageError=true;
  cloudMessage='Cihaz kaydı başarısız! Depolamayı kontrol et.';
  toast(cloudMessage);
 }
 updateSaveStatus();
 if(!storageError)queueCloudSave();
 return !storageError;
}
function updateSaveStatus(){
 const text=saving?'Buluta kaydediliyor…':dirty?'Kaydedilmemiş değişiklikler var.':cloudMessage;
 const notice=$('unsavedNotice');if(notice){notice.hidden=tab==='workout'||(!dirty&&cloudReady);notice.textContent=text;}
 const status=$('allSaveStatus');if(status)status.textContent=text;
 const button=$('saveAllButton');if(button)button.disabled=saving||cloudReconcile;
 const finish=$('finishWorkoutButton');if(finish){finish.classList.toggle('is-saved',!!state.days[selected]?.finished&&!dirty&&!saving);finish.disabled=saving;finish.textContent=saving?'Kaydediliyor…':state.days[selected]?.finished?(dirty?'Kaydı yeniden dene':'Kaydedildi ✓'):'Antrenmanı bitir ✓';}
 const side=document.querySelector('.side-bottom');if(side)side.textContent=cloudMessage;
}
function updateShoulderLegs(){
 const marker='shoulder-legs-v2-20261028';
 if(storageError||state.migrations?.includes(marker)||gymAccount.role==='member')return;
 const i=state.programs.findIndex(p=>p.name==='Omuz + Bacak');
 if(i<0)return;
 const specs=[['Seated Dumbbell Shoulder Press',3,'6–10'],['Squat',3,'6–10'],['Dumbbell Lateral Raise',4,'12–20'],['Leg Press',4,'8–12'],['Reverse Pec Deck',3,'12–15'],['Leg Extension',3,'10–15'],['Seated Leg Curl',3,'10–15'],['Standing Calf Raise',2,'12–20']];
 const p=state.programs[i];
 p.history.push({version:p.version,name:p.name,exercises:clone(p.exercises),saved:new Date().toISOString()});
 p.exercises=specs.map(([name,sets,reps])=>{
  let e=state.library.find(x=>x.name===name);
  if(!e){e=exercise(name,/Press|Raise|Deck/.test(name)&&name!=='Leg Press'?'Omuz':'Bacak',/Dumbbell/.test(name)?'Dambıl':name==='Squat'?'Barbell':'Makine','external',/Dumbbell/.test(name)?2:1);state.library.push(clone(e));}
  return {...clone(e),sets,reps,rir:2,rest:name==='Squat'||name==='Leg Press'?150:75};
 });
 p.cardio={name:'Koşu Bandı',minutes:10,intensity:'Hafif–orta'};
 p.version++;
 state.migrations=[...(state.migrations||[]),marker];
 save();
}
async function initializeCloud(){
 if(saving)return;
 cloudReady=false;
 try{
  const {data,error}=await gymAccount.client.from('gym_account_state').select('state,revision').eq('member_id',gymAccount.user.id).maybeSingle();
  if(error)throw error;
  let meta=null;try{meta=JSON.parse(localStorage.getItem(SYNC_KEY));}catch{}
  const local=localStorage.getItem(KEY);
  if(data){
   const remote=validateBackup(data.state);cloudRevision=data.revision;
   if(local && (!meta||meta.pending)){
    // Preserve unsent local data; merging remains explicit and reviewable.
    dirty=true;cloudMessage='Cihaz kayıtları aktarım bekliyor.';
    pending=remote;cloudReconcile=true;previewImport();
   }else{state=remote;cloudMessage='Buluttan yüklendi · rev '+cloudRevision;}
  }else{cloudRevision=0;dirty=!!local;cloudMessage=local?'Cihaz kayıtları buluta aktarılmayı bekliyor.':'Bulut hazır · Henüz kayıt yok.';}
  cloudReady=true;
  if(!cloudReconcile)updateShoulderLegs();
 }catch(e){cloudMessage='Bulut okunamadı. Girdiler korunuyor; bağlantını kontrol edip yeniden dene.';cloudReady=false;}
 render();
}
async function saveAll({silentSuccess=false}={}){
 if(saving)return false;
 if(cloudReconcile){previewImport();return false;}
 if(invalidSets.size){const entry=invalidSets.values().next().value;selected=entry.date;go('workout');toast('Geçersiz set değerini düzelt: '+entry.label);return false;}
 if(draft&&!saveProgram()){editor();return false;}
 let snapshot;try{snapshot=clone(validateBackup(state));}catch(e){toast(e.message);return false;}
 saving=true;updateSaveStatus();
 try{
  // Save a retryable local copy before the network request. A failed request stays pending.
  localStorage.setItem(SYNC_KEY,JSON.stringify({pending:true,revision:cloudRevision}));
  localStorage.setItem(KEY,JSON.stringify(snapshot));storageError=false;
  if(!cloudReady)throw Error('Bulut bağlantısı yok.');
  const {data,error}=await gymAccount.client.rpc('save_gym_state',{payload:snapshot,expected_revision:cloudRevision});
  if(error)throw error;
  cloudRevision=data;
  const check=await gymAccount.client.from('gym_account_state').select('revision').eq('member_id',gymAccount.user.id).single();
  if(check.error||check.data.revision!==cloudRevision)throw Error('Kayıt doğrulanamadı.');
  localStorage.setItem(SYNC_KEY,JSON.stringify({pending:false,revision:cloudRevision}));
  dirty=JSON.stringify(state)!==JSON.stringify(snapshot);
  cloudMessage='Buluta kaydedildi ve doğrulandı · rev '+cloudRevision;
  if(!silentSuccess||dirty)toast(dirty?'Buluta kaydedildi. İşlem sırasında yaptığın yeni değişiklikleri de kaydet.':'Tüm girdiler buluta kaydedildi ve doğrulandı.');
  return true;
 }catch(e){
  dirty=true;
  cloudMessage=String(e.message).includes('GYM_CONFLICT')?'Başka cihazda yeni kayıt var. Bulutu yeniden kontrol et ve kayıtları birleştir.':'Bulut kaydı doğrulanamadı. Cihaz kopyası korunuyor; yeniden dene.';
  toast(cloudMessage);return false;
 }finally{saving=false;updateSaveStatus();}
}
async function retryCloud(){
 if(saving)return;
 // Keep unsaved edits available for explicit reconciliation.
 if(dirty){try{localStorage.setItem(SYNC_KEY,JSON.stringify({pending:true}));localStorage.setItem(KEY,JSON.stringify(state));}catch{toast('Önce JSON yedeği indir; cihaz depolaması kullanılamıyor.');return;}}
 await initializeCloud();
}
window.addEventListener('beforeunload',event=>{if(dirty||draft){event.preventDefault();event.returnValue='';}});
function toast(s){$('toast').textContent=s;$('toast').style.display='block';clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>$('toast').style.display='none',4500)}
function show(html){$('modalBody').innerHTML=html;if(!$('modal').open)$('modal').showModal()}
const navIcons={
 calendar:'<path d="m3 10 9-7 9 7"/><path d="M5 9v12h14V9"/><path d="M9 21v-8h6v8"/>',
 workout:'<path d="M6 12h12M4 8v8M7 6v12M17 6v12M20 8v8"/>',
 progress:'<path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 6-7"/><path d="M16 7h4v4"/>',
 programs:'<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1M9 10h6M9 14h6M9 18h4"/>'
};
const labels=[['calendar','Ana Sayfa'],['workout','Antrenman'],['progress','Gelişim'],['programs','Programlar']];
function navIcon(id){return '<svg class="nav-icon" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+navIcons[id]+'</svg>';}

function go(t){tab=t;render();window.scrollTo(0,0)}
/* Single Instagram-minimal theme. Legacy saved theme preferences are ignored, not deleted. */
function currentTheme(){return 'minimal';}
function chooseTheme(){return;}
function themePicker(){return '';}
function applyTheme(){
 document.body.classList.remove('dark','theme-sage','theme-cobalt','theme-lavender','theme-orange','theme-cream','theme-dark');
}
function render(){extendExerciseLibrary();applyTheme();const profileButton=$('profileButton');if(profileButton){const name=String(state.profile.name||gymAccount.user.user_metadata?.full_name||'Hesabım').trim()||'Hesabım';profileButton.textContent=name;profileButton.setAttribute('aria-label',name+' · Hesabım');}$('greeting').textContent=`Merhaba, ${state.profile.name||'sporcu'}.`;
const nav=labels.map(([id,name])=>`<button class="${tab===id?'active':''}" onclick="go('${id}')"><b>${navIcon(id)}</b>${name}</button>`).join('');$('desktopNav').innerHTML=nav;$('mobileNav').innerHTML=nav;$('app').innerHTML='<p id="unsavedNotice" class="notice" role="status" hidden></p>'+(storageError?'<p class="notice">Yerel kayıt okunamadı veya yazılamadı. Mevcut depolama üzerine otomatik yazılmadı. Yedeğinizi kontrol edin.</p>':'')+({calendar:calendarView,workout:workoutView,progress:progressView,programs:programsView,settings:settingsView}[tab]());renderRestTimer();showRestNotice();updateSaveStatus();GymMotion.refresh();if(tab==='settings'&&gymAccount.role==='member')loadAssignedProgram();}
const fmtDate=d=>new Date(d+'T12:00:00').toLocaleDateString('tr-TR',{day:'numeric',month:'long',year:'numeric'});
const allWork=()=>Object.entries(state.days).filter(([,d])=>d.kind==='workout');
function totals(d){let ext=0,body=0,sets=0;for(const e of d.exercises||[])for(const s of e.logs||[])if(s.done){sets++;const v=(+s.kg||0)*(+s.reps||0)*(e.factor||1);if(e.type==='body')body+=v;else ext+=v}return {ext,body,sets}}
const num=n=>Math.round(n).toLocaleString('tr-TR');
const kgDisplay=n=>state.settings.unit==='lb'?Math.round(n*2.20462262*100)/100:n;
function summary(){let a=allWork(),sets=a.reduce((n,[,d])=>n+totals(d).sets,0);return `<div class="metrics"><div class="metric"><small>TAMAMLANAN ANTRENMAN</small><strong>${a.filter(([,d])=>d.finished).length}</strong><small>Toplam kayıt</small></div><div class="metric"><small>ÇALIŞMA SETİ</small><strong>${sets}</strong><small>Tamamlandı olarak işaretli</small></div><div class="metric"><small>DİNLENME GÜNÜ</small><strong>${Object.keys(state.days).filter(k=>k<today&&state.days[k]?.kind==='rest').length}</strong><small>Toparlanma da gelişimdir</small></div><div class="metric"><small>PROGRAM SAYISI</small><strong>${selectablePrograms().length}</strong><small>${esc(gymAccount.role==='member'?beginnerProgram.name:state.programs[state.active]?.name||'Program seç')}</small></div></div>`}
function firstWorkoutDate(){return Object.keys(state.days).filter(k=>state.days[k]?.kind==='workout').sort()[0]||null;}
function isAutomaticRestDay(key){const first=firstWorkoutDate();if(!first)return false;const monthStart=first.slice(0,7)+'-01';return key>=monthStart&&key<today&&!state.days[key];}

let dailySummaryLayout=localStorage.getItem('gym-daily-summary-layout')==='sankey'?'sankey':'radial';
let dailySummaryExercise=-1;
function showDailySummary(){const d=state.days[selected];if(!d||!d.finished)return;dailySummaryExercise=-1;renderDailySummaryModal();}
function switchDailySummaryLayout(v){dailySummaryLayout=v==='sankey'?'sankey':'radial';localStorage.setItem('gym-daily-summary-layout',dailySummaryLayout);dailySummaryExercise=-1;renderDailySummaryModal();}
function pickDailySummaryExercise(i){dailySummaryExercise=dailySummaryExercise===i?-1:i;renderDailySummaryModal();}
function closeDailySummary(){document.getElementById('dailySummaryOverlay')?.remove();}
async function shareDailySummaryStory(){
 const overlay=document.getElementById('dailySummaryOverlay'),svg=overlay?.querySelector('.daily-summary-chart svg'),d=state.days[selected];
 if(!svg||!d)return;
 const btn=overlay.querySelector('.daily-summary-share');if(btn){btn.disabled=true;btn.textContent='Hazırlanıyor…';}
 try{
  const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1920;
  const ctx=canvas.getContext('2d');if(!ctx)throw Error('Canvas kullanılamıyor');
  ctx.fillStyle='#F7F8FC';ctx.fillRect(0,0,1080,1920);
  const rr=(x,y,w,h,r)=>{ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();};
  // One soft rounded white story card, with consistent system typography.
  ctx.fillStyle='#FFFFFF';rr(42,205,996,1480,42);
  const logs=(d.exercises||[]).flatMap(e=>(e.logs||[]).filter(x=>x.done).map(x=>({kg:(+x.kg||0)*(e.factor||1),reps:+x.reps||0})));
  const totalSets=logs.length,totalVolume=logs.reduce((sum,x)=>sum+x.kg*x.reps,0);
  const mins=d.started&&d.finished?Math.max(0,Math.round((d.finished-d.started)/60000)):null;
  const title=d.name||'Antrenman';
  ctx.textAlign='center';ctx.fillStyle='#202020';ctx.font='700 57px -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
  ctx.fillText(title.length>28?title.slice(0,27)+'…':title,540,316);
  ctx.fillStyle='#777';ctx.font='32px -apple-system, BlinkMacSystemFont, system-ui, sans-serif';ctx.fillText(fmtDate(selected),540,378);
  ctx.fillStyle='#F7F8FC';rr(82,430,916,172,26);
  const metrics=[{value:String(totalSets),label:'Set'},{value:mins===null?'—':mins+' dk',label:'Süre'},{value:num(kgDisplay(totalVolume))+' '+state.settings.unit,label:'Hacim'}];
  metrics.forEach((m,i)=>{const x=82+(i+.5)*(916/3);ctx.fillStyle='#202020';ctx.font='700 '+(m.value.length>9?36:44)+'px -apple-system, BlinkMacSystemFont, system-ui, sans-serif';ctx.fillText(m.value,x,500);ctx.fillStyle='#777';ctx.font='29px -apple-system, BlinkMacSystemFont, system-ui, sans-serif';ctx.fillText(m.label,x,552);});
  ctx.textAlign='start';
  const copy=svg.cloneNode(true);copy.setAttribute('xmlns','http://www.w3.org/2000/svg');copy.removeAttribute('style');
  copy.querySelectorAll('text').forEach(t=>{t.setAttribute('font-family','-apple-system, BlinkMacSystemFont, Arial, sans-serif');t.style.fontFamily='Arial, sans-serif';});
  const raw=new XMLSerializer().serializeToString(copy),url=URL.createObjectURL(new Blob([raw],{type:'image/svg+xml;charset=utf-8'}));
  try{
   const img=new Image();await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject;img.src=url;});
   const box=svg.viewBox.baseVal,ratio=(box.width||390)/(box.height||440);
   const maxW=940,maxH=940,drawW=Math.min(maxW,maxH*ratio),drawH=drawW/ratio;
   ctx.drawImage(img,(1080-drawW)/2,625+(940-drawH)/2,drawW,drawH);
  }finally{URL.revokeObjectURL(url);}
  ctx.fillStyle='#777';ctx.font='28px -apple-system, BlinkMacSystemFont, system-ui, sans-serif';ctx.textAlign='center';ctx.fillText('GYM TRADER PRO',540,1600);ctx.textAlign='start';
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw Error('Görsel oluşturulamadı');
  const file=new File([blob],'gym-trader-pro-hikaye-'+selected+'.png',{type:'image/png'});
  if(navigator.canShare?.({files:[file]})&&navigator.share){try{await navigator.share({files:[file],title:'Gym Trader Pro · Antrenman Özeti'});return;}catch(err){if(err.name==='AbortError')return;}}
  const link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download=file.name;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(link.href),2000);
  toast('Hikâye görseli kaydedildi. Instagram’da paylaşabilirsin.');
 }catch(err){console.error('Story share failed',err);toast('Paylaşım görseli hazırlanamadı. Tekrar dene.');}
 finally{if(btn){btn.disabled=false;btn.textContent='Paylaş ↗';}}
}
function renderDailySummaryModal(){
 const d=state.days[selected];if(!d||!d.finished)return;
 const palette=['#E6A078','#8AAFC9','#B09ED1','#8CBCA7','#DCA6AF','#D2BC83','#8DBDBB','#B9A4C1','#A6BBD8','#C3B4A0'];
 const exercises=(d.exercises||[]).map(e=>{const logs=(e.logs||[]).filter(s=>s.done),volume=logs.reduce((n,s)=>n+(+s.kg||0)*(+s.reps||0)*(e.factor||1),0);return {name:e.name,volume,max:Math.max(0,...logs.map(s=>(+s.kg||0)*(e.factor||1))),sets:logs.length,reps:logs.reduce((n,s)=>n+(+s.reps||0),0)};}).filter(e=>e.sets);
 const volume=exercises.reduce((n,e)=>n+e.volume,0),sets=exercises.reduce((n,e)=>n+e.sets,0);
 const minutes=d.started&&d.finished?Math.max(0,Math.round((d.finished-d.started)/60000)):null;
 const active=dailySummaryExercise>=0?exercises[dailySummaryExercise]:null;
 const duration=minutes===null?'—':minutes+' dk';
 const totalLabel=num(kgDisplay(volume))+' '+state.settings.unit;
 const n=exercises.length, radial=dailySummaryLayout==='radial';
 const H=Math.max(radial?390:350,n*59+34),W=390;
 const centerX=radial?195:74,centerY=H/2;
 const hub='<circle cx="'+centerX+'" cy="'+centerY+'" r="70" fill="#fff" stroke="#E7E3DF" stroke-width="2"/>'+
 '<text x="'+centerX+'" y="'+(centerY-27)+'" text-anchor="middle" font-size="11" fill="#777">'+esc(active?active.name:d.name)+'</text>'+
 '<text x="'+centerX+'" y="'+(centerY+4)+'" text-anchor="middle" font-size="'+(active?19:29)+'" font-weight="700" fill="#202020">'+(active?num(kgDisplay(active.volume))+' '+state.settings.unit:sets+' SET')+'</text>'+
 '<text x="'+centerX+'" y="'+(centerY+25)+'" text-anchor="middle" font-size="12" fill="#555">'+(active?'Maks. '+num(kgDisplay(active.max))+' '+state.settings.unit:duration)+'</text>'+
 '<text x="'+centerX+'" y="'+(centerY+43)+'" text-anchor="middle" font-size="11" fill="#777">'+(active?active.sets+' set · '+active.reps+' tekrar':radial?totalLabel:'')+'</text>';
 let paths='',cards='';
 exercises.forEach((e,i)=>{
  const color=palette[i%palette.length],dim=dailySummaryExercise>=0&&dailySummaryExercise!==i,opacity=dim?'.16':'.83';
  let x,y,cx,cy;
  if(radial){const angle=-Math.PI/2+(2*Math.PI*i/n);cx=centerX+Math.cos(angle)*150;cy=centerY+Math.sin(angle)*Math.min(160,H/2-32);x=Math.max(2,Math.min(W-126,cx-62));y=Math.max(2,Math.min(H-49,cy-23));}
  else{x=264;y=10+i*59;cx=x;cy=y+23;}
  const targetX=radial?x+62:cx,targetY=radial?y+23:cy;
  const dx=targetX-centerX,dy=targetY-centerY,len=Math.max(1,Math.hypot(dx,dy)),ux=dx/len,uy=dy/len,nx=-uy,ny=ux;
  const startX=centerX+70*ux,startY=centerY+70*uy,endX=radial?targetX-25*ux:251,endY=radial?targetY-17*uy:targetY;
  const width=3+17*(volume?e.volume/Math.max(...exercises.map(a=>a.volume),1):0);
  const bend=radial?(i%2?9:-9):0;
  const midX=(startX+endX)/2+nx*bend,midY=(startY+endY)/2+ny*bend;
  paths+='<path d="M'+(startX+nx*width/2)+' '+(startY+ny*width/2)+' Q'+midX+' '+midY+' '+(endX+nx*2)+' '+(endY+ny*2)+' L'+(endX-nx*2)+' '+(endY-ny*2)+' Q'+midX+' '+midY+' '+(startX-nx*width/2)+' '+(startY-ny*width/2)+'Z" fill="'+color+'" opacity="'+opacity+'"/>';
  cards+='<g role="button" tabindex="0" aria-label="'+esc(e.name)+'" onclick="pickDailySummaryExercise('+i+')" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();pickDailySummaryExercise('+i+')}" style="cursor:pointer;opacity:'+(dim?'.5':'1')+'"><rect x="'+x+'" y="'+y+'" width="124" height="47" rx="9" fill="#fff" stroke="'+(dailySummaryExercise===i?color:'#E7E3DF')+'" stroke-width="'+(dailySummaryExercise===i?2:1)+'"/><rect x="'+(x+3)+'" y="'+(y+6)+'" width="4" height="35" rx="2" fill="'+color+'"/><text x="'+(x+12)+'" y="'+(y+17)+'" font-size="10" font-weight="600" fill="#292929">'+esc(e.name.length>19?e.name.slice(0,18)+'…':e.name)+'</text><text x="'+(x+12)+'" y="'+(y+34)+'" font-size="12" font-weight="700" fill="#292929">'+num(kgDisplay(e.volume))+' '+state.settings.unit+'</text><title>'+esc(e.name)+' · Maks. '+num(kgDisplay(e.max))+' '+state.settings.unit+'</title></g>';
 });
 const middle=radial?'':'<path d="M144 '+(centerY-19)+' C164 '+(centerY-19)+' 174 '+(centerY-18)+' 191 '+(centerY-18)+' L191 '+(centerY+18)+' C174 '+(centerY+18)+' 164 '+(centerY+19)+' 144 '+(centerY+19)+'Z" fill="#A9C6F0" opacity=".65"/><rect x="168" y="'+(centerY-23)+'" width="87" height="46" rx="10" fill="#fff" stroke="#D6E4F2"/><text x="211.5" y="'+(centerY-6)+'" text-anchor="middle" font-size="9" fill="#777">TOPLAM HACİM</text><text x="211.5" y="'+(centerY+11)+'" text-anchor="middle" font-size="13" font-weight="700" fill="#202020">'+totalLabel+'</text>';
 let svg='<svg viewBox="0 0 '+W+' '+H+'" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;max-height:75vh" role="img" aria-label="Günlük antrenman hacim grafiği">'+paths+middle+hub+cards+'</svg>';
 if(!radial){
  const sh=Math.max(440,n*76+30),midY=sh/2-20,midX=190,midTop=midY-47,midBottom=midY+47;
  const sourceItems=[{label:'ANTRENMAN',value:d.name,color:'#5A9DE9',y:midY-81},{label:'SET SAYISI',value:sets+' set',color:'#A98BE5',y:midY-23},{label:'SÜRE',value:duration,color:'#85BEA8',y:midY+35}];
  let ribbons='',sourceBoxes='',exerciseBoxes='',rightOffset=midTop;
  let gradients='<defs>';
  const shades=[['#BDDDF9','#629FE2','#A0D9E8'],['#DED0F5','#AB91D9','#D6B8E5'],['#C9E8DB','#77BFAE','#A9DAC7']];
  shades.forEach((p,i)=>{gradients+='<linearGradient id="daily-left-'+i+'" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="'+p[0]+'"/><stop offset="50%" stop-color="'+p[1]+'"/><stop offset="100%" stop-color="'+p[2]+'"/></linearGradient>';});
  const blend=(hex,white)=>{const v=hex.replace('#','');return '#'+[0,2,4].map(j=>Math.round(parseInt(v.slice(j,j+2),16)*(1-white)+255*white).toString(16).padStart(2,'0')).join('');};
  exercises.forEach((e,i)=>{const c=palette[i%palette.length];gradients+='<linearGradient id="daily-right-'+i+'" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="'+blend(c,.48)+'"/><stop offset="50%" stop-color="'+c+'"/><stop offset="100%" stop-color="'+blend(c,.32)+'"/></linearGradient>';});gradients+='</defs>';

  sourceItems.forEach((item,i)=>{
   const sy=item.y+23,ty=midTop+15+i*31,width=27;
   ribbons+='<path d="M 114 '+(sy-width/2)+' C 144 '+(sy-width/2)+' 147 '+(ty-width/2)+' 176 '+(ty-width/2)+' L 176 '+(ty+width/2)+' C 147 '+(ty+width/2)+' 144 '+(sy+width/2)+' 114 '+(sy+width/2)+' Z" fill="url(#daily-left-'+i+')" opacity=".9"/>';
   sourceBoxes+='<rect x="3" y="'+item.y+'" width="111" height="46" rx="9" fill="#fff" stroke="#E7E3DF"/><rect x="5" y="'+(item.y+7)+'" width="4" height="32" rx="2" fill="'+item.color+'"/><text x="15" y="'+(item.y+16)+'" font-size="9" fill="#777">'+item.label+'</text><text x="15" y="'+(item.y+33)+'" font-size="12" font-weight="700" fill="#222">'+esc(item.value.length>15?item.value.slice(0,14)+'…':item.value)+'</text>';
  });
  const scale=volume>0?Math.min(94/volume,28/Math.max(...exercises.map(e=>e.volume),1)):0;
  let offset=midTop;
  exercises.forEach((e,i)=>{
   const y=10+i*76,ey=y+30,band=Math.max(2,e.volume*scale),sy=offset+band/2;offset+=band;
   const color=palette[i%palette.length],dim=dailySummaryExercise>=0&&dailySummaryExercise!==i;
   ribbons+='<path d="M 203 '+(sy-band/2)+' C 245 '+(sy-band/2)+' 249 '+(ey-band/2)+' 276 '+(ey-band/2)+' L 276 '+(ey+band/2)+' C 249 '+(ey+band/2)+' 245 '+(sy+band/2)+' 203 '+(sy+band/2)+' Z" fill="url(#daily-right-'+i+')" opacity="'+(dim?'.15':'.88')+'"/>';
   exerciseBoxes+='<g role="button" tabindex="0" aria-label="'+esc(e.name)+'" onclick="pickDailySummaryExercise('+i+')" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();pickDailySummaryExercise('+i+')}" style="cursor:pointer;opacity:'+(dim?'.45':'1')+'"><rect x="275" y="'+y+'" width="161" height="61" rx="10" fill="#fff" stroke="'+(dailySummaryExercise===i?color:'#E7E3DF')+'" stroke-width="'+(dailySummaryExercise===i?2:1)+'"/><rect x="278" y="'+(y+7)+'" width="4" height="47" rx="2" fill="'+color+'"/><text x="288" y="'+(y+18)+'" font-size="10.5" font-weight="600" fill="#292929">'+esc(e.name.length>23?e.name.slice(0,22)+'…':e.name)+'</text><text x="288" y="'+(y+36)+'" font-size="15" font-weight="700" fill="#222">'+num(kgDisplay(e.volume))+' '+state.settings.unit+'</text><text x="288" y="'+(y+51)+'" font-size="10" fill="#777">Maks. '+num(kgDisplay(e.max))+' '+state.settings.unit+'</text><title>'+esc(e.name)+'</title></g>';
  });
  const middleNode='<rect x="176" y="'+midTop+'" width="27" height="94" rx="10" fill="#80B6E8" opacity=".9"/><rect x="153" y="'+(midY-25)+'" width="80" height="50" rx="9" fill="#fff" stroke="#D6E4F2"/><text x="193" y="'+(midY-8)+'" font-size="9" text-anchor="middle" fill="#777">TOPLAM HACİM</text><text x="193" y="'+(midY+10)+'" font-size="13" font-weight="700" text-anchor="middle" fill="#222">'+totalLabel+'</text>';
  svg='<svg viewBox="0 0 440 '+sh+'" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;max-height:75vh" role="img" aria-label="Üç antrenman bilgisi toplam hacimde birleşir ve hareketlere dağılır">'+gradients+ribbons+sourceBoxes+middleNode+exerciseBoxes+'</svg>';
 }
 let overlay=document.getElementById('dailySummaryOverlay');if(!overlay){overlay=document.createElement('div');overlay.id='dailySummaryOverlay';document.body.appendChild(overlay);}
 const sankeyHeader=radial?'':'<div class="daily-summary-metrics-header"><strong>'+esc(d.name)+'</strong><span>'+fmtDate(selected)+'</span><div class="daily-summary-metrics-grid"><div><b>'+sets+'</b><small>Set</small></div><div><b>'+esc(duration)+'</b><small>Süre</small></div><div><b>'+esc(totalLabel)+'</b><small>Hacim</small></div></div></div>';
 overlay.innerHTML='<div class="daily-summary-sheet"><div class="daily-summary-head"><div><strong>'+esc(d.name)+'</strong><small>Günlük Antrenman Özeti · '+fmtDate(selected)+'</small></div><div class="daily-summary-head-actions"><button type="button" class="daily-summary-share" onclick="shareDailySummaryStory()" aria-label="Instagram hikâyesi için paylaş">Paylaş ↗</button><button type="button" onclick="closeDailySummary()" aria-label="Kapat">×</button></div></div><div class="daily-summary-tabs"><button class="'+(radial?'active':'')+'" onclick="switchDailySummaryLayout(\'radial\')">Serbest Akış</button><button class="'+(!radial?'active':'')+'" onclick="switchDailySummaryLayout(\'sankey\')">Hacim Akışı</button></div><div class="daily-summary-chart">'+sankeyHeader+(n?svg:'<p>Tamamlanmış set bulunamadı.</p>')+'</div><p class="daily-summary-hint">Hareket seçmek için kutuya dokun. Aynı kutuya tekrar dokunarak genel özete dön.</p></div>';
}

function calendarView(){
 const d=state.days[selected],start=(month.getDay()+(state.settings.week==='monday'?6:0))%7,count=new Date(month.getFullYear(),month.getMonth()+1,0).getDate(),week=state.settings.week==='monday'?['Pzt','Sal','Çar','Per','Cum','Cmt','Paz']:['Paz','Pzt','Sal','Çar','Per','Cum','Cmt'];
 let cells=week.map(w=>'<div class="weekday">'+w+'</div>').join('')+'<div></div>'.repeat(start);
 for(let i=1;i<=count;i++){const key=dateKey(new Date(month.getFullYear(),month.getMonth(),i)),entry=state.days[key],kind=entry?.kind,status=kind==='workout'?(entry.finished?'work':'planned'):kind==='rest'?'manual-rest':isAutomaticRestDay(key)?'rest':'';
 cells+='<button aria-label="'+fmtDate(key)+(kind==='workout'?' · Antrenman':(kind==='rest'||isAutomaticRestDay(key))?' · Dinlenme':' ')+'" aria-pressed="'+(selected===key)+'" class="day '+(selected===key?'selected ':'')+(key===today?'today ':'')+status+'" onclick="selectDate(\''+key+'\')">'+i+'</button>';}
 const completed=Object.entries(state.days).filter(([,v])=>v.kind==='workout'&&v.finished);
 const first=new Date(today+'T12:00:00'),weekStart=new Date(first);weekStart.setDate(first.getDate()-(first.getDay()+6)%7);
 const weekly=completed.filter(([k])=>k>=dateKey(weekStart)&&k<=today).length;
 const monthly=completed.filter(([k])=>k.startsWith(month.getFullYear()+'-'+String(month.getMonth()+1).padStart(2,'0')+'-')).length;
 let streak=0,probe=new Date(first);while(true){const k=dateKey(probe);if(state.days[k]?.finished&&state.days[k]?.kind==='workout')streak++;else if(k!==today)break;probe.setDate(probe.getDate()-1);if(streak>365)break;}
 const weekEnd=new Date(weekStart);weekEnd.setDate(weekStart.getDate()+6);const weekEntries=Object.entries(state.days).filter(([k])=>k>=dateKey(weekStart)&&k<=dateKey(weekEnd));const rested=Array.from({length:7},(_,i)=>{const x=new Date(weekStart);x.setDate(x.getDate()+i);return dateKey(x)}).filter(k=>state.days[k]?.kind==='rest'||isAutomaticRestDay(k)).length;const planned=weekEntries.filter(([,v])=>v.kind==='workout'&&!v.finished).length;const summaryBar='<section class="card cal-weekly"><h3>Bu hafta dağılımı</h3><div class="cal-weekrow"><span>Antrenman</span><div><i style="width:'+(weekly/7*100)+'%;background:#8d8068"></i></div><strong>'+weekly+' gün</strong></div><div class="cal-weekrow"><span>Dinlenme</span><div><i style="width:'+(rested/7*100)+'%;background:#9680BC"></i></div><strong>'+rested+' gün</strong></div><div class="cal-weekrow"><span>Planlı</span><div><i style="width:'+(planned/7*100)+'%;background:#83a88a"></i></div><strong>'+planned+' gün</strong></div></section>';const stats='<div class="calendar-stats"><div class="cal-stat"><small>Bu hafta</small><strong>'+weekly+'</strong><small>antrenman</small></div><div class="cal-stat"><small>Aylık toplam</small><strong>'+monthly+'</strong><small>antrenman</small></div><div class="cal-stat"><small>Seri</small><strong>'+streak+'</strong><small>gün</small></div></div>';
 let panel;
 if(!d)panel=assignment();
 else if(d.kind==='rest')panel='<section class="card rest-card"><h2>☾ Dinlenme günü</h2><p>Toparlanma günü olarak kaydedildi.</p><button class="secondary" onclick="removeDay()">Günü yeniden planla</button></section>';
 else {
  const t=totals(d),minutes=d.started&&d.finished?Math.round((d.finished-d.started)/60000):null;
  panel='<section class="card day-plan"><div class="row"><h2>'+esc(d.name)+' · v'+esc(d.version||1)+'</h2><span class="badge">'+(d.finished?'✓ TAMAMLANDI':d.started?'DEVAM EDİYOR':'PLANLANDI')+'</span></div><div class="calendar-detail-metrics"><div><strong>'+(d.exercises||[]).length+'</strong><small>hareket</small></div><div><strong>'+t.sets+'</strong><small>set</small></div><div><strong>'+(minutes===null?'—':minutes+' dk')+'</strong><small>süre</small></div><div><strong>'+num(t.ext)+'</strong><small>kg hacim</small></div></div>'+(d.finished?'<div class="calendar-exercises"><h3>Kısa özet</h3>'+(d.exercises||[]).filter(e=>(e.logs||[]).some(log=>log.done)).slice(0,4).map(e=>'<div class="calendar-exercise"><span>'+esc(e.name)+'</span><small>'+e.logs.filter(log=>log.done).length+' set</small></div>').join('')+'</div>':'')+'<div class="actions"><button onclick="go(\'workout\')">Antrenmanı görüntüle</button><button class="secondary" onclick="duplicateWorkoutNextDay()">↻ Tekrar planla</button></div></section>';
 }
 return '<div class="calendar-home"><section class="card month-card"><div class="row"><h2>'+month.toLocaleDateString('tr-TR',{month:'long',year:'numeric'})+'</h2><div class="month-controls"><button class="link" aria-label="Önceki ay" onclick="shiftMonth(-1)">‹</button><button class="link" aria-label="Sonraki ay" onclick="shiftMonth(1)">›</button></div></div><div class="calendar">'+cells+'</div><div class="legend"><span><i style="background:#8d8068"></i>Antrenman</span><span><i style="background:#83a88a"></i>Planlandı</span><span><i style="background:#9680BC"></i>Dinlenme</span></div></section>'+stats+'<section aria-label="Seçili günün planı"><div class="row selected-date"><h3>'+fmtDate(selected)+'</h3><button class="link" onclick="month=new Date(new Date().getFullYear(),new Date().getMonth(),1);selectDate(today)">Bugüne dön</button></div>'+panel+'</section>'+summaryBar+'</div>';
}
function copyPreviousWorkout(){
 if(state.days[selected]){toast('Önce mevcut günün kaydını koru; dolu günün üzerine yazılmadı.');return;}
 const previous=Object.entries(state.days).filter(([k,v])=>k<selected&&v.kind==='workout').sort(([a],[b])=>b.localeCompare(a))[0];
 if(!previous){toast('Kopyalanabilecek önceki antrenman bulunamadı.');return;}
 const original=previous[1];
 state.days[selected]={id:uid(),kind:'workout',name:original.name,programId:original.programId,version:original.version,exercises:(original.exercises||[]).map(e=>({...clone(e),logs:(e.logs||[]).map(()=>({kg:'',reps:'',rir:'',done:false}))})),started:null,finished:null,note:'',programNote:original.programNote||''};save();render();
}
function duplicateWorkoutNextDay(){const source=state.days[selected];if(!source||source.kind!=='workout')return;let cursor=new Date(selected+'T12:00:00');cursor.setDate(cursor.getDate()+1);for(let i=0;i<366;i++,cursor.setDate(cursor.getDate()+1)){const key=dateKey(cursor);if(!state.days[key]){const original=selected;selected=key;copyPreviousWorkout();month=new Date(cursor.getFullYear(),cursor.getMonth(),1);toast('Antrenman '+fmtDate(key)+' gününe kopyalandı.');return;}}toast('Boş gün bulunamadı.');}
function selectDate(d){if(!/^\d{4}-\d{2}-\d{2}$/.test(d))return;selected=d;render()}function shiftMonth(n){month=new Date(month.getFullYear(),month.getMonth()+n,1);render()}
let coachAssignedProgram=null,coachProgramLoaded=false,coachProgramError='';
async function refreshCoachProgram(){
 if(gymAccount.role!=='member')return;
 try{
  const {data,error}=await gymAccount.client.from('coach_program_assignments').select('program,updated_at').eq('member_id',gymAccount.user.id).maybeSingle();
  if(error)throw error;
  const p=data?.program;
  if(p&&(!Array.isArray(p.exercises)||typeof p.name!=='string'))throw Error('Program biçimi geçersiz');
  coachAssignedProgram=p?{...p,id:'coach-assigned',version:1}:null;
  coachProgramError='';
 }catch(e){coachProgramError='Koç programı yüklenemedi. Bağlantını kontrol et.';}
 coachProgramLoaded=true;
 if(tab==='programs'||tab==='workout'||tab==='calendar')render();
}
function coachProgramCard(){
 if(gymAccount.role!=='member')return '';
 if(!coachProgramLoaded)return '<section class="card"><h2>Koçumun programı</h2><p>Program yükleniyor…</p></section>';
 if(coachProgramError)return '<section class="card"><h2>Koçumun programı</h2><p>'+esc(coachProgramError)+'</p><button class="secondary" onclick="refreshCoachProgram()">Tekrar dene</button></section>';
 if(!coachAssignedProgram)return '<section class="card"><h2>Koçumun programı</h2><p>Henüz atanmış program yok.</p></section>';
 const p=coachAssignedProgram;
 return '<section class="card"><span class="badge">KOÇ TARAFINDAN ATANDI</span><h2>'+esc(p.name)+'</h2><p>'+p.exercises.length+' hareket · düzenlenemez</p><div class="actions"><button onclick="go(&quot;workout&quot;)">Antrenmanda seç →</button></div></section>';
}
function assignment(){return `<section class="card"><h2>Bu günü planla</h2><label>Program<select id="assignProgram">${selectablePrograms().map(({value,p})=>`<option value="${value}" ${gymAccount.role!=='member'&&value===String(state.active)?'selected':''}>${esc(p.name)}</option>`).join('')}</select></label><div class="actions plan-day-actions"><button type="button" class="secondary rest-day-action" onclick="setRest()" aria-label="Dinlenme günü olarak kaydet"><span aria-hidden="true">☾</span> Dinlenme günü</button><button type="button" onclick="assignWorkout()">Antrenman ata</button></div></section>`}
function assignWorkout(){if(state.days[selected])return;const choice=$('assignProgram').value;const p=selectablePrograms().find(x=>x.value===choice)?.p;if(!p)return;state.days[selected]={id:uid(),kind:'workout',name:p.name,programId:p.id,version:p.version,exercises:p.exercises.map(e=>({...clone(e),logs:Array.from({length:e.sets},()=>({kg:'',reps:'',rir:'',done:false}))})),started:null,finished:null,note:'',programNote:p.note||'',cardio:p.cardio?clone(p.cardio):null};save();render()}
function setRest(){if(state.days[selected])return;state.days[selected]={id:uid(),kind:'rest',note:''};save();render()}
function workoutView(){const d=state.days[selected];let body='';if(!d)body=assignment();else if(d.kind==='rest')body=`<section class="card rest-card"><h2>☾ Dinlenme günü</h2><p>Takviminde mor renkle işaretlendi.</p><button class="secondary" onclick="removeDay()">Günü yeniden planla</button></section>`;else{const t=totals(d),target=d.exercises.reduce((n,e)=>n+e.logs.length,0);body=`<section class="card hero" id="workoutSummary">${d.finished?'<button type="button" class="workout-summary-top-button" onclick="showDailySummary()">Özet ↗</button>':''}<h2>${esc(d.name)}</h2><small>${t.sets}/${target} set tamamlandı</small><div class="progress"><div style="width:${target?t.sets/target*100:0}%"></div></div><div class="workout-footer">${!d.started&&!d.finished?'<button class="workout-start-button" onclick="startWorkout()">▶ Antrenmanı Başlat</button>':''}<span class="workout-duration">Antrenman süresi <strong id="workoutClock">${workoutDuration(d)}</strong></span><button id="finishWorkoutButton" onclick="finishWorkout()">${d.finished?(dirty?'Kaydı yeniden dene':'Kaydedildi ✓'):'Antrenmanı bitir ✓'}</button></div></section>${programNote({note:d.programNote})}${d.exercises.map((e,i)=>`<section class="card"><div class="exercise-head"><div><span class="eyebrow">${String(i+1).padStart(2,'0')} / ${esc(e.muscle)}</span><h3 style="margin-top:8px">${esc(e.name)}</h3>${d.programId===beginnerProgram.id?`<p class="muted">${e.sets} × ${esc(e.reps)} ${e.duration?'sn':'tekrar'} · RIR ${esc(e.rirLabel||'—')} · ${esc(e.restLabel)} sn dinlenme</p>`:''}${e.superset?'<small>Süperset '+esc(e.superset)+'</small>':''}</div>${GymMotion.card(e)}</div><div class="set-grid"><small>SET</small><small>${state.settings.unit.toUpperCase()}</small><small>${e.duration?'SÜRE (sn)':'TEKRAR'}</small><small>RIR</small><small>BİTTİ</small></div>${e.logs.map((s,j)=>`<div class="set-grid ${s.done?'done':''}"><span class="number">${j+1}</span>${['kg','reps','rir'].map(f=>`<input aria-label="${esc(e.name)} set ${j+1} ${e.duration&&f==='reps'?'süre (saniye)':f}" ${invalidSets.has(selected+':'+i+':'+j+':'+f)?'aria-invalid="true"':''} type="number" inputmode="decimal" min="0" ${e.duration&&f!=='reps'?'disabled':''} ${f==='rir'?'max="10"':''} step="${f==='kg'?'.1':'1'}" value="${s[f]===''?'':f==='kg'?kgDisplay(s[f]):s[f]}" oninput="updateSet(${i},${j},'${f}',this.value,this)">`).join('')}<input aria-label="Set ${j+1} tamamlandı" type="checkbox" ${s.done?'checked':''} onchange="updateSet(${i},${j},'done',this.checked,this)"></div>`).join('')}<div class="set-adjust" style="display:flex;align-items:center;justify-content:center;gap:14px;margin-top:12px"><button type="button" aria-label="Set çıkar" onclick="adjustWorkoutSets(${i},-1)" style="width:36px;height:36px;min-height:36px;padding:0;border-radius:50%;font-size:22px">−</button><span style="font-size:13px;color:var(--muted,#777);min-width:42px;text-align:center">${e.logs.length} set</span><button type="button" aria-label="Set ekle" onclick="adjustWorkoutSets(${i},1)" style="width:36px;height:36px;min-height:36px;padding:0;border-radius:50%;font-size:22px">+</button></div></section>`).join('')}<section class="card"><label>Antrenman notu<textarea oninput="state.days[selected].note=this.value;save()">${esc(d.note)}</textarea></label><button class="danger" onclick="removeDay()">Bu günün kaydını kaldır</button></section>`}return `<div class="title-row"><div><span class="eyebrow">SET SET GELİŞİM</span><h1>Antrenman</h1></div><input aria-label="Antrenman tarihi" type="date" value="${selected}" onchange="selectDate(this.value)"></div>${body}`}
// Keep the edited input and next tap target mounted while persisting each change.
function refreshWorkoutSummary(){
 const d=state.days[selected],host=$('workoutSummary');if(!host||!d)return;
 const t=totals(d),target=d.exercises.reduce((n,e)=>n+e.logs.length,0);
 host.querySelector('small').textContent=`${t.sets}/${target} set tamamlandı`;
 host.querySelector('.progress > div').style.width=(target?t.sets/target*100:0)+'%';
}
function adjustWorkoutSets(i,delta){
 const e=state.days[selected]?.exercises?.[i];if(!e||!Array.isArray(e.logs))return;
 if(delta>0){if(e.logs.length>=30){toast('En fazla 30 set eklenebilir.');return;}e.logs.push({kg:'',reps:'',rir:'',done:false});}
 else{if(e.logs.length<=1)return;const last=e.logs[e.logs.length-1];if((last.done||['kg','reps','rir'].some(k=>last[k]!==''&&last[k]!=null))&&!confirm('Son sette veri var. Bu set silinsin mi?'))return;e.logs.pop();}
 save();render();
}
function updateSet(i,j,f,v,input){
 const s=state.days[selected].exercises[i].logs[j],errorKey=selected+':'+i+':'+j+':'+f;
 if(f!=='done'){
  if(input?.validity?.badInput||(v!==''&&(!Number.isFinite(+v)||+v<0||(f==='rir'&&+v>10)||(f!=='kg'&&!Number.isInteger(+v))))){
   input?.setAttribute('aria-invalid','true');invalidSets.set(errorKey,{date:selected,label:state.days[selected].exercises[i].name+' / Set '+(j+1)+' / '+f});save();return;
  }
  input?.removeAttribute('aria-invalid');invalidSets.delete(errorKey);
  v=v===''?'':f==='kg'&&state.settings.unit==='lb'?+v/2.20462262:+v;
 }
 s[f]=v;
 const day=state.days[selected];

 const row=input?.closest('.set-grid');if(row){row.classList.toggle('done',s.done);row.querySelector('input[type="checkbox"]').checked=s.done;}
 save();refreshWorkoutSummary();
}
function startWorkout(){
 const d=state.days[selected];
 if(!d||d.kind!=='workout'||d.started||d.finished)return;
 d.started=Date.now();
 if(!save())return;
 render();
}
function workoutDuration(d){
 if(!d?.started)return '00:00';
 const seconds=Math.max(0,Math.floor(((d.finished||Date.now())-d.started)/1000));
 return String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');
}
async function finishWorkout(){
 if(saving)return false;
 if(invalidSets.size){toast('Önce geçersiz set değerlerini düzelt.');return false;}
 const d=state.days[selected];if(!d||d.kind!=='workout')return false;
 if(!d.started){toast('Önce Antrenmanı Başlat butonuna bas.');return false;}
 if(!d.finished){d.finished=Date.now();save();}
 stopRest();
 const saved=await saveAll({silentSuccess:true});
 render();
 return saved;
}
async function confirmFinishWorkout(){return finishWorkout();}
function removeDay(){if(!confirm('Bu günün kaydı kaldırılsın mı? Öncesinde yedek indirmen önerilir.'))return;delete state.days[selected];for(const key of invalidSets.keys())if(key.startsWith(selected+':'))invalidSets.delete(key);save();render()}
function programsView(){if(gymAccount.role==='member')return `<div class="title-row"><h1>Programlarım</h1></div>${beginnerCard()}${coachAssignedProgram||coachProgramError||!coachProgramLoaded?coachProgramCard():''}`;return `<div class="title-row"><div><span class="eyebrow">SANA AİT BİR PLAN</span><h1>Programlarım</h1></div><button onclick="editProgram(-1)">+ Yeni</button></div><p class="lead">Programını değiştir; geçmiş antrenmanların aynı kalsın.</p>${beginnerCard()}${coachProgramCard()}<div class="grid"><div>${state.programs.map((p,i)=>`<section class="card"><span class="badge">${i===state.active?'AKTİF PROGRAM':'PROGRAM'} · v${p.version}</span><h2 style="margin-top:15px">${esc(p.name)}</h2><p class="muted">${p.exercises.length} hareket · ${p.exercises.reduce((n,e)=>n+e.sets,0)} set</p><div class="actions"><button onclick="editProgram(${i})">Düzenle</button><button class="secondary" onclick="state.active=${i};save();render()">Aktif seç</button><button class="secondary" onclick="duplicateProgram(${i})">Çoğalt</button><button class="link" onclick="versions(${i})">Sürümler</button></div></section>`).join('')}</div><div><section class="card"><h2>Hazır şablonlar</h2><p class="muted">Başlangıç noktası olarak ekle, ihtiyaçlarına göre düzenle.</p><div class="actions">${['Full Body','Upper','Lower','Push','Pull','Legs'].map(n=>`<button class="secondary" onclick="addTemplate('${n}')">+ ${n}</button>`).join('')}</div></section><section class="card"><h2>Hareket kütüphanesi</h2><input aria-label="Hareket ara" placeholder="Hareket adı ara…" oninput="filterLibrary(this.value)"><label>Kas grubu<select id="muscleFilter" onchange="filterLibrary('')"><option value="">Tüm kaslar</option>${[...new Set(state.library.map(e=>e.muscle))].map(m=>`<option>${esc(m)}</option>`).join('')}</select></label><label>Ekipman<select id="equipmentFilter" onchange="filterLibrary('')"><option value="">Tüm ekipmanlar</option>${[...new Set(state.library.map(e=>e.equipment))].map(m=>`<option>${esc(m)}</option>`).join('')}</select></label><div id="libraryList">${libraryRows(state.library)}</div><button class="secondary" onclick="customExercise()">+ Özel hareket</button></section></div></div>`}
function libraryRows(items){return items.map(e=>`<div class="list-item library-motion-row"><div><h3>${esc(e.name)}</h3><span class="pill">${esc(e.muscle)}</span></div>${GymMotion.card(e)}</div>`).join('')||'<p class="empty">Hareket bulunamadı.</p>'}function filterLibrary(q){$('libraryList').innerHTML=libraryRows(state.library.filter(e=>e.name.toLocaleLowerCase('tr').includes(q.toLocaleLowerCase('tr'))&&(!$('muscleFilter').value||e.muscle===$('muscleFilter').value)&&(!$('equipmentFilter').value||e.equipment===$('equipmentFilter').value)));GymMotion.refresh()}
function duplicateProgram(i){if(gymAccount.role==='member')return;const p=clone(state.programs[i]);p.id=uid();p.name+=' (kopya)';p.history=[];p.version=1;state.programs.push(p);save();render()}
function addTemplate(n){if(gymAccount.role==='member')return;const map={'Full Body':[14,0,9,10],'Upper':[0,8,9,10,6],'Lower':[12,13,14],'Push':[0,10,4],'Pull':[8,9,6,7],'Legs':[12,13,14]};state.programs.push(program(n,map[n]));save();render();toast('Şablon eklendi. Profil bölümünden kaydet.')}
function editProgram(i){if(gymAccount.role==='member')return;draft={index:i,p:i<0?{id:uid(),name:'Yeni program',version:0,history:[],exercises:[]}:clone(state.programs[i])};editor()}
function editor(){if(gymAccount.role==='member')return;showEditor(`<h2>Programı düzenle</h2><label>Program adı<input value="${esc(draft.p.name)}" oninput="draft.p.name=this.value;save()"></label><div class="notice">Uyguladığın programı kalıcı saklamak için Profil bölümünden kaydet. Geçmiş antrenmanlar değiştirilmez.</div>${draft.p.exercises.map((e,i)=>`<div class="editor-row"><div class="row"><b>${i+1}. ${esc(e.name)}</b><div><button class="link" onclick="moveExercise(${i},-1)" aria-label="Yukarı taşı">↑</button><button class="link" onclick="moveExercise(${i},1)" aria-label="Aşağı taşı">↓</button><button class="link" onclick="draft.p.exercises.splice(${i},1);editor()" aria-label="Hareketi kaldır">×</button></div></div><div class="editor-fields">${[['sets','Set'],['reps','Tekrar aralığı'],['rir','Hedef RIR'],['rest','Dinlenme (sn)'],['superset','Süperset grubu']].map(([f,l])=>`<label>${l}<input value="${esc(e[f])}" oninput="draft.p.exercises[${i}]['${f}']=this.value;save()" ${['sets','rir','rest'].includes(f)?'type="number" min="0"':''}></label>`).join('')}</div><label>Alternatif hareket<select onchange="replaceExercise(${i},this.value)"><option value="">Hareket değiştir…</option>${state.library.map((x,j)=>`<option value="${j}">${esc(x.name)}</option>`).join('')}</select></label></div>`).join('')}<label>Hareket ekle<select id="addExercise">${state.library.map((e,i)=>`<option value="${i}">${esc(e.name)}</option>`).join('')}</select></label><div class="actions"><button class="secondary" onclick="draft.p.exercises.push(clone(state.library[+$('addExercise').value]));editor()">+ Ekle</button><button onclick="saveProgram()">Programı uygula</button></div>`)}
function showEditor(html){$('modalBody').innerHTML=html;if(!$('modal').open)$('modal').showModal()}
function replaceExercise(i,j){if(gymAccount.role==='member')return;if(j==='')return;draft.p.exercises[i]=clone(state.library[+j]);editor()}function moveExercise(i,d){if(gymAccount.role==='member')return;let a=draft.p.exercises,j=i+d;if(j<0||j>=a.length)return;[a[i],a[j]]=[a[j],a[i]];editor()}
function saveProgram(){if(gymAccount.role==='member')return;const p=draft.p;if(!p.name.trim()||!p.exercises.length){toast('Program adı ve en az bir hareket gerekli.');return false}for(const e of p.exercises){e.sets=+e.sets;e.rir=+e.rir;e.rest=+e.rest;if(!Number.isInteger(e.sets)||e.sets<1||e.sets>20||!Number.isFinite(e.rir)||e.rir<0||e.rir>10||!Number.isFinite(e.rest)||e.rest<0){toast('Set 1–20, RIR 0–10 ve dinlenme 0 veya üstü olmalı.');return false}}if(draft.index>=0){const old=state.programs[draft.index];p.history.push({version:old.version,name:old.name,exercises:clone(old.exercises),saved:new Date().toISOString()});p.version++;state.programs[draft.index]=p}else{p.version=1;state.programs.push(p)}draft=null;save();$('modal').close();render();return true}
function versions(i){const p=state.programs[i];show(`<h2>${esc(p.name)} · Sürümler</h2><p>Güncel sürüm: ${p.version}</p>${p.history.map(v=>`<div class="list-item"><b>v${v.version} · ${esc(v.name)}</b><p>${v.exercises.map(e=>`${esc(e.name)} (${e.sets} set)`).join('<br>')}</p></div>`).join('')||'<p class="empty">Henüz önceki sürüm yok.</p>'}`)}
function customExercise(){if(gymAccount.role==='member')return;show(`<h2>Özel hareket</h2><label>Ad<input id="customName"></label><label>Kas grubu<input id="customMuscle"></label><label>Ekipman<input id="customEquipment"></label><label>Hacim hesabı<select id="customType"><option value="1">Toplam ağırlık × tekrar</option><option value="2">Tek dambıl × 2 × tekrar</option><option value="body">Vücut ağırlığı (ayrı hacim)</option></select></label><button onclick="saveCustom()">Hareketi ekle</button>`)}
function saveCustom(){if(gymAccount.role==='member')return;if(!$('customName').value.trim()||!$('customMuscle').value.trim()||!$('customEquipment').value.trim()){toast('Tüm alanları doldur.');return}const type=$('customType').value;state.library.push(exercise($('customName').value,$('customMuscle').value,$('customEquipment').value,type==='body'?'body':'external',type==='2'?2:1));save();$('modal').close();render()}
let growthPeriod='week',growthExercise='';
function growthBounds(period=growthPeriod,now=new Date()){
 const end=new Date(now.getFullYear(),now.getMonth(),now.getDate()),start=new Date(end);
 if(period==='all'){const first=growthRows()[0];if(first){const [y,m,d]=first[0].split('-').map(Number);start.setFullYear(y,m-1,d)}else start.setTime(end.getTime())}else if(period==='week')start.setDate(start.getDate()-(state.settings.week==='sunday'?start.getDay():(start.getDay()+6)%7));else start.setDate(1);
 const previousStart=new Date(start),previousEnd=new Date(end);
 if(period==='all'){previousStart.setTime(start.getTime());previousEnd.setTime(start.getTime()-86400000)}else if(period==='week'){previousStart.setDate(start.getDate()-7);previousEnd.setDate(end.getDate()-7)}else{previousStart.setMonth(start.getMonth()-1);previousEnd.setDate(1);previousEnd.setMonth(end.getMonth()-1);previousEnd.setDate(Math.min(end.getDate(),new Date(end.getFullYear(),end.getMonth(),0).getDate()))}
 return {start:dateKey(start),end:dateKey(end),previousStart:dateKey(previousStart),previousEnd:dateKey(previousEnd)};
}
function growthRows(){return allWork().filter(([date,d])=>date<=dateKey(new Date())&&totals(d).sets>0).sort(([a],[b])=>a.localeCompare(b))}
function growthStats(rows){return rows.reduce((a,[,d])=>{const t=totals(d);a.workouts+=d.finished?1:0;a.sets+=t.sets;a.volume+=t.ext;return a},{workouts:0,sets:0,volume:0})}
function growthChange(current,previous,unit){return previous>0?`${current>=previous?'+':''}${num(current-previous)} ${unit}`:'Karşılaştırma için önceki kayıt yok'}
function growthPoints(rows,name){return rows.map(([date,d])=>{const es=d.exercises.filter(e=>e.name===name),sets=es.flatMap(e=>e.logs.filter(s=>s.done&&s.kg!==''&&Number.isFinite(+s.kg)&&+s.reps>0));if(!sets.length)return null;const best=sets.reduce((a,b)=>+b.kg>+a.kg||(+b.kg===+a.kg&&+b.reps>+a.reps)?b:a);return {date,set:best,sets}}).filter(Boolean)}
function growthPerformance(rows,name){
 const points=growthPoints(rows,name);if(!points.length)return '<p class="empty">Bu dönemde bu hareket için tamamlanmış set yok.</p>';
 const last=points.at(-1),all=growthPoints(growthRows(),name),previous=all.filter(p=>p.date<last.date).at(-1),unit=esc(state.settings.unit);
 const max=Math.max(...points.map(p=>+p.set.kg),1),xy=points.map((p,i)=>[40+(points.length===1?130:i*260/(points.length-1)),120-(+p.set.kg/max)*85]);
 const display=p=>p?`${num(kgDisplay(p.set.kg))} ${unit} × ${p.set.reps}<br><small>RIR ${p.set.rir===''?'—':p.set.rir} · ${fmtDate(p.date)}</small>`:'Henüz önceki kayıt yok';
 let comparison='Ağırlık, tekrar ve RIR birlikte değerlendirilmelidir.';
 if(previous){const same=previous.sets.filter(s=>+s.kg===+last.set.kg).sort((a,b)=>+b.reps-+a.reps)[0];if(same){const delta=+last.set.reps-+same.reps;comparison=`${num(kgDisplay(last.set.kg))} ${unit} ile önceki antrenmana göre ${delta>0?'+':''}${delta} tekrar · RIR ${same.rir===''?'—':same.rir} → ${last.set.rir===''?'—':last.set.rir}`}}
 return `<small>En yüksek ağırlık (${unit}) · Tarihe göre</small><svg class="growth-chart" viewBox="0 0 340 160" role="img" aria-label="${esc(name)} ağırlık gelişimi"><path d="M36 25V120H310" fill="none" stroke="var(--line)"/><text x="4" y="38">${num(kgDisplay(max))}</text><text x="20" y="124">0</text><polyline points="${xy.map(p=>p.join(',')).join(' ')}" fill="none" stroke="var(--green)" stroke-width="3"/>${points.map((p,i)=>`<circle cx="${xy[i][0]}" cy="${xy[i][1]}" r="4" fill="var(--green)"><title>${fmtDate(p.date)}: ${num(kgDisplay(p.set.kg))} ${unit} × ${p.set.reps}</title></circle>`).join('')}<text x="36" y="148">${points[0].date.slice(5)}</text><text x="305" y="148" text-anchor="end">${last.date.slice(5)}</text></svg><div class="growth-compare"><div><small>Önceki antrenman</small><p>${display(previous)}</p></div><div><small>Son antrenman</small><p>${display(last)}</p></div></div><p class="notice">${comparison}</p><details><summary>Grafik değerlerini göster</summary>${points.map(p=>`<p>${fmtDate(p.date)} · ${display(p)}</p>`).join('')}</details>`;
}
function growthRecords(rows,bounds){
 const best=new Map(),records=[];
 for(const [date,d] of rows)for(const e of d.exercises){const valid=e.logs.filter(s=>s.done&&s.kg!==''&&+s.reps>0);if(!valid.length)continue;const key=e.name+'|'+e.type,old=best.get(key)||{weight:null,reps:new Map()};let weight=null;const repRecords=[];
 for(const s of valid){const kg=+s.kg,reps=+s.reps;if(e.type!=='body'&&kg>0&&(old.weight===null||kg>old.weight)){weight=kg;old.weight=kg}const prior=old.reps.get(kg);if(prior!==undefined&&reps>prior)repRecords.push({kg,reps});old.reps.set(kg,Math.max(prior||0,reps))}best.set(key,old);
 if(date>=bounds.start&&date<=bounds.end){if(weight!==null)records.push({date,name:e.name,label:'En yüksek ağırlık',value:`${num(kgDisplay(weight))} ${state.settings.unit}`});const pr=repRecords.at(-1);if(pr)records.push({date,name:e.name,label:'Aynı ağırlıkta tekrar rekoru',value:`${num(kgDisplay(pr.kg))} ${state.settings.unit} × ${pr.reps}`})}
 }return records.reverse();
}
function setGrowthPeriod(period){growthPeriod=['week','month','all'].includes(period)?period:'week';render()}
function setGrowthExercise(name){growthExercise=name;const b=growthBounds();$('growthPerformance').innerHTML=growthPerformance(growthRows().filter(([date])=>date>=b.start&&date<=b.end),name)}

let regionalSelected='',regionalTab='summary';
const regionalOrder=['Göğüs','Sırt','Omuz','Ön kol','Arka kol','Bacak','Karın'];
function regionalMetric(rows,muscle){
 let sets=0,volume=0,workouts=0;const exercises=new Set();
 rows.forEach(([,d])=>{let active=false;d.exercises.forEach(e=>{if(String(e.muscle).toLocaleLowerCase('tr')!==muscle.toLocaleLowerCase('tr'))return;let valid=e.logs.filter(x=>x.done&&Number(x.reps)>0);if(valid.length){active=true;exercises.add(e.name)}valid.forEach(x=>{sets++;if(e.type!=='body'&&Number.isFinite(+x.kg))volume+=(+x.kg)*(+x.reps)*(+e.factor||1)})});if(active)workouts++});
 return {sets,volume,workouts,exercises:[...exercises]};
}
function regionalPercent(now,prev){return prev>0?((now-prev)/prev*100):null}
function regionalProgressCard(rows,previous,all){
 const muscles=[...new Set([...regionalOrder,...all.flatMap(([,d])=>d.exercises.map(e=>e.muscle).filter(Boolean))])];
 const active=muscles.filter(m=>regionalMetric(all,m).sets>0);
 return `<section class="card regional-card"><h2>Bölgesel Gelişim</h2><small>Kas grubuna dokunarak detayları incele · Antrenman başına ortalama hacim</small><div class="regional-list">${active.map(m=>{const a=regionalMetric(rows,m),b=regionalMetric(previous,m),pct=(growthPeriod==='all'||!a.workouts||!b.workouts)?null:regionalPercent(a.volume/a.workouts,b.volume/b.workouts);return `<button class="regional-row" onclick="openRegional('${esc(m).replace(/'/g,'&#39;')}')"><span class="regional-muscle">◉</span><b>${esc(m)}</b><span class="regional-change">${pct===null?(growthPeriod==='all'?'Toplam':'—'):(pct>=0?'+':'')+num(pct)+'%'}</span><span class="regional-chevron">›</span></button>`}).join('')||'<p class="empty">Henüz kas bölgesi kaydı yok.</p>'}</div></section>`;
}
function openRegional(m){regionalSelected=m;regionalTab='summary';renderRegionalSheet()}
function closeRegional(){document.getElementById('regionalOverlay')?.remove();document.body.classList.remove('regional-open')}
function setRegionalTab(tab){regionalTab=tab;renderRegionalSheet()}
function renderRegionalSheet(){
 const all=growthRows(),b=growthBounds(),rows=all.filter(([d])=>d>=b.start&&d<=b.end),prev=all.filter(([d])=>d>=b.previousStart&&d<=b.previousEnd);
 const a=regionalMetric(rows,regionalSelected),p=regionalMetric(prev,regionalSelected),pct=growthPeriod==='all'||!a.workouts||!p.workouts?null:regionalPercent(a.volume/a.workouts,p.volume/p.workouts);
 const exercises=[...new Set(all.flatMap(([,d])=>d.exercises.filter(e=>e.muscle===regionalSelected).map(e=>e.name)))];
 const history=rows.filter(([,d])=>d.exercises.some(e=>e.muscle===regionalSelected&&e.logs.some(x=>x.done)));
 const entries=history.map(([date,d])=>({date,value:regionalMetric([[date,d]],regionalSelected).volume})).filter(x=>x.value>0).slice(-12);
 const maximum=Math.max(1,...entries.map(x=>x.value));
 const chart=entries.length?`<div class="regional-chart"><div class="regional-chart-bars">${entries.map(x=>`<div class="regional-chart-item" title="${esc(fmtDate(x.date))}: ${num(kgDisplay(x.value))} ${esc(state.settings.unit)}"><span class="regional-chart-value">${num(kgDisplay(x.value))}</span><div class="regional-chart-track"><i style="height:${Math.max(3,x.value/maximum*100)}%"></i></div><small>${esc(x.date.slice(5))}</small></div>`).join('')}</div></div>`:'<p class="empty">Grafik için kayıt yok.</p>';
 const body=regionalTab==='summary'?`<div class="regional-kpis"><div><strong>${num(kgDisplay(a.volume))} ${esc(state.settings.unit)}</strong><small>Toplam hacim</small></div><div><strong>${a.sets}</strong><small>Toplam set</small></div><div><strong>${a.workouts}</strong><small>Antrenman</small></div></div><div class="regional-chart-title"><h3>Hacim Değişimi</h3><small>Antrenman başına · ${esc(state.settings.unit)}</small></div>${chart}<p class="regional-chart-note">Ortalama hacim değişimi: ${pct===null?(growthPeriod==='all'?'Tüm kayıtlar':'Önceki dönemde veri yok'):(pct>=0?'+':'')+num(pct)+'%'} · Harici ağırlık hacmi</p>`:regionalTab==='exercises'?`<div class="regional-exercises">${exercises.map(n=>{const points=growthPoints(all,n),last=points.at(-1);return `<details><summary><b>${esc(n)}</b><small>${last?num(kgDisplay(last.set.kg))+' '+esc(state.settings.unit)+' × '+last.set.reps:'Kayıt yok'}</small></summary>${growthPerformance(rows,n)}</details>`}).join('')||'<p class="empty">Kayıtlı hareket yok.</p>'}</div>`:`<div class="regional-exercises">${history.slice().reverse().map(([date,d])=>`<details><summary><b>${fmtDate(date)}</b><small>${esc(d.name||'Antrenman')}</small></summary>${d.exercises.filter(e=>e.muscle===regionalSelected).map(e=>`<p><b>${esc(e.name)}</b></p>${e.logs.filter(x=>x.done).map(x=>`<small>${num(kgDisplay(x.kg))} ${esc(state.settings.unit)} × ${x.reps} · RIR ${x.rir===''?'—':x.rir}</small>`).join('<br>')}`).join('')}</details>`).join('')||'<p class="empty">Bu dönemde kayıt yok.</p>'}</div>`;
 closeRegional();document.body.classList.add('regional-open');
 const overlay=document.createElement('div');overlay.id='regionalOverlay';overlay.className='regional-overlay';overlay.innerHTML=`<div class="regional-backdrop" onclick="closeRegional()"></div><section class="regional-sheet" role="dialog" aria-modal="true" aria-label="${esc(regionalSelected)} gelişimi"><div class="regional-handle"></div><div class="regional-sheet-head"><div><h2>${esc(regionalSelected)}</h2><small>${fmtDate(b.start)} – ${fmtDate(b.end)}</small></div><button class="regional-close" onclick="closeRegional()" aria-label="Kapat">×</button></div><div class="regional-tabs">${[['summary','Özet'],['exercises','Hareketler'],['history','Antrenmanlar']].map(([id,label])=>`<button class="${regionalTab===id?'active':''}" onclick="setRegionalTab('${id}')">${label}</button>`).join('')}</div><div class="regional-sheet-body">${body}</div></section>`;
 document.body.appendChild(overlay);
 const sheet=overlay.querySelector('.regional-sheet');let y=0;sheet.querySelector('.regional-handle').addEventListener('touchstart',e=>{y=e.touches[0].clientY},{passive:true});sheet.querySelector('.regional-handle').addEventListener('touchend',e=>{const diff=e.changedTouches[0].clientY-y;if(diff>90)closeRegional();else if(diff< -45)sheet.classList.add('expanded')},{passive:true});
}

function progressView(){
 const bounds=growthBounds(),all=growthRows(),rows=all.filter(([date])=>date>=bounds.start&&date<=bounds.end),previous=all.filter(([date])=>date>=bounds.previousStart&&date<=bounds.previousEnd),now=growthStats(rows),prev=growthStats(previous),names=[...new Set(all.flatMap(([,d])=>d.exercises.map(e=>e.name)))],muscles={};
 if(!names.includes(growthExercise))growthExercise=names[0]||'';
 rows.forEach(([,d])=>d.exercises.forEach(e=>{const n=e.logs.filter(s=>s.done).length;if(n)muscles[e.muscle]=(muscles[e.muscle]||0)+n}));const records=growthRecords(all,bounds);
 return `<div class="growth"><span class="eyebrow">EMEĞİNİN KARŞILIĞI</span><h1>Gelişim</h1><p class="lead">Emeğinin karşılığını gör.</p><div class="growth-period" aria-label="Rapor dönemi"><button class="${growthPeriod==='week'?'':'secondary'}" aria-pressed="${growthPeriod==='week'}" onclick="setGrowthPeriod('week')">Bu hafta</button><button class="${growthPeriod==='month'?'':'secondary'}" aria-pressed="${growthPeriod==='month'}" onclick="setGrowthPeriod('month')">Bu ay</button><button class="${growthPeriod==='all'?'':'secondary'}" aria-pressed="${growthPeriod==='all'}" onclick="setGrowthPeriod('all')">Tüm geçmiş</button></div><p class="muted">${fmtDate(bounds.start)} – ${fmtDate(bounds.end)}<br><small>${growthPeriod==='all'?'İlk kayıtlı antrenmandan bugüne':'Karşılaştırma: '+fmtDate(bounds.previousStart)+' – '+fmtDate(bounds.previousEnd)}</small></p><p class="notice" role="status">${rows.length?`${growthPeriod==='all'?'Tüm geçmişte':growthPeriod==='week'?'Bu hafta':'Bu ay'} <b>${now.workouts} antrenman</b> bitirdin; <b>${now.sets} set</b> tamamladın.`:'Bu dönemde henüz tamamlanmış set yok. Antrenmanlarını kaydettikçe gelişimin burada görünecek.'}</p><div class="growth-stats">${[['Antrenman',now.workouts,growthPeriod==='all'?'Toplam':growthChange(now.workouts,prev.workouts,'antrenman')],['Set',now.sets,growthPeriod==='all'?'Toplam':growthChange(now.sets,prev.sets,'set')],['Harici hacim',num(kgDisplay(now.volume))+' '+esc(state.settings.unit),growthPeriod==='all'?'Toplam':prev.volume>0?`${num((now.volume-prev.volume)/prev.volume*100)}% değişim`:'Önceki dönem verisi yok']].map(([label,value,change])=>`<section class="card"><small>${label}</small><strong>${value}</strong><small>${change}</small></section>`).join('')}</div><small>Set ve hacim, tamamlandı işaretli setlerden hesaplanır. Hacim artışı tek başına güç artışı değildir.</small><div class="grid">${regionalProgressCard(rows,previous,all)}<section class="card"><h2>Kişisel rekorlar</h2><small>Seçili dönemdeki en iyi kayıtlar · İlk kayıt başlangıç rekorudur.</small>${records.map(p=>`<div class="list-item"><div class="row wrap"><b>${esc(p.name)}</b><strong>${esc(p.value)}</strong></div><small>${p.label} · ${fmtDate(p.date)}</small></div>`).join('')||'<p class="empty">Bu dönemde yeni rekor yok.</p>'}</section><section class="card"><h2>Antrenman düzeni</h2><p>${now.workouts} bitirilmiş antrenman · ${rows.length} aktif gün</p><small>Kas grubu başına tamamlanan set · Her set ana kasına sayılır</small>${Object.entries(muscles).map(([m,n])=>`<div class="list-item"><div class="row"><span>${esc(m)}</span><b>${n} set</b></div><div class="bar"><i style="width:${n/Math.max(...Object.values(muscles),1)*100}%"></i></div></div>`).join('')||'<p class="empty">Henüz tamamlanmış set yok.</p>'}</section><section class="card"><h2>Geçmiş antrenmanlar</h2>${rows.slice().reverse().map(([date,d])=>`<details class="list-item"><summary>${fmtDate(date)} · ${esc(d.name)} ${d.finished?'✓':'(devam ediyor)'}</summary>${d.exercises.map(e=>`<h3>${esc(e.name)}</h3>${e.logs.map((s,i)=>`<p>${i+1}. set · ${s.kg===''?'—':num(kgDisplay(s.kg))} ${esc(state.settings.unit)} × ${s.reps===''?'—':s.reps} · RIR ${s.rir===''?'—':s.rir} ${s.done?'✓':''}</p>`).join('')}`).join('')}<button class="secondary" onclick="selected='${date}';go('workout')">Antrenmanı aç</button></details>`).join('')||'<p class="empty">Bu dönemde kayıt yok.</p>'}</section></div><section class="card"><h2>Vücut ağırlığı</h2><div class="row wrap"><input type="date" id="bodyDate" value="${today}" aria-label="Ölçüm tarihi"><input type="number" min="1" step=".1" id="bodyKg" placeholder="kg" aria-label="Vücut ağırlığı kilogram"><button onclick="addBodyweight()">Ekle</button></div>${state.bodyweights.map(x=>`<p>${fmtDate(x.date)} <b>${x.kg} kg</b></p>`).join('')}</section></div>`;
}
function drawChart(){const name=$('chartExercise').value,mode=$('chartMode').value,range=$('chartRange').value,cutoff=range==='all'?null:Date.now()-(+range)*86400000;const points=allWork().sort(([a],[b])=>a.localeCompare(b)).filter(([date])=>!cutoff||new Date(date+'T23:59:59').getTime()>=cutoff).map(([date,d])=>{const es=d.exercises.filter(e=>e.name===name),sets=es.flatMap(e=>e.logs.filter(s=>s.done&&+s.reps>0&&s.kg!==''&&(mode!=='rm'||e.type==='external'&&+s.reps<=10)));if(!sets.length)return null;let best=sets.reduce((a,s)=>{let value=+s.kg*(mode==='rm'?1+(+s.reps)/30:1);return !a||value>a.value?{value,set:s}:a},null);return {date,...best}}).filter(Boolean);if(!points.length){$('chartArea').innerHTML='<p class="empty">Bu seçim için uygun tamamlanmış set yok.</p>';return}const max=Math.max(...points.map(p=>p.value),1),xy=points.map((p,i)=>[40+(points.length===1?210:i*420/(points.length-1)),165-p.value/max*130]);const last=points.at(-1),prev=points.at(-2);$('chartArea').innerHTML=`<svg class="chart" viewBox="0 0 500 205" role="img" aria-label="Tarihe göre ${esc(name)} performansı"><path d="M40 20V165H480" fill="none" stroke="var(--line)"/><polyline points="${xy.map(p=>p.join(',')).join(' ')}" fill="none" stroke="var(--green)" stroke-width="3"/>${points.map((p,i)=>`<circle cx="${xy[i][0]}" cy="${xy[i][1]}" r="6" fill="var(--green)"><title>${fmtDate(p.date)} · ${kgDisplay(p.value).toFixed(1)} ${state.settings.unit} · ${p.set.reps} tekrar · RIR ${p.set.rir}</title></circle>`).join('')}<text x="40" y="192">${points[0].date}</text><text x="480" y="192" text-anchor="end">${last.date}</text></svg><div class="row"><span>Rekor <b>${kgDisplay(max).toFixed(1)} ${state.settings.unit}</b></span><span>Son antrenmana göre <b>${prev?(kgDisplay(last.value-prev.value)).toFixed(1)+' '+state.settings.unit:'—'}</b></span></div>${points.map(p=>`<details class="list-item"><summary>${fmtDate(p.date)} · ${kgDisplay(p.value).toFixed(1)} ${state.settings.unit}</summary><p>${p.set.reps} tekrar · RIR ${p.set.rir===''?'Belirtilmedi':p.set.rir} · ${kgDisplay(p.set.kg)} ${state.settings.unit}</p></details>`).join('')}`}
function addBodyweight(){const kg=+$('bodyKg').value,date=$('bodyDate').value;if(!date||!Number.isFinite(kg)||kg<=0||kg>500){toast('Geçerli tarih ve kilo gir.');return}const old=state.bodyweights.find(x=>x.date===date);if(old&&!confirm('Bu tarihteki kilo ölçümü güncellensin mi?'))return;state.bodyweights=state.bodyweights.filter(x=>x.date!==date);state.bodyweights.push({date,kg});state.bodyweights.sort((a,b)=>a.date.localeCompare(b.date));save();render()}
function settingsView(){return `<span class="eyebrow">KİŞİSEL ALANIN</span><h1>Hesabım</h1><p class="lead">Tercihlerin ve kayıtların bir arada.</p><section class="card"><h2>Tüm girdileri kaydet</h2><p>Antrenmanlar, setler, notlar, takvim, programlar, ölçümler ve profil ayarları tek düğmeyle Supabase bulutuna kaydedilir ve doğrulanır.</p><button id="saveAllButton" onclick="saveAll()">Antrenmanı kaydet</button> <button class="secondary" onclick="retryCloud()">Bulutu yeniden kontrol et</button><p id="allSaveStatus" role="status"></p></section><div class="grid"><section class="card"><h2>Profilim</h2>${[['name','Ad'],['goal','Spor hedefi'],['height','Boy (cm)']].map(([f,l])=>`<label>${l}<input value="${esc(state.profile[f])}" oninput="state.profile['${f}']=this.value;save()"></label>`).join('')}<label>Ağırlık birimi<select onchange="state.settings.unit=this.value;save();render()"><option ${state.settings.unit==='kg'?'selected':''}>kg</option><option ${state.settings.unit==='lb'?'selected':''}>lb</option></select></label><label>Hafta başlangıcı<select onchange="state.settings.week=this.value;save();render()"><option value="monday" ${state.settings.week==='monday'?'selected':''}>Pazartesi</option><option value="sunday" ${state.settings.week==='sunday'?'selected':''}>Pazar</option></select></label></section><div><section class="card"><h2>Yedekleme</h2><p class="muted">Programların, setlerin, takvimin ve profilin tek JSON dosyasında.</p><div class="actions"><button onclick="downloadBackup()">Yedeği indir ↓</button><button class="secondary" onclick="$ ('importFile').click()">Yedekten birleştir ↑</button></div><div class="notice">Buluta kaydedilmiş verilerin aynı hesapla diğer cihazlarda açılır. Buluta gönderilmemiş cihaz kayıtları tarayıcı verileri silinirse kaybolabilir. JSON yedeğini de sakla.</div></section>${membershipCard()}</div></div>${themePicker()}`}
function downloadObject(o,name){const a=document.createElement('a'),url=URL.createObjectURL(new Blob([JSON.stringify(o,null,2)],{type:'application/json'}));a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}function downloadBackup(){downloadObject(state,`gym-tracker-pro-${today}.json`)}
function validateBackup(o){if(!o||o.schema!=='gym-tracker-pro'||o.version!==1||!Array.isArray(o.programs)||!o.programs.length||!Array.isArray(o.library)||!o.days||typeof o.days!=='object'||Array.isArray(o.days)||!o.profile||!o.settings||!Array.isArray(o.bodyweights))throw Error('Bu dosya bu sürümün yedeği değil. Eski panel yedekleri ayrıca eşleştirilerek aktarılmalı.');const validNum=(n,max=100000)=>n===''||typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=max;function checkExercise(e,logs=false){if(!e||typeof e.name!=='string'||typeof e.muscle!=='string'||typeof e.equipment!=='string'||!['external','body'].includes(e.type)||![1,2].includes(e.factor)||!Number.isInteger(e.sets)||e.sets<1||e.sets>20||!validNum(e.rir,10)||!validNum(e.rest))throw Error('Hareket bilgisi geçersiz.');if(logs&&(!Array.isArray(e.logs)||e.logs.some(s=>!s||typeof s.done!=='boolean'||!validNum(s.kg)||!validNum(s.reps,10000)||!validNum(s.rir,10))))throw Error('Set değerleri geçersiz.')}for(const p of o.programs){if(typeof p.id!=='string'||typeof p.name!=='string'||!Number.isInteger(p.version)||!Array.isArray(p.exercises)||!Array.isArray(p.history))throw Error('Program yapısı geçersiz.');p.exercises.forEach(e=>checkExercise(e))}o.library.forEach(e=>checkExercise(e));for(const [date,d] of Object.entries(o.days)){if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!['rest','workout'].includes(d.kind)||typeof d.id!=='string')throw Error('Gün kaydı geçersiz.');if(d.kind==='workout'){if(!Array.isArray(d.exercises)||typeof d.name!=='string')throw Error('Antrenman geçersiz.');d.exercises.forEach(e=>checkExercise(e,true))}}if(o.bodyweights.some(x=>!/^\d{4}-\d{2}-\d{2}$/.test(x.date)||!validNum(x.kg,500)))throw Error('Vücut ölçümü geçersiz.');return o}
$('importFile').addEventListener('change',async ev=>{const file=ev.target.files[0];if(!file)return;try{if(file.size>10000000)throw Error('Dosya 10 MB sınırını aşıyor.');pending=validateBackup(JSON.parse(await file.text()));previewImport();}catch(e){toast(e.message);pending=null}ev.target.value=''});
function mergeBackup(){if(!pending)return;downloadBackup();const merged=clone(state);for(const [k,d] of Object.entries(pending.days)){const selector=document.querySelector(`[data-conflict="${k}"]`);if(!merged.days[k]||selector?.value==='import')merged.days[k]=clone(d)}for(const p of pending.programs)if(!merged.programs.some(x=>x.id===p.id))merged.programs.push(clone(p));for(const e of pending.library)if(!merged.library.some(x=>x.id===e.id))merged.library.push(clone(e));for(const b of pending.bodyweights)if(!merged.bodyweights.some(x=>x.date===b.date))merged.bodyweights.push(clone(b));state=merged;pending=null;cloudReconcile=false;save();$('modal').close();render();toast('Birleştirme hazır. Profil bölümünden tüm girdileri kaydet.')}
// Manual rest timer: separate from workout data and based on wall-clock time.
const REST_KEY='gym-rest-timer-v1:'+window.gymAccount.user.id;
let restTimer={duration:90,remaining:90000,endAt:null,status:'idle'};
try{const saved=JSON.parse(sessionStorage.getItem(REST_KEY));if(saved&&[60,90,120].includes(saved.duration)&&Number.isFinite(saved.remaining)&&saved.remaining>=0&&saved.remaining<=86400000&&['idle','running','paused','done'].includes(saved.status)&&(saved.endAt===null||Number.isFinite(saved.endAt))&&(saved.status!=='running'||saved.endAt!==null))restTimer=saved;}catch{}
let restNoticeVisible=false;
function showRestNotice(){
 const box=$('restNotice');if(!box)return;
 box.hidden=!restNoticeVisible;
 if(restNoticeVisible)box.innerHTML='<div class="notice" role="alert"><strong>Dinlenme süresi doldu.</strong> Sonraki setine geçebilirsin. <button class="secondary" onclick="restNoticeVisible=false;showRestNotice()">Tamam</button></div>';
}
function notifyRestFinished(){
 restNoticeVisible=true;showRestNotice();toast('Dinlenme süresi doldu — sonraki setine geçebilirsin.');
 if(typeof Notification!=='undefined'&&Notification.permission==='granted'){
  try{new Notification('Dinlenme süresi doldu',{body:'Sonraki setine geçebilirsin.',tag:'gym-rest-finished'});}catch{/* In-app alert remains available on unsupported platforms. */}
 }
}
async function enableRestNotifications(){
 if(typeof Notification==='undefined'){toast('Bu tarayıcı sistem bildirimi desteklemiyor. Uygulama içi bildirim açık.');return;}
 try{const permission=await Notification.requestPermission();toast(permission==='granted'?'Sistem bildirim izni verildi. Arka planda teslim garanti edilmez.':'Sistem bildirimi açılamadı. Uygulama içi bildirim devam eder.');}catch{toast('Sistem bildirimi kullanılamıyor. Uygulama içi bildirim devam eder.');}
}
function persistRest(){try{sessionStorage.setItem(REST_KEY,JSON.stringify(restTimer));}catch{}}
function restRemaining(){return restTimer.status==='running'?Math.max(0,restTimer.endAt-Date.now()):restTimer.remaining;}
function updateRestClock(){
 const workoutClock=$('workoutClock');if(workoutClock)workoutClock.textContent=workoutDuration(state.days[selected]);
 const remaining=restRemaining();
 if(restTimer.status==='running'&&remaining===0){restTimer.status='done';restTimer.remaining=0;restTimer.endAt=null;persistRest();renderRestTimer();notifyRestFinished();return;}
 const el=$('restClock');if(el){const seconds=Math.ceil(remaining/1000);el.textContent=String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');}
}
function renderRestTimer(){
 const host=$('restTimer');if(!host)return;
 const visible=tab==='workout'&&state.days[selected]?.kind==='workout';host.hidden=!visible;document.body.classList.toggle('has-rest-timer',visible);if(!visible)return;
 const active=['running','paused'].includes(restTimer.status),running=restTimer.status==='running';
 host.innerHTML=`<select aria-label="Dinlenme süresi" onchange="chooseRest(+this.value)" ${active?'disabled':''}>${[60,90,120].map(s=>`<option value="${s}" ${restTimer.duration===s?'selected':''}>${s} sn</option>`).join('')}</select><strong id="restClock" aria-label="Kalan dinlenme süresi"></strong><button class="rest-start" aria-label="${running?'Dinlenmeyi duraklat':'Dinlenmeyi başlat'}" onclick="${running?'pauseRest()':'startRest()'}">${running?'Ⅱ':'▶'}</button><button class="secondary" onclick="addRestTime()" ${active?'':'disabled'}>+15 sn</button><button class="secondary" aria-label="Dinlenmeyi sıfırla" onclick="stopRest()">↺</button>`;
 updateRestClock();
}
function chooseRest(seconds){if(![60,90,120].includes(seconds)||['running','paused'].includes(restTimer.status))return;restTimer={duration:seconds,remaining:seconds*1000,endAt:null,status:'idle'};persistRest();renderRestTimer();}
function startRest(){if(restTimer.status==='running')return;restNoticeVisible=false;showRestNotice();const remaining=restTimer.status==='paused'?restTimer.remaining:restTimer.duration*1000;restTimer.remaining=remaining;restTimer.endAt=Date.now()+remaining;restTimer.status='running';persistRest();renderRestTimer();}
function pauseRest(){if(restTimer.status!=='running')return;restTimer.remaining=restRemaining();restTimer.endAt=null;restTimer.status=restTimer.remaining>0?'paused':'done';persistRest();renderRestTimer();}
function addRestTime(){if(!['running','paused'].includes(restTimer.status))return;if(restTimer.status==='running')restTimer.endAt+=15000;else restTimer.remaining+=15000;persistRest();updateRestClock();}
function stopRest(){restTimer.remaining=restTimer.duration*1000;restTimer.endAt=null;restTimer.status='idle';persistRest();renderRestTimer();}
setInterval(updateRestClock,250);
document.addEventListener('visibilitychange',updateRestClock);

window.gymReady=initializeCloud();

function previewImport(){const conflicts=Object.keys(pending.days).filter(k=>state.days[k]&&JSON.stringify(state.days[k])!==JSON.stringify(pending.days[k]));show(`<h2>Yedek önizlemesi</h2><p>${Object.keys(pending.days).length} gün · ${pending.programs.length} program · ${conflicts.length} çakışan gün.</p><p>Yeni günler eklenir. Aynı program kimliğindeki mevcut program korunur. Profil ve ayarlar değiştirilmez. Tarihi çakışan vücut ölçümlerinde mevcut değer korunur.</p>${conflicts.map(k=>`<label>${fmtDate(k)}<select data-conflict="${k}"><option value="keep">Cihazdaki kaydı koru</option><option value="import">Yedekteki kaydı kullan</option></select></label>`).join('')}<div class="notice">Birleştirmeden önce mevcut durumun güvenlik yedeği indirilecek.</div><button onclick="mergeBackup()">Seçimlerimle birleştir</button>`)}

if(gymAccount.role==='member')refreshCoachProgram();
