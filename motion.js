/* Six-frame exercise illustrations. No workout/account writes. */
window.GymMotion=(()=>{
 'use strict';
 const names=[
 ['Dumbbell Bench Press','dumbbell-bench-press'],
 ['Incline Dumbbell Bench Press','incline-dumbbell-bench-press'],
 ['Chest Fly Makine','chest-fly-machine'],['Dips','dips'],
 ['Cable Triceps Pushdown','cable-triceps-pushdown'],
 ['Overhead Cable Triceps Extension','overhead-cable-triceps-extension'],
 ['Dumbbell Curl','dumbbell-curl'],['Hammer Curl','hammer-curl'],
 ['Lat Pulldown','lat-pulldown'],['Seated Cable Row','seated-cable-row'],
 ['Dumbbell Shoulder Press','dumbbell-shoulder-press'],['Lateral Raise','lateral-raise'],
 ['Leg Press','leg-press'],['Leg Curl','leg-curl'],['Goblet Squat','goblet-squat'],['Plank','plank']
 ];
 const normalize=s=>String(s||'').trim().toLocaleLowerCase('en').replace(/\s+/g,' ');
 const byName=new Map(names.map(([name,id])=>[normalize(name),id]));
 const byId=new Map(names.map(([name,id])=>[id,name]));
 const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const media=window.matchMedia?window.matchMedia('(prefers-reduced-motion: reduce)'):null;
 let paused=!!media?.matches,observer=null;
 function sprite(id,large=false){return `<span class="exercise-motion${large?' exercise-motion-large':''}" data-motion="${id}" role="img" aria-label="${escape(byId.get(id))} hareket gösterimi"></span>`;}
 function card(e){
  const id=byName.get(normalize(e.name));
  if(!id)return `<span class="badge">${escape(e.equipment)}</span>`;
  return `<div class="exercise-media"><button type="button" class="exercise-preview" onclick="GymMotion.open('${id}')" aria-label="${escape(e.name)} animasyonunu büyüt">${sprite(id)}<span class="exercise-preview-label">Büyüt ↗</span></button><small class="exercise-equipment">${escape(e.equipment)}</small></div>`;
 }
 function syncPause(){
  document.body.classList.toggle('exercise-motion-paused',paused||document.hidden);
  document.querySelectorAll('[data-motion-toggle]').forEach(button=>{button.textContent=paused?'Animasyonları oynat':'Animasyonları durdur';button.setAttribute('aria-pressed',String(!paused));});
 }
 function toggle(){paused=!paused;syncPause();}
 function refresh(){
  observer?.disconnect();syncPause();
  const nodes=document.querySelectorAll('.exercise-motion');
  const activate=(node,visible)=>{const id=node.dataset.motion;if(!byId.has(id))return;if(visible)node.style.backgroundImage=`url("assets/exercises/${id}.webp?v=1")`;node.classList.toggle('motion-visible',visible);};
  if(typeof IntersectionObserver==='undefined'){nodes.forEach(node=>activate(node,true));return;}
  observer=new IntersectionObserver(entries=>entries.forEach(entry=>activate(entry.target,entry.isIntersecting)),{rootMargin:'40px'});
  nodes.forEach(node=>observer.observe(node));
 }
 function open(id){
  if(!byId.has(id))return;
  const extra=id==='plank'?'<p>Plank sabit tutuş hareketidir; görselde duruş ve nefes döngüsü gösterilir.</p>':id==='leg-curl'?'<p>Gösterilen varyasyon: yatarak leg curl.</p>':'';
  show(`<div class="motion-detail"><h2>${escape(byId.get(id))}</h2>${sprite(id,true)}<p class="muted">Turuncu alanlar hedef kasları gösterir. Kısa animasyonlu çizim.</p>${extra}<button type="button" class="secondary" data-motion-toggle onclick="GymMotion.toggle()"></button></div>`);
  refresh();
 }
 document.addEventListener('visibilitychange',syncPause);
 media?.addEventListener?.('change',event=>{paused=event.matches;syncPause();});
 return {card,open,refresh,toggle,names};
})();
