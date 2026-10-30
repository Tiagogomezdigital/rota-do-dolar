import assert from 'node:assert/strict';
import {setTimeout as pause} from 'node:timers/promises';
import * as daniel from '../lib/content-daniel.ts';

const origin=process.env.QUIZ_TEST_ORIGIN||'http://localhost:5173';
const url=new URL(origin);
assert.ok(url.protocol==='http:'&&['localhost','127.0.0.1'].includes(url.hostname)&&url.pathname==='/'&&!url.search&&!url.hash,'Only a local TEST server is allowed.');
assert.ok(process.argv.includes('--confirm-test-database'),'Confirm the TEST database.');
const jar=new Map();
async function request(endpoint,body,expected=200,cookies=jar){
  const response=await fetch(origin+endpoint,{method:body?'POST':'GET',headers:{Origin:origin,'Content-Type':'application/json',Cookie:[...cookies].map(([name,value])=>`${name}=${value}`).join('; ')},...(body?{body:JSON.stringify(body)}:{})});
  const data=await response.json();
  assert.equal(response.status,expected,JSON.stringify(data));
  assert.match(response.headers.get('cache-control'),/no-store/);
  const cookie=response.headers.get('set-cookie');
  if(cookie){
    assert.match(cookie,/HttpOnly; SameSite=Lax/);
    const pair=cookie.split(';')[0],equal=pair.indexOf('=');
    jar.set(pair.slice(0,equal),pair.slice(equal+1));
    assert.ok(cookie.includes(`Path=${endpoint.startsWith('/daniel/')?'/daniel;':'/;'}`));
  }
  return data;
}
const original='/tiago-gomes/api/journey',copy='/daniel/api/journey';
await request(original,{action:'init',source:'qa-variant-original',device:'mobile'},201);
await request(original,{action:'view',step:1});
await request(original,{action:'answer',questionId:'compromisso',optionId:'sim'});
await request(original,{action:'answer',questionId:'genero',optionId:'homem'});
const originalState=await request(original);
await request(copy,{action:'init',source:'qa-variant-daniel',device:'mobile',quiz:'tiago'},201);
assert.equal(jar.size,2);
assert.notEqual(jar.get('journey_session'),jar.get('journey_session_daniel'));
await request(copy,{action:'view',step:1});
await request(copy,{action:'answer',questionId:'compromisso',optionId:'sim'});
await request(copy,{action:'answer',questionId:'genero',optionId:'mulher'});
const danielState=await request(copy);
assert.equal(danielState.answers.genero,'mulher');
assert.equal((await request(original)).answers.genero,'homem');
assert.deepEqual(await request(original,{action:'init'}),originalState,'Switching routes must retain the original progress.');
assert.deepEqual(await request(copy,{action:'init'}),danielState,'Daniel must resume its own answers.');
for(const [endpoint,cookieName,foreignId] of [[copy,'journey_session_daniel',jar.get('journey_session')],[original,'journey_session',jar.get('journey_session_daniel')]]){
  const foreign=new Map([[cookieName,foreignId]]);
  assert.deepEqual(await request(endpoint,undefined,200,foreign),{step:0,answers:{},completed:false,ctaClicked:false,revision:0},'Foreign edition cookie must not expose another quiz snapshot.');
  await request(endpoint,{action:'view',step:1},409,foreign);
}
let current=danielState;
for(const [index,question] of daniel.questions.entries()){
  if(index<2)continue;
  current=await request(copy,{action:'answer',questionId:question.id,optionId:question.options[0].id,expectedStep:current.step,expectedRevision:current.revision});
}
assert.equal(current.step,daniel.PROCESS_STEP);
await request(copy,{action:'view',step:daniel.STORY_STEP},400);
await pause(daniel.PROCESS_DURATION_MS+120);
for(const step of [daniel.STORY_STEP,daniel.RESULT_STEP,daniel.OFFER_STEP]){
  current=await request(copy,{action:'view',step,expectedStep:current.step,expectedRevision:current.revision});
}
await request(copy,{action:'cta',expectedStep:current.step,expectedRevision:current.revision});
const completed=await request(copy);
assert.equal(completed.completed,true);
assert.equal(completed.ctaClicked,true);
assert.equal(Object.keys(completed.answers).length,12);
assert.deepEqual(await request(original),originalState,'Completing Daniel must not advance or overwrite the original.');
assert.deepEqual(await request('/api/journey'),originalState,'The original API alias must continue working.');
for(const path of ['/','/tiago-gomes','/daniel','/obrigado','/tiago-gomes/obrigado'])assert.equal((await fetch(origin+path)).status,200,path);
assert.equal((await fetch(origin+'/daniel/obrigado')).status,404,'Daniel has no separate thank-you route.');
for(const query of ['', '?quiz=daniel','?quiz=unknown']){
  const response=await fetch(`${origin}/api/admin${query}`);
  assert.equal(response.status,401,'Every admin variant must require authentication.');
  assert.match(response.headers.get('cache-control'),/private/);
}
console.log('PASS: separate cookies, editions and answers, independent resume, foreign-cookie rejection, original aliases, 12 Daniel answers, 7-second gate, completion/CTA and protected admin.');
