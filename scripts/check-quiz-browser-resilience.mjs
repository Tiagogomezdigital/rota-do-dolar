import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {setTimeout as pause} from 'node:timers/promises';
import {questions,content,PROCESS_DURATION_MS,STORY_STEP,RESULT_STEP,OFFER_STEP,DECLINED_STEP} from '../lib/content.ts';

const originUrl=new URL(process.env.QUIZ_TEST_ORIGIN||'http://localhost:5190');
assert.ok(originUrl.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(originUrl.hostname),'Browser resilience tests accept only a local HTTP server.');
assert.ok(!originUrl.username&&!originUrl.password&&originUrl.pathname==='/'&&!originUrl.search&&!originUrl.hash,'Use a local origin without credentials, path or query.');
assert.ok(process.argv.includes('--confirm-test-database')||process.env.QUIZ_TEST_DATABASE_CONFIRMED==='1','Confirm that the local server uses the TEST database with --confirm-test-database or QUIZ_TEST_DATABASE_CONFIRMED=1.');
const origin=originUrl.origin;
const endpoint=origin+'/tiago-gomes/api/journey';
const packagePath=process.env.QUIZ_PLAYWRIGHT_MODULE;
const {chromium}=await import(packagePath?pathToFileURL(path.resolve(packagePath)).href:'playwright');
const browser=await chromium.launch({headless:true,...(process.env.QUIZ_CHROME_PATH?{executablePath:process.env.QUIZ_CHROME_PATH}:{})});
const folder=path.resolve('outputs/performance/resilience');
await fs.mkdir(folder,{recursive:true});
const scenarios=[];
const pageErrors=[];
const contexts=[];
const started=performance.now();
let activePage;

function bodyOf(request){
 if(request.method()!=='POST')return null;
 try{return request.postDataJSON();}catch{return null;}
}
async function createContext(){
 const context=await browser.newContext({viewport:{width:375,height:812},deviceScaleFactor:1,reducedMotion:'reduce'});
 contexts.push(context);
 context.on('page',page=>page.on('pageerror',error=>pageErrors.push(error.message)));
 // Only local functionality is under test; the external player is deliberately unavailable.
 for(const host of ['scripts.converteai.net','cdn.converteai.net','images.converteai.net','license.vturb.com']){
  await context.route(`https://${host}/**`,route=>route.abort('blockedbyclient'));
 }
 return context;
}
async function api(context,body){
 const response=body?await context.request.post(endpoint,{data:body,headers:{Origin:origin},maxRedirects:0}):await context.request.get(endpoint,{maxRedirects:0});
 assert.ok(response.ok(),`Local QA request failed (${response.status()}).`);
 const result=await response.json();
 assert.ok(Number.isSafeInteger(result.revision),'The acknowledged server revision must be available.');
 return result;
}
async function snapshot(context){return api(context);}
async function heading(page,index){await page.getByRole('heading',{name:questions[index].title,exact:true}).waitFor();}
async function open(page){
 activePage=page;
 await page.goto(origin+'/?utm_source=qa-browser-resilience',{waitUntil:'domcontentloaded'});
}
async function begin(page){
 await open(page);
 const button=page.getByRole('button',{name:content.hero.cta,exact:true});
 await button.waitFor();
 await button.click();
 await heading(page,0);
}
async function checked(radio){
 return radio.evaluate(element=>element.checked===true||element.getAttribute('aria-checked')==='true'||element.getAttribute('data-state')==='checked');
}
async function assertSelected(radio,message){
 const state=await radio.evaluate(element=>({native:'checked'in element?element.checked:null,aria:element.getAttribute('aria-checked'),data:element.getAttribute('data-state')}));
 if(state.native!==null)assert.equal(state.native,true,`${message}: native checked state (${JSON.stringify(state)})`);
 if(state.aria!==null)assert.equal(state.aria,'true',`${message}: ARIA checked state`);
 if(state.data!==null)assert.equal(state.data,'checked',`${message}: visual data-state`);
 assert.equal(await checked(radio),true,message);
}
function passed(name,extra={}){scenarios.push({name,result:'PASS',...extra});}

