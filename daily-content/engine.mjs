import {TIPS} from './catalog.mjs';
export const dayKey=(now=new Date())=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Istanbul',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
export const addDays=(day,n)=>new Date(Date.parse(day+'T12:00:00Z')+n*86400000).toISOString().slice(0,10);
export function hash(s){let h=2166136261;for(const c of s)h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;}
export function context(state,day){
 const days=state?.days||{},completed=Object.entries(days).filter(([k,v])=>k<=day&&v.kind==='workout'&&v.finished).sort(([a],[b])=>a.localeCompare(b));
 const weekday=(new Date(day+'T12:00:00Z').getUTCDay()+6)%7,week=addDays(day,-weekday);
 const weekly=completed.filter(([k])=>k>=week).length,last=completed.at(-1),plan=days[day];
 let streak=0;for(let k=last?.[0];k&&days[k]?.kind==='workout'&&days[k]?.finished;k=addDays(k,-1))streak++;
 const records=[],improvements=[],best=new Map();
 for(const [date,w] of completed)for(const e of w.exercises||[]){
  const key=[e.name,e.equipment,e.type,e.factor||1].join('|');
  const valid=(e.logs||[]).filter(s=>s.done&&Number.isFinite(+s.kg)&&+s.kg>=0&&+s.reps>0);
  if(!valid.length)continue;const kg=Math.max(...valid.map(s=>+s.kg));const reps=Math.max(...valid.filter(s=>+s.kg===kg).map(s=>+s.reps));const prev=best.get(key);
  if(date===last?.[0]&&prev){if(kg>prev.kg)records.push(e.name);else if(kg===prev.kg&&reps>prev.reps)improvements.push(e.name);}
  if(!prev||kg>prev.kg||(kg===prev.kg&&reps>prev.reps))best.set(key,{kg,reps});
 }
 let topic='general';
 if(plan?.kind==='rest')topic='rest';
 else if(plan?.kind==='workout'){
  const text=(plan.name+' '+(plan.exercises||[]).map(e=>e.muscle).join(' ')).toLocaleLowerCase('tr');
  topic=/bacak|squat|leg/.test(text)?'legs':/sırt|pull|ön kol/.test(text)?'pull':/göğüs|push|arka kol|omuz/.test(text)?'push':'general';
 }
 return {weekly,last:last?{date:last[0],name:last[1].name||'Antrenman'}:null,streak,records,improvements,topic};
}
export function choose(items,{user,day,history=[],feedback=[]}){
 const recency=new Map();for(const h of history)for(const c of h.cards||[])recency.set(c.rotationId||c.id,h.day);
 return [...items].sort((a,b)=>score(b)-score(a)||a.id.localeCompare(b.id))[0];
 function score(c){const seen=recency.get(c.rotationId||c.id);const age=seen?(Date.parse(day)-Date.parse(seen))/86400000:100;const affinity=Math.max(-2,Math.min(2,feedback.filter(f=>f.topic===c.topic).reduce((n,f)=>n+(f.reaction||0),0)));
 return Math.min(age,30)*10+affinity*2+(hash(user+day+c.id)%1000)/1000;}
}
export function buildDaily({user,day,state={},science=[],history=[],feedback=[]}){
 const c=context(state,day),options={user,day,history,feedback};
 const lead=c.last?`Son tamamlanan antrenmanın ${c.last.date} tarihli ${c.last.name}. Bu hafta ${c.weekly} antrenman tamamladın.`:'Henüz tamamlanmış bir antrenman kaydın yok. İlk kaydın, ilerlemeni takip etmek için başlangıç noktan olacak.';
 const details=c.records.length?`Son seansında ${c.records[0]} için önceki tamamlanmış kayıtlarından daha yüksek ağırlık kaydettin.`:c.improvements.length?`${c.improvements[0]} hareketinde aynı ağırlıkta önceki en iyi tekrarını geçtin.`:c.streak>1?`Son kayıtlarında art arda ${c.streak} gün tamamlanmış antrenman var. Toparlanma ihtiyacını da dikkate al.`:c.topic==='rest'?'Bugün takviminde dinlenme planı var; toparlanmana alan açabilirsin.':'İlerlemeyi tek bir güne göre değerlendirme; düzenli kayıtlar zaman içindeki değişimi gösterir.';
 const endings=['Bugünkü hedefin, sana uygun bir adımı sürdürebilmek olsun.','Küçük ve uygulanabilir hedefler düzenini korumana yardımcı olabilir.','Bir sonraki seansında kontrol edebildiğin bir hedefe odaklan.','Her gün rekor gerekmez; düzenli kayıtların sana yol gösterir.','Planını günlük enerjin ve toparlanmana göre değerlendir.','Tekrar kalitesi de ilerlemenin bir parçasıdır.','Kendi geçmişinle karşılaştırma yap; başkasının temposuna yetişmek zorunda değilsin.'];
 const message=choose(endings.map((body,i)=>({id:'message-'+i+':'+day,rotationId:'message-'+i,topic:'consistency',kind:'message',title:'Kendi ritminde ilerle',body:lead+' '+details+' '+body,private:true})),options);
 const tips=TIPS[c.topic].map(([title,body],i)=>({id:`tip-${c.topic}-${i}`,kind:'tip',topic:c.topic,title,body,private:false}));
 const evidence=choose(science,options);
 if(!evidence)throw Error('Doğrulanmış bilim içeriği bulunamadı');
 return {day,cards:[message,choose(tips,options),{...evidence,private:false}]};
}
export function sharePayload(card){return card.private?{title:'Gym Trader Pro · Günün Mesajı',text:'Kendi ritminde ilerle. Küçük ve sürdürülebilir adımlar at.',url:'https://kaanaydin48.github.io/Gym/'}:{title:card.title,text:card.body,url:card.url||'https://kaanaydin48.github.io/Gym/'};}
