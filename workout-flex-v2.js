/* Workout Flex V2 — pure, backward-compatible set helpers.
   Historical RIR data is intentionally preserved; no completed set is edited. */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 root.GymWorkoutFlexV2=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 const fields=['kg','reps'];
 function isEmpty(v){return v===''||v===null||v===undefined;}
 function copyFirst(exercise){
  const logs=exercise?.logs||[];
  if(!logs.length)return exercise;
  const first=logs[0];
  for(const field of fields){
   const value=first[field];
   for(let i=1;i<logs.length;i++){
    const row=logs[i];
    if(row.done)continue;
    const origin=row._flexOrigin?.[field]||(!isEmpty(row[field])?'manual':'empty');
    if(origin==='manual')continue;
    if(!row._flexOrigin)row._flexOrigin={};
    if(isEmpty(value)){if(origin==='auto'){row[field]='';row._flexOrigin[field]='empty';}}
    else {row[field]=value;row._flexOrigin[field]='auto';}
   }
  }
  return exercise;
 }
 function edit(exercise,index,field,value){
  if(!fields.includes(field))throw new Error('Unsupported field');
  const row=exercise.logs[index];
  if(!row)throw new Error('Missing set');
  row[field]=value;
  if(!row._flexOrigin)row._flexOrigin={};
  row._flexOrigin[field]=index===0?'source':(isEmpty(value)?'empty':'manual');
  if(index===0)copyFirst(exercise);
  return exercise;
 }
 function append(exercise){
  if(exercise.logs.length>=30)throw new Error('Set limit');
  exercise.logs.push({kg:'',reps:'',done:false});
  copyFirst(exercise);
  return exercise;
 }
 function change(exercise,newExercise){
  const done=(exercise.logs||[]).filter(s=>s.done);
  const pending=(exercise.logs||[]).filter(s=>!s.done);
  const replacement={...newExercise,sets:pending.length||newExercise.sets||1,reps:exercise.reps,
   logs:pending.map(s=>({...s,kg:'',_flexOrigin:{...s._flexOrigin,kg:'empty'}}))};
  const historical=done.length?{...exercise,sets:done.length,logs:done,_flexHistorical:true}:null;
  return {historical,replacement};
 }
 return {copyFirst,edit,append,change};
});
