// All development entry points call this before constructing a DB/API client.
export function assertLocalDatabase(config) {
  if(!config||!['127.0.0.1','localhost','::1'].includes(config.host)||config.database!=='gym_quests_test')throw Error('Test ortamı yalnızca yerel gym_quests_test veritabanına bağlanabilir.');
  if(config.connectionString||config.ssl)throw Error('Test ortamında uzak bağlantı yapılandırması yasak.');
  return config;
}
export function assertDevelopmentApi(url) {
  const u=new URL(url);
  if(!['127.0.0.1','localhost','[::1]'].includes(u.hostname)||!['http:','https:'].includes(u.protocol)||u.username||u.password)throw Error('Geliştirme ortamında canlı API bağlantısı engellendi.');
  return u.origin;
}

// Production activation was explicitly approved on 9 November 2026.
export function assertQuestApi(url) {
 if(url==='https://aryzgrgjwjdxumbddank.supabase.co')return url;
 return assertDevelopmentApi(url);
}
