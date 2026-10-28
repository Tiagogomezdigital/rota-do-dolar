import {getAuth,isVercelAuthRuntime,safeAdminReturnPath} from '@/lib/auth';

export const dynamic='force-dynamic';
const privateHeaders={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'};

async function signOut(request:Request){
  const url=new URL(request.url),origin=request.headers.get('origin');
  if(request.headers.get('sec-fetch-site')==='cross-site'||(origin&&origin!==url.origin)){
    return Response.json({error:'Origem não permitida.'},{status:403,headers:privateHeaders});
  }
  if(!isVercelAuthRuntime()){
    const target=`/signout-with-chatgpt?return_to=${encodeURIComponent(safeAdminReturnPath(url.searchParams.get('return_to')))}`;
    return new Response(null,{status:303,headers:{...privateHeaders,Location:target}});
  }
  try{
    const auth=await getAuth();
    const result=await auth.api.signOut({headers:request.headers,returnHeaders:true});
    const response=new Response(null,{status:303,headers:{...privateHeaders,Location:safeAdminReturnPath(url.searchParams.get('return_to'))}});
    for(const cookie of result.headers.getSetCookie())response.headers.append('Set-Cookie',cookie);
    return response;
  }catch{
    console.error('administrative sign-out failed');
    return Response.json({error:'Não foi possível sair agora. Tente novamente.'},{status:503,headers:privateHeaders});
  }
}

export const GET=signOut;
export const POST=signOut;
