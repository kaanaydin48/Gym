import test from 'node:test';import assert from 'node:assert/strict';
import {runtimeConfig,TEST_PROJECT} from '../../quests/runtime-config.mjs';
const local={apiUrl:'http://127.0.0.1:54321',databaseUrl:'postgres://postgres:fixture@127.0.0.1:5432/gym_quests_test'};
const hosted={apiUrl:`https://${TEST_PROJECT}.supabase.co`,databaseUrl:`postgres://postgres:fixture@db.${TEST_PROJECT}.supabase.co:5432/postgres`};
test('runtime permits only local fixture DB or exact hosted test project',()=>{
 assert.equal(runtimeConfig(local).hosted,false);assert.equal(runtimeConfig(hosted).hosted,true);
 assert.equal(runtimeConfig({...hosted,databaseUrl:hosted.databaseUrl+'?sslmode=require'}).databaseUrl,hosted.databaseUrl);
 for(const patch of [{apiUrl:'https://aryzgrgjwjdxumbddank.supabase.co'},{databaseUrl:'postgres://postgres:fixture@db.aryzgrgjwjdxumbddank.supabase.co/postgres'},{apiUrl:hosted.apiUrl+'.evil.invalid'},{origin:'https://kaanaydin48.github.io'},{origin:'http://127.0.0.1:8080/path'}])assert.throws(()=>runtimeConfig({...hosted,...patch}));
 assert.equal(runtimeConfig({...hosted,databaseUrl:hosted.databaseUrl+'?sslmode=disable&host=evil.invalid'}).databaseUrl,hosted.databaseUrl);
 assert.throws(()=>runtimeConfig({...local,databaseUrl:'postgres://localhost/postgres'}));
});

test('approved production uses matching DB and Pages origin only',()=>{
 const apiUrl='https://aryzgrgjwjdxumbddank.supabase.co',databaseUrl='postgres://postgres:fixture@db.aryzgrgjwjdxumbddank.supabase.co/postgres';
 assert.equal(runtimeConfig({apiUrl,databaseUrl,origin:'https://kaanaydin48.github.io',allowProduction:true}).hosted,true);
 assert.throws(()=>runtimeConfig({apiUrl,databaseUrl,origin:'https://evil.invalid',allowProduction:true}));
 assert.throws(()=>runtimeConfig({apiUrl,databaseUrl:hosted.databaseUrl,allowProduction:true}));
});
