import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {setTimeout as pause} from 'node:timers/promises';
import {questions,PROCESS_STEP} from '../lib/content.ts';

// Bounded local TEST-database exercise, never a production capacity claim.
// Example: node scripts/check-quiz-load.mjs --confirm-test-database --visitors=12 --concurrency=3
const args=process.argv.slice(2);
if(args.includes('--help')){
 console.log('Usage: node scripts/check-quiz-load.mjs --confirm-test-database [--origin=http://localhost:5173] [--visitors=12] [--concurrency=3]\nRequires a local server configured with QUIZ_TEST_TURSO_*; no production credentials. Maximum: 50 visitors, 5 concurrent visitors. Each visitor submits 12 answers and stops before the presentation. QA sessions are retained, never deleted.');
 process.exit(0);
}
for(const argument of args)assert.ok(argument==='--confirm-test-database'||/^--(origin|visitors|concurrency)=/.test(argument),`Unknown argument: ${argument}`);
function option(name,fallback){const values=args.filter(argument=>argument.startsWith(`--${name}=`));assert.ok(values.length<=1,`Specify --${name} only once.`);return values[0]?.slice(name.length+3)??fallback;}
const origin=new URL(option('origin',process.env.QUIZ_TEST_ORIGIN||'http://localhost:5173'));
assert.ok(origin.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(origin.hostname),'Load checks accept only local HTTP test servers.');
assert.ok(!origin.username&&!origin.password&&origin.pathname==='/'&&!origin.search&&!origin.hash,'Provide only the local origin, without credentials, path or query.');
assert.ok(args.includes('--confirm-test-database')||process.env.QUIZ_TEST_DATABASE_CONFIRMED==='1','Confirm the local server uses only the TEST database with --confirm-test-database or QUIZ_TEST_DATABASE_CONFIRMED=1.');
const visitors=Number(option('visitors','12'));
const concurrency=Number(option('concurrency','3'));
assert.ok(Number.isInteger(visitors)&&visitors>=1&&visitors<=50,'Visitors must be between 1 and 50.');
assert.ok(Number.isInteger(concurrency)&&concurrency>=1&&concurrency<=5&&concurrency<=visitors,'Concurrency must be between 1 and 5 and no greater than the visitor count.');

const startedAt=new Date().toISOString();
const source=`qa-load-${startedAt}`;
const samples=[];
const failures=[];
let nextVisitor=0;
let completedVisitors=0;
const start=performance.now();

async function runVisitor(){
 let cookie='';
 async function request(body){
  const phase=body?.action||'read';
  const tick=performance.now();
  let status=0;
  let success=false;
  try{
   const response=await fetch(new URL('/tiago-gomes/api/journey',origin),{
    method:body?'POST':'GET',
    headers:{Origin:origin.origin,'Content-Type':'application/json',Cookie:cookie},
    ...(body?{body:JSON.stringify(body)}:{}),
    redirect:'error',
    signal:AbortSignal.timeout(10_000),
   });
   status=response.status;
   if(response.headers.get('set-cookie'))cookie=response.headers.get('set-cookie').split(';')[0];
   if(!response.ok){await response.body?.cancel();throw new Error(`HTTP ${status}`);}
   const result=await response.json();
   assert.ok(Number.isSafeInteger(result.revision),'Missing acknowledged revision.');
   success=true;
   return result;
  }finally{
   samples.push({phase,status,ok:success,ms:performance.now()-tick});
  }
 }
 let state=await request({action:'init',source,device:'mobile'});
 state=await request({action:'view',step:1,expectedStep:state.step,expectedRevision:state.revision});
 for(const question of questions){
  await pause(100);
  state=await request({action:'answer',questionId:question.id,optionId:question.options[0].id,expectedStep:state.step,expectedRevision:state.revision});
 }
 const saved=await request();
 assert.equal(saved.step,PROCESS_STEP);
 assert.equal(Object.keys(saved.answers).length,questions.length);
 assert.equal(saved.completed,false);
 assert.equal(saved.ctaClicked,false);
 completedVisitors++;
}

async function worker(){
 while(nextVisitor<visitors){
  nextVisitor++;
  try{await runVisitor();}catch(error){failures.push({kind:error.name,message:error.message});}
 }
}
await Promise.all(Array.from({length:concurrency},()=>worker()));
const durationMs=performance.now()-start;
function metrics(rows){
 const times=rows.map(row=>row.ms).sort((a,b)=>a-b);
 const percentile=p=>times.length?Math.round(times[Math.ceil(times.length*p)-1]*100)/100:null;
 return {requests:rows.length,errors:rows.filter(row=>!row.ok).length,p50Ms:percentile(.5),p95Ms:percentile(.95),p99Ms:percentile(.99),maxMs:times.length?Math.round(times.at(-1)*100)/100:null};
}
const report={
 environment:'local server with explicitly confirmed TEST database',origin:origin.origin,startedAt,source,
 visitors,concurrency,completedVisitors,durationMs:Math.round(durationMs),requestsPerSecond:Math.round(samples.length/(durationMs/1000)*100)/100,
 ...metrics(samples),
 byPhase:Object.fromEntries(['init','view','answer','read'].map(phase=>[phase,metrics(samples.filter(row=>row.phase===phase))])),
 failures,
 limits:'Only the local server and TEST database were exercised. This does not measure Vercel CDN, serverless autoscaling, real mobile networks or production capacity. QA sessions are retained.',
};
await mkdir(new URL('../outputs/',import.meta.url),{recursive:true});
const output=new URL(`../outputs/quiz-load-${startedAt.replaceAll(':','-').replaceAll('.','-')}.json`,import.meta.url);
await writeFile(output,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
if(failures.length)process.exitCode=1;
