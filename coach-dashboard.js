'use strict';
let coachDashboard={members:[],query:'',filter:'all',detail:null,month:today.slice(0,7),selected:null,busy:false};
const staffProgramsView=programsView;
programsView=function(){return (memberMode?'':`<section class="card"><h2>Koç paneli</h2><p>Üyelerini, programlarını ve gelişimlerini takip et.</p><button onclick="openCoachDashboard()">Üyeler ve gelişim</button></section>`)+staffProgramsView();};
const staffMembershipCard=membershipCard;
membershipCard=function(){return staffMembershipCard()+(memberMode?'':`<section class="card"><button onclick="openCoachDashboard()">Koç panelini aç</button></section>`);};
function coachNumber(value){const n=Number(value);return Number.isFinite(n)&&n>=0?n:0;}
function coachStats(logs){
 const sessions=[],records=new Map();
 for(const row of [...logs].sort((a,b)=>a.workout_date.localeCompare(b.workout_date))){
  const day=row.sets;if(day?.kind!=='workout')continue;
  let external=0,body=0,completed=0;
  for(const exercise of day.exercises||[]){
   for(const set of exercise.logs||[]){
    if(!set.done||set.kg===''||coachNumber(set.reps)<=0)continue;
    const kg=coachNumber(set.kg),reps=coachNumber(set.reps),volume=kg*reps*(exercise.factor===2?2:1);completed++;
    if(exercise.type==='body')body+=volume;else external+=volume;
    const key=exercise.name+'|'+exercise.type,previous=records.get(key)||{name:exercise.name,type:exercise.type,kg:-1,rm:0,date:row.workout_date,reps:0};
    if(kg>previous.kg||(kg===previous.kg&&reps>previous.reps)){previous.kg=kg;previous.reps=reps;previous.date=row.workout_date;}
    if(exercise.type==='external'&&reps<=10)previous.rm=Math.max(previous.rm,kg*(1+reps/30));
    records.set(key,previous);
   }
  }
  if(completed)sessions.push({date:row.workout_date,name:day.name,external,body,completed});
 }
 const latest=sessions.at(-1),previous=sessions.at(-2);
 return {sessions,records:[...records.values()],latest,delta:latest&&previous?latest.external-previous.external:null};
}
async function openCoachDashboard(){
 if(memberMode)return;
 show('<h2>Koç paneli</h2><p role="status">Üyeler yükleniyor…</p>');coachDashboard.detail=null;
 try{const {data,error}=await gymAccount.client.rpc('coach_member_overview');if(error)throw error;coachDashboard.members=data||[];renderCoachDashboard();}
 catch{coachDashboard.members=[];show('<h2>Koç paneli</h2><p role="alert">Üyeler yüklenemedi. Yetkini ve bağlantını kontrol et.</p><button onclick="openCoachDashboard()">Yeniden dene</button>');}
}
function filteredCoachMembers(){
 const q=coachDashboard.query.toLocaleLowerCase('tr');return coachDashboard.members.filter(m=>(`${m.display_name} ${m.email}`).toLocaleLowerCase('tr').includes(q)&&(coachDashboard.filter==='all'||coachDashboard.filter==='active'&&m.is_active||coachDashboard.filter==='inactive'&&!m.is_active||coachDashboard.filter==='pending'&&m.invite_status==='pending'));
}
function renderCoachDashboard(){
 if(memberMode)return;
 show(`<h2>Koç paneli</h2><div class="row"><button class="secondary" onclick="openCoachDashboard()">Yenile</button><button class="secondary" onclick="openProgramManagement()">Programları yönet</button>${gymAccount.role==='admin'?'<button class="secondary" onclick="openMembers()">Üye daveti</button>':''}</div><label>Üye ara<input id="coachSearch" value="${esc(coachDashboard.query)}" placeholder="Ad veya e-posta" oninput="coachDashboard.query=this.value;renderCoachMemberList()"></label><label>Durum<select id="coachFilter" onchange="coachDashboard.filter=this.value;renderCoachMemberList()">${[['all','Tüm üyeler'],['active','Aktif'],['inactive','Pasif'],['pending','Davet bekleyen']].map(([value,label])=>`<option value="${value}" ${coachDashboard.filter===value?'selected':''}>${label}</option>`).join('')}</select></label><p class="muted">Aktif/pasif, takip durumudur; hesabın giriş hakkını değiştirmez.</p><div id="coachMemberList"></div>`);renderCoachMemberList();
}
function renderCoachMemberList(){
 const host=$('coachMemberList');if(!host||memberMode)return;const members=filteredCoachMembers();
 host.innerHTML=members.map(m=>`<section class="card"><div class="row"><h3>${esc(m.display_name||'İsimsiz üye')}</h3><span class="badge">${m.is_active?'Aktif':'Pasif'}</span></div><p>${esc(m.email)}</p><p>Son antrenman: <b>${m.last_workout?fmtDate(m.last_workout):'Henüz kayıt yok'}</b></p><p>Program: ${m.active_programs>0?m.active_programs+' aktif atama':'Atanmamış'}</p><p>${m.invite_status==='pending'?'Davet bekliyor':m.invite_status==='accepted'?'Davet kabul edildi':'Mevcut hesap'}</p><button onclick="openCoachMember('${m.id}')">Üye detayı</button></section>`).join('')||'<p class="empty">Bu filtreye uygun üye yok.</p>';
}
async function coachReadAll(table,columns,memberId){
 const result=[];for(let offset=0;;offset+=500){const {data,error}=await gymAccount.client.from(table).select(columns).eq('member_id',memberId).order(table==='workout_logs'?'workout_date':'created_at').range(offset,offset+499);if(error)throw error;result.push(...(data||[]));if((data||[]).length<500)return result;}
}
async function openCoachMember(memberId){
 if(memberMode)return;
 show('<h2>Üye detayı</h2><p role="status">Yükleniyor…</p>');coachDashboard.detail=null;
 try{
  const profile=await gymAccount.client.rpc('coach_member_profile',{target:memberId});if(profile.error||!profile.data)throw profile.error||Error('Yetki yok');
  const [logs,notes,assignments]=await Promise.all([coachReadAll('workout_logs','workout_date,sets,notes',memberId),coachReadAll('coach_notes','id,author_id,body,created_at',memberId),gymAccount.client.from('assignments').select('id,is_active,programs(id,title,exercises,version,is_active)').eq('member_id',memberId)]);
  if(assignments.error)throw assignments.error;
  coachDashboard.detail={profile:profile.data,logs,notes,assignments:assignments.data||[],stats:coachStats(logs)};
  coachDashboard.month=today.slice(0,7);coachDashboard.selected=logs.at(-1)?.workout_date||today;renderCoachDetail();
 }catch{show('<h2>Üye detayı açılamadı</h2><p role="alert">Üye artık yetki alanında olmayabilir veya bağlantı kesilmiş olabilir.</p><button onclick="openCoachDashboard()">Üyelere dön</button>');}
}
function coachCalendar(){
 const {logs}=coachDashboard.detail,[year,month]=coachDashboard.month.split('-').map(Number),first=new Date(year,month-1,1),length=new Date(year,month,0).getDate(),start=(first.getDay()+6)%7;
 let cells=['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'].map(d=>`<div class="weekday">${d}</div>`).join('')+'<div></div>'.repeat(start);
 const dates=new Map(logs.map(l=>[l.workout_date,l.sets?.kind]));
 for(let n=1;n<=length;n++){const date=`${coachDashboard.month}-${String(n).padStart(2,'0')}`,kind=dates.get(date);cells+=`<button class="day ${kind==='rest'?'rest':kind==='workout'?'work':''} ${date===coachDashboard.selected?'selected':''}" aria-label="${fmtDate(date)}" onclick="selectCoachDay('${date}')">${n}</button>`;}
 return `<div class="row"><button class="link" onclick="shiftCoachMonth(-1)" aria-label="Önceki ay">‹</button><h3>${first.toLocaleDateString('tr-TR',{month:'long',year:'numeric'})}</h3><button class="link" onclick="shiftCoachMonth(1)" aria-label="Sonraki ay">›</button></div><div class="calendar">${cells}</div>`;
}
function shiftCoachMonth(step){const [y,m]=coachDashboard.month.split('-').map(Number);coachDashboard.month=dateKey(new Date(y,m-1+step,1)).slice(0,7);renderCoachDetail();}
function selectCoachDay(date){coachDashboard.selected=date;renderCoachDetail();}
function coachDayDetail(){
 const row=coachDashboard.detail.logs.find(l=>l.workout_date===coachDashboard.selected),d=row?.sets;
 if(!d)return '<p class="empty">Bu tarihte kayıt yok.</p>';
 if(d.kind==='rest')return '<p class="notice">Dinlenme günü</p>';
 return `<h3>${esc(d.name)}</h3><p>${d.finished?'Tamamlandı':'Devam ediyor / planlandı'}</p>${(d.exercises||[]).map(e=>`<section class="list-item"><h3>${esc(e.name)}</h3><small>${esc(e.reps)} hedef tekrar · RIR ${esc(e.rir)}</small><div class="coach-table"><table><thead><tr><th>Set</th><th>Kg</th><th>Tekrar</th><th>RIR</th><th>Bitti</th></tr></thead><tbody>${(e.logs||[]).map((s,i)=>`<tr><td>${i+1}</td><td>${esc(s.kg===''?'—':s.kg)}</td><td>${esc(s.reps===''?'—':s.reps)}</td><td>${esc(s.rir===''?'—':s.rir)}</td><td>${s.done?'✓':'—'}</td></tr>`).join('')}</tbody></table></div></section>`).join('')}<p>${esc(d.note||'')}</p>`;
}
function renderCoachDetail(){
 const detail=coachDashboard.detail;if(!detail||memberMode)return;const {profile:p,stats,assignments,notes}=detail;
 const active=assignments.filter(a=>a.is_active&&a.programs?.is_active),profile=p.profile||{};
 show(`<button class="secondary" onclick="renderCoachDashboard()">← Üyelere dön</button><h2>${esc(p.display_name||profile.name||'Üye')}</h2><p>${esc(p.email)}</p><span class="badge">${p.is_active?'Aktif':'Pasif'}</span><button class="secondary" onclick="setCoachMemberActivity()">${p.is_active?'Pasife al':'Aktife al'}</button><section class="card"><h3>Üye profili</h3><p>Hedef: ${esc(profile.goal||'Belirtilmedi')}</p><p>Boy: ${esc(profile.height||'—')} cm · Son kilo: ${esc(p.latest_weight??'—')} kg</p><p>Son antrenman: ${stats.latest?fmtDate(stats.latest.date):'Henüz kayıt yok'}</p></section><section class="card"><h3>Atanmış aktif programlar</h3>${active.map(a=>`<details><summary>${esc(a.programs.title)} · v${a.programs.version}</summary>${a.programs.exercises.map((e,i)=>`<p>${i+1}. ${esc(e.name)} · ${e.sets} set · ${esc(e.reps)} tekrar · RIR ${esc(e.rir)}</p>`).join('')}</details>`).join('')||'<p>Henüz antrenman programı atanmadı</p>'}<button class="secondary" onclick="openProgramManagement()">Atamaları yönet</button></section><section class="card"><h3>Antrenman takvimi</h3>${coachCalendar()}<h3>${fmtDate(coachDashboard.selected)}</h3>${coachDayDetail()}</section><section class="card"><h3>Hacim değişimi</h3><p>Son seans: ${stats.latest?num(stats.latest.external)+' kg harici hacim':'—'} · Önceki seansa göre: ${stats.delta===null?'—':(stats.delta>0?'+':'')+num(stats.delta)+' kg'}</p><small>Farklı programların toplamları doğrudan güç artışı anlamına gelmez. Dambıllarda iki kol; vücut ağırlığı hacmi ayrı gösterilir.</small><div class="coach-table"><table><thead><tr><th>Tarih</th><th>Harici hacim</th><th>Vücut hacmi</th></tr></thead><tbody>${stats.sessions.slice(-20).reverse().map(s=>`<tr><td>${s.date}</td><td>${num(s.external)} kg</td><td>${num(s.body)} kg</td></tr>`).join('')}</tbody></table></div><small>Son 20 seans. Diğer kayıtlar takvimden açılabilir.</small></section><section class="card"><h3>Kişisel rekorlar</h3><p class="muted">Tamamlanan setlerden hesaplanır. Tahmini 1RM yalnızca harici ağırlıkta 1–10 tekrar için gösterilir.</p>${stats.records.map(r=>`<div class="list-item"><b>${esc(r.name)}</b><p>${r.kg} kg × ${r.reps} · ${fmtDate(r.date)}${r.rm?' · Tahmini 1RM '+r.rm.toFixed(1)+' kg':''}</p></div>`).join('')||'<p>Henüz tamamlanmış set yok.</p>'}</section><section class="card"><h3>Koç notları</h3><p class="muted">Yalnızca yetkili koç ve yöneticiler görebilir.</p><label>Yeni not<textarea id="coachNote" maxlength="5000" placeholder="Gözlemler ve sonraki antrenman hedefleri"></textarea></label><button id="saveCoachNote" onclick="saveCoachNote()">Notu kaydet</button><p id="coachNoteStatus" role="status"></p>${notes.slice().reverse().map(n=>`<div class="list-item"><small>${new Date(n.created_at).toLocaleString('tr-TR')}</small><p class="coach-note">${esc(n.body)}</p></div>`).join('')}</section>`);
}
async function saveCoachNote(){
 if(memberMode||coachDashboard.busy||!coachDashboard.detail)return;const body=$('coachNote').value.trim();if(!body){$('coachNoteStatus').textContent='Not yaz.';return;}
 coachDashboard.busy=true;$('saveCoachNote').disabled=true;const memberId=coachDashboard.detail.profile.id;
 try{const {error}=await gymAccount.client.from('coach_notes').insert({member_id:memberId,author_id:gymAccount.user.id,body});if(error)throw error;await openCoachMember(memberId);toast('Koç notu kaydedildi.');}
 catch{$('coachNoteStatus').textContent='Not kaydedilemedi. Metin korunuyor; bağlantını ve yetkini kontrol et.';}
 finally{coachDashboard.busy=false;const button=$('saveCoachNote');if(button)button.disabled=false;}
}
async function setCoachMemberActivity(){
 if(memberMode||coachDashboard.busy||!coachDashboard.detail)return;const p=coachDashboard.detail.profile;coachDashboard.busy=true;
 try{const {data,error}=await gymAccount.client.from('profiles').update({is_active:!p.is_active}).eq('id',p.id).select('id');if(error||!data?.length)throw error||Error('Yetki yok');await openCoachMember(p.id);const old=coachDashboard.members.find(m=>m.id===p.id);if(old)old.is_active=!p.is_active;}
 catch{toast('Üye durumu güncellenemedi.');}finally{coachDashboard.busy=false;}
}
