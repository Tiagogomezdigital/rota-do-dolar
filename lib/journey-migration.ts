const forwardOrigin='https://rota-do-dolar-beige.vercel.app';
const journeyPaths=new Set(['/api/journey','/tiago-gomes/api/journey']);
const migrationHop='x-quiz-migration-hop';
const responseHeaders={'Cache-Control':'no-store','Pragma':'no-cache','X-Content-Type-Options':'nosniff'};
const allowedOrigins=new Set([
  'https://rotadodolar.com.br',
  'https://www.rotadodolar.com.br',
  'https://jornada-quiz-doug.dougfrr1.chatgpt.site',
  'https://4yousite.com.br',
  'https://www.4yousite.com.br',
]);

export type JourneyMigrationSettings={
  isSitesRuntime:boolean;
  forwardOrigin?:unknown;
  writePaused?:unknown;
  fetcher?:(input:string,init:RequestInit)=>Promise<Response>;
  timeoutMs?:number;
};

export function isJourneyOriginAllowed(req:Request):boolean {
  const origin=req.headers.get('origin');
  return !!origin&&(origin===new URL(req.url).origin||allowedOrigins.has(origin));
}

function temporaryFailure(method:string):Response {
  return Response.json({error:method==='POST'
    ?'Não conseguimos salvar agora. Sua escolha está mantida; tente novamente.'
    :'Não foi possível recuperar seu progresso. Tente novamente.'},
  {status:503,headers:{...responseHeaders,'Retry-After':'15'}});
}

function validForwardOrigin(value:unknown):boolean {
  if(typeof value!=='string'||value!==value.trim())return false;
  try{
    // The origin is configuration, never a client-supplied URL or an arbitrary proxy target.
    const parsed=new URL(value);
    return parsed.origin===forwardOrigin&&!parsed.username&&!parsed.password&&parsed.href===`${forwardOrigin}/`;
  }catch{return false;}
}

/** Temporary Sites-only bridge. A null result means the existing local handler should run. */
export async function journeyMigrationResponse(req:Request,settings:JourneyMigrationSettings,rawBody?:string):Promise<Response|null> {
  // Vercel must always own its database writes, even if legacy flags or a hop header reach it.
  if(!settings.isSitesRuntime)return null;
  const source=new URL(req.url);
  if(!journeyPaths.has(source.pathname)||(req.method!=='GET'&&req.method!=='POST'))return null;
  const configured=settings.forwardOrigin!==undefined&&settings.forwardOrigin!==null&&settings.forwardOrigin!=='';
  if(!configured)return req.method==='POST'&&settings.writePaused==='1'?temporaryFailure(req.method):null;

  // Never fall back to the old database after forwarding has been enabled.
  if(!validForwardOrigin(settings.forwardOrigin)||source.hostname===new URL(forwardOrigin).hostname||req.headers.has(migrationHop))return temporaryFailure(req.method);
  if(req.method==='POST'&&(rawBody===undefined||new TextEncoder().encode(rawBody).byteLength>2048)){
    return Response.json({error:'Requisição muito grande.'},{status:413,headers:responseHeaders});
  }
  const forwardedHeaders=new Headers({[migrationHop]:'1'});
  for(const name of ['cookie','origin','content-type']){
    const value=req.headers.get(name);if(value!==null)forwardedHeaders.set(name,value);
  }
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),settings.timeoutMs??10_000);
  try{
    const send=settings.fetcher??fetch;
    const upstream=await send(`${forwardOrigin}/api/journey`,{
      method:req.method,headers:forwardedHeaders,
      ...(req.method==='POST'?{body:rawBody}:{}),
      redirect:'manual',cache:'no-store',signal:controller.signal,
    });
    // Redirects could return to the old host or expose cookies to another target.
    if(upstream.status<200||(upstream.status>=300&&upstream.status<400))return temporaryFailure(req.method);
    const body=await upstream.arrayBuffer();
    // Cloning Headers retains separate Set-Cookie fields in both Workers and Node.
    const headers=new Headers(upstream.headers);
    for(const name of Array.from(headers.keys()))if(!['content-type','set-cookie','retry-after'].includes(name.toLowerCase()))headers.delete(name);
    for(const [name,value] of Object.entries(responseHeaders))headers.set(name,value);
    return new Response(upstream.status===204||upstream.status===205?null:body,{status:upstream.status,headers});
  }catch{return temporaryFailure(req.method);}
  finally{clearTimeout(timeout);}
}
