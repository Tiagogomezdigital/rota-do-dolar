import assert from 'node:assert/strict';
import {isJourneyOriginAllowed,journeyMigrationResponse} from '../lib/journey-migration.ts';

const target='https://rota-do-dolar-beige.vercel.app';
const source='https://rotadodolar.com.br';
const raw='{"action":"init","source":"migration-check"}';
const request=(path='/api/journey',method='POST',extra={})=>new Request(`${source}${path}`,{
  method,headers:{origin:source,'content-type':'application/json',...extra},
});
const noFetch=async()=>{throw new Error('Unexpected fetch');};
const sites={isSitesRuntime:true,fetcher:noFetch};

// Origins are exact strings, including the current request origin for local and preview use.
for(const origin of [source,'https://www.rotadodolar.com.br','https://jornada-quiz-doug.dougfrr1.chatgpt.site','https://4yousite.com.br','https://www.4yousite.com.br']){
  assert.equal(isJourneyOriginAllowed(request('/api/journey','POST',{origin})),true,origin);
}
for(const origin of ['https://evil.rotadodolar.com.br','https://rotadodolar.com.br.evil.example','https://rotadodolar.com.br/','http://rotadodolar.com.br','null']){
  assert.equal(isJourneyOriginAllowed(request('/api/journey','POST',{origin})),false,origin);
}
assert.equal(isJourneyOriginAllowed(new Request(`${source}/api/journey`)),false);
assert.equal(isJourneyOriginAllowed(new Request('http://localhost:5173/api/journey',{headers:{origin:'http://localhost:5173'}})),true);

// A bad destination must fail closed, not resume writes in the old database.
let calls=0;
const recordNoFetch=async()=>{calls++;throw new Error('Must not fetch');};
for(const forwardOrigin of ['http://rota-do-dolar-beige.vercel.app','https://evil.example','https://rota-do-dolar-beige.vercel.app.evil.example',`${target}:444`,`${target}/admin`,`${target}?x=1`,`${target}#x`,`${target}?`,`${target}#`,'https://user:password@rota-do-dolar-beige.vercel.app',` ${target}`,true]){
  const result=await journeyMigrationResponse(request(),{...sites,forwardOrigin,fetcher:recordNoFetch},raw);
  assert.equal(result.status,503,String(forwardOrigin));
  assert.equal(result.headers.get('cache-control'),'no-store');
}
assert.equal(calls,0);

// Forwarding keeps the session and origin, drops unrelated headers, and relays cookies/status/body.
const returnedHeaders=new Headers({'content-type':'application/json','cache-control':'public,max-age=999','location':'https://evil.example','x-private-upstream':'remove'});
returnedHeaders.append('set-cookie','journey_session=original-session; Path=/; HttpOnly; Secure; SameSite=Lax');
returnedHeaders.append('set-cookie','second_cookie=2; Path=/; HttpOnly');
let forwarded;
const forwarder=async(url,init)=>{
  calls++;forwarded={url,init};
  return new Response('{"step":0}',{status:201,headers:returnedHeaders});
};
const response=await journeyMigrationResponse(request('/tiago-gomes/api/journey','POST',{
  cookie:'journey_session=original-session; other=kept',authorization:'must-not-forward','x-irrelevant':'remove',
}),{...sites,forwardOrigin:target,writePaused:'1',fetcher:forwarder},raw);
assert.equal(forwarded.url,`${target}/api/journey`);
assert.equal(forwarded.init.method,'POST');
assert.equal(forwarded.init.body,raw);
assert.equal(forwarded.init.redirect,'manual');
assert.equal(forwarded.init.cache,'no-store');
assert.equal(forwarded.init.headers.get('cookie'),'journey_session=original-session; other=kept');
assert.equal(forwarded.init.headers.get('origin'),source);
assert.equal(forwarded.init.headers.get('content-type'),'application/json');
assert.equal(forwarded.init.headers.get('x-quiz-migration-hop'),'1');
assert.equal(forwarded.init.headers.has('authorization'),false);
assert.equal(forwarded.init.headers.has('x-irrelevant'),false);
assert.equal(response.status,201);
assert.equal(await response.text(),'{"step":0}');
assert.deepEqual(response.headers.getSetCookie(),returnedHeaders.getSetCookie());
assert.equal(response.headers.get('cache-control'),'no-store');
assert.equal(response.headers.get('pragma'),'no-cache');
assert.equal(response.headers.get('x-content-type-options'),'nosniff');
assert.equal(response.headers.has('location'),false);
assert.equal(response.headers.has('x-private-upstream'),false);

