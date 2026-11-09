/* Shared source for browser displays and trusted quest evaluation. No network or writes. */
(function(root){
'use strict';
const number=(x,min,max,integer=false)=>x!==''&&x!==null&&x!==undefined&&typeof x!=='boolean'&&Number.isFinite(+x)&&+x>=min&&+x<=max&&(!integer||Number.isInteger(+x));
function validSets(e) {return (Array.isArray(e?.logs)?e.logs:[]).filter(s=>s?.done===true&&number(s.reps,1,e.duration?86400:1000,true)&&(e.duration||number(s.kg,0,2000))&&(s.rir===''||s.rir==null||number(s.rir,0,10)));}
// Preserves external vs bodyweight volume and per-dumbbell multiplier used by the app.
function workoutMetrics(day) {
  let sets=0,externalVolume=0,bodyVolume=0;
  const exercises=[];
  for(const e of Array.isArray(day?.exercises)?day.exercises:[]) {
    if(!e||!Array.isArray(e.logs))continue;
    const factor=e.factor===2?2:1, type=e.type==='body'?'body':'external';
    const valid=validSets(e);
    sets+=valid.length;
    const volume=valid.reduce((n,s)=>n+(e.duration?0:+s.kg*+s.reps*factor),0);
    if(type==='body')bodyVolume+=volume;else externalVolume+=volume;
    // Existing library ids are reused when available; legacy fallback never uses display name alone.
    const identity=e.id||`${e.name}|${type}|${e.equipment||''}`;
    exercises.push({key:`${identity}|${type}|${factor}|${e.duration?'duration':'reps'}`,name:String(e.name||''),type,factor,duration:!!e.duration,sets:valid,volume});
  }
  const finish=typeof day?.finished==='number'?day.finished:typeof day?.finished==='string'?Date.parse(day.finished):NaN;
  const finished=day?.kind==='workout'&&Number.isFinite(finish)&&finish>0&&sets>0;
  return {sets,externalVolume,bodyVolume,exercises,finished};
}
root.GymWorkoutMetrics=Object.freeze({workoutMetrics,validSets});
})(globalThis);
