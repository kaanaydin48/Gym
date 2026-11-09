import {readFile,writeFile,mkdir,cp,rm,readdir} from 'node:fs/promises';
import {assertDevelopmentApi} from '../quests/isolation.mjs';
const api=assertDevelopmentApi(process.env.QUESTS_LOCAL_API||'http://127.0.0.1:54321');
const key=process.env.QUESTS_LOCAL_ANON_KEY;
if(!key)throw Error('Yerel Supabase anon anahtarını QUESTS_LOCAL_ANON_KEY ile ver. Üretim anahtarı kullanma.');
const out=new URL('../dev-build/',import.meta.url);
await rm(out,{recursive:true,force:true});await mkdir(out,{recursive:true});
// An explicit allowlist prevents backups, credentials, dependencies and Git data entering the preview.
const files=['index.html','login.html','app.js','auth-guard.js','membership.js','motion.js','contour-icons.js','pwa-dock.js','workout-metrics.js','style.css','manifest.webmanifest','icon.png','icon-512.png','apple-touch-icon.png','favicon-32.png'];
for(const file of files)await cp(new URL('../'+file,import.meta.url),new URL(file,out));
await cp(new URL('../quests/',import.meta.url),new URL('quests/',out),{recursive:true});
try{await cp(new URL('../assets/',import.meta.url),new URL('assets/',out),{recursive:true});}catch(e){if(e.code!=='ENOENT')throw e;}
for(const name of ['auth-guard.js','login.html']){
 const file=new URL(name,out);let source=await readFile(file,'utf8');
 source=source.replaceAll('https://aryzgrgjwjdxumbddank.supabase.co',api).replaceAll('sb_publishable_t2QNhjaGq0_kaY5IfsF87A_y7ep-837',key);
 await writeFile(file,source);
}
await writeFile(new URL('quests/config.js',out),'window.GYM_QUESTS_ENABLED = true;\n');
const csp=`<meta http-equiv="Content-Security-Policy" content="default-src 'self';script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net;style-src 'self' 'unsafe-inline';img-src 'self' data: blob:;connect-src 'self' ${api} ${api.replace('http','ws')};font-src 'self';worker-src 'none'">`;
for(const name of ['index.html','login.html']){const file=new URL(name,out);await writeFile(file,(await readFile(file,'utf8')).replace('<head>','<head>'+csp));}
for(const name of ['auth-guard.js','login.html'])if((await readFile(new URL(name,out),'utf8')).includes('aryzgrgjwjdxumbddank'))throw Error('Production URL remained in development output');
console.log('dev-build ready: local API only; service worker disabled; original source unchanged.');
