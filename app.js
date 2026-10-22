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
function save(){dirty=true;updateSaveStatus();return true;}
function updateSaveStatus(){
 const text=saving?'Buluta kaydediliyor…':dirty?'Buluta gönderilmemiş değişiklikler var. Hesabım > Bulut durumu.':cloudMessage;
 const notice=$('unsavedNotice');if(notice){notice.hidden=!dirty&&cloudReady;notice.textContent=text;}
 const status=$('allSaveStatus');if(status)status.textContent=text;
 const button=$('saveAllButton');if(button)button.disabled=saving||cloudReconcile;
 const side=document.querySelector('.side-bottom');if(side)side.textContent=cloudMessage;
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
 }catch(e){cloudMessage='Bulut okunamadı. Girdiler korunuyor; bağlantını kontrol edip yeniden dene.';cloudReady=false;}
 render();
}
async function saveAll(){
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
  toast(dirty?'Buluta kaydedildi. İşlem sırasında yaptığın yeni değişiklikleri de kaydet.':'Tüm girdiler buluta kaydedildi ve doğrulandı.');
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
const labels=[['calendar','▦','Takvim'],['workout','◈','Antrenman'],['progress','↗','İlerleme'],['programs','☷','Programlar']];
function go(t){tab=t;render();window.scrollTo(0,0)}
function render(){extendExerciseLibrary();document.body.classList.toggle('dark',state.settings.theme==='dark'||state.settings.theme==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);$('greeting').textContent=`Merhaba, ${state.profile.name||'sporcu'}.`;
const nav=labels.map(([id,icon,name])=>`<button class="${tab===id?'active':''}" onclick="go('${id}')"><b>${icon}</b>${name}</button>`).join('');$('desktopNav').innerHTML=nav;$('mobileNav').innerHTML=nav;$('app').innerHTML='<p id="unsavedNotice" class="notice" role="status" hidden></p>'+(storageError?'<p class="notice">Yerel kayıt okunamadı veya yazılamadı. Mevcut depolama üzerine otomatik yazılmadı. Yedeğinizi kontrol edin.</p>':'')+({calendar:calendarView,workout:workoutView,progress:progressView,programs:programsView,settings:settingsView}[tab]());renderRestTimer();showRestNotice();updateSaveStatus();GymMotion.refresh();if(tab==='settings'&&gymAccount.role==='member')loadAssignedProgram();}
const fmtDate=d=>new Date(d+'T12:00:00').toLocaleDateString('tr-TR',{day:'numeric',month:'long',year:'numeric'});
const allWork=()=>Object.entries(state.days).filter(([,d])=>d.kind==='workout');
function totals(d){let ext=0,body=0,sets=0;for(const e of d.exercises||[])for(const s of e.logs||[])if(s.done){sets++;const v=(+s.kg||0)*(+s.reps||0)*(e.factor||1);if(e.type==='body')body+=v;else ext+=v}return {ext,body,sets}}
const num=n=>Math.round(n).toLocaleString('tr-TR');
const kgDisplay=n=>state.settings.unit==='lb'?Math.round(n*2.20462262*100)/100:n;
function summary(){let a=allWork(),sets=a.reduce((n,[,d])=>n+totals(d).sets,0);return `<div class="metrics"><div class="metric"><small>TAMAMLANAN ANTRENMAN</small><strong>${a.filter(([,d])=>d.finished).length}</strong><small>Toplam kayıt</small></div><div class="metric"><small>ÇALIŞMA SETİ</small><strong>${sets}</strong><small>Tamamlandı olarak işaretli</small></div><div class="metric"><small>DİNLENME GÜNÜ</small><strong>${Object.values(state.days).filter(d=>d.kind==='rest').length}</strong><small>Toparlanma da gelişimdir</small></div><div class="metric"><small>PROGRAM SAYISI</small><strong>${state.programs.length}</strong><small>${esc(state.programs[state.active]?.name||'Program seç')}</small></div></div>`}
function calendarView(){
 const d=state.days[selected],start=(month.getDay()+(state.settings.week==='monday'?6:0))%7,count=new Date(month.getFullYear(),month.getMonth()+1,0).getDate(),week=state.settings.week==='monday'?['Pzt','Sal','Çar','Per','Cum','Cmt','Paz']:['Paz','Pzt','Sal','Çar','Per','Cum','Cmt'];
 let cells=week.map(w=>`<div class="weekday">${w}</div>`).join('')+'<div></div>'.repeat(start);
 for(let i=1;i<=count;i++){const key=dateKey(new Date(month.getFullYear(),month.getMonth(),i)),kind=state.days[key]?.kind;cells+=`<button aria-label="${fmtDate(key)}${kind==='rest'?' · Dinlenme':kind?' · Antrenman':''}" aria-pressed="${selected===key}" class="day ${selected===key?'selected':''} ${key===today?'today':''} ${kind==='rest'?'rest':kind?'work':''}" onclick="selectDate('${key}')">${i}</button>`}
 const plan=!d?assignment():d.kind==='rest'?`<section class="card rest-card"><span class="badge">DİNLENME</span><h2>Toparlanma günü</h2><p>Takviminde mor renkle işaretlendi.</p><button class="secondary" onclick="go(&quot;workout&quot;)">Günü görüntüle</button></section>`:`<section class="card day-plan"><span class="badge">${d.finished?'TAMAMLANDI':d.started?'DEVAM EDİYOR':'ANTRENMAN'}</span><h2>${esc(d.name)}</h2><small>${d.exercises.length} hareket · ${totals(d).sets} set tamamlandı</small><div class="actions"><button onclick="go('workout')">Antrenmana geç →</button></div></section>`;
 return `<div class="calendar-home"><span class="eyebrow">GÜNLÜĞÜN</span><h1>Bugünün planı.</h1><section class="card month-card"><div class="row"><h2>${month.toLocaleDateString('tr-TR',{month:'long',year:'numeric'})}</h2><div class="month-controls"><button class="link" aria-label="Önceki ay" onclick="shiftMonth(-1)">‹</button><button class="link" aria-label="Sonraki ay" onclick="shiftMonth(1)">›</button></div></div><div class="calendar">${cells}</div><div class="legend"><span><i style="background:var(--green)"></i>Antrenman</span><span><i style="background:var(--purple)"></i>Dinlenme</span><span>Çerçeve: bugün</span></div></section><section aria-label="Seçili günün planı"><div class="row selected-date"><h3>${fmtDate(selected)}</h3><button class="link" onclick="month=new Date(new Date().getFullYear(),new Date().getMonth(),1);selectDate(today)">Bugüne dön</button></div>${plan}</section></div>`;
}
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
function assignment(){return `<section class="card"><h2>Bu günü planla</h2><label>Program<select id="assignProgram">${coachAssignedProgram&&gymAccount.role==='member'?`<option value="coach">${esc(coachAssignedProgram.name)} · Koçumun programı</option>`:''}${state.programs.map((p,i)=>`<option value="${i}" ${i===state.active?'selected':''}>${esc(p.name)} · v${p.version}</option>`).join('')}</select></label><div class="actions"><button onclick="assignWorkout()">Antrenman ata</button><button class="secondary" onclick="setRest()">☾ Dinlenme günü ekle</button></div></section>`}
function assignWorkout(){const choice=$('assignProgram').value;const p=choice==='coach'&&gymAccount.role==='member'?coachAssignedProgram:state.programs[+choice];if(!p)return;state.days[selected]={id:uid(),kind:'workout',name:p.name,programId:p.id,version:p.version,exercises:p.exercises.map(e=>({...clone(e),logs:Array.from({length:e.sets},()=>({kg:'',reps:'',rir:'',done:false}))})),started:null,finished:null,note:''};save();render()}
function setRest(){state.days[selected]={id:uid(),kind:'rest',note:''};save();render()}
function workoutView(){const d=state.days[selected];let body='';if(!d)body=assignment();else if(d.kind==='rest')body=`<section class="card rest-card"><h2>☾ Dinlenme günü</h2><p>Takviminde mor renkle işaretlendi.</p><button class="secondary" onclick="removeDay()">Günü yeniden planla</button></section>`;else{const t=totals(d),target=d.exercises.reduce((n,e)=>n+e.logs.length,0);body=`<section class="card hero" id="workoutSummary"><span class="badge">PROGRAM SÜRÜMÜ ${d.version}</span><h2>${esc(d.name)}</h2><small>${t.sets}/${target} set · ${num(kgDisplay(t.ext))} ${state.settings.unit} harici hacim · ${num(kgDisplay(t.body))} ${state.settings.unit} vücut ağırlığı hacmi</small><div class="progress"><div style="width:${target?t.sets/target*100:0}%"></div></div><div class="actions">${!d.finished?'<button onclick="finishWorkout()">Antrenmanı bitir ✓</button>':`<span class="badge">Tamamlandı${d.started?' · '+Math.round((d.finished-d.started)/60000)+' dk':''}</span>`}</div></section>${d.exercises.map((e,i)=>`<section class="card"><div class="exercise-head"><div><span class="eyebrow">${String(i+1).padStart(2,'0')} / ${esc(e.muscle)}</span><h3 style="margin-top:8px">${esc(e.name)}</h3><small>${esc(e.reps)} tekrar · Hedef RIR ${e.rir} · ${e.rest} sn dinlenme ${e.superset?'· Süperset '+esc(e.superset):''}</small></div>${GymMotion.card(e)}</div><small>${e.factor===2?'Ağırlığı tek dambıl için gir. Hacim iki kol üzerinden hesaplanır.':e.type==='body'?'Toplam vücut + ek ağırlığı gir. Hacim ayrı izlenir.':'Toplam çalışma ağırlığını gir.'}</small><div class="set-grid"><small>SET</small><small>${state.settings.unit.toUpperCase()}</small><small>TEKRAR</small><small>RIR</small><small>BİTTİ</small></div>${e.logs.map((s,j)=>`<div class="set-grid ${s.done?'done':''}"><span class="number">${j+1}</span>${['kg','reps','rir'].map(f=>`<input aria-label="${esc(e.name)} set ${j+1} ${f}" ${invalidSets.has(selected+':'+i+':'+j+':'+f)?'aria-invalid="true"':''} type="number" inputmode="decimal" min="0" ${f==='rir'?'max="10"':''} step="${f==='kg'?'.1':'1'}" value="${s[f]===''?'':f==='kg'?kgDisplay(s[f]):s[f]}" oninput="updateSet(${i},${j},'${f}',this.value,this)">`).join('')}<input aria-label="Set ${j+1} tamamlandı" type="checkbox" ${s.done?'checked':''} onchange="updateSet(${i},${j},'done',this.checked,this)"></div>`).join('')}</section>`).join('')}<section class="card"><label>Antrenman notu<textarea oninput="state.days[selected].note=this.value;save()">${esc(d.note)}</textarea></label><button class="danger" onclick="removeDay()">Bu günün kaydını kaldır</button></section>`}return `<div class="title-row"><div><span class="eyebrow">SET SET GELİŞİM</span><h1>Antrenman</h1></div><input aria-label="Antrenman tarihi" type="date" value="${selected}" onchange="selectDate(this.value)"></div><p class="lead">${fmtDate(selected)} · Girdilerini Profil / Hesabım bölümündeki Antrenmanı kaydet düğmesiyle kaydet.</p>${body}`}
// Keep the edited input and next tap target mounted while persisting each change.
function refreshWorkoutSummary(){
 const d=state.days[selected],host=$('workoutSummary');if(!host||!d)return;
 const t=totals(d),target=d.exercises.reduce((n,e)=>n+e.logs.length,0);
 host.querySelector('small').textContent=`${t.sets}/${target} set · ${num(kgDisplay(t.ext))} ${state.settings.unit} harici hacim · ${num(kgDisplay(t.body))} ${state.settings.unit} vücut ağırlığı hacmi`;
 host.querySelector('.progress > div').style.width=(target?t.sets/target*100:0)+'%';
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
 if(f==='done'&&v&&(s.kg===''||s.reps===''||+s.reps<=0||input?.closest('.set-grid')?.querySelector('[aria-invalid="true"]'))){
  if(input)input.checked=false;toast('Önce geçerli ağırlık ve tekrar gir.');return;
 }
 s[f]=v;
 if(s.done&&(s.kg===''||s.reps===''||+s.reps<=0))s.done=false;
 const row=input?.closest('.set-grid');if(row){row.classList.toggle('done',s.done);row.querySelector('input[type="checkbox"]').checked=s.done;}
 save();refreshWorkoutSummary();
}
function finishWorkout(){
 if(invalidSets.size){toast('Önce geçersiz set değerlerini düzelt.');return;}
 show('<h2>Antrenmanı bitir</h2><p>Boş setler tamamlanmış sayılmaz. Antrenman bitince buluta otomatik kaydedilir.</p><button onclick="confirmFinishWorkout()">Antrenmanı bitir ✓</button>');
}
async function confirmFinishWorkout(){
 const d=state.days[selected];if(!d||d.kind!=='workout'||saving)return;
 d.finished=Date.now();save();
 $('modal').close();render();
 const success=await saveAll();
 toast(success?'Antrenman tamamlandı ve buluta kaydedildi ✓':'Antrenman tamamlandı ancak bulut kaydı bekliyor. Hesabım > Bulut durumu bölümünden tekrar dene.');
}
function removeDay(){if(!confirm('Bu günün kaydı kaldırılsın mı? Öncesinde yedek indirmen önerilir.'))return;delete state.days[selected];for(const key of invalidSets.keys())if(key.startsWith(selected+':'))invalidSets.delete(key);save();render()}
function programsView(){return `<div class="title-row"><div><span class="eyebrow">SANA AİT BİR PLAN</span><h1>Programlarım</h1></div><button onclick="editProgram(-1)">+ Yeni</button></div><p class="lead">Programını değiştir; geçmiş antrenmanların aynı kalsın.</p>${coachProgramCard()}<div class="grid"><div>${state.programs.map((p,i)=>`<section class="card"><span class="badge">${i===state.active?'AKTİF PROGRAM':'PROGRAM'} · v${p.version}</span><h2 style="margin-top:15px">${esc(p.name)}</h2><p class="muted">${p.exercises.length} hareket · ${p.exercises.reduce((n,e)=>n+e.sets,0)} set</p><div class="actions"><button onclick="editProgram(${i})">Düzenle</button><button class="secondary" onclick="state.active=${i};save();render()">Aktif seç</button><button class="secondary" onclick="duplicateProgram(${i})">Çoğalt</button><button class="link" onclick="versions(${i})">Sürümler</button></div></section>`).join('')}</div><div><section class="card"><h2>Hazır şablonlar</h2><p class="muted">Başlangıç noktası olarak ekle, ihtiyaçlarına göre düzenle.</p><div class="actions">${['Full Body','Upper','Lower','Push','Pull','Legs'].map(n=>`<button class="secondary" onclick="addTemplate('${n}')">+ ${n}</button>`).join('')}</div></section><section class="card"><h2>Hareket kütüphanesi</h2><input aria-label="Hareket ara" placeholder="Hareket adı ara…" oninput="filterLibrary(this.value)"><label>Kas grubu<select id="muscleFilter" onchange="filterLibrary('')"><option value="">Tüm kaslar</option>${[...new Set(state.library.map(e=>e.muscle))].map(m=>`<option>${esc(m)}</option>`).join('')}</select></label><label>Ekipman<select id="equipmentFilter" onchange="filterLibrary('')"><option value="">Tüm ekipmanlar</option>${[...new Set(state.library.map(e=>e.equipment))].map(m=>`<option>${esc(m)}</option>`).join('')}</select></label><div id="libraryList">${libraryRows(state.library)}</div><button class="secondary" onclick="customExercise()">+ Özel hareket</button></section></div></div>`}
function libraryRows(items){return items.map(e=>`<div class="list-item library-motion-row"><div><h3>${esc(e.name)}</h3><span class="pill">${esc(e.muscle)}</span></div>${GymMotion.card(e)}</div>`).join('')||'<p class="empty">Hareket bulunamadı.</p>'}function filterLibrary(q){$('libraryList').innerHTML=libraryRows(state.library.filter(e=>e.name.toLocaleLowerCase('tr').includes(q.toLocaleLowerCase('tr'))&&(!$('muscleFilter').value||e.muscle===$('muscleFilter').value)&&(!$('equipmentFilter').value||e.equipment===$('equipmentFilter').value)));GymMotion.refresh()}
function duplicateProgram(i){const p=clone(state.programs[i]);p.id=uid();p.name+=' (kopya)';p.history=[];p.version=1;state.programs.push(p);save();render()}
function addTemplate(n){const map={'Full Body':[14,0,9,10],'Upper':[0,8,9,10,6],'Lower':[12,13,14],'Push':[0,10,4],'Pull':[8,9,6,7],'Legs':[12,13,14]};state.programs.push(program(n,map[n]));save();render();toast('Şablon eklendi. Profil bölümünden kaydet.')}
function editProgram(i){draft={index:i,p:i<0?{id:uid(),name:'Yeni program',version:0,history:[],exercises:[]}:clone(state.programs[i])};editor()}
function editor(){showEditor(`<h2>Programı düzenle</h2><label>Program adı<input value="${esc(draft.p.name)}" oninput="draft.p.name=this.value;save()"></label><div class="notice">Uyguladığın programı kalıcı saklamak için Profil bölümünden kaydet. Geçmiş antrenmanlar değiştirilmez.</div>${draft.p.exercises.map((e,i)=>`<div class="editor-row"><div class="row"><b>${i+1}. ${esc(e.name)}</b><div><button class="link" onclick="moveExercise(${i},-1)" aria-label="Yukarı taşı">↑</button><button class="link" onclick="moveExercise(${i},1)" aria-label="Aşağı taşı">↓</button><button class="link" onclick="draft.p.exercises.splice(${i},1);editor()" aria-label="Hareketi kaldır">×</button></div></div><div class="editor-fields">${[['sets','Set'],['reps','Tekrar aralığı'],['rir','Hedef RIR'],['rest','Dinlenme (sn)'],['superset','Süperset grubu']].map(([f,l])=>`<label>${l}<input value="${esc(e[f])}" oninput="draft.p.exercises[${i}]['${f}']=this.value;save()" ${['sets','rir','rest'].includes(f)?'type="number" min="0"':''}></label>`).join('')}</div><label>Alternatif hareket<select onchange="replaceExercise(${i},this.value)"><option value="">Hareket değiştir…</option>${state.library.map((x,j)=>`<option value="${j}">${esc(x.name)}</option>`).join('')}</select></label></div>`).join('')}<label>Hareket ekle<select id="addExercise">${state.library.map((e,i)=>`<option value="${i}">${esc(e.name)}</option>`).join('')}</select></label><div class="actions"><button class="secondary" onclick="draft.p.exercises.push(clone(state.library[+$('addExercise').value]));editor()">+ Ekle</button><button onclick="saveProgram()">Programı uygula</button></div>`)}
function showEditor(html){$('modalBody').innerHTML=html;if(!$('modal').open)$('modal').showModal()}
function replaceExercise(i,j){if(j==='')return;draft.p.exercises[i]=clone(state.library[+j]);editor()}function moveExercise(i,d){let a=draft.p.exercises,j=i+d;if(j<0||j>=a.length)return;[a[i],a[j]]=[a[j],a[i]];editor()}
function saveProgram(){const p=draft.p;if(!p.name.trim()||!p.exercises.length){toast('Program adı ve en az bir hareket gerekli.');return false}for(const e of p.exercises){e.sets=+e.sets;e.rir=+e.rir;e.rest=+e.rest;if(!Number.isInteger(e.sets)||e.sets<1||e.sets>20||!Number.isFinite(e.rir)||e.rir<0||e.rir>10||!Number.isFinite(e.rest)||e.rest<0){toast('Set 1–20, RIR 0–10 ve dinlenme 0 veya üstü olmalı.');return false}}if(draft.index>=0){const old=state.programs[draft.index];p.history.push({version:old.version,name:old.name,exercises:clone(old.exercises),saved:new Date().toISOString()});p.version++;state.programs[draft.index]=p}else{p.version=1;state.programs.push(p)}draft=null;save();$('modal').close();render();return true}
function versions(i){const p=state.programs[i];show(`<h2>${esc(p.name)} · Sürümler</h2><p>Güncel sürüm: ${p.version}</p>${p.history.map(v=>`<div class="list-item"><b>v${v.version} · ${esc(v.name)}</b><p>${v.exercises.map(e=>`${esc(e.name)} (${e.sets} set)`).join('<br>')}</p></div>`).join('')||'<p class="empty">Henüz önceki sürüm yok.</p>'}`)}
function customExercise(){show(`<h2>Özel hareket</h2><label>Ad<input id="customName"></label><label>Kas grubu<input id="customMuscle"></label><label>Ekipman<input id="customEquipment"></label><label>Hacim hesabı<select id="customType"><option value="1">Toplam ağırlık × tekrar</option><option value="2">Tek dambıl × 2 × tekrar</option><option value="body">Vücut ağırlığı (ayrı hacim)</option></select></label><button onclick="saveCustom()">Hareketi ekle</button>`)}
function saveCustom(){if(!$('customName').value.trim()||!$('customMuscle').value.trim()||!$('customEquipment').value.trim()){toast('Tüm alanları doldur.');return}const type=$('customType').value;state.library.push(exercise($('customName').value,$('customMuscle').value,$('customEquipment').value,type==='body'?'body':'external',type==='2'?2:1));save();$('modal').close();render()}
function progressView(){const rows=allWork().sort(([a],[b])=>a.localeCompare(b)),names=[...new Set(rows.flatMap(([,d])=>d.exercises.map(e=>e.name)))],muscles={};rows.forEach(([,d])=>d.exercises.forEach(e=>muscles[e.muscle]=(muscles[e.muscle]||0)+e.logs.filter(s=>s.done).length));return `<span class="eyebrow">EMEĞİNİN KARŞILIĞI</span><h1>Gelişimini gör.</h1><p class="lead">Yalnızca kaydettiğin gerçek veriler. Her setin bir hikâyesi var.</p>${summary()}<div class="grid"><section class="card"><h2>Hareket performansı</h2><label>Hareket<select id="chartExercise" onchange="drawChart()">${names.map(n=>`<option>${esc(n)}</option>`).join('')}</select></label><div class="row"><label>Ölçüm<select id="chartMode" onchange="drawChart()"><option value="weight">En yüksek ağırlık</option><option value="rm">Tahmini 1RM</option></select></label><label>Dönem<select id="chartRange" onchange="drawChart()"><option value="all">Tümü</option><option value="30">Son 30 gün</option><option value="90">Son 90 gün</option></select></label></div><div id="chartArea"><p class="empty">Grafiği görmek için bir hareket ve ölçüm seç.<br>${names.length?'':'Henüz antrenman kaydı yok.'}</p></div><button class="secondary" onclick="drawChart()">Grafiği göster</button><div class="notice">Epley tahmini yalnızca 1–10 tekrarlı harici ağırlık setlerinden hesaplanır. Dambıl gücü tek eldeki ağırlıktır; hacim iki kolu kapsar.</div></section><section class="card"><h2>Kas grubu dağılımı</h2><small>Tamamlanan setler · Her set ana kasına sayılır</small>${Object.entries(muscles).map(([m,n])=>`<div class="list-item"><div class="row"><span>${esc(m)}</span><b>${n} set</b></div><div class="bar"><i style="width:${n/Math.max(...Object.values(muscles),1)*100}%"></i></div></div>`).join('')||'<p class="empty">İlk setini tamamladığında burada görünecek.</p>'}</section></div><section class="card"><h2>Antrenman geçmişi</h2>${rows.reverse().map(([date,d])=>{const t=totals(d);return `<div class="list-item row"><div><h3>${esc(d.name)}</h3><small>${fmtDate(date)} · ${t.sets} set · ${num(kgDisplay(t.ext))} ${state.settings.unit} harici / ${num(kgDisplay(t.body))} ${state.settings.unit} vücut hacmi${d.finished&&d.started?' · '+Math.round((d.finished-d.started)/60000)+' dk':''}</small></div><button class="secondary" onclick="selected='${date}';go('workout')">Aç</button></div>`}).join('')||'<p class="empty">Henüz kayıt yok.</p>'}</section><section class="card"><h2>Vücut ağırlığı</h2><div class="row"><input type="date" id="bodyDate" value="${today}" aria-label="Ölçüm tarihi"><input type="number" min="1" step=".1" id="bodyKg" placeholder="kg" aria-label="Vücut ağırlığı kilogram"><button onclick="addBodyweight()">Ekle</button></div>${state.bodyweights.map(x=>`<p>${fmtDate(x.date)} <b>${x.kg} kg</b></p>`).join('')}</section>`}
function drawChart(){const name=$('chartExercise').value,mode=$('chartMode').value,range=$('chartRange').value,cutoff=range==='all'?null:Date.now()-(+range)*86400000;const points=allWork().sort(([a],[b])=>a.localeCompare(b)).filter(([date])=>!cutoff||new Date(date+'T23:59:59').getTime()>=cutoff).map(([date,d])=>{const es=d.exercises.filter(e=>e.name===name),sets=es.flatMap(e=>e.logs.filter(s=>s.done&&+s.reps>0&&s.kg!==''&&(mode!=='rm'||e.type==='external'&&+s.reps<=10)));if(!sets.length)return null;let best=sets.reduce((a,s)=>{let value=+s.kg*(mode==='rm'?1+(+s.reps)/30:1);return !a||value>a.value?{value,set:s}:a},null);return {date,...best}}).filter(Boolean);if(!points.length){$('chartArea').innerHTML='<p class="empty">Bu seçim için uygun tamamlanmış set yok.</p>';return}const max=Math.max(...points.map(p=>p.value),1),xy=points.map((p,i)=>[40+(points.length===1?210:i*420/(points.length-1)),165-p.value/max*130]);const last=points.at(-1),prev=points.at(-2);$('chartArea').innerHTML=`<svg class="chart" viewBox="0 0 500 205" role="img" aria-label="Tarihe göre ${esc(name)} performansı"><path d="M40 20V165H480" fill="none" stroke="var(--line)"/><polyline points="${xy.map(p=>p.join(',')).join(' ')}" fill="none" stroke="var(--green)" stroke-width="3"/>${points.map((p,i)=>`<circle cx="${xy[i][0]}" cy="${xy[i][1]}" r="6" fill="var(--green)"><title>${fmtDate(p.date)} · ${kgDisplay(p.value).toFixed(1)} ${state.settings.unit} · ${p.set.reps} tekrar · RIR ${p.set.rir}</title></circle>`).join('')}<text x="40" y="192">${points[0].date}</text><text x="480" y="192" text-anchor="end">${last.date}</text></svg><div class="row"><span>Rekor <b>${kgDisplay(max).toFixed(1)} ${state.settings.unit}</b></span><span>Son antrenmana göre <b>${prev?(kgDisplay(last.value-prev.value)).toFixed(1)+' '+state.settings.unit:'—'}</b></span></div>${points.map(p=>`<details class="list-item"><summary>${fmtDate(p.date)} · ${kgDisplay(p.value).toFixed(1)} ${state.settings.unit}</summary><p>${p.set.reps} tekrar · RIR ${p.set.rir===''?'Belirtilmedi':p.set.rir} · ${kgDisplay(p.set.kg)} ${state.settings.unit}</p></details>`).join('')}`}
function addBodyweight(){const kg=+$('bodyKg').value,date=$('bodyDate').value;if(!date||!Number.isFinite(kg)||kg<=0||kg>500){toast('Geçerli tarih ve kilo gir.');return}const old=state.bodyweights.find(x=>x.date===date);if(old&&!confirm('Bu tarihteki kilo ölçümü güncellensin mi?'))return;state.bodyweights=state.bodyweights.filter(x=>x.date!==date);state.bodyweights.push({date,kg});state.bodyweights.sort((a,b)=>a.date.localeCompare(b.date));save();render()}
function settingsView(){return `<span class="eyebrow">KİŞİSEL ALANIN</span><h1>Hesabım</h1><p class="lead">Tercihlerin ve kayıtların bir arada.</p><section class="card"><h2>Bulut durumu</h2><p id="allSaveStatus" role="status"></p><button class="secondary" onclick="retryCloud()">Bulutu yeniden kontrol et</button><button class="secondary" onclick="saveAll()">Bekleyen değişiklikleri buluta gönder</button></section><div class="grid"><section class="card"><h2>Profilim</h2>${[['name','Ad'],['goal','Spor hedefi'],['height','Boy (cm)']].map(([f,l])=>`<label>${l}<input value="${esc(state.profile[f])}" oninput="state.profile['${f}']=this.value;save()"></label>`).join('')}<label>Tema<select onchange="state.settings.theme=this.value;save();render()">${[['system','Sistem'],['light','Açık'],['dark','Koyu']].map(([v,l])=>`<option value="${v}" ${state.settings.theme===v?'selected':''}>${l}</option>`).join('')}</select></label><label>Ağırlık birimi<select onchange="state.settings.unit=this.value;save();render()"><option ${state.settings.unit==='kg'?'selected':''}>kg</option><option ${state.settings.unit==='lb'?'selected':''}>lb</option></select></label><label>Hafta başlangıcı<select onchange="state.settings.week=this.value;save();render()"><option value="monday" ${state.settings.week==='monday'?'selected':''}>Pazartesi</option><option value="sunday" ${state.settings.week==='sunday'?'selected':''}>Pazar</option></select></label></section><div><section class="card"><h2>Dinlenme bildirimi</h2><p class="muted">Sayaç bitince uygulama içinde bildirim gösterilir. Desteklenen tarayıcılarda sistem bildirimini de açabilirsin.</p><button class="secondary" onclick="enableRestNotifications()">Sistem bildirimini aç</button><p class="notice">Telefon kilitliyken veya uygulama arka plandayken bildirim garanti edilmez. Uygulamaya dönünce süre kontrol edilir. iPhone bu yerel sayaç için sistem bildirimi göstermeyebilir.</p></section><section class="card"><h2>Yedekleme</h2><p class="muted">Programların, setlerin, takvimin ve profilin tek JSON dosyasında.</p><div class="actions"><button onclick="downloadBackup()">Yedeği indir ↓</button><button class="secondary" onclick="$ ('importFile').click()">Yedekten birleştir ↑</button></div><div class="notice">Buluta kaydedilmiş verilerin aynı hesapla diğer cihazlarda açılır. Buluta gönderilmemiş cihaz kayıtları tarayıcı verileri silinirse kaybolabilir. JSON yedeğini de sakla.</div></section>${membershipCard()}</div></div>`}
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
 const remaining=restRemaining();
 if(restTimer.status==='running'&&remaining===0){restTimer.status='done';restTimer.remaining=0;restTimer.endAt=null;persistRest();renderRestTimer();notifyRestFinished();return;}
 const el=$('restClock');if(el){const seconds=Math.ceil(remaining/1000);el.textContent=String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');}
}
function renderRestTimer(){
 const host=$('restTimer');if(!host)return;
 const visible=tab==='workout'&&state.days[selected]?.kind==='workout';host.hidden=!visible;document.body.classList.toggle('has-rest-timer',visible);if(!visible)return;
 const active=['running','paused'].includes(restTimer.status),running=restTimer.status==='running';
 host.innerHTML=`<div class="rest-top"><div><small>SET ARASI DİNLENME</small><div id="restMessage" role="status">${restTimer.status==='done'?'Süre doldu ✓':running?'Dinlenme sürüyor':restTimer.status==='paused'?'Duraklatıldı':'Süre seç ve başlat'}</div></div><strong id="restClock" aria-label="Kalan dinlenme süresi"></strong></div><div class="rest-presets" aria-label="Dinlenme süresi">${[60,90,120].map(s=>`<button type="button" ${active?'disabled':''} aria-pressed="${restTimer.duration===s}" onclick="chooseRest(${s})">${s} sn</button>`).join('')}</div><div class="rest-actions"><button class="rest-start" onclick="${running?'pauseRest()':'startRest()'}">${running?'Duraklat':restTimer.status==='paused'?'Devam et':'Başlat'}</button><button class="secondary" onclick="addRestTime()" ${active?'':'disabled'}>+15 sn</button><button class="secondary" onclick="stopRest()" ${restTimer.status==='idle'?'disabled':''}>Bitir</button></div>`;
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
