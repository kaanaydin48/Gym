const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const {boot,setRemote,setFail}=require('../sync-harness.cjs');
function themed(storage){
 const a=boot(storage);a.ctx.document.documentElement={dataset:{}};
 vm.runInContext(fs.readFileSync('theme.js','utf8'),a.ctx);return a;
}
test('legacy defaults, immediate root update, local reload and data preservation',async()=>{
 setRemote(null);setFail(false);const a=themed();await a.ctx.gymReady;
 assert.equal(a.run('currentTheme()'),'classic-white');
 const before=a.run('JSON.stringify({...state,settings:{...state.settings,theme:null}})');
 a.run("chooseTheme('liquid-glass')");assert.equal(a.ctx.document.documentElement.dataset.theme,'liquid-glass');
 assert.equal(a.run('JSON.stringify({...state,settings:{...state.settings,theme:null}})'),before);
 const b=themed(a.storage);await b.ctx.gymReady;assert.equal(b.run('currentTheme()'),'liquid-glass');
 b.run("chooseTheme('bad-value')");assert.equal(b.run('currentTheme()'),'liquid-glass');
 b.run("chooseTheme('classic-white')");assert.equal(b.ctx.document.documentElement.dataset.theme,'classic-white');
});
test('cloud snapshot round trip to a fresh device and failed save retry',async()=>{
 setRemote(null);setFail(false);const a=themed();await a.ctx.gymReady;a.run("chooseTheme('liquid-glass')");
 setFail(true);assert.equal(await a.run('saveAll({silentSuccess:true})'),false);assert.equal(a.run('dirty'),true);
 setFail(false);assert.equal(await a.run('saveAll({silentSuccess:true})'),true);
 const b=themed();await b.ctx.gymReady;assert.equal(b.run('currentTheme()'),'liquid-glass');assert.equal(b.ctx.document.documentElement.dataset.theme,'liquid-glass');
});
test('startup cache is account scoped and malformed/blocked storage is safe',()=>{
 const a=themed();a.storage.set('gym-tracker-pro-v1:one',JSON.stringify({settings:{theme:'liquid-glass'}}));
 a.ctx.GymTheme.restore('one');assert.equal(a.ctx.document.documentElement.dataset.theme,'liquid-glass');
 a.ctx.GymTheme.restore('two');assert.equal(a.ctx.document.documentElement.dataset.theme,'classic-white');
 a.storage.set('gym-tracker-pro-v1:two','broken');assert.doesNotThrow(()=>a.ctx.GymTheme.restore('two'));
 a.ctx.localStorage.getItem=()=>{throw Error('blocked')};assert.doesNotThrow(()=>a.ctx.GymTheme.restore('one'));
});
test('concurrent-device conflict keeps the local theme and workout snapshot',async()=>{
 setRemote(null);setFail(false);const a=themed();await a.ctx.gymReady;await a.run('saveAll({silentSuccess:true})');
 const b=themed();await b.ctx.gymReady;
 a.run("chooseTheme('liquid-glass')");await a.run('saveAll({silentSuccess:true})');
 b.run("chooseTheme('classic-white')");assert.equal(await b.run('saveAll({silentSuccess:true})'),false);
 assert.equal(b.run('currentTheme()'),'classic-white');assert.equal(b.run('dirty'),true);
});
