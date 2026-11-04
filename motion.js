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
 ['Leg Press','leg-press'],['Leg Curl','leg-curl'],['Goblet Squat','goblet-squat'],['Plank','plank'],
 ["Barbell Bench Press", "barbell-bench-press"],
 ["Chest Press Makine", "chest-press-machine"],
 ["Cable Crossover", "cable-crossover"],
 ["Barfiks", "pull-up"],
 ["Assisted Pull-up", "assisted-pull-up"],
 ["Tek Kol Dumbbell Row", "single-arm-dumbbell-row"],
 ["Chest-Supported Row", "chest-supported-row"],
 ["Reverse Pec Deck", "reverse-pec-deck"],
 ["Cable Lateral Raise", "cable-lateral-raise"],
 ["Face Pull", "face-pull"],
 ["Smith Squat", "smith-squat"],
 ["Bulgarian Split Squat", "bulgarian-split-squat"],
 ["Romanian Deadlift", "romanian-deadlift"],
 ["Leg Extension", "leg-extension"],
 ["Hip Thrust", "hip-thrust"],
 ["Cable Glute Kickback", "cable-glute-kickback"],
 ["Standing Calf Raise", "standing-calf-raise"],
 ["Seated Calf Raise", "seated-calf-raise"],
 ["Preacher Curl", "preacher-curl"],
 ["Incline Dumbbell Curl", "incline-dumbbell-curl"],
 ["Rope Triceps Pushdown", "rope-triceps-pushdown"],
 ["Dead Bug", "dead-bug"],
 ["Cable Crunch", "cable-crunch"],
 ["Reverse Crunch", "reverse-crunch"]
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
 // Additional program variants outside the built-in catalog.
 const poses = {
  'squat':[15,7,'M15 11L11 19L19 21L14 28H19M15 12L20 14L20 10','M4 10H27M7 7V13M24 7V13'],
  'seated-leg-curl':[9,8,'M10 12V20H20L15 26M10 14L15 17','M6 12V23H19M8 24V29M13 27H18'],
  'seated-shoulder-press':[16,10,'M16 14V21M16 15L8 14V6M16 15L24 14V6M16 21L11 23V29M16 21L21 23V29','M4 5H12M4 3V7M12 3V7M20 5H28M20 3V7M28 3V7M12 24H20']
 };
 const iconAliases=new Map([['machine chest press','chest-press-machine'],['dumbbell lateral raise','lateral-raise'],['seated leg curl','seated-leg-curl'],['squat','squat'],['seated dumbbell shoulder press','seated-shoulder-press']]);
 function icon(name,x=0,y=0,size=26){
  const key=normalize(name),id=byName.get(key)||iconAliases.get(key);
  const contour=window.GymContourPaths[id];
  if(contour){
   const color=x?'#333':'currentColor';
   return `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="0 0 100 100" aria-hidden="true" fill="${color}" stroke="${color}" stroke-width="0.55" stroke-linejoin="round"><path fill-rule="evenodd" d="${contour}"/></svg>`;
  }
  const pose=poses[id];
  if(!pose)return '';
  const [cx,cy,body,equipment]=pose;
  return `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="${x ? '#414141' : 'currentColor'}" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round"><circle cx="${cx}" cy="${cy}" r="2.5"/><path d="${body}"/><path d="${equipment}" stroke-width="1.25"/></svg>`;
 }
 return {card,open,refresh,toggle,names,icon};
})();
