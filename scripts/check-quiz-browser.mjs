import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {questions,content} from '../lib/content.ts';

const origin=process.env.QUIZ_TEST_ORIGIN||'http://localhost:5190';
const localUrl=new URL(origin);
assert.ok(localUrl.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(localUrl.hostname)&&!localUrl.username&&!localUrl.password&&localUrl.pathname==='/'&&!localUrl.search&&!localUrl.hash,'Browser tests require a local HTTP origin with the TEST database.');
assert.ok(process.argv.includes('--confirm-test-database')||process.env.QUIZ_TEST_DATABASE_CONFIRMED==='1','Confirm the TEST database with --confirm-test-database.');
const phase=process.argv[2]||'after';
assert.match(phase,/^[a-z0-9][a-z0-9-]{0,63}$/,'Use a safe report phase name.');
const packagePath=process.env.QUIZ_PLAYWRIGHT_MODULE;
const {chromium}=await import(packagePath?pathToFileURL(path.resolve(packagePath)).href:'playwright');
const browser=await chromium.launch({headless:true,...(process.env.QUIZ_CHROME_PATH?{executablePath:process.env.QUIZ_CHROME_PATH}:{})});
const folder=path.resolve('outputs/performance',phase,'browser');
await fs.mkdir(folder,{recursive:true});
const widths=[320,375,390,412,430,768,1280];
const measurements=[],transitions=[],errors=[];
const context=await browser.newContext({viewport:{width:375,height:812},deviceScaleFactor:1,reducedMotion:'reduce'});
const page=await context.newPage();
page.on('pageerror',e=>errors.push(e.message));
let checkoutUrl='';
await page.route('https://pay.kiwify.com.br/**',async route=>{checkoutUrl=route.request().url();await route.fulfill({status:200,contentType:'text/html',body:'Checkout destination verified by local test.'});});
async function capture(step){
 for(const width of widths){
  await page.setViewportSize({width,height:width>=768?900:812});
  await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].filter(i=>i.loading!=='lazy').map(i=>i.decode().catch(()=>{})));window.scrollTo(0,0);});
  const layout=await page.evaluate(()=>({viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth,h1:document.querySelector('h1')?.innerText,headingHeight:document.querySelector('h1')?.getBoundingClientRect().height,cta:[...document.querySelectorAll('.opening-cta .cta,.result-cta .cta')].map(el=>{const r=el.getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,height:r.height,viewportHeight:innerHeight};})}));
  assert.ok(layout.scrollWidth<=width+1,`Horizontal overflow at step ${step}, width ${width}`);
  for(const cta of layout.cta)assert.ok(cta.top>=0&&cta.bottom<=cta.viewportHeight+1&&cta.left>=0&&cta.right<=width+1,`Fixed CTA clipped at step ${step}, width ${width}`);
  measurements.push({step,width,...layout});
  await page.screenshot({path:path.join(folder,`step-${String(step).padStart(2,'0')}-${width}.png`),fullPage:true,animations:'disabled'});
 }
 await page.setViewportSize({width:375,height:812});
}
async function advance(click,heading,label){
 const started=performance.now();
 await click();await heading.waitFor();
 transitions.push({label,ms:performance.now()-started});
}
try{
 await page.goto(origin+'/?utm_source=qa-browser-performance',{waitUntil:'networkidle'});
 await page.getByRole('button',{name:content.hero.cta,exact:true}).waitFor();
 await capture(0);
 await advance(()=>page.getByRole('button',{name:content.hero.cta,exact:true}).click(),page.getByRole('heading',{name:questions[0].title,exact:true}),'opening');
 for(const [index,question] of questions.entries()){
  await page.getByRole('heading',{name:question.title,exact:true}).waitFor();
  assert.equal(await page.getByRole('radio').count(),question.options.length);
  await capture(index+1);
  if(index===3){
   await page.reload({waitUntil:'networkidle'});
   await page.getByRole('heading',{name:question.title,exact:true}).waitFor();
  }
  const target=index===questions.length-1?page.getByRole('heading',{name:'Seu próximo passo começa aqui.'}):page.getByRole('heading',{name:questions[index+1].title,exact:true});
  await advance(()=>page.locator('label.answer').first().click(),target,question.id);
 }
 await page.getByRole('heading',{name:content.expert.title,exact:true}).waitFor({timeout:20000});
 await capture(14);
 await advance(()=>page.getByRole('button',{name:content.expert.cta,exact:true}).click(),page.getByRole('heading',{name:'A SUA JORNADA NOS PRÓXIMOS 30 DIAS'}),'story');
 await capture(15);
 // Block only the external player to verify that its failure cannot disable checkout.
 await page.route('**/players/**/player.js',route=>route.abort());
 await advance(()=>page.getByRole('button',{name:content.result.cta,exact:true}).click(),page.getByRole('button',{name:content.offer.cta,exact:true}),'result');
 await capture(16);
 await page.getByRole('button',{name:content.offer.cta,exact:true}).click();
 await page.waitForURL('https://pay.kiwify.com.br/**');
 assert.equal(checkoutUrl,content.offer.checkoutUrl);
 assert.deepEqual(errors,[],'No uncaught browser or hydration errors allowed.');
 await fs.writeFile(path.join(folder,'results.json'),JSON.stringify({measurements,transitions,errors,checkoutUrl},null,2));
 console.log(JSON.stringify({result:'PASS',phase,visualChecks:measurements.length,questions:questions.length,transitions,checkoutUrl,errors}));
}finally{await browser.close();}
