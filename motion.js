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
 // Equipment silhouettes on a shared 32-unit grid. Mat exercises use floor-contact marks.
 const glyphs = {
  'lat-pulldown': 'M16 3v7 M4 20l5-4 5-1h4l5 1 5 4 M4 20l4-3 M24 17l4 3',
  'seated-cable-row': 'M22 16h7 M21 16 7 6v20z',
  'dumbbell-bench-press': 'M5 22h22 M8 23v5 M24 23v5 M7 9h17 M8 6v6 M12 5v8 M20 5v8 M24 6v6',
  'incline-dumbbell-bench-press': 'M4 24h7L26 13 M10 25v4 M22 17v11 M4 9h15 M5 6v6 M9 5v8 M15 5v8 M19 6v6',
  'barbell-bench-press': 'M2 10h28 M6 6v8 M10 4v12 M22 4v12 M26 6v8 M8 19v9 M24 19v9 M5 21h22',
  'chest-fly-machine': 'M6 7v9l6 5 M26 7v9l-6 5 M4 8v7 M28 8v7 M13 25h6',
  'dips': 'M4 12l10-6 M4 12v13 M14 6v12 M17 18l11-7 M17 18v10 M28 11v12',
  'cable-triceps-pushdown': 'M16 3v11 M13 17l3-3 3 3 M4 19h24 M4 17v4 M28 17v4',
  'overhead-cable-triceps-extension': 'M3 28l10-12 M13 16l5-4 7-1 M14 16l6 2 7-2 M24 9l2 4 M26 14l2 4',
  'dumbbell-curl': 'M5 23 25 9 M4 19l5 7 M7 16l6 9 M19 7l6 9 M23 5l5 7',
  'hammer-curl': 'M16 5v22 M10 5h12 M8 9h16 M8 23h16 M10 27h12',
  'dumbbell-shoulder-press': 'M3 12h10 M4 8v8 M12 8v8 M19 12h10 M20 8v8 M28 8v8',
  'lateral-raise': 'M3 15l9-6 M3 12l4 6 M9 7l4 6 M20 9l9 6 M19 13l4-6 M25 18l4-6',
  'leg-press': 'M3 16l4 8h7 M8 28h18 M13 24 28 9 M15 8l8 8 M17 6l8 8',
  'leg-curl': 'M3 20l10-3 9 2 M5 21v6 M20 20v7 M21 17l5-8 M23 8h5',
  'goblet-squat': 'M16 8v16 M9 7h14 M7 11h18 M10 23h12 M11 27h10',
  'plank': 'M3 23h26 M4 18h5 M22 16h5v2h-5z',
  'chest-press-machine': 'M6 10v13h9 M8 24v4 M24 27V12l-5-5 M15 9h6 M15 8v5',
  'cable-crossover': 'M3 26V5h4 M29 26V5h-4 M5 7l17 15 M27 7 10 22 M8 21l3 3 M21 24l3-3',
  'pull-up': 'M3 12l5-4h16l5 4 M8 8v8 M24 8v8',
  'assisted-pull-up': 'M3 8l5-3h17l3 3 M26 6v20h-7 M8 22h11v3H8z',
  'single-arm-dumbbell-row': 'M3 19h14 M5 20v7 M15 20v7 M19 12h10 M20 8v8 M27 8v8',
  'chest-supported-row': 'M4 23 25 7 M9 21v6 M21 12v15 M15 21h13 M16 18v6 M27 18v6',
  'reverse-pec-deck': 'M3 12v6 M29 12v6 M4 12l9-7h6l9 7 M14 15h4v9h-4z M12 27h8',
  'cable-lateral-raise': 'M3 25h5 M5 23 22 10 M21 9l8-3-3 9z',
  'face-pull': 'M28 8l-11 6 M17 14l-5-3-7 1 M17 14l-3 6-7 4 M4 10l2 4 M6 22l2 4',
  'smith-squat': 'M4 3v25 M28 3v25 M3 14h26 M8 10v8 M24 10v8 M2 28h6 M24 28h6',
  'bulgarian-split-squat': 'M2 16h15 M4 18v8 M14 18v8 M25 9v15 M21 10h8 M21 22h8',
  'romanian-deadlift': 'M2 19l28-6 M5 15l2 9 M9 12l3 13 M20 9l3 13 M25 9l2 9',
  'leg-extension': 'M4 7v14h12 M7 22v6 M16 19l9-4 M24 12l3 6 M22 13l3 6',
  'hip-thrust': 'M2 13h9 M4 14v10 M10 14v10 M13 20h17 M16 16v8 M20 14v12 M26 15v10',
  'cable-glute-kickback': 'M2 22l12-6 M14 12l9-5 5 10-9 5z M17 12l5 8',
  'standing-calf-raise': 'M6 8h13 M8 8v4 M17 8v4 M20 8h6v19H14 M6 24h9v3H6z',
  'seated-calf-raise': 'M3 18h8 M6 19v8 M7 27h19 M15 12h10 M19 13v9 M21 24h7',
  'preacher-curl': 'M7 12l13 8 M14 17v11 M4 23h6 M15 7l4 2 3-3 5 2 M15 5l-2 5 M27 5l-2 6',
  'incline-dumbbell-curl': 'M6 6l8 17h8 M13 24v4 M20 24v4 M19 12l9-4 M18 9l3 6 M26 5l3 6',
  'rope-triceps-pushdown': 'M16 3v8 M16 11l-3 8-6 6 M16 11l3 8 6 6 M5 23l4 4 M23 27l4-4',
  'dead-bug': 'M3 25h26 M6 17l4-4 M12 17l5-5 M21 10l4-4',
  'cable-crunch': 'M25 3l-7 8 M18 11l-7 3-2 6 M18 11l1 5-4 5 M4 27h17',
  'reverse-crunch': 'M3 26h26 M11 19q8 0 10-8 M9 15q5 0 7-5',
  'squat': 'M2 15h28 M6 10v10 M10 7v16 M22 7v16 M26 10v10',
  'seated-leg-curl': 'M5 6v13h13 M8 20v8 M19 19l-4 7 M12 25l5 3 M13 15h9',
  'seated-shoulder-press': 'M2 8h11 M3 5v6 M12 5v6 M19 8h11 M20 5v6 M29 5v6 M13 16v8h8 M16 24v4'
 };
 const iconAliases=new Map([['machine chest press','chest-press-machine'],['dumbbell lateral raise','lateral-raise'],['seated leg curl','seated-leg-curl'],['squat','squat'],['seated dumbbell shoulder press','seated-shoulder-press']]);
 function icon(name,x=0,y=0,size=26){
  const key=normalize(name);
  const path=glyphs[byName.get(key)||iconAliases.get(key)];
  if(!path)return '';
  return `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="${x ? '#414141' : 'currentColor'}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="${path}"/></svg>`;
 }
 return {card,open,refresh,toggle,names,icon};
})();
