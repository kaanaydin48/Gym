// Offline preview: synthetic records only; no app startup, auth or database code.
const fs=require('node:fs'),vm=require('node:vm');
const {ctx,source}=require('./home-flow-groups.cjs');
vm.runInContext(fs.readFileSync('contour-icons.js','utf8'),ctx);
ctx.document={addEventListener(){}};
vm.runInContext(fs.readFileSync('motion.js','utf8'),ctx);
ctx.GymMotion=ctx.window.GymMotion;
const names={Bench:'Dumbbell Bench Press',Fly:'Chest Fly Makine',Row:'Seated Cable Row',Shoulder:'Dumbbell Shoulder Press',Curl:'Dumbbell Curl',Triceps:'Cable Triceps Pushdown'};
Object.values(ctx.state.days).forEach(d=>d.exercises.forEach(e=>e.name=names[e.name]||e.name));
const data=ctx.calendarFlowData();
const previewMarkup=ctx.calendarFlowSummary().replace(/onclick="(?:setGrowthPeriod|openWorkoutHistory)[^"]*"/g,'disabled');
const child=`<!doctype html><html lang="tr"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>${fs.readFileSync('style.css','utf8')}</style><body><main>${previewMarkup}</main><script>const esc=s=>String(s).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");const openCalendarFlowExercise=i=>alert(calendarFlowData().movements[i].name);const calendarFlowData=()=>(${JSON.stringify(data)});${source.slice(source.indexOf('function summaryFlowColor('),source.indexOf('function completedHomeWorkouts('))}${source.slice(source.indexOf('function drawHomeFlowRibbons('))}drawHomeFlowRibbons();</script></body></html>`;
const html=`<!doctype html><html lang="tr"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Gym — Kompakt kart önizlemesi</title><style>body{margin:0;padding:16px;background:#eee;font:14px system-ui}header{max-width:900px;margin:auto auto 16px}iframe{display:block;border:0;background:white;max-width:100%;margin:auto;height:1500px}select{font:inherit;padding:6px}</style><header><b>Kompakt Hacim Akışı · Geliştirme önizlemesi</b><p>Örnek veriler. Canlı uygulama ve hesap bağlantısı yok. Kartlara dokunarak kavisleri vurgulayabilirsin.</p><label>Ekran genişliği <select id="width"><option>320</option><option>375</option><option selected>393</option><option>430</option><option>768</option></select> px</label></header><iframe title="Hacim Akışı" style="width:393px"></iframe><script>const frame=document.querySelector('iframe');frame.srcdoc=${JSON.stringify(child).replace(/<\/script/gi,'<\\/script')};document.querySelector('select').onchange=e=>frame.style.width=e.target.value+'px';</script></html>`;
fs.writeFileSync('docs/compact-flow-preview.html',html);
