import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {setTimeout as pause} from 'node:timers/promises';
import {questions,content,PROCESS_DURATION_MS,STORY_STEP,RESULT_STEP} from '../lib/content.ts';

// Exercises the actual external embed on a local TEST session. Never opens checkout.
const origin=new URL(process.env.QUIZ_TEST_ORIGIN||'http://localhost:5190');
assert.ok(origin.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(origin.hostname)&&origin.pathname==='/'&&!origin.username&&!origin.password&&!origin.search&&!origin.hash,'Use only a local HTTP origin.');
assert.ok(process.argv.includes('--confirm-test-database'),'Confirm the local server uses QUIZ_TEST_TURSO_* with --confirm-test-database.');
const packagePath=process.env.QUIZ_PLAYWRIGHT_MODULE;
const {chromium}=await import(packagePath?pathToFileURL(path.resolve(packagePath)).href:'playwright');
const browser=await chromium.launch({headless:true,...(process.env.QUIZ_CHROME_PATH?{executablePath:process.env.QUIZ_CHROME_PATH}:{})});
const context=await browser.newContext({viewport:{width:375,height:812}});
const page=await context.newPage();
const errors=[],requests=[],responses=[];
page.on('pageerror',error=>errors.push(error.message));
page.on('request',request=>{if(request.url()===content.offer.video.vturb.scriptUrl)requests.push(request.url());});
page.on('response',response=>{if(response.url()===content.offer.video.vturb.scriptUrl)responses.push(response.status());});
await context.route('https://pay.kiwify.com.br/**',route=>route.abort());
async function command(body){
 const response=await context.request.post(new URL('/tiago-gomes/api/journey',origin).href,{data:body,headers:{Origin:origin.origin},maxRedirects:0});
 assert.ok(response.ok(),`TEST API failed: ${response.status()}`);
 return response.json();
}
try{
 let state=await command({action:'init',source:'qa-player-live',device:'mobile'});
 state=await command({action:'view',step:1,expectedStep:state.step,expectedRevision:state.revision});
 for(const question of questions)state=await command({action:'answer',questionId:question.id,optionId:question.options[0].id,expectedStep:state.step,expectedRevision:state.revision});
 await pause(PROCESS_DURATION_MS+150);
 state=await command({action:'view',step:STORY_STEP,expectedStep:state.step,expectedRevision:state.revision});
 await command({action:'view',step:RESULT_STEP,expectedStep:state.step,expectedRevision:state.revision});
 await page.goto(origin.href,{waitUntil:'domcontentloaded'});
 await page.getByRole('button',{name:content.result.cta,exact:true}).click();
 await page.locator('vturb-smartplayer').waitFor();
 await page.waitForFunction(()=>!!customElements.get('vturb-smartplayer'),{},{timeout:40000});
 await page.locator('video').first().waitFor({state:'attached',timeout:40000});
 const inspect=()=>page.locator('video').first().evaluate(video=>({readyState:video.readyState,networkState:video.networkState,width:video.getBoundingClientRect().width,height:video.getBoundingClientRect().height,hasSource:!!video.currentSrc}));
 const initial=await inspect();
 const playerBounds=await page.locator('vturb-smartplayer').boundingBox();
 assert.ok(playerBounds&&playerBounds.width>250&&playerBounds.width<=375&&playerBounds.height>400,'The visible portrait player must occupy its reserved responsive space.');
 const checkout=page.getByRole('button',{name:content.offer.cta,exact:true});
 assert.ok(await checkout.isEnabled(),'Checkout must be enabled without a watch-time gate.');
 assert.equal(await page.locator(`script[src="${content.offer.video.vturb.scriptUrl}"]`).count(),1,'Only one embed script may execute per mounted player.');
 await page.reload({waitUntil:'domcontentloaded'});
 await page.locator('video').first().waitFor({state:'attached',timeout:40000});
 assert.ok(await checkout.isEnabled());
 assert.equal(await page.locator(`script[src="${content.offer.video.vturb.scriptUrl}"]`).count(),1);
 const reloaded=await inspect();
 const report={result:'PASS',initial,reloaded,playerBounds,embedRequests:requests.length,embedHttpStatuses:responses,pageErrors:errors,scope:'Actual VTurb custom element and video mounted, checkout enabled, reload mounted again; no playback completion or purchase attempted.'};
 await mkdir('outputs/performance/player',{recursive:true});
 await page.screenshot({path:'outputs/performance/player/offer-375.png',fullPage:true});
 await writeFile('outputs/performance/player/results.json',JSON.stringify(report,null,2)+'\n');
 assert.deepEqual(errors,[],'Unexpected browser errors in live embed.');
 console.log(JSON.stringify(report));
}finally{await context.close();await browser.close();}
