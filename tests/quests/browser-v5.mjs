import {chromium,webkit} from 'playwright';import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';import {createRequire} from 'node:module';import assert from 'node:assert/strict';
import {evaluateV5} from '../../quests/v5-engine.mjs';
const require=createRequire(import.meta.url);const {html:graph,source}=require('../home-flow-groups.cjs');
const engine=process.env.QUEST_BROWSER==='webkit'?webkit:chromium;
const today='2026-11-04',start='2026-11-02';
const days={'2026-11-02':{kind:'workout',programId:'p',finished:1793642400000,exercises:[{id:'row',type:'external',name:'Row',logs:[{done:true,kg:20,reps:10}]}]}};
const model=evaluateV5({today,activation:start,days,plans:[{day:today,kind:'workout',targets:{basic:8,advanced:16}}]});
const html=`<!doctype html><html lang="tr"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta http-equiv="Content-Security-Policy" content="default-src 'self';script-src 'self' 'unsafe-inline';style-src 'self' 'unsafe-inline';img-src 'self' data:;connect-src 'self'"><title>Görev V5 — Geliştirme önizlemesi</title><link rel="stylesheet" href="/style.css"><link rel="stylesheet" href="/quests/quests.css"><style>body{background:#fafafa}main{max-width:460px;margin:auto;padding:20px 16px 100px}.preview-note{font-size:11px;color:#888}.preview-nav{position:fixed;bottom:0;left:0;right:0;height:56px;padding-bottom:env(safe-area-inset-bottom);background:#fff;display:flex;align-items:center;justify-content:space-around;border-top:1px solid #eee;font-size:12px;z-index:20}</style><main><p class="preview-note">Geliştirme önizlemesi · Örnek veriler</p><div id="questHost"></div><div id="unchangedGraph">${graph}</div></main><nav class="preview-nav"><span>Ana Sayfa</span><span>Antrenman</span><span>Programlar</span></nav><script>${source.slice(source.indexOf('function summaryFlowColor('))};drawHomeFlowRibbons();</script><script type="module">import {mountQuestUI} from '/quests/ui.mjs';window.questUI=mountQuestUI({host:document.getElementById('questHost'),model:${JSON.stringify(model)},onAction:async()=>{},onGoal:async()=>{}});window.previewReady=true;</script></html>`;
const server=createServer(async(req,res)=>{
 if(req.url==='/'){res.setHeader('Content-Type','text/html;charset=utf-8');res.end(html);return;}
 const file=req.url?.split('?')[0];if(!['/style.css','/quests/quests.css','/quests/ui.mjs'].includes(file)){res.writeHead(404);res.end();return;}
 res.setHeader('Content-Type',file.endsWith('.css')?'text/css':'text/javascript');res.end(await readFile('.'+file));
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
try{
 browser=await engine.launch({headless:true,...(engine===chromium?{args:['--no-sandbox']}: {})});await mkdir('test-results',{recursive:true});
 for(const width of [320,375,390,430]){
  const page=await browser.newPage({viewport:{width,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/`);await page.waitForFunction(()=>window.previewReady);
  const before=await page.locator('#unchangedGraph').innerHTML();
  assert.equal(await page.locator('.q-row').count(),3);
  assert.ok(await page.evaluate(()=>document.querySelector('.q-card').getBoundingClientRect().bottom<=document.querySelector('#unchangedGraph').getBoundingClientRect().top));
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.getByRole('tab',{name:'Haftalık',exact:true}).click();assert.equal(await page.locator('.q-row').count(),6);
  await page.locator('.q-row').first().click();assert.equal(await page.locator('#questDetail').evaluate(e=>e.open),true);
  assert.ok(await page.locator('#questDetail').evaluate(e=>e.getBoundingClientRect().right<=innerWidth&&e.getBoundingClientRect().bottom<=innerHeight));
  await page.getByRole('button',{name:'Kapat',exact:true}).click();
  await page.getByRole('tab',{name:'Günlük',exact:true}).click();
  await page.locator('.q-row').nth(1).click();assert.equal(await page.locator('textarea').count(),0);assert.equal(await page.locator('[data-q-goal]').count(),0);await page.getByRole('button',{name:'Kapat',exact:true}).click();
  assert.equal(await page.locator('#unchangedGraph').innerHTML(),before);
  assert.ok(await page.locator('.preview-nav').evaluate(e=>Math.abs(e.getBoundingClientRect().bottom-innerHeight)<1));
  assert.deepEqual(errors,[]);
  if(width===390)await page.screenshot({path:`test-results/quests-v5-${engine.name()}-390.png`,fullPage:true});
  await page.close();
 }
 console.log(`PASS ${engine.name()}: four widths, 3/6 tabs, detail sheet, automatic-only actions, graph unchanged, no overflow, fixed preview nav`);
}finally{await browser?.close();await new Promise(r=>server.close(r));}

