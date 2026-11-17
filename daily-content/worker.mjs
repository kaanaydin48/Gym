import {buildDaily} from './engine.mjs';
import {SCIENCE} from './catalog.mjs';
export async function ensureDaily(db,user){
 const {rows:[{day}]}=await db.query("select (now() at time zone 'Europe/Istanbul')::date::text as day");
 const existing=await db.query('select day::text,cards from public.daily_content_days where user_id=$1 and day=$2',[user,day]);
 if(existing.rows.length)return existing.rows[0];
 const [{rows:account},{rows:feedback},{rows:history},{rows:sources}]=await Promise.all([
 db.query('select state from public.gym_account_state where member_id=$1',[user]),
 db.query('select topic,reaction from public.daily_content_preferences where user_id=$1',[user]),
 db.query('select day::text,cards from public.daily_content_days where user_id=$1 and day>=$2::date-30 order by day',[user,day]),
 db.query('select card from public.daily_content_sources where active and verified_at>now()-interval \'30 days\'')]);
 const result=buildDaily({user,day,state:account[0]?.state||{},feedback,history,science:sources.map(x=>x.card)});
 await db.query('insert into public.daily_content_days(user_id,day,cards) values($1,$2,$3) on conflict do nothing',[user,day,JSON.stringify(result.cards)]);
 return (await db.query('select day::text,cards from public.daily_content_days where user_id=$1 and day=$2',[user,day])).rows[0];
}
// Metadata and retraction checks are automatic; only editorially verified Turkish summaries publish.
export async function verifySources(db,fetcher=fetch){
 const query=SCIENCE.map(x=>'EXT_ID:'+x.pmid).join(' OR ');
 const response=await fetcher('https://www.ebi.ac.uk/europepmc/webservices/rest/search?format=json&resultType=core&pageSize=100&query='+encodeURIComponent('SRC:MED AND ('+query+')'),{signal:AbortSignal.timeout(12000)});
 if(!response.ok)throw Error('Kaynak doğrulama servisi yanıt vermedi');
 const data=await response.json();let verified=0;
 for(const source of SCIENCE){
 const item=data.resultList?.result?.find(x=>x.id===source.pmid&&x.source==='MED');
 if(!item)continue;
 const types=JSON.stringify(item.pubTypeList||{}),title=String(item.title||'');
 if(/retract|withdraw/i.test(types+' '+title)||item.isRetracted==='Y'){
 await db.query('update public.daily_content_sources set active=false where id=$1',[source.id]);continue;}
 if(!title.toLowerCase().includes(source.match.toLowerCase()))continue;
 const card={...source,verifiedAt:new Date().toISOString(),publicationTitle:title};
 await db.query('insert into public.daily_content_sources(id,card,verified_at,active) values($1,$2,now(),true) on conflict(id) do update set card=excluded.card,verified_at=now(),active=true',[source.id,JSON.stringify(card)]);verified++;
 }
 if(!verified)throw Error('Hiçbir kaynak doğrulanamadı');return verified;
}
