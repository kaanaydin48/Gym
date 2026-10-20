const assert=require('node:assert/strict'),{boot}=require('./audit.cjs');
(async()=>{
 const a=boot();await a.ctx.gymReady;
 const exercise={name:'Bench',type:'external',factor:2,logs:[{kg:20,reps:10,rir:2,done:true},{kg:99,reps:1,rir:0,done:false}]};
 a.ctx.testLogs=[{workout_date:'2026-10-16',sets:{kind:'workout',name:'Day 1',exercises:[exercise]}},{workout_date:'2026-10-19',sets:{kind:'workout',name:'Day 2',exercises:[{...exercise,logs:[{kg:25,reps:8,rir:1,done:true}]},{name:'Dips',type:'body',factor:1,logs:[{kg:70,reps:12,rir:2,done:true}]}]}}];
 const s=a.run('coachStats(testLogs)');assert.equal(s.sessions[0].external,400);assert.equal(s.latest.external,400);assert.equal(s.latest.body,840);assert.equal(s.delta,0);assert.equal(s.records.find(r=>r.name==='Bench').kg,25);assert.equal(s.records.find(r=>r.name==='Dips').rm,0);
 a.run("coachDashboard.members=[{id:'a',display_name:'Kaan',email:'a@example.invalid',is_active:true,invite_status:'pending'},{id:'b',display_name:'Ada',email:'b@example.invalid',is_active:false,invite_status:'accepted'}]");
 a.run("coachDashboard.query='kaan'");assert.equal(a.run('filteredCoachMembers().length'),1);
 a.run("coachDashboard.query='';coachDashboard.filter='inactive'");assert.equal(a.run('filteredCoachMembers()[0].id'),'b');
 a.run("coachDashboard.filter='pending'");assert.equal(a.run('filteredCoachMembers()[0].id'),'a');
 a.run("coachDashboard.detail={profile:{id:'a',display_name:'<img src=x>',email:'a@example.invalid',is_active:true,profile:{goal:'Strong'}},logs:testLogs,notes:[{body:'<script>bad</script>',created_at:'2026-10-19'}],assignments:[],stats:coachStats(testLogs)};coachDashboard.month='2026-10';coachDashboard.selected='2026-10-19';renderCoachDetail()");
 const html=a.e('modalBody').innerHTML;assert.match(html,/&lt;img/);assert.match(html,/&lt;script&gt;/);assert.doesNotMatch(html,/<script>/);assert.match(html,/Kişisel rekorlar/);assert.match(html,/25/);assert.match(html,/Antrenman takvimi/);
 for(const m of html.matchAll(/on(?:click|input|change)="([^"]*)"/g))new Function('event',m[1]);
 const before=a.run('JSON.stringify(state)');a.run('shiftCoachMonth(-1);selectCoachDay("2026-09-01")');assert.equal(a.run('JSON.stringify(state)'),before,'Coach browsing must not edit own workout state');
 console.log('PASS: coach search/status filters, volume/PR arithmetic, uncompleted sets excluded, escaping, calendar and own-record preservation');
})().catch(e=>{console.error(e);process.exit(1)});
