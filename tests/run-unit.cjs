const {spawnSync}=require('node:child_process');
const files=['audit','beginner-program','growth','home-flow-groups','home-insights','member-directory','pwa-dock-unit','summary-flow','sync-safety'];
let failed=0;
for(const file of files){const r=spawnSync(process.execPath,[`tests/${file}.cjs`],{stdio:'inherit',env:{...process.env,TZ:'Europe/Istanbul'}});if(r.status!==0)failed++;}
console.log(`${files.length-failed}/${files.length} test suites passed`);process.exitCode=failed?1:0;
