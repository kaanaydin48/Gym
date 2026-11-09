// Explicit allowlist: this development runtime must never connect to production.
export const PRODUCTION_PROJECT='aryzgrgjwjdxumbddank';
export const TEST_PROJECT='sucoijqzhfifwmwrprww';
const loopback=u=>['localhost','127.0.0.1','[::1]'].includes(u.hostname);
export function runtimeConfig({apiUrl,databaseUrl,origin='http://127.0.0.1:8080',allowProduction=false}) {
  const api=new URL(apiUrl),db=new URL(databaseUrl),app=new URL(origin);
  if(!['http:','https:'].includes(api.protocol)||api.username||api.password||api.pathname!=='/'||api.search||api.hash)throw Error('Invalid API configuration');
  if(!['postgres:','postgresql:'].includes(db.protocol))throw Error('Invalid database protocol');
  const production=allowProduction&&api.origin===`https://${PRODUCTION_PROJECT}.supabase.co`;
  if(!['http:','https:'].includes(app.protocol)||!(loopback(app)||(production&&app.origin==='https://kaanaydin48.github.io'))||app.username||app.password||app.pathname!=='/'||app.search||app.hash)throw Error('Development app origin must be loopback');
  const hosted=production||api.origin===`https://${TEST_PROJECT}.supabase.co`;
  const project=production?PRODUCTION_PROJECT:TEST_PROJECT;
  if(hosted){
    if(db.hostname!==`db.${project}.supabase.co`||db.pathname!=='/postgres')throw Error('Test database mismatch');
  }else if(!loopback(api)||!loopback(db)||db.pathname!=='/gym_quests_test')throw Error('Production connections are forbidden');
  // Discard provider URL options rather than letting them override the verified
  // host or driver TLS settings. In hosted mode the driver always verifies TLS.
  if(db.hash)throw Error('Database URL fragments are forbidden');
  db.search='';
  return {apiUrl:api.origin,databaseUrl:db.href,origin:app.origin,hosted};
}
