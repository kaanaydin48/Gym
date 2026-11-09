const text=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function mountCoachQuests(host,account) {
  let selected=null,seq=0,quests=[];
  host.innerHTML='<section class="q-card"><h2>Üye görevleri</h2><label>Üye<select aria-label="Görevleri gösterilecek üye"></select></label><div data-coach-content></div><p role="status"></p></section>';
  const status=host.querySelector('[role=status]'),select=host.querySelector('select'),content=host.querySelector('[data-coach-content]');
  const rpc=async(name,args)=>{const {error}=await account.client.rpc(name,args);if(error)throw error;};
  async function load(){const token=++seq;status.textContent='Yükleniyor…';
    try{
      const [{data,error},{data:actions,error:ae},{data:overrides,error:oe}]=await Promise.all([
        account.client.from('user_quests').select('detail').eq('user_id',selected).order('start_date',{ascending:false}),
        account.client.from('quest_actions').select('*').eq('user_id',selected).order('ordinal',{ascending:false}),
        account.client.from('quest_overrides').select('quest_key,version').eq('user_id',selected)]);
      if(token!==seq)return;if(error||ae||oe)throw error||ae||oe;quests=data.map(r=>r.detail);
      content.innerHTML=quests.map(q=>`<article class="q-coach-task"><b>${text(q.title)}</b><p>${q.progress}/${q.target} · ${q.xp} XP · ${text(q.start)}</p><form data-key="${text(q.id)}" data-version="${overrides.find(o=>o.quest_key===q.id)?.version||0}"><label>Görev adı<input name="title" value="${text(q.title)}" maxlength="100" required></label><label>Hedef<input name="goal" type="number" min="${Math.max(1,q.target)}" value="${Math.max(1,q.target)}" required></label><button name="action" value="edit">Düzenle</button>${(q.period==='daily'&&q.slot===3||q.period==='weekly'&&q.slot===4)?'<button name="action" value="manual">Koç doğrulamalı görev ata</button>':''}</form></article>`).join('');
      const submissions=(actions||[]).filter(a=>a.kind==='submission');
      content.innerHTML+='<h3>Doğrulama başvuruları</h3>'+submissions.map(a=>`<article><p>${text(a.payload.evidence)}</p><form data-submission="${a.id}"><label>Doğrulama açıklaması<textarea name="reason" minlength="8" maxlength="2000" required></textarea></label><button name="approval" value="yes">Onayla</button><button name="approval" value="no">Reddet / geri al</button></form></article>`).join('');
      status.textContent='Değişiklikler sunucu doğrulamasından sonra ilerlemeye yansır.';
    }catch(e){if(token===seq)status.textContent=e.message;}
  }
  content.onsubmit=async e=>{e.preventDefault();const f=e.target,member=selected,button=e.submitter;button.disabled=true;
    try{
      if(f.dataset.submission)await rpc('quest_approve',{submission_id:f.dataset.submission,approved:button.value==='yes',reason:f.elements.reason.value,request_id:crypto.randomUUID()});
      else if(button.value==='manual')await rpc('quest_assign_manual',{target:member,quest_key:f.dataset.key,title:f.elements.title.value,expected_version:+f.dataset.version});
      else await rpc('quest_edit',{target:member,quest_key:f.dataset.key,title:f.elements.title.value,goal:+f.elements.goal.value,expected_version:+f.dataset.version});
      if(member===selected)await load();
    }catch(err){status.textContent=err.message;}finally{button.disabled=false;}
  };
  select.onchange=()=>{selected=select.value;load();};
  (async()=>{const {data,error}=await account.client.from('profiles').select('id,display_name').eq('coach_id',account.user.id);if(error){status.textContent=error.message;return;}select.innerHTML=(data||[]).map(m=>`<option value="${m.id}">${text(m.display_name||'Üye')}</option>`).join('');selected=select.value;if(selected)await load();else status.textContent='Atanmış üye bulunamadı.';})();
  return ()=>{seq++;host.replaceChildren();};
}
