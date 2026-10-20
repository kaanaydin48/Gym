'use strict';
// Assignment access is independent of personal templates and historical day snapshots.
const memberMode=gymAccount.role==='member';
let assignedPrograms=[],assignmentsReady=false,assignmentError='',management=null,managementBusy=false;
const personal={render,initializeCloud,saveAll,programsView,assignment,assignWorkout,summary,extendExerciseLibrary,validateBackup,saveProgram};
function availablePrograms(){return memberMode?assignedPrograms:state.programs;}
function archiveMemberTemplates(){
 if(!memberMode)return;
 if(state.programs.length||state.library.length){
  const key=KEY+':pre-assignment-access';
  // Never replace the old local archive; cloud migration separately archives cloud snapshots.
  if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify(state));
 }
 state.programs=[];state.library=[];state.active=0;
}
extendExerciseLibrary=function(){if(!memberMode)personal.extendExerciseLibrary();};
validateBackup=function(value){
 // The original format required one personal program. Assigned-only accounts may have none.
 if(Array.isArray(value?.programs)&&value.programs.length===0){
  personal.validateBackup({...value,programs:[{id:'validation-only',name:'',version:1,exercises:[],history:[]}]});return value;
 }
 return personal.validateBackup(value);
};
async function refreshAssignedPrograms(){
 if(!memberMode)return;
 assignmentsReady=false;assignedPrograms=[];assignmentError='';
 try{
  const result=await gymAccount.client.from('assignments').select('id,program_id,programs(id,title,version,exercises,is_active)').eq('member_id',gymAccount.user.id).eq('is_active',true);
  if(result.error)throw result.error;
  assignedPrograms=(result.data||[]).filter(a=>a.programs?.is_active).map(a=>({id:a.programs.id,assignmentId:a.id,name:a.programs.title,version:a.programs.version,exercises:a.programs.exercises,history:[]}));
  assignmentsReady=true;
 }catch{assignmentError='Atanmış programlar yüklenemedi. Bağlantını kontrol edip yeniden dene.';}
}
function memberProgramNotice(){return assignmentError||(!assignmentsReady?'Programlar kontrol ediliyor…':'Henüz antrenman programı atanmadı');}
async function reloadAssignedPrograms(){await refreshAssignedPrograms();render();}
assignment=function(){
 if(!memberMode)return personal.assignment();
 if(!assignedPrograms.length)return `<section class="card"><p role="status">${memberProgramNotice()}</p><button class="secondary" onclick="reloadAssignedPrograms()">Yenile</button><button class="secondary" onclick="setRest()">☾ Dinlenme günü ekle</button></section>`;
 return `<section class="card"><h2>Atanmış antrenmanlar</h2><label>Program<select id="assignProgram">${assignedPrograms.map((p,i)=>`<option value="${i}">${esc(p.name)} · v${p.version}</option>`).join('')}</select></label><div class="actions"><button onclick="assignWorkout()">Bu gün için seç</button><button class="secondary" onclick="setRest()">☾ Dinlenme günü ekle</button><button class="secondary" onclick="reloadAssignedPrograms()">Yenile</button></div></section>`;
};
assignWorkout=function(){
 if(!memberMode)return personal.assignWorkout();
 const p=assignedPrograms[+$('assignProgram').value];
 if(!assignmentsReady||!p){toast(memberProgramNotice());return;}
 if(state.days[selected]){toast('Bu tarihte kayıt var. Mevcut kaydını takvimden aç.');return;}
 state.days[selected]={id:uid(),kind:'workout',assignmentId:p.assignmentId,programId:p.id,name:p.name,version:p.version,exercises:p.exercises.map(e=>({...clone(e),logs:Array.from({length:e.sets},()=>({kg:'',reps:'',rir:'',done:false}))})),started:null,finished:null,note:''};save();render();
};
programsView=function(){
 if(!memberMode)return `<section class="card"><button onclick="openProgramManagement()">Koç yönetimi · Programlar ve atamalar</button></section>`+personal.programsView();
 return `<h1>Antrenmanlarım</h1><p class="lead">Koçunun atadığı aktif programlar. Set sonuçlarını Antrenman ekranında kaydedebilirsin.</p><button class="secondary" onclick="reloadAssignedPrograms()">Yenile</button>`+(assignedPrograms.length?assignedPrograms.map(p=>`<section class="card"><h2>${esc(p.name)}</h2><small>Sürüm ${p.version}</small>${p.exercises.map((e,i)=>`<div class="list-item"><h3>${i+1}. ${esc(e.name)}</h3><p>${e.sets} set · ${esc(e.reps)} tekrar · RIR ${e.rir} · ${e.rest} sn</p>${GymMotion.card(e)}</div>`).join('')}</section>`).join(''):`<p class="empty" role="status">${memberProgramNotice()}</p>`);
};
summary=function(){
 if(!memberMode)return personal.summary();
 // Reuse the metrics view, substituting only the displayed program count/name.
 const old=state.programs;try{state.programs=assignedPrograms;return personal.summary();}finally{state.programs=old;}
};
for(const name of ['editProgram','duplicateProgram','addTemplate','customExercise','saveCustom','editor','versions','replaceExercise','moveExercise']){
 const original=window[name];window[name]=function(...args){if(memberMode){toast('Program yapısını yalnızca koçun veya yönetici değiştirebilir.');return false;}return original(...args);};
}
saveProgram=function(){if(memberMode)return false;return personal.saveProgram();};
saveAll=async function(){
 if(memberMode){try{archiveMemberTemplates();}catch{toast('Yerel arşiv korunamadı. Önce JSON yedeğini indir.');return false;}}
 return personal.saveAll();
};
initializeCloud=async function(){await personal.initializeCloud();if(memberMode){archiveMemberTemplates();await refreshAssignedPrograms();render();}};
const previousReady=window.gymReady;
window.gymReady=(async()=>{await previousReady;if(memberMode){archiveMemberTemplates();await initializeCloud();}render();})();

