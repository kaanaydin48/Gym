const text=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function mountCoachQuests(host,account) {
  let selected=null,seq=0,quests=[];
  host.innerHTML='<section class="q-card"><h2>Üye görevleri</h2><label>Üye<select aria-label="Görevleri gösterilecek üye"></select></label><div data-coach-content></div><p role="status"></p></section>';
  const status=host.querySelector('[role=status]'),select=host.querySelector('select'),content=host.querySelector('[data-coach-content]');
  async function load(){const token=++seq;status.textContent='Yükleniyor…';
    try{
      const {data,error}=await account.client.from('user_quests').select('detail').eq('user_id',selected).order('start_date',{ascending:false});
      if(token!==seq)return;if(error)throw error;quests=(data||[]).map(r=>r.detail).filter(q=>q.ruleVersion===5);
      content.innerHTML=quests.map(q=>`<article class="q-coach-task"><b>${text(q.title)}</b><p>${q.progress}/${q.target} · ${q.xp} XP · ${text(q.start)} ${q.status==='complete'?'✓':''}</p></article>`).join('');
      status.textContent='İlerleme antrenman kayıtlarından otomatik hesaplanır.';
    }catch(e){if(token===seq)status.textContent=e.message;}
  }
  select.onchange=()=>{selected=select.value;load();};
  (async()=>{const {data,error}=await account.client.from('profiles').select('id,display_name').eq('coach_id',account.user.id);if(error){status.textContent=error.message;return;}select.innerHTML=(data||[]).map(m=>`<option value="${m.id}">${text(m.display_name||'Üye')}</option>`).join('');selected=select.value;if(selected)await load();else status.textContent='Atanmış üye bulunamadı.';})();
  return ()=>{seq++;host.replaceChildren();};
}
