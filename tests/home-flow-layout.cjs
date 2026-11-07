const {chromium,webkit}=require('playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
const {html,source}=require('./home-flow-groups.cjs');
(async()=>{
 const engine=process.env.FLOW_BROWSER==='webkit'?webkit:chromium;
 const browser=await engine.launch(engine===chromium?{headless:true,executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']}:{headless:true});
 for(const width of [320,375,393,430])for(const theme of ['','dark','theme-dark'])for(const standalone of [false,true]){
  const page=await browser.newPage({viewport:{width,height:852},deviceScaleFactor:2,isMobile:true,hasTouch:true});
  await page.setContent(`<meta name="viewport" content="width=device-width, initial-scale=1"><style>${fs.readFileSync('style.css','utf8')}</style><body class="${theme}"><main>${html}</main></body>`);
  await page.evaluate(value=>Object.defineProperty(navigator,'standalone',{value}),standalone);
  await page.addScriptTag({content:source.slice(source.indexOf('function summaryFlowColor('))});
  await page.evaluate(()=>drawHomeFlowRibbons());
  const result=await page.evaluate(()=>{
   const host=document.querySelector('.period-flow'),cards=[...host.querySelectorAll('.period-flow-item')],paths=[...host.querySelectorAll('path')];
   const rect=e=>e.getBoundingClientRect();
   return {overflow:document.documentElement.scrollWidth>innerWidth,heads:host.querySelectorAll('.period-flow-group-heading').length,paths:paths.length,cards:cards.length,
    compact:cards.every(card=>Math.abs(rect(card).width/rect(host).width-.592)<.002&&rect(card).height>=51),
    clipped:cards.some(card=>[...card.querySelectorAll('.period-flow-name,.period-flow-max,.period-flow-values,.period-flow-icon')].some(el=>el.scrollWidth>el.clientWidth+1||rect(el).right>rect(card).right||rect(el).left<rect(card).left)),
    targets:cards.map((card,i)=>{const end=paths[i].getPointAtLength(paths[i].getTotalLength());return Math.abs(end.y-(card.offsetTop+card.offsetHeight*.4))<.2&&Math.abs(end.x-(host.querySelector('.period-flow-items').offsetLeft+2))<.2;}),
    overlaps:cards.some(card=>{const name=rect(card.querySelector('.period-flow-name')),icon=rect(card.querySelector('.period-flow-icon'));return name.left<icon.right&&name.right>icon.left&&name.bottom>icon.top&&name.top<icon.bottom;}),
    gaps:cards.map(card=>{const next=card.nextElementSibling;return next?.classList.contains('period-flow-item')?rect(next).top-rect(card).bottom:null}).filter(x=>x!==null),
    headerInteractive:!!host.querySelector('.period-flow-group-heading button,.period-flow-group-heading svg,.period-flow-group-heading[onclick]')};
  });
  assert(!result.overflow,`overflow ${width}/${theme}/${standalone}`);
  assert(result.compact);assert(!result.clipped);
  assert(!result.overlaps,`name/icon overlap ${width}/${theme}/${standalone}`);
  assert.equal(result.heads,6);assert.equal(result.paths,result.cards);assert(result.targets.every(Boolean));assert(result.gaps.every(g=>Math.abs(g-6)<.2));assert(!result.headerInteractive);
  if(width===393&&theme===''&&!standalone)await page.screenshot({path:'/tmp/home-flow-groups.png',fullPage:true});
  await page.close();
 }
 await browser.close();console.log(`PASS: ${engine.name()} 24 mobile layouts, light/dark, standalone flag, long names, no horizontal overflow, 6px gaps, every ribbon endpoint and noninteractive headers`);
})().catch(e=>{console.error(e);process.exit(1)});
