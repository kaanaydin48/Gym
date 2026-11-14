const {chromium,webkit}=require('playwright');const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
(async()=>{
 const type=process.env.FLEX_BROWSER==='webkit'?webkit:chromium,browser=await type.launch({headless:true});
 for(const width of [320,393,430]){
 const context=await browser.newContext({viewport:{width,height:852},isMobile:true,hasTouch:true});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
 await page.route('https://gym.test/**',async route=>{
 const file=new URL(route.request().url()).pathname.slice(1)||'index.html';
 if(file==='index.html'){
 let html=fs.readFileSync('index.html','utf8').replace(/<script[\s\S]*?<\/script>/g,'').replace('html{visibility:hidden}','html{visibility:visible}');
 const mock=`window.gymAccount={user:{id:'fixture',email:'fixture@example.invalid',user_metadata:{}},role:'coach',client:{from(){const q={select(){return q},eq(){return q},async maybeSingle(){if(!navigator.onLine||localStorage.getItem('fixtureOffline'))return {error:Error('offline')};return {data:JSON.parse(localStorage.getItem('remote')||'null')}},async single(){return q.maybeSingle()}};return q},async rpc(name,{payload,expected_revision}){if(!navigator.onLine||localStorage.getItem('fixtureOffline'))return {error:Error('offline')};const old=JSON.parse(localStorage.getItem('remote')||'null');if(expected_revision!==(old?.revision||0))return {error:Error('GYM_CONFLICT')};localStorage.setItem('remote',JSON.stringify({state:payload,revision:expected_revision+1}));return {data:expected_revision+1}}}};`;
 html=html.replace('</body>',`<script>${mock}</script>`+['membership.js','contour-icons.js','motion.js','workout-metrics.js','workout-flex-v2.js','app.js'].map(f=>`<script src="/${f}"></script>`).join('')+'</body>');return route.fulfill({contentType:'text/html',body:html});
 }if(fs.existsSync(file))return route.fulfill({path:path.resolve(file)});return route.fulfill({status:404,body:''});
 });
 await page.goto('https://gym.test/');await page.evaluate(()=>window.gymReady);await page.evaluate(()=>{state.days={};go('workout')});
 await page.locator('#assignProgram').selectOption('0');await page.getByRole('button',{name:'Antrenman ata',exact:true}).click();
 const card=page.locator('.workout-exercise-card').first();const kg=card.locator('input[data-field="kg"]'),reps=card.locator('input[data-field="reps"]');
 await kg.nth(0).fill('30');await reps.nth(0).fill('10');assert.equal(await kg.nth(1).inputValue(),'30');assert.equal(await reps.nth(3).inputValue(),'10');
 await reps.nth(1).fill('8');await reps.nth(0).fill('12');assert.equal(await reps.nth(1).inputValue(),'8');
 await card.locator('input[type="checkbox"]').nth(0).check();
 await card.getByRole('button',{name:'Hareket seçenekleri'}).click();await page.getByRole('button',{name:'Hareketi değiştir',exact:true}).click();await page.getByPlaceholder('Adıyla ara…').fill('Barbell Bench');await page.getByRole('button',{name:'Değiştir',exact:true}).click();
 assert.match(await card.innerText(),/Dumbbell Bench/);const replacement=page.locator('.workout-exercise-card').nth(1);assert.match(await replacement.innerText(),/Barbell Bench/);assert.equal(await replacement.locator('input[data-field="kg"]').first().inputValue(),'');
 await replacement.getByRole('button',{name:'Hareket seçenekleri'}).click();await page.getByRole('button',{name:'Süper sete ekle / çıkar'}).click();await page.locator('input[name="flexGroup"][value="2"]').check();await page.locator('input[name="flexGroup"][value="3"]').check();await page.getByRole('button',{name:'Bağla',exact:true}).click();assert.equal(await page.locator('.flex-linked').count(),3);
 await replacement.locator('input[data-field="kg"]').first().fill('40');
 await context.setOffline(true);assert.equal(await page.evaluate(()=>{localStorage.setItem('fixtureOffline','1');save();return saveAll({silentSuccess:true})}),false);await context.setOffline(false);await page.reload();await page.evaluate(()=>window.gymReady);await page.evaluate(()=>go('workout'));assert.equal(await page.locator('.flex-linked').count(),3);assert.equal(await page.locator('.workout-exercise-card').nth(1).locator('input[data-field="kg"]').first().inputValue(),'40');
 assert(!await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),'horizontal overflow '+width);
 assert.equal(await page.locator('input[aria-label*="rir"]').count(),0);
 await page.evaluate(()=>{localStorage.removeItem('fixtureOffline');return retryCloud()});await page.getByRole('button',{name:'▶ Antrenmanı Başlat'}).click();await page.getByRole('button',{name:'Antrenmanı bitir ✓',exact:true}).click();await page.getByRole('button',{name:'Yalnızca bugün',exact:true}).click();
 assert.equal(await page.evaluate(()=>state.programs[0].version),1);assert(await page.evaluate(()=>state.days[selected].finished));
 assert.deepEqual(errors,[]);await page.screenshot({path:'/tmp/gym-flex-'+type.name()+'-'+width+'.png',fullPage:true});await context.close();
 }
 await browser.close();console.log('PASS '+type.name()+': 320/393/430px inputs, manual override, replacement, 3-linked cards, offline RPC failure + persisted recovery, finish, default template choice; no runtime errors/overflow');
})().catch(e=>{console.error(e);process.exit(1)});
