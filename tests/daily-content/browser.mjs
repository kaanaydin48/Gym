import {chromium,webkit} from 'playwright';import {createServer} from 'node:http';import {readFile} from 'node:fs/promises';import {resolve,extname} from 'node:path';import assert from 'node:assert/strict';
const root=process.cwd(),server=createServer(async(req,res)=>{try{const p=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://x').pathname));if(!p.startsWith(root+'/'))throw Error();const data=await readFile(p);res.setHeader('Content-Type',({'.mjs':'text/javascript','.js':'text/javascript','.html':'text/html','.css':'text/css'})[extname(p)]||'text/plain');res.end(data);}catch{res.statusCode=404;res.end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
const browser=await (process.env.CONTENT_BROWSER==='webkit'?webkit:chromium).launch({headless:true});
try{for(const width of [320,375,390,430]){
 const context=await browser.newContext({viewport:{width,height:900},isMobile:true,hasTouch:true});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(base+'/tests/daily-content/preview.html');await page.locator('.dc-card').nth(2).waitFor();
 assert.equal(await page.locator('.dc-card').count(),3);assert.equal(await page.locator('.dc-dots button').count(),3);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 assert.equal(await page.evaluate(()=>[...document.querySelectorAll('.dc-body')].every(e=>e.scrollHeight<=e.clientHeight+1)),true);
 await page.getByLabel('Spor Bilimi kartına git').click();await page.waitForFunction(()=>document.querySelector('.dc-rail').scrollLeft>100);
 assert.equal(await page.getByText('Orijinal kaynak ↗').getAttribute('href').then(x=>/^https:\/\/pubmed.ncbi.nlm.nih.gov\/\d+\/$/.test(x)),true);
 await page.getByLabel('Günün Mesajı kartına git').click();await page.waitForFunction(()=>document.querySelector('.dc-rail').scrollLeft<5);
 await page.getByLabel('Kaydet',{exact:true}).first().click();await page.getByLabel('Kaydı kaldır',{exact:true}).waitFor();
 await page.getByLabel('Beğendim',{exact:true}).first().click();await page.waitForFunction(()=>document.querySelector('[aria-label="Beğendim"]').getAttribute('aria-pressed')==='true');
 await page.getByLabel('Beğenmedim',{exact:true}).first().click();await page.waitForFunction(()=>document.querySelector('[aria-label="Beğenmedim"]').getAttribute('aria-pressed')==='true');
 await context.setOffline(true);await page.getByLabel('Kaydı kaldır',{exact:true}).click();await context.setOffline(false);await page.waitForFunction(()=>Object.keys(JSON.parse(localStorage.getItem('gym-daily-v1:daily-test')).pending).length===0);
 await page.getByLabel('Kaydet',{exact:true}).first().click();await page.getByRole('button',{name:'Profil',exact:true}).click();await page.getByText('Kaydettiğim İçerikler').waitFor();assert.equal(await page.locator('.dc-saved .dc-card').count(),1);assert.deepEqual(errors,[]);console.log('PASS '+width+'px cards, overflow, navigation, source, save, reactions, offline sync, profile');await context.close();
 }}finally{await browser.close();await new Promise(r=>server.close(r));}
