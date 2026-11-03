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
// Each pose has a head centre, a body path and an optional equipment path on a 32-unit grid.
 const poses = {
  'dumbbell-bench-press':[25,18,'M22 20H10L6 25V29 M19 20L16 14L17 8','M6 23H28M9 24V29M26 24V29 M13 7H21M13 5V9M21 5V9'],
  'incline-dumbbell-bench-press':[22,12,'M20 15L12 23H7L5 29 M18 17L14 13L16 6','M7 25H13L25 13M12 26V29 M12 5H20M12 3V7M20 3V7'],
  'barbell-bench-press':[24,18,'M21 20H10L6 25V29 M18 20L14 14V9','M5 23H28M8 24V29M26 24V29 M3 8H26M6 5V11M23 5V11'],
  'chest-fly-machine':[16,8,'M16 12V22M16 15L10 13L8 9M16 15L22 13L24 9M16 22L12 24V29M16 22L20 24V29','M5 7V17L10 19M27 7V17L22 19M12 23H20'],
  'dips':[17,6,'M17 10L15 18L18 24L12 26M17 12L22 15L18 20','M7 20H24M9 20V29M24 20V29'],
  'cable-triceps-pushdown':[12,6,'M13 10L11 20L8 29M11 20L16 29M14 12L16 16L20 22','M25 3V6L20 21M17 22H23'],
  'overhead-cable-triceps-extension':[16,12,'M16 16L14 22L10 29M14 22L21 28M16 16L15 6L21 4','M3 27L20 4M2 24V29'],
  'dumbbell-curl':[14,6,'M14 10V20L9 29M14 20L19 29M14 12L19 17L23 12','M19 10L26 14M20 8L18 12M27 12L25 16'],
  'hammer-curl':[14,6,'M14 10V20L9 29M14 20L19 29M14 12L19 18L23 13','M24 8V16M21 8H27M21 16H27'],
  'lat-pulldown':[16,10,'M16 14V21M16 15L10 12L6 7M16 15L22 12L26 7M16 21L11 23V29M16 21L21 23V29','M16 2V4M4 8L8 5H24L28 8M12 24H20'],
  'seated-cable-row':[9,9,'M10 13L9 21L18 22L24 26M10 14L12 18L17 17','M17 17L29 20V28M4 24H13M6 25V29'],
  'dumbbell-shoulder-press':[16,10,'M16 14V22M16 15L8 14V7M16 15L24 14V7M16 22L11 29M16 22L21 29','M4 6H12M4 4V8M12 4V8M20 6H28M20 4V8M28 4V8'],
  'lateral-raise':[16,7,'M16 11V20M16 13L9 12L4 11M16 13L23 12L28 11M16 20L11 29M16 20L21 29','M3 9V13M29 9V13'],
  'leg-press':[7,12,'M8 16L12 23L18 17L24 14M8 17L10 20H14','M3 13L8 25H14M21 10L26 17M24 12L29 6M14 28L29 13'],
  'leg-curl':[6,18,'M9 19L19 20L23 18L25 10M10 20L7 24H3','M3 22H21M5 23V29M19 23V29M23 10H28'],
  'goblet-squat':[14,7,'M14 11L12 19L20 22L14 28H19M14 12L19 15L19 11','M18 8H22M20 8V13M18 13H22'],
  'plank':[25,12,'M22 15L13 17L4 22M21 15L23 22H29','M3 24H29'],
  'chest-press-machine':[10,8,'M10 12V21L18 22V29M10 14L17 15H23','M6 12V24H14M8 25V29M24 12V18L28 23V29'],
  'cable-crossover':[16,7,'M16 11V20L12 29M16 20L21 29M15 13L10 16L17 19M17 13L22 16L15 19','M2 4V23M30 4V23M2 5L15 18M30 5L17 18'],
  'pull-up':[16,8,'M16 12V20L12 26L16 28M16 20L20 26L17 29M16 13L8 12L7 5M16 13L24 12L25 5','M3 4H29'],
  'assisted-pull-up':[16,8,'M16 12V19L13 24H19M16 13L9 12L8 5M16 13L23 12L24 5','M4 4H28M11 26H21L26 22V5'],
  'single-arm-dumbbell-row':[24,10,'M21 13L11 17L7 28M11 17L15 23H20M21 13L24 22M19 14L14 13L13 19','M16 24H29M18 25V29M27 25V29M10 20H16M10 18V22M16 18V22'],
  'chest-supported-row':[22,8,'M20 12L11 21L6 28M18 14L11 14L13 20','M8 25L24 12M12 23V29M22 16V29M10 21H16M10 19V23M16 19V23'],
  'reverse-pec-deck':[16,8,'M16 12V22M16 14L10 15L4 12M16 14L22 15L28 12M16 22L12 28M16 22L20 28','M3 9V14M29 9V14M4 9L12 4M28 9L20 4M13 23H19'],
  'cable-lateral-raise':[16,7,'M16 11V21L12 29M16 21L21 29M16 13L22 12L28 10','M3 23V29L28 11'],
  'face-pull':[10,8,'M10 12L8 20L5 29M8 20L15 28M11 13L16 14L14 9','M14 9L20 11L29 8M14 12L20 11M29 4V24'],
  'smith-squat':[15,9,'M15 13L11 19L19 22L14 28H19M15 14L19 16L20 12','M4 3V29M28 3V29M3 12H29M7 9V15M25 9V15'],
  'bulgarian-split-squat':[15,6,'M15 10L14 18L22 20L21 28H26M14 18L11 23L5 20M15 12L18 19','M2 21H8M3 22V28M16 20H20'],
  'romanian-deadlift':[23,10,'M20 12L10 15L13 21L10 28H15M20 13L19 23','M11 24H28M14 21V27M25 21V27'],
  'leg-extension':[9,8,'M10 12L11 21H19L27 18M10 14L13 19','M6 12V24H18M8 24V29M24 20L28 18'],
  'hip-thrust':[6,14,'M9 16L18 16L24 18L23 27H28M10 16L13 19L17 16','M2 19H10M4 20V28M16 12A4 4 0 1 0 16.1 12Z'],
  'cable-glute-kickback':[21,9,'M19 13L13 18L15 28M13 18L8 20L3 16M19 14L25 16','M27 6V28M4 17L26 26'],
  'standing-calf-raise':[14,7,'M14 11V21L13 25L16 28H20M14 13L19 16L21 12','M10 11H18M22 8V29M15 30H25'],
  'seated-calf-raise':[10,8,'M10 12V20H19L18 25L22 28M10 14L14 17H18','M4 23H12M6 24V29M16 18H23M21 30H28'],
  'preacher-curl':[11,8,'M12 12L10 21H16V29M13 13L20 19L24 12','M15 16L22 22M19 21V29M5 23H12M22 11H27M22 9V13M27 9V13'],
  'incline-dumbbell-curl':[9,9,'M10 13L14 21H20L22 28M11 14L10 20L6 16','M5 10L12 24H20M14 25V29M3 15H8'],
  'rope-triceps-pushdown':[11,6,'M12 10L10 20L7 29M10 20L16 29M13 12L16 16L19 22M14 12L18 15L24 21','M25 3L22 16L19 22M22 16L25 21'],
  'dead-bug':[6,21,'M9 22L18 22L21 15H27M17 22L28 25M10 21L13 12M10 21L4 15','M3 27H29'],
  'cable-crunch':[17,15,'M15 17L10 13L9 20L15 25H6M13 14L19 19L19 14','M24 3L19 13M4 28H19'],
  'reverse-crunch':[6,22,'M9 23L17 21L21 16L17 11L23 8M10 23L14 25H23','M3 27H28'],
  'squat':[15,7,'M15 11L11 19L19 21L14 28H19M15 12L20 14L20 10','M4 10H27M7 7V13M24 7V13'],
  'seated-leg-curl':[9,8,'M10 12V20H20L15 26M10 14L15 17','M6 12V23H19M8 24V29M13 27H18'],
  'seated-shoulder-press':[16,10,'M16 14V21M16 15L8 14V6M16 15L24 14V6M16 21L11 23V29M16 21L21 23V29','M4 5H12M4 3V7M12 3V7M20 5H28M20 3V7M28 3V7M12 24H20']
 };
 const iconAliases=new Map([['machine chest press','chest-press-machine'],['dumbbell lateral raise','lateral-raise'],['seated leg curl','seated-leg-curl'],['squat','squat'],['seated dumbbell shoulder press','seated-shoulder-press']]);
 function icon(name,x=0,y=0,size=26){
  const key=normalize(name),pose=poses[byName.get(key)||iconAliases.get(key)];
  if(!pose)return '';
  const [cx,cy,body,equipment]=pose;
  return `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="${x ? '#414141' : 'currentColor'}" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round"><circle cx="${cx}" cy="${cy}" r="2.5"/><path d="${body}"/><path d="${equipment}" stroke-width="1.25"/></svg>`;
 }
 return {card,open,refresh,toggle,names,icon};
})();
