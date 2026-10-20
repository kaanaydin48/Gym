const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('login.html','utf8').split('<script>')[1].split('</script>')[0];
const user={id:'member-a',email:'member@example.invalid',user_metadata:{full_name:'Test Member'}};
async function boot(url,options={}){
 const elements={},calls=[],storage=options.storage||{};
 const el=id=>elements[id]??=( {value:'',hidden:false,textContent:'',children:[],type:'password',append(...x){this.children.push(...x)},prepend(...x){this.children.unshift(...x)},setAttribute(){},querySelectorAll(){return []}});
 const auth={getUser:async()=>({data:{user:options.noUser?null:user},error:null}),getSession:async()=>({data:{session:options.session?{user}:null}}),setSession:async x=>(calls.push(['setSession',x]),{error:options.badLink?'expired':null}),verifyOtp:async x=>(calls.push(['verifyOtp',x]),{error:options.badLink?'expired':null}),exchangeCodeForSession:async x=>(calls.push(['exchange',x]),{data:{redirectType:'recovery'}}),resetPasswordForEmail:async(...x)=>(calls.push(['recover',...x]),{error:null}),updateUser:async x=>(calls.push(['update',x]),{error:null}),signOut:async()=>({error:null}),signInWithPassword:async()=>({error:null})};
 const document={getElementById:el,querySelectorAll:()=>[],createElement:()=>({}),createTextNode:x=>x};
 const context={URL,URLSearchParams,Date,document,location:new URL(url),history:{replaceState(...x){calls.push(['clean',...x])}},sessionStorage:{setItem:(k,v)=>storage[k]=v,getItem:k=>storage[k],removeItem:k=>delete storage[k]},window:{supabase:{createClient:()=>({auth,from:()=>({select:()=>({eq:()=>({single:async()=>({data:{role:'member'}})})})})})}}};
 await vm.runInNewContext(source,context);return {el,calls,storage,context};
}
(async()=>{
 let checks=0;const check=(ok,label)=>{assert.ok(ok,label);checks++};
 let t=await boot('https://kaanaydin48.github.io/Gym/login.html#access_token=a&refresh_token=r&type=invite');
 check(t.el('title').textContent==='Hesabını tamamla.','Invite opens password setup');check(t.el('email').value===user.email,'Verified email used');check(!t.el('confirmLabel').hidden,'Confirmation field shown');
 let resumed=await boot('https://kaanaydin48.github.io/Gym/login.html',{session:true,storage:t.storage});check(resumed.el('title').textContent==='Hesabını tamamla.','Refresh preserves incomplete setup');
 t.el('password').value='LongPassword1';t.el('confirmPassword').value='WrongPassword';await t.el('accountForm').onsubmit({preventDefault(){}});check(!t.calls.some(x=>x[0]==='update'),'Mismatch cannot update');
 t.el('confirmPassword').value='LongPassword1';await t.el('accountForm').onsubmit({preventDefault(){}});check(t.calls.some(x=>x[0]==='update'),'Password update submitted');check(!t.storage['gym-password-flow'],'Completed flow cleared');
 t=await boot('https://kaanaydin48.github.io/Gym/login.html#access_token=a&refresh_token=r&type=recovery');check(t.el('title').textContent==='Yeni şifreni belirle.','Recovery opens new password');
 t=await boot('https://kaanaydin48.github.io/Gym/login.html?token_hash=abc&type=invite');check(t.calls.some(x=>x[0]==='verifyOtp'&&x[1].type==='invite'),'Token hash verified');check(t.el('title').textContent==='Hesabını tamamla.','Token hash invite form');
 t=await boot('https://kaanaydin48.github.io/Gym/login.html?code=abc');check(t.el('title').textContent==='Yeni şifreni belirle.','PKCE recovery handled');
 t=await boot('https://kaanaydin48.github.io/Gym/login.html?token_hash=abc&type=invite',{session:true,badLink:true});check(t.el('title').textContent==='Tekrar hoş geldin.','Invalid link cannot use previous session');check(!t.el('forgot').hidden,'Invalid link recovery available');
 t=await boot('https://kaanaydin48.github.io/Gym/login.html?type=invite',{session:true});check(t.el('title').textContent==='Tekrar hoş geldin.','Type alone does not authorize password form');
 t=await boot('https://kaanaydin48.github.io/Gym/login.html',{session:true});check(!t.el('forgot').hidden,'Signed-in account still offers recovery');
 t.el('forgot').onclick();t.el('email').value=user.email;await t.el('accountForm').onsubmit({preventDefault(){}});check(t.calls.find(x=>x[0]==='recover')[2].redirectTo==='https://kaanaydin48.github.io/Gym/login.html','Recovery exact callback');
 t=await boot('https://kaanaydin48.github.io/Gym/login.html?action=forgot');check(t.el('title').textContent==='Şifreni yenile.','Direct recovery route');
 const guard=fs.readFileSync('auth-guard.js','utf8');let destination;await vm.runInNewContext(guard,{URLSearchParams,document:{documentElement:{style:{}}},location:{search:'',hash:'#access_token=a&refresh_token=r&type=invite',replace:x=>destination=x}});check(destination==='./login.html#access_token=a&refresh_token=r&type=invite','App redirects callback intact before loading SDK');
 console.log(`PASS: ${checks} password/invitation routing and form checks (mocked Auth; no email E2E)`);
})().catch(e=>{console.error(e);process.exit(1)});
