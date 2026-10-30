import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {questions,content} from '../lib/content-daniel.ts';

const origin=process.env.QUIZ_TEST_ORIGIN||'http://localhost:5173';
const local=new URL(origin);
assert.ok(local.protocol==='http:'&&['localhost','127.0.0.1'].includes(local.hostname)&&local.pathname==='/'&&!local.search&&!local.hash,'Only a local TEST origin is allowed.');
assert.ok(process.argv.includes('--confirm-test-database'),'Confirm the TEST database.');
const {chromium}=await import(process.env.QUIZ_PLAYWRIGHT_MODULE?pathToFileURL(path.resolve(process.env.QUIZ_PLAYWRIGHT_MODULE)).href:'playwright');
const browser=await chromium.launch({headless:true,...(process.env.QUIZ_CHROME_PATH?{executablePath:process.env.QUIZ_CHROME_PATH}:{})});
const folder=path.resolve('outputs/daniel/browser');
await fs.mkdir(folder,{recursive:true});
const errors=[],checks=[];
try{
  const context=await browser.newContext({viewport:{width:375,height:812},deviceScaleFactor:1,reducedMotion:'reduce'});
  context.on('page',page=>page.on('pageerror',error=>errors.push(error.message)));
  const original=await context.newPage(),daniel=await context.newPage();
  // Player availability is covered separately; this verifies that it cannot block the journey.
  await context.route('**/players/**/player.js',route=>route.abort());
  let checkout='';
  await context.route('https://pay.kiwify.com.br/**',route=>{checkout=route.request().url();return route.fulfill({status:200,contentType:'text/html',body:'Local checkout destination check.'});});
  await original.goto(origin+'/?utm_source=qa-variants-browser-original');
  await daniel.goto(origin+'/daniel?utm_source=qa-variants-browser-daniel');
  for(const page of [original,daniel])await page.getByRole('button',{name:content.hero.cta,exact:true}).waitFor();
  async function layout(page,step){
    await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].filter(image=>image.loading!=='lazy').map(image=>image.decode().catch(()=>{})));window.scrollTo(0,0);});
    const dimensions=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,cta:[...document.querySelectorAll('.opening-cta .cta,.result-cta .cta')].map(element=>{const box=element.getBoundingClientRect();return {top:box.top,bottom:box.bottom,left:box.left,right:box.right,height:innerHeight};})}));
    assert.ok(dimensions.scroll<=dimensions.width+1,`${step}: horizontal overflow`);
    for(const box of dimensions.cta)assert.ok(box.top>=0&&box.bottom<=box.height+1&&box.left>=0&&box.right<=dimensions.width+1,`${step}: clipped fixed CTA`);
    checks.push({step,width:dimensions.width});
    return page.screenshot({fullPage:true,animations:'disabled'});
  }
  for(const width of [320,375,430,1280]){
    await original.setViewportSize({width,height:812});await daniel.setViewportSize({width,height:812});
    const before=await layout(original,'original-opening'),copy=await layout(daniel,'daniel-opening');
    assert.ok(before.equals(copy),`The initial copy must match the original pixels at ${width}px.`);
    await fs.writeFile(path.join(folder,`opening-${width}.png`),copy);
  }
  await original.setViewportSize({width:375,height:812});await daniel.setViewportSize({width:375,height:812});
  await original.getByRole('button',{name:content.hero.cta,exact:true}).click();
  await original.getByRole('heading',{name:questions[0].title,exact:true}).waitFor();
  await original.locator('label.answer').first().click();
  await original.getByRole('heading',{name:questions[1].title,exact:true}).waitFor();
  await daniel.getByRole('button',{name:content.hero.cta,exact:true}).click();
  for(const [index,question] of questions.entries()){
    await daniel.getByRole('heading',{name:question.title,exact:true}).waitFor();
    assert.equal(await daniel.getByRole('radio').count(),question.options.length);
    await layout(daniel,`question-${index+1}`);
    if(index===4){await daniel.reload();await daniel.getByRole('heading',{name:question.title,exact:true}).waitFor();}
    await daniel.locator('label.answer').first().click();
  }
  await daniel.getByRole('heading',{name:content.expert.title,exact:true}).waitFor({timeout:20000});
  await daniel.getByRole('button',{name:content.expert.cta,exact:true}).click();
  await daniel.getByRole('button',{name:content.result.cta,exact:true}).waitFor();
  for(const width of [320,375,1280]){await daniel.setViewportSize({width,height:812});await fs.writeFile(path.join(folder,`result-${width}.png`),await layout(daniel,'result'));}
  await daniel.getByRole('button',{name:content.result.cta,exact:true}).click();
  await daniel.getByRole('button',{name:content.offer.cta,exact:true}).waitFor();
  await daniel.reload();
  await daniel.getByRole('button',{name:content.offer.cta,exact:true}).waitFor();
  await original.reload();
  await original.getByRole('heading',{name:questions[1].title,exact:true}).waitFor();
  const cookies=await context.cookies();
  assert.equal(cookies.find(cookie=>cookie.name==='journey_session').path,'/');
  assert.equal(cookies.find(cookie=>cookie.name==='journey_session_daniel').path,'/daniel');
  const images=await daniel.evaluate(()=>[...document.images].map(image=>image.currentSrc));
  assert.ok(images.every(src=>!src.includes('/tiago-gomes/images/')),'Daniel must reference its own image copies.');
  await daniel.getByRole('button',{name:content.offer.cta,exact:true}).click();
  await daniel.waitForURL('https://pay.kiwify.com.br/**');
  assert.equal(checkout,content.offer.checkoutUrl);
  assert.equal((await context.request.get(origin+'/daniel/obrigado')).status(),404);
  assert.deepEqual(errors,[]);
  await fs.writeFile(path.join(folder,'results.json'),JSON.stringify({result:'PASS',checks,errors,checkout},null,2));
  console.log(JSON.stringify({result:'PASS',pixelIdenticalWidths:[320,375,430,1280],layoutChecks:checks.length,questions:12,independentBrowserSessions:true,checkoutIntercepted:true,errors}));
}finally{await browser.close();}
