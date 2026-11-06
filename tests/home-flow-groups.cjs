const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('app.js','utf8');
const state={settings:{unit:'kg',week:'monday'},days:{},library:[]};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ctx={state,esc,totals:d=>({sets:d.exercises.reduce((n,e)=>n+e.logs.filter(s=>s.done).length,0)}),num:n=>n.toLocaleString('tr-TR'),kgDisplay:Number,fmtDate:String,dateKey:d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`,allWork:()=>Object.entries(state.days).filter(([,d])=>d.kind==='workout'),GymMotion:{icon:()=>'<svg viewBox="0 0 56 56"><circle cx="28" cy="28" r="20"/></svg>'},window:{addEventListener(){}},show:html=>ctx.detail=html};
vm.createContext(ctx);
vm.runInContext(source.slice(source.indexOf('let growthPeriod='),source.indexOf('function drawChart()')),ctx);
vm.runInContext(source.slice(source.indexOf('function summaryFlowColor(')),ctx);
const exercise=(name,muscle,kg,type='external',factor=1)=>({name,muscle,type,factor,logs:[{kg,reps:10,done:true},{kg:999,reps:100,done:false}]});
const day=exercises=>({kind:'workout',name:'Fixture',finished:1,exercises});
const now=new Date(),today=ctx.dateKey(now);
const fixture=[exercise('Leg Press','Bacak',100),exercise('Curl','Ön kol',20),exercise('Triceps','Arka kol',10),exercise('Row','Sırt',40),exercise('Shoulder','Omuz',30),exercise('Bench','Göğüs',35,'external',2),exercise('Fly','Göğüs',10),exercise('Plank','Karın',0,'body')];
state.days={[today]:day(fixture),'2000-01-01':day([exercise('Old Row','Sırt',10)])};
const before=JSON.stringify(state);
for(const period of ['latest','week','month','all']){
 vm.runInContext(`growthPeriod='${period}'`,ctx);
 const data=ctx.calendarFlowData();
 assert.equal(data.groups.map(g=>g.name).join(','),'GÖĞÜS,SIRT,OMUZ,KOL,BACAK,KARIN');
 assert.equal(data.volume,period==='all'?2900:2800);
 assert.equal(data.groups.reduce((n,g)=>n+g.volume,0),data.volume);
 assert.equal(data.groups.find(g=>g.name==='KOL').volume,300);
 assert.equal(data.movements.length,period==='all'?9:8);
 assert.equal(data.movements[0].name,'Bench');
 assert.equal(data.movements[0].max,70);
 assert.equal(data.groups.find(g=>g.name==='GÖĞÜS').volume,800);
 assert.equal(data.groups.at(-1).volume,0);
 for(const group of data.groups)for(let i=1;i<group.movements.length;i++)assert(group.movements[i-1].volume>=group.movements[i].volume);
 const html=ctx.calendarFlowSummary();
 assert.equal((html.match(/class="period-flow-group-heading"/g)||[]).length,6);
 assert(html.includes('800 kg · %'+(800/data.volume*100).toLocaleString('tr-TR',{minimumFractionDigits:1,maximumFractionDigits:1})));
 assert(!/NaN|undefined/.test(html));
 data.movements.forEach((item,i)=>{ctx.openCalendarFlowExercise(i);assert(ctx.detail.includes(esc(item.name)));});
}
assert.equal(JSON.stringify(state),before);
// Zero-volume, missing metadata, duplicate names and custom labels must not lose volume.
state.days={[today]:day([exercise('Custom','Unknown',10),exercise('Custom','Unknown',20),exercise('Plank','Karın',0,'body')])};
let data=ctx.calendarFlowData();assert.equal(data.volume,300);assert.equal(data.movements.length,2);assert.equal(data.groups.at(-1).name,'DİĞER');
state.days={[today]:day([exercise('Plank','Karın',0,'body')])};assert(!/NaN|Infinity/.test(ctx.calendarFlowSummary()));
state.days={};assert.equal(ctx.calendarFlowData().groups.length,0);
// Export deterministic long-name fixture for browser layout tests.
state.days={[today]:day([...fixture,exercise('Çok uzun hareket adı — Tek Kol Destekli Dumbbell Shoulder Press <kontrol>','Omuz',15)])};
vm.runInContext("growthPeriod='all'",ctx);
module.exports={html:ctx.calendarFlowSummary(),source};
console.log('PASS: six-group order, filters, primary arms, sums, percentages denominator, bodyweight, details, empty/custom records and data preservation');
