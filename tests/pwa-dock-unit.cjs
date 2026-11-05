const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const code=fs.readFileSync(require('node:path').join(__dirname,'../pwa-dock.js'),'utf8');
function boot({ios=true,standalone=true}={}){
 const listeners=new Map(),frames=[];
 const events=prefix=>({addEventListener:(name,fn)=>listeners.set(prefix+name,fn)});
 const node=()=>({style:{setProperty(k,v){this[k]=v}},classList:{values:new Set(),add(k){this.values.add(k)},toggle(k,v){v?this.values.add(k):this.values.delete(k)}},append(...items){this.children=items},getBoundingClientRect:()=>({height:83})});
 const nav=node(),timer=node(),body=node(),root=node();let dock;
 const viewport={...events('vv:'),pageTop:0,pageLeft:0,width:393,height:852,scale:1};
 const mobile={matches:true,...events('media:')};
 const document={...events('doc:'),body,documentElement:root,activeElement:null,createElement(){return dock=node()},getElementById:id=>id==='mobileNav'?nav:timer};
 const window={...events('win:'),visualViewport:viewport,innerHeight:852,matchMedia:q=>q.includes('standalone')?{matches:standalone}:mobile};
 const context={window,document,navigator:{userAgent:ios?'iPhone':'Android',platform:'',standalone},requestAnimationFrame:fn=>(frames.push(fn),frames.length),setTimeout:fn=>frames.push(fn)};
 vm.runInNewContext(code,context);
 const fire=name=>{listeners.get(name)?.();while(frames.length)frames.shift()()};
 return {window,document,viewport,mobile,dock,body,nav,timer,fire};
}
for(const config of [{ios:false},{standalone:false}])assert.equal(boot(config).dock,undefined);
const a=boot();assert.deepEqual(a.dock.children,[a.nav,a.timer]);
for(const scroll of [0,500,1900,200]){a.viewport.pageTop=scroll;a.fire('vv:scroll');assert.equal(a.dock.style.top,`${scroll+852}px`);}
a.viewport.pageTop=225;a.viewport.height=500;a.document.activeElement={matches:()=>true};a.fire('vv:resize');assert.ok(a.dock.classList.values.has('keyboard-open'));
a.document.activeElement=null;a.viewport.height=852;a.fire('doc:focusout');assert.ok(!a.dock.classList.values.has('keyboard-open'));assert.equal(a.dock.style.top,'1077px');
a.viewport.width=852;a.viewport.height=393;a.mobile.matches=false;a.fire('win:orientationchange');assert.equal(a.dock.style.width,'852px');
a.viewport.width=393;a.viewport.height=852;a.mobile.matches=true;a.fire('win:pageshow');assert.equal(a.dock.style.width,'393px');assert.equal(a.dock.style['--dock-nav-height'],'83px');
console.log('PASS: iOS standalone gating, scroll offsets, keyboard hide/recovery, orientation, resume and measured nav height');
