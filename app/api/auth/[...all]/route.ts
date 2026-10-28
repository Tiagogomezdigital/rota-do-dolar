import {getAuth,isVercelAuthConfigured,isVercelAuthRuntime} from '@/lib/auth';

export const dynamic='force-dynamic';
const privateHeaders={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'};

async function handle(request:Request){
  if(!isVercelAuthRuntime())return Response.json({error:'Não encontrado.'},{status:404,headers:privateHeaders});
  if(!isVercelAuthConfigured())return Response.json({error:'A entrada administrativa está temporariamente indisponível.'},{status:503,headers:privateHeaders});
  try{
    const auth=await getAuth();
    const response=await auth.handler(request);
    const headers=new Headers(response.headers);
    headers.set('Cache-Control','private, no-store');
    headers.set('X-Content-Type-Options','nosniff');
    return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
  }catch{
    console.error('administrative authentication request failed');
    return Response.json({error:'Não foi possível entrar agora. Tente novamente.'},{status:503,headers:privateHeaders});
  }
}

export const GET=handle;
export const POST=handle;
