const { chromium, webkit }=require('playwright');
const fs=require('node:fs');
const assert=require('node:assert/strict');
const path=require('node:path');
const root=path.join(__dirname,'..');
(async()=>{
 for(const engine of [webkit]){
 const browser=await engine.launch({headless:true});
 for(const standalone of [true,false]){
 const page=await browser.newPage({viewport:{width:393,height:852},userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15'});
 await page.setContent(`<style>${fs.readFileSync(path.join(root,'style.css'),'utf8')}</style><div style="height:4000px"><input id="kg"></div><nav id="mobileNav"><button>Ana Sayfa</button><button>Antrenman</button></nav><section id="restTimer" class="rest-timer">00:00</section>`);
 await page.evaluate(value=>Object.defineProperty(navigator,'standalone',{value}),standalone);
 await page.addScriptTag({path:path.join(root,'pwa-dock.js')});
 for(const y of [0,600,1800,300]){
 await page.evaluate(y=>window.scrollTo(0,y),y);await page.waitForTimeout(80);
 const nav=await page.locator('#mobileNav').boundingBox();
 assert.ok(Math.abs(nav.y+nav.height-852)<2,`nav drift at ${y}: ${JSON.stringify(nav)}`);
 const timer=await page.locator('#restTimer').boundingBox();assert.ok(timer.y+timer.height<=nav.y,'timer overlaps nav');
 }
 if(standalone){
 await page.evaluate(()=>{document.getElementById('kg').focus();Object.defineProperty(visualViewport,'height',{configurable:true,value:500});visualViewport.dispatchEvent(new Event('resize'));});
 await page.waitForTimeout(80);assert.equal(await page.locator('#mobileNav').isVisible(),false);
 await page.evaluate(()=>{document.getElementById('kg').blur();delete visualViewport.height;visualViewport.dispatchEvent(new Event('resize'));});
 await page.waitForTimeout(120);assert.equal(await page.locator('#mobileNav').isVisible(),true);
 await page.setViewportSize({width:852,height:393});await page.waitForTimeout(120);assert.equal(await page.locator('#mobileNav').isVisible(),false);
 await page.setViewportSize({width:393,height:852});await page.waitForTimeout(120);
 const nav=await page.locator('#mobileNav').boundingBox();assert.ok(Math.abs(nav.y+nav.height-852)<2);
 }
 await page.close();
 }
 await browser.close();console.log(engine.name()+': scroll, keyboard recovery, orientation and Safari fallback passed');
 }
})().catch(e=>{console.error(e);process.exit(1)});