// Staff management uses the existing exercise editor, without touching personal programs.
async function openProgramManagement(){
 if(memberMode)return;
 show('<h2>Program yönetimi</h2><p>Yükleniyor…</p>');
 try{
  const results=await Promise.all([
   gymAccount.client.from('programs').select('*').order('created_at'),
   gymAccount.client.from('profiles').select('id,display_name,coach_id').eq('role','member'),
   gymAccount.client.from('assignments').select('*').order('assigned_at')
  ]);
  for(const r of results)if(r.error)throw r.error;
  management={programs:results[0].data,members:results[1].data,assignments:results[2].data};
  show(`<h2>Programlar ve atamalar</h2><p>Güncellemeler yeni antrenmanlara uygulanır. Kaydedilmiş antrenmanlar eski sürümleriyle korunur.</p><label>Kişisel programını buluta kopyala<select id="publishProgram">${state.programs.map((p,i)=>`<option value="${i}">${esc(p.name)}</option>`).join('')}</select></label><button onclick="publishProgram()">Kopyayı oluştur</button>${management.programs.map((p,i)=>`<div class="list-item"><h3>${esc(p.title)} · v${p.version}</h3><span>${p.is_active?'Aktif':'Pasif'}</span><button class="secondary" onclick="editManagedProgram(${i})">Düzenle</button><button class="secondary" onclick="toggleManagedProgram(${i})">${p.is_active?'Pasifleştir':'Etkinleştir'}</button></div>`).join('')}<h3>Üyeye program ata</h3><label>Üye<select id="managedMember">${management.members.map(m=>`<option value="${m.id}">${esc(m.display_name||m.id)}</option>`).join('')}</select></label><label>Program<select id="managedProgram">${management.programs.filter(p=>p.is_active).map(p=>`<option value="${p.id}">${esc(p.title)}</option>`).join('')}</select></label><button onclick="createProgramAssignment()">Ata</button><h3>Mevcut atamalar</h3>${management.assignments.map((a,i)=>`<div class="list-item"><p>${esc(management.members.find(m=>m.id===a.member_id)?.display_name||a.member_id)} → ${esc(management.programs.find(p=>p.id===a.program_id)?.title||'Program')}</p><button class="secondary" onclick="toggleProgramAssignment(${i})">${a.is_active?'Atamayı pasifleştir':'Atamayı etkinleştir'}</button></div>`).join('')}`);
 }catch{show('<h2>Programlar yüklenemedi</h2><p>Yetkini ve bağlantını kontrol et.</p><button onclick="openProgramManagement()">Yeniden dene</button>');}
}
async function managementWrite(operation){
 if(managementBusy)return false;managementBusy=true;
 try{const r=await operation();if(r.error)throw r.error;if(!r.data?.length)throw Error('Kayıt güncellenemedi.');await openProgramManagement();return true;}
 catch{toast('İşlem kaydedilemedi. Yetki değişmiş veya başka cihazda güncellenmiş olabilir. Listeyi yenile.');return false;}
 finally{managementBusy=false;}
}
async function publishProgram(){
 if(memberMode)return;const p=state.programs[+$('publishProgram').value];if(!p)return;
 await managementWrite(()=>gymAccount.client.from('programs').insert({coach_id:gymAccount.user.id,title:p.name,exercises:clone(p.exercises)}).select('id'));
}
function editManagedProgram(i){
 if(memberMode)return;const p=management.programs[i];if(!p)return;
 draft={index:-1,p:{id:p.id,name:p.title,version:p.version,history:[],exercises:clone(p.exercises)}};editor();
 // Replace only the editor's save action. Personal editor and history stay unchanged.
 const button=[...$('modalBody').querySelectorAll('button')].find(b=>b.getAttribute('onclick')==='saveProgram()');
 if(button){button.setAttribute('onclick','saveManagedProgram()');button.textContent='Atanmış programı güncelle';}
 draft.managed={id:p.id,version:p.version};
}
// Re-rendering the editor must retain the managed-save action after reorder/add/remove.
const baseEditor=editor;
editor=function(){baseEditor();if(draft?.managed){const b=[...$('modalBody').querySelectorAll('button')].find(x=>x.getAttribute('onclick')==='saveProgram()');if(b){b.setAttribute('onclick','saveManagedProgram()');b.textContent='Atanmış programı güncelle';}}};
const ordinarySave=saveProgram;
saveProgram=function(){if(draft?.managed){toast('Program düzenleyicisindeki güncelle düğmesini kullan.');return false;}return ordinarySave();};
async function saveManagedProgram(){
 if(memberMode||!draft?.managed)return;
 const p=clone(draft.p),target=draft.managed;
 for(const e of p.exercises){e.sets=+e.sets;e.rir=+e.rir;e.rest=+e.rest;}
 try{validateBackup({...state,programs:[p]});if(!p.name.trim()||!p.exercises.length)throw Error();}catch{toast('Program adı, hareketler ve set hedeflerini kontrol et.');return;}
 const ok=await managementWrite(()=>gymAccount.client.from('programs').update({title:p.name,exercises:p.exercises}).eq('id',target.id).eq('version',target.version).select('id'));
 if(ok)draft=null;
}
async function toggleManagedProgram(i){if(memberMode)return;const p=management.programs[i];if(!p)return;await managementWrite(()=>gymAccount.client.from('programs').update({is_active:!p.is_active}).eq('id',p.id).eq('version',p.version).select('id'));}
async function createProgramAssignment(){
 if(memberMode)return;const member=$('managedMember').value,programId=$('managedProgram').value;if(!member||!programId)return;
 if(management.assignments.some(a=>a.member_id===member&&a.program_id===programId&&a.is_active)){toast('Bu program zaten aktif olarak atanmış.');return;}
 await managementWrite(()=>gymAccount.client.from('assignments').insert({coach_id:gymAccount.user.id,member_id:member,program_id:programId}).select('id'));
}
async function toggleProgramAssignment(i){if(memberMode)return;const a=management.assignments[i];if(!a)return;await managementWrite(()=>gymAccount.client.from('assignments').update({is_active:!a.is_active}).eq('id',a.id).select('id'));}
