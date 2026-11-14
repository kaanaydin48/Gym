/* Workout Flex V2 — pure, backward-compatible set helpers.
   Historical RIR data is intentionally preserved; no completed set is edited. */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 root.GymWorkoutFlexV2=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 function append(exercise){
  if(exercise.logs.length>=30)throw new Error('Set limit');
  exercise.logs.push({kg:'',reps:'',rir:'',done:false});
  return exercise;
 }
 function change(exercise,newExercise){
  const done=(exercise.logs||[]).filter(s=>s.done);
  const pending=(exercise.logs||[]).filter(s=>!s.done);
  const replacement={...newExercise,sets:pending.length,reps:exercise.reps,
   _flexPlannedSets:exercise._flexPlannedSets||exercise.logs.length,
   logs:pending.map(s=>({...s,kg:'',_flexOrigin:{...s._flexOrigin,kg:'empty'}}))};
  const historical=done.length?{...exercise,sets:done.length,logs:done,superset:'',_flexHistorical:true}:null;
  return {historical,replacement};
 }
 return {append,change};
});