try{
 const context=await createContext();
 const page=await context.newPage();
 let failInit=true;
 let failAnswer=false;
 let delayAnswer=false;
 let holdAnswer=false;
 let heldRoute;
 let initRequests=0;
 let answerRequests=0;
 await page.route('**/tiago-gomes/api/journey',async route=>{
  const body=bodyOf(route.request());
  if(body?.action==='init'){
   initRequests++;
   if(failInit){failInit=false;await route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'Não foi possível recuperar seu progresso. Tente novamente.'})});return;}
  }
  if(body?.action==='answer'){
   answerRequests++;
   assert.ok(Number.isSafeInteger(body.expectedRevision),'Browser writes must carry the latest acknowledged revision.');
   if(failAnswer){failAnswer=false;await pause(600);await route.abort('internetdisconnected');return;}
   if(holdAnswer){heldRoute=route;return;}
   if(delayAnswer)await pause(300);
  }
  await route.continue();
 });

 await open(page);
 const retry=page.getByRole('button',{name:'Tentar novamente',exact:true});
 await retry.waitFor();
 assert.equal(await page.locator('.opening-cta .cta').isEnabled(),false);
 await retry.click();
 await page.getByRole('button',{name:content.hero.cta,exact:true}).waitFor();
 assert.equal(initRequests,2,'Initialization is retried only after the visitor requests it.');
 assert.equal((await snapshot(context)).step,0);
 passed('503 during initialization, explicit retry and unlocked opening CTA');

 await page.getByRole('button',{name:content.hero.cta,exact:true}).click();
 await heading(page,0);
 failAnswer=true;
 await page.getByRole('radio').first().click();
 assert.equal(await page.locator('.quiz-content').getAttribute('aria-busy'),'true');
 await assertSelected(page.getByRole('radio').first(),'A direct click on the radio must stay selected while saving');
 await page.getByRole('alert').filter({hasText:'Verifique sua conexão'}).waitFor();
 await heading(page,0);
 await assertSelected(page.getByRole('radio').first(),'A failed direct radio click must keep the selected choice');
 assert.equal(await page.getByRole('button',{name:'Continuar',exact:true}).isEnabled(),true);
 let stored=await snapshot(context);
 assert.equal(stored.step,1);
 assert.equal(stored.answers.compromisso,undefined,'An aborted request must not look committed.');
 await page.getByRole('button',{name:'Continuar',exact:true}).click();
 await heading(page,1);
 assert.equal((await snapshot(context)).answers.compromisso,'sim');
 passed('Direct radio click stays checked during saving and after network loss; retry succeeds without false advancement');

 const beforeDoubleClick=answerRequests;
 delayAnswer=true;
 await page.locator('label.answer').first().dblclick({delay:30});
 await heading(page,2);
 delayAnswer=false;
 assert.equal(answerRequests-beforeDoubleClick,1,'A double click must send one answer mutation.');
 assert.equal((await snapshot(context)).answers.genero,questions[1].options[0].id);
 passed('Rapid double click sends exactly one mutation');

 const beforeKeyboard=answerRequests;
 await page.getByRole('heading',{name:questions[2].title,exact:true}).focus();
 await page.keyboard.press('Tab');
 assert.equal(await page.getByRole('radio').first().evaluate(element=>document.activeElement===element),true);
 await page.keyboard.press('ArrowDown');
 await page.keyboard.press('Space');
 await assertSelected(page.getByRole('radio').nth(1),'Keyboard selection must stay synchronized');
 assert.equal(answerRequests,beforeKeyboard,'Space and arrow keys must only select, without submitting.');
 await heading(page,2);
 const keyboardContinue=page.getByRole('button',{name:'Continuar',exact:true});
 assert.equal(await keyboardContinue.isEnabled(),true);
 await page.keyboard.press('Tab');
 assert.equal(await keyboardContinue.evaluate(element=>document.activeElement===element),true);
 await page.keyboard.press('Enter');
 await heading(page,3);
 assert.equal((await snapshot(context)).answers.idade,questions[2].options[1].id);
 passed('Keyboard Tab, ArrowDown, Space and Continue preserve explicit answer submission');

 holdAnswer=true;
 const timeoutStarted=performance.now();
 const beforeTimeout=answerRequests;
 await page.locator('label.answer').first().click();
 await assertSelected(page.getByRole('radio').first(),'A label click must stay selected while its request is pending');
 await page.getByRole('alert').filter({hasText:'A conexão demorou mais'}).waitFor({timeout:30_000});
 const timeoutMs=performance.now()-timeoutStarted;
 assert.ok(timeoutMs>=19_000&&timeoutMs<30_000,`Expected the real 20-second request timeout, observed ${Math.round(timeoutMs)} ms.`);
 assert.equal(answerRequests-beforeTimeout,1,'A timed-out mutation must not retry itself.');
 await heading(page,3);
 await assertSelected(page.getByRole('radio').first(),'A label click must stay selected after timeout');
 assert.equal(await page.getByRole('button',{name:'Continuar',exact:true}).isEnabled(),true,'Timeout must release the submission lock.');
 stored=await snapshot(context);
 assert.equal(stored.step,4);
 assert.equal(stored.answers.momento,undefined);
 holdAnswer=false;
 await heldRoute?.abort().catch(()=>{});
 await page.getByRole('button',{name:'Continuar',exact:true}).click();
 await heading(page,4);
 passed('Real 20-second timeout releases the lock without committing or retrying', {timeoutMs:Math.round(timeoutMs)});

 await page.reload({waitUntil:'domcontentloaded'});
 await heading(page,4);
 stored=await snapshot(context);
 assert.equal(stored.step,5);
 assert.equal(stored.answers.momento,questions[3].options[0].id);
 passed('Reload restores saved progress and prior answers');

 const secondTab=await context.newPage();
 await open(secondTab);
 await heading(secondTab,4);
 const staleRevision=(await snapshot(context)).revision;
 await page.locator('label.answer').first().click();
 await heading(page,5);
 stored=await snapshot(context);
 const revisited=await api(context,{action:'view',step:5,expectedStep:stored.step,expectedRevision:stored.revision});
 await page.reload({waitUntil:'domcontentloaded'});
 await heading(page,4);
 const conflictResponse=secondTab.waitForResponse(response=>response.url()===endpoint&&bodyOf(response.request())?.action==='answer');
 await secondTab.locator('label.answer').nth(1).click();
 const conflict=await conflictResponse;
 assert.equal(conflict.status(),409);
 assert.equal(bodyOf(conflict.request()).expectedRevision,staleRevision);
 await secondTab.getByRole('alert').filter({hasText:'outra aba'}).waitFor();
 await heading(secondTab,4);
 stored=await snapshot(context);
 assert.equal(stored.step,5);
 assert.equal(stored.revision,revisited.revision);
 assert.equal(stored.answers.experiencia,questions[4].options[0].id);
 await secondTab.locator('label.answer').nth(1).click();
 await heading(secondTab,5);
 assert.equal((await snapshot(context)).answers.experiencia,questions[4].options[1].id);
 passed('Two tabs reject an obsolete revision after revisiting the same step, then accept explicit retry');
 await secondTab.close();

 const refusedContext=await createContext();
 const refusedPage=await refusedContext.newPage();
 await begin(refusedPage);
 await refusedPage.locator('label.answer').nth(1).click();
 await refusedPage.getByRole('heading',{name:/Você decide quando/}).waitFor();
 assert.equal((await snapshot(refusedContext)).step,DECLINED_STEP);
 await refusedPage.reload({waitUntil:'domcontentloaded'});
 await refusedPage.getByRole('heading',{name:/Você decide quando/}).waitFor();
 assert.equal(await refusedPage.getByRole('button',{name:'Continuar',exact:true}).count(),0);
 const resumedRefusal=await refusedContext.newPage();
 await open(resumedRefusal);
 await resumedRefusal.getByRole('heading',{name:/Você decide quando/}).waitFor();
 assert.equal((await snapshot(refusedContext)).answers.compromisso,'nao');
 assert.equal((await snapshot(context)).answers.compromisso,'sim','Independent contexts must not share answers.');
 passed('Refusal persists across reload/new tab and remains isolated from other visitors');

 const checkoutContext=await createContext();
 let state=await api(checkoutContext,{action:'init',source:'qa-browser-checkout',device:'mobile'});
 state=await api(checkoutContext,{action:'view',step:1,expectedStep:state.step,expectedRevision:state.revision});
 for(const question of questions){
  state=await api(checkoutContext,{action:'answer',questionId:question.id,optionId:question.options[0].id,expectedStep:state.step,expectedRevision:state.revision});
 }
 await pause(PROCESS_DURATION_MS+100);
 for(const step of [STORY_STEP,RESULT_STEP,OFFER_STEP]){
  state=await api(checkoutContext,{action:'view',step,expectedStep:state.step,expectedRevision:state.revision});
 }
 const checkoutPage=await checkoutContext.newPage();
 let checkoutRequests=0;
 let outgoingCheckout='';
 await checkoutPage.route('**/tiago-gomes/api/journey',async route=>{
  const body=bodyOf(route.request());
  if(body?.action==='cta'){
   checkoutRequests++;
   if(checkoutRequests===1){await route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'Não conseguimos salvar agora. Tente novamente.'})});return;}
  }
  await route.continue();
 });
 await checkoutPage.route('https://pay.kiwify.com.br/**',async route=>{
  outgoingCheckout=route.request().url();
  await route.fulfill({status:200,contentType:'text/html',body:'Checkout intercepted by local QA; no purchase was performed.'});
 });
 await open(checkoutPage);
 const checkoutButton=checkoutPage.getByRole('button',{name:content.offer.cta,exact:true});
 await checkoutButton.waitFor();
 await checkoutButton.click();
 await checkoutPage.getByRole('alert').filter({hasText:'Não conseguimos salvar agora'}).waitFor();
 assert.equal(new URL(checkoutPage.url()).origin,origin);
 assert.equal(outgoingCheckout,'','A failed click record must never report a successful redirect.');
 assert.equal((await snapshot(checkoutContext)).ctaClicked,false);
 assert.equal(await checkoutButton.isEnabled(),true);
 await checkoutButton.click();
 await checkoutPage.waitForURL('https://pay.kiwify.com.br/**');
 assert.equal(outgoingCheckout,content.offer.checkoutUrl);
 assert.equal((await snapshot(checkoutContext)).ctaClicked,true);
 assert.equal(checkoutRequests,2);
 passed('Checkout remains available with blocked video; a failed record prevents redirect and retry preserves the exact destination', {checkoutUrl:outgoingCheckout});

 assert.deepEqual(pageErrors,[],'Uncaught browser/hydration errors are not acceptable.');
 const report={result:'PASS',environment:'local server with explicitly confirmed TEST database',durationMs:Math.round(performance.now()-started),scenarios,pageErrors};
 await fs.writeFile(path.join(folder,'results.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify(report,null,2));
}catch(error){
 await activePage?.screenshot({path:path.join(folder,'failure.png'),fullPage:true}).catch(()=>{});
 await fs.writeFile(path.join(folder,'results.json'),JSON.stringify({result:'FAIL',scenarios,pageErrors,error:error.message},null,2)+'\n');
 throw error;
}finally{
 for(const context of contexts)await context.close().catch(()=>{});
 await browser.close();
}
