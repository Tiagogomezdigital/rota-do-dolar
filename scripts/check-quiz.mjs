import assert from 'node:assert/strict';
import {setTimeout as pause} from 'node:timers/promises';
import {questions,PROCESS_STEP,STORY_STEP,RESULT_STEP,OFFER_STEP,DECLINED_STEP,PROCESS_DURATION_MS} from '../lib/content.ts';
const origin=process.env.QUIZ_TEST_ORIGIN||'http://localhost:5173';
assert.ok(['localhost','127.0.0.1'].includes(new URL(origin).hostname),'Use only a local test server.');
function visitor(){
 let cookie='';
 return async(body,expected=200,requestOrigin=origin)=>{
  const r=await fetch(`${origin}/tiago-gomes/api/journey`,{method:body?'POST':'GET',headers:{Cookie:cookie,Origin:requestOrigin,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
  if(r.headers.get('set-cookie')){assert.match(r.headers.get('set-cookie'),/HttpOnly/);cookie=r.headers.get('set-cookie').split(';')[0];}
  const raw=await r.text();let data;try{data=JSON.parse(raw);}catch{data={message:raw.slice(0,120)};}assert.equal(r.status,expected,JSON.stringify(data));return data;
 };
}
const journey=visitor();
assert.equal((await journey()).step,0);
await journey({action:'init',source:'qa-roteiro-20261023',device:'mobile'},201);
await journey({action:'view',step:OFFER_STEP},400);
await journey({action:'view',step:1},403,'https://untrusted.invalid');
await journey({action:'view',step:1});
await journey({action:'answer',questionId:'idade',optionId:'26-35'},400);
await journey({action:'cta'},400);
for(const [index,question] of questions.entries()){
 const value=question.options[0].id;
 assert.equal((await journey({action:'answer',questionId:question.id,optionId:value})).step,index+2);
}
const processingStarted=performance.now();
assert.equal((await journey()).step,PROCESS_STEP);
await journey({action:'view',step:STORY_STEP},400);
await pause(PROCESS_DURATION_MS+80);
await journey({action:'view',step:STORY_STEP});
assert.ok(performance.now()-processingStarted>=7000);
await journey({action:'view',step:RESULT_STEP});
await journey({action:'view',step:OFFER_STEP});
const saved=await journey();
assert.equal(Object.keys(saved.answers).length,12);
assert.equal(saved.completed,true);
assert.equal(saved.ctaClicked,false);
assert.equal((await journey({action:'init'})).step,OFFER_STEP);
await journey({action:'cta'});
assert.equal((await journey()).ctaClicked,true);
await journey({action:'view',step:4});
await journey({action:'answer',questionId:'momento',optionId:'autonomo'});
assert.equal((await journey()).answers.momento,'autonomo');
assert.equal(Object.keys((await journey()).answers).length,12);
const declined=visitor();
await declined({action:'init',source:'qa-recusou-20261023'},201);
await declined({action:'view',step:1});
assert.equal((await declined({action:'answer',questionId:'compromisso',optionId:'nao'})).step,DECLINED_STEP);
assert.equal((await declined()).completed,false);
await declined({action:'view',step:OFFER_STEP},400);
await declined({action:'view',step:2},400);
await declined({action:'view',step:1});
assert.equal((await declined({action:'answer',questionId:'compromisso',optionId:'sim'})).step,2);
const admin=await fetch(`${origin}/api/admin`);
assert.ok([401,403].includes(admin.status),'Admin must remain protected.');
assert.equal((await fetch(`${origin}/tiago-gomes/obrigado`)).status,200);
console.log('PASS: 12 answers, resume, edit, 7-second gate, refusal, CTA tracking, origin validation, admin protection and thank-you route.');
