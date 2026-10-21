'use strict';
const memberEscape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function membershipCard(){const a=window.gymAccount;return `<section class="card"><h2>Üyelik hesabım</h2><p>${memberEscape(a.user.email)}</p><span class="badge">${{admin:'Yönetici',coach:'Koç',member:'Üye'}[a.role]}</span><p>Oturumun doğrulandı. Antrenman kayıtların Antrenmanı kaydet düğmesiyle hesabına özel bulut alanına yazılır. Aynı hesapla diğer cihazlarından ulaşabilirsin.</p>${a.role==='admin'?'<button onclick="openMembers()">Üye yönetimi</button> <button class="secondary" onclick="importLegacyAccount()">Eski cihaz kayıtlarımı aktar</button>':''}<button class="secondary" onclick="membershipSignOut()">Çıkış yap</button></section>`;}
async function membershipSignOut(){if(typeof saving!=='undefined'&&saving){toast('Kayıt işleminin bitmesini bekle.');return;}if(typeof dirty!=='undefined'&&(dirty||draft)&&!confirm('Kaydedilmemiş değişiklikler var. Kaydetmeden çıkılsın mı?'))return;const {error}=await gymAccount.client.auth.signOut();if(error)toast('Çıkış yapılamadı. Tekrar dene.');}
function importLegacyAccount(){try{const raw=localStorage.getItem('gym-tracker-pro-v1');if(!raw){toast('Bu cihazda eski kayıt bulunamadı.');return;}pending=validateBackup(JSON.parse(raw));previewImport();}catch{toast('Eski kayıt okunamadı. JSON yedeğini kullan.');}}
async function memberRequest(body){
 const {data,error}=await gymAccount.client.functions.invoke('invite-member',{body});
 if(error){
  let detail;try{detail=await error.context?.json();}catch{}
  if(typeof detail?.error==='string')throw Error(detail.error);
  const status=error.context?.status;
  if(status===401)throw Error('Oturumun sona ermiş olabilir. Girdilerini kaydet, yeniden giriş yap ve tekrar dene.');
  if(status===403)throw Error('Üye yönetimi için yönetici yetkisi gerekli.');
  if(status===429)throw Error('Çok fazla istek gönderildi. Bir süre sonra tekrar dene.');
  throw Error('Üye servisine bağlanılamadı. İnternet bağlantını kontrol edip tekrar dene.');
 }
 if(data?.error)throw Error(data.error);return data;
}
function openMembers(){
 if(gymAccount.role!=='admin')return;
 show(`<h2>Üye yönetimi</h2><p>Yeni üyeler yalnızca e-posta davetiyle katılır.</p><form id="memberInvite"><label>Ad soyad<input name="fullName" required maxlength="100" autocomplete="name"></label><label>E-posta<input name="email" type="email" required maxlength="254" autocomplete="email"></label><button type="submit">Üye daveti gönder</button></form><p id="memberStatus" role="status"></p><h3>Üyeler</h3><p id="memberCounts" role="status"></p><label>Üye ara<input id="memberSearch" placeholder="Ad veya e-posta" type="search"></label><label>Davet durumu<select id="memberFilter"><option value="all">Tüm üyeler</option><option value="pending">Davet bekleyenler</option><option value="joined">Giriş yapmış üyeler</option></select></label><p class="notice">Giriş yapmış olması, üyenin şifre oluşturduğunu veya antrenman kaydettiğini göstermez.</p><div id="memberList" aria-live="polite">Yükleniyor…</div><button type="button" id="refreshMembers" class="secondary">Listeyi yenile</button>`);
 const form=document.getElementById('memberInvite');
 form.onsubmit=async event=>{event.preventDefault();const button=form.querySelector('button');if(button.disabled)return;const fullName=form.elements.fullName.value.trim(),email=form.elements.email.value.trim().toLowerCase();if(!fullName){document.getElementById('memberStatus').textContent='Ad soyad gerekli.';return;}button.disabled=true;document.getElementById('memberStatus').textContent='Davet gönderiliyor…';try{await memberRequest({action:'invite',fullName,email});form.reset();document.getElementById('memberStatus').textContent='Davet gönderildi. Üye e-postasındaki bağlantıyla kaydını tamamlayabilir.';await refreshMembers();}catch(e){document.getElementById('memberStatus').textContent=e.message;}finally{button.disabled=false;}};
 document.getElementById('refreshMembers').onclick=refreshMembers;refreshMembers();
}
let memberListRequest=0;
function filterMemberDirectory(members,query,status){
 const normalize=value=>String(value??'').normalize('NFC').toLocaleLowerCase('tr').trim();
 const terms=normalize(query).split(/\s+/).filter(Boolean);
 return members.filter(m=>{
  const text=normalize((m.fullName||'')+' '+(m.email||''));
  return terms.every(term=>text.includes(term))&&(status==='pending'?!m.active:status==='joined'?!!m.active:true);
 }).sort((a,b)=>String(a.fullName||a.email||'').localeCompare(String(b.fullName||b.email||''),'tr'));
}
async function refreshMembers(){
 if(gymAccount.role!=='admin')return;
 const target=document.getElementById('memberList'),search=document.getElementById('memberSearch'),filter=document.getElementById('memberFilter'),counts=document.getElementById('memberCounts');
 if(!target||!search||!filter||!counts)return;
 const request=++memberListRequest;
 target.textContent='Yükleniyor…';counts.textContent='';search.oninput=null;filter.onchange=null;
 try{
  const result=await memberRequest({action:'list'});
  if(!target.isConnected||request!==memberListRequest)return;
  const members=result.members||[];
  const renderList=()=>{
   const rows=filterMemberDirectory(members,search.value,filter.value);
   const joined=members.filter(m=>m.active).length;
   counts.textContent=`${members.length} üye · ${members.length-joined} davet bekliyor · ${joined} giriş yapmış · ${rows.length} gösteriliyor`;
   target.innerHTML=rows.map(m=>`<div class="list-item"><strong>${memberEscape(m.fullName||'İsimsiz üye')}</strong><p>${memberEscape(m.email)}</p><span class="badge">${m.active?'Giriş yaptı':'Davet bekliyor'}</span></div>`).join('')||(members.length?'<p>Arama ve filtreye uygun üye bulunamadı.</p>':'<p>Henüz üye yok. Yukarıdaki formdan ilk üyeni davet edebilirsin.</p>');
  };
  search.oninput=renderList;filter.onchange=renderList;renderList();
 }catch(e){if(target.isConnected&&request===memberListRequest){target.textContent=e.message+' Listeyi yenile düğmesiyle tekrar deneyebilirsin.';}}
}
