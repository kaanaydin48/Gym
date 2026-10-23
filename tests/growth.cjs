const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('app.js','utf8'),code=source.slice(source.indexOf("let growthPeriod="),source.indexOf('function drawChart()'));
const context={state:{settings:{week:'monday',unit:'kg'}},dateKey:d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-'),num:String,kgDisplay:Number};vm.createContext(context);vm.runInContext(code,context);
let b=context.growthBounds('month',new Date(2026,2,31));assert.equal(b.previousEnd,'2026-02-28');assert.equal(b.previousStart,'2026-02-01');
b=context.growthBounds('week',new Date(2026,0,1));assert.equal(b.start,'2025-12-29');assert.equal(b.previousEnd,'2025-12-25');
const day=(kg,reps,done=true)=>({exercises:[{name:'Bench',type:'external',logs:[{kg,reps,done,rir:2}]}]});
const rows=[['2026-10-01',day(30,6)],['2026-10-03',day(30,8)],['2026-10-05',day(50,10,false)]];
const original=JSON.stringify(rows);let records=context.growthRecords(rows,{start:'2026-10-02',end:'2026-10-05'});assert.equal(records.length,1);assert.equal(records[0].value,'30 kg × 8');assert.equal(JSON.stringify(rows),original);
assert.equal(context.growthPoints(rows,'Bench').length,2);assert.match(context.growthChange(4,0,'set'),/önceki kayıt yok/);assert(!code.includes('Özel tarih'));assert(source.includes("['progress','↗','Gelişim']"));console.log('PASS: month/year boundaries, incomplete sets, repeat PRs, no data mutation, no custom dates');
