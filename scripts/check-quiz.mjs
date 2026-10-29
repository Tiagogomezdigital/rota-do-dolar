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
  const raw=await r.text();let data;try{data=JSON.parse(raw);}catch{data={message:raw.slice(0,120)};}
  if(Array.isArray(expected))assert.ok(expected.includes(r.status),`${r.status}: ${JSON.stringify(data)}`);else assert.equal(r.status,expected,JSON.stringify(data));
  return data;
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
await journey({action:'cta'});
assert.equal((await journey()).ctaClicked,true,'Repeating the checkout action must remain idempotent.');
await journey({action:'view',step:4});
await journey({action:'answer',questionId:'momento',optionId:'autonomo'});
assert.equal((await journey()).answers.momento,'autonomo');
assert.equal(Object.keys((await journey()).answers).length,12);
const staleEdit=await journey({action:'answer',questionId:'momento',optionId:'clt',expectedStep:4},409);
assert.equal(staleEdit.step,5);
assert.equal(staleEdit.answers.momento,'autonomo');
assert.equal(staleEdit.completed,true);
await journey({action:'view',step:4,expectedStep:5});
await journey({action:'answer',questionId:'momento',optionId:'clt',expectedStep:4});
assert.equal((await journey()).answers.momento,'clt','Explicitly revisiting a question must still permit editing.');
const declined=visitor();
await declined({action:'init',source:'qa-recusou-20261023'},201);
await declined({action:'view',step:1});
await declined({action:'answer',questionId:'compromisso',optionId:'sim'});
await declined({action:'view',step:1,expectedStep:2});
assert.equal((await declined({action:'answer',questionId:'compromisso',optionId:'nao'})).step,DECLINED_STEP);
assert.equal((await declined()).completed,false);
const refusedInAnotherTab=await declined({action:'answer',questionId:'genero',optionId:'homem',expectedStep:2},409);
assert.equal(refusedInAnotherTab.step,DECLINED_STEP);
assert.equal(refusedInAnotherTab.answers.compromisso,'nao');
assert.equal(refusedInAnotherTab.answers.genero,undefined);
await declined({action:'view',step:2,expectedStep:2},409);
await declined({action:'answer',questionId:'genero',optionId:'homem'},409);
assert.equal((await declined()).step,DECLINED_STEP,'A stale tab must not undo the refusal or its metric.');
await declined({action:'view',step:OFFER_STEP},400);
await declined({action:'view',step:2},400);
await declined({action:'view',step:1,expectedStep:DECLINED_STEP});
assert.equal((await declined({action:'answer',questionId:'compromisso',optionId:'sim',expectedStep:1})).step,2);
const racing=visitor();
await racing({action:'init',source:'qa-abas-concorrentes-20261023'},201);
await racing({action:'view',step:1});
await racing({action:'answer',questionId:'compromisso',optionId:'sim'});
const raced=await Promise.all(['homem','mulher'].map(optionId=>racing({action:'answer',questionId:'genero',optionId,expectedStep:2},[200,409])));
assert.equal(raced.filter(result=>!result.error).length,1,'Only one simultaneous answer may advance the same cursor.');
assert.equal(raced.filter(result=>result.error).length,1);
const raceSnapshot=await racing();
assert.equal(raceSnapshot.step,3);
assert.equal(Object.keys(raceSnapshot.answers).length,2);
assert.equal(raced.find(result=>result.error).answers.genero,raceSnapshot.answers.genero,'Conflict must return the winning answer for UI resynchronization.');

// An old request must remain stale even when a different tab returns to the same step.
const aba=visitor();
const abaInitial=await aba({action:'init',source:'qa-revision-aba'},201);
assert.ok(Number.isSafeInteger(abaInitial.revision));
let abaState=await aba({action:'view',step:1,expectedStep:0,expectedRevision:abaInitial.revision});
abaState=await aba({action:'answer',questionId:'compromisso',optionId:'sim',expectedStep:1,expectedRevision:abaState.revision});
const obsoleteRevision=abaState.revision;
abaState=await aba({action:'answer',questionId:'genero',optionId:'homem',expectedStep:2,expectedRevision:obsoleteRevision});
abaState=await aba({action:'view',step:2,expectedStep:3,expectedRevision:abaState.revision});
const staleAfterRevisit=await aba({action:'answer',questionId:'genero',optionId:'mulher',expectedStep:2,expectedRevision:obsoleteRevision},409);
assert.equal(staleAfterRevisit.step,2);
assert.equal(staleAfterRevisit.revision,abaState.revision);
assert.equal(staleAfterRevisit.answers.genero,'homem','An old answer must not overwrite a later explicit revisit.');
for(const invalidRevision of [-1,1.5,'123',null]){
 await aba({action:'answer',questionId:'genero',optionId:'mulher',expectedStep:2,expectedRevision:invalidRevision},400);
}

// Discarding a successful response models a connection lost after the server committed.
const possiblyCommitted={action:'answer',questionId:'genero',optionId:'mulher',expectedStep:2,expectedRevision:abaState.revision};
await aba(possiblyCommitted);
const afterLostResponse=await aba(possiblyCommitted,409);
assert.equal(afterLostResponse.step,3);
assert.equal(afterLostResponse.answers.genero,'mulher');
assert.equal(Object.keys(afterLostResponse.answers).length,2);
assert.ok(afterLostResponse.revision>abaState.revision);
assert.deepEqual(await aba({action:'init'}),await aba(),'Reload/resume must recover a write whose acknowledgement was lost.');

// The completed QA session can revisit each question without creating duplicate answers.
let allOptionsState=await journey();
let checkedOptions=2; // Commitment yes/no are both covered above.
for(const [index,question] of questions.entries()){
 if(question.id==='compromisso')continue;
 for(const option of question.options){
  allOptionsState=await journey({action:'view',step:index+1,expectedStep:allOptionsState.step,expectedRevision:allOptionsState.revision});
  await journey({action:'answer',questionId:question.id,optionId:'__invalid__',expectedStep:index+1,expectedRevision:allOptionsState.revision},400);
  const advanced=await journey({action:'answer',questionId:question.id,optionId:option.id,expectedStep:index+1,expectedRevision:allOptionsState.revision});
  assert.equal(advanced.step,index+2);
  assert.ok(advanced.revision>allOptionsState.revision);
  allOptionsState=await journey();
  assert.equal(allOptionsState.answers[question.id],option.id);
  assert.equal(allOptionsState.revision,advanced.revision);
  assert.equal(Object.keys(allOptionsState.answers).length,questions.length);
  checkedOptions++;
 }
}
assert.equal(checkedOptions,questions.reduce((total,question)=>total+question.options.length,0));
assert.equal((await declined({action:'init'})).answers.compromisso,'sim','Independent visitors must retain their own answers.');
const admin=await fetch(`${origin}/api/admin`);
assert.ok([401,403].includes(admin.status),'Admin must remain protected.');
assert.equal((await fetch(`${origin}/tiago-gomes/obrigado`)).status,200);
console.log(`PASS: ${questions.length} questions, all ${checkedOptions} options, invalid options, resume, explicit edit, stale-tab and ABA revision conflicts, lost acknowledgement recovery, concurrent answers, refusal protection, 7-second gate, idempotent CTA, origin validation, admin protection and thank-you route.`);