// GET targets a fixed endpoint too, with cookies but no body or arbitrary source query.
await journeyMigrationResponse(request('/api/journey?ignored=1','GET',{cookie:'journey_session=original-session'}),{
  ...sites,forwardOrigin:`${target}/`,fetcher:async(url,init)=>{
    assert.equal(url,`${target}/api/journey`);assert.equal(init.method,'GET');assert.equal('body' in init,false);
    assert.equal(init.headers.get('cookie'),'journey_session=original-session');
    return new Response(null,{status:204});
  },
});

// Bytes, not UTF-16 code units, cap forwarding before fetch is called.
const beforeOversized=calls;
const oversized=await journeyMigrationResponse(request(),{...sites,forwardOrigin:target,fetcher:recordNoFetch},'á'.repeat(1025));
assert.equal(oversized.status,413);assert.equal(calls,beforeOversized);

// During the export pause, reads work locally, writes retry, and forwarding has priority.
const paused=await journeyMigrationResponse(request(),{...sites,writePaused:'1'},raw);
assert.equal(paused.status,503);assert.equal(paused.headers.get('retry-after'),'15');
assert.equal((await paused.json()).error,'Não conseguimos salvar agora. Sua escolha está mantida; tente novamente.');
assert.equal(await journeyMigrationResponse(request('/api/journey','GET'),{...sites,writePaused:'1'}),null);
assert.equal(await journeyMigrationResponse(request(),sites,raw),null);

// Vercel ignores all legacy flags. Admin and unknown paths never enter the bridge.
assert.equal(await journeyMigrationResponse(request('/api/journey','POST',{'x-quiz-migration-hop':'1'}),{
  isSitesRuntime:false,forwardOrigin:'https://evil.example',writePaused:'1',fetcher:recordNoFetch,
},raw),null);
for(const path of ['/api/admin','/api/admin/journey','/tiago-gomes/admin','/api/journey/other']){
  assert.equal(await journeyMigrationResponse(request(path),{...sites,forwardOrigin:target,writePaused:'1',fetcher:recordNoFetch},raw),null,path);
}

// An accidental proxy hop/loop or redirect must fail without returning to old writes.
const beforeLoops=calls;
const loopRequests=[request('/api/journey','POST',{'x-quiz-migration-hop':'1'}),new Request(`${target}/api/journey`,{method:'POST'})];
for(const req of loopRequests)assert.equal((await journeyMigrationResponse(req,{...sites,forwardOrigin:target,fetcher:recordNoFetch},raw)).status,503);
assert.equal(calls,beforeLoops);
const redirected=await journeyMigrationResponse(request(),{
  ...sites,forwardOrigin:target,fetcher:async()=>new Response(null,{status:307,headers:{location:`${source}/api/journey`}}),
},raw);
assert.equal(redirected.status,503);assert.equal(redirected.headers.has('location'),false);

// A stalled request aborts and responds with the existing recoverable error.
let aborted=false;
const timedOut=await journeyMigrationResponse(request(),{
  ...sites,forwardOrigin:target,timeoutMs:5,fetcher:(_url,init)=>new Promise((_resolve,reject)=>{
    init.signal.addEventListener('abort',()=>{aborted=true;reject(new Error('aborted'));},{once:true});
  }),
},raw);
assert.equal(aborted,true);assert.equal(timedOut.status,503);
const failed=await journeyMigrationResponse(request('/api/journey','GET'),{...sites,forwardOrigin:target});
assert.equal(failed.status,503);assert.equal((await failed.json()).error,'Não foi possível recuperar seu progresso. Tente novamente.');

console.log('PASS: exact origins/destination, session cookies, fixed forwarding, byte limit, pause precedence, Vercel isolation, admin isolation, loops, redirects and timeout. No network or database used.');
