/** The Sites bridge retains its own identity boundary; Vercel must verify sessions. */
export function isVercelAuthRuntime(){
  return process.env.QUIZ_RUNTIME==='vercel'||!!process.env.VERCEL;
}

export function allowedAdminEmails(){
  return (process.env.ADMIN_EMAILS??'').split(',').map(value=>value.trim().toLowerCase()).filter(Boolean);
}

export function isAllowedVerifiedAdmin(email:unknown,emailVerified:unknown){
  return typeof email==='string'&&emailVerified===true&&allowedAdminEmails().includes(email.trim().toLowerCase());
}

export function isVercelAuthConfigured(){
  return isVercelAuthRuntime()&&!!process.env.VERCEL_CLIENT_ID?.trim()
    &&(process.env.BETTER_AUTH_SECRET?.length??0)>=32&&allowedAdminEmails().length>0;
}

function allowedOrigins(){
  const origins=new Set(['https://rotadodolar.com.br','https://www.rotadodolar.com.br']);
  for(const value of [process.env.BETTER_AUTH_URL,process.env.VERCEL_URL,process.env.VERCEL_PROJECT_PRODUCTION_URL]){
    if(!value)continue;
    try{
      const url=new URL(value.includes('://')?value:`https://${value}`);
      if(url.protocol==='https:')origins.add(url.origin);
    }catch{throw new Error('Invalid administrative authentication origin.');}
  }
  if(process.env.NODE_ENV!=='production'){
    origins.add('http://localhost:3000');
    origins.add('http://localhost:5173');
    origins.add('http://127.0.0.1:3000');
  }
  return [...origins];
}

async function createAdminAuth(){
  if(!isVercelAuthConfigured())throw new Error('Administrative authentication is not configured.');
  const [{betterAuth},{drizzleAdapter},{drizzle},schema,{getTursoClient},{nextCookies},{getVercelOidcToken}]=await Promise.all([
    import('better-auth'),
    import('@better-auth/drizzle-adapter'),
    import('drizzle-orm/libsql/web'),
    import('@/db/auth-schema'),
    import('@/lib/libsql-d1'),
    import('better-auth/next-js'),
    import('@vercel/oidc'),
  ]);
  const origins=allowedOrigins();
  const clientId=process.env.VERCEL_CLIENT_ID!.trim();
  const db=drizzle(getTursoClient(),{schema});
  return betterAuth({
    appName:'Rota do Dólar',
    secret:process.env.BETTER_AUTH_SECRET!,
    basePath:'/api/auth',
    baseURL:process.env.BETTER_AUTH_URL||{
      allowedHosts:origins.map(origin=>new URL(origin).host),
      protocol:process.env.NODE_ENV==='production'?'https':'http',
    },
    trustedOrigins:origins,
    database:drizzleAdapter(db,{provider:'sqlite',schema,transaction:true}),
    emailAndPassword:{enabled:false},
    socialProviders:{
      vercel:{
        clientId,
        scope:['openid','email','profile'],
        tokenEndpointAuth:{
          method:'custom',
          async customizeRequest({body}){
            // Workload identity is fetched per exchange, never cached as a secret.
            body.set('client_id',clientId);
            body.set('client_assertion',await getVercelOidcToken());
            body.set('client_assertion_type','urn:vercel:params:oauth:client-assertion-type:oidc-bearer');
          },
        },
      },
    },
    user:{
      validateUserInfo:({user,source})=>{
        if(source.oauth?.providerId!=='vercel'||!isAllowedVerifiedAdmin(user.email,user.emailVerified)){
          return {error:'access_denied',errorDescription:'Esta conta não tem acesso ao painel.'};
        }
      },
    },
    account:{accountLinking:{enabled:false},encryptOAuthTokens:true},
    session:{expiresIn:60*60*8,updateAge:60*60,cookieCache:{enabled:false}},
    plugins:[nextCookies()],
  });
}

let authPromise:ReturnType<typeof createAdminAuth>|undefined;

/** No database connection or provider is initialized during a Sites request or build. */
export function getAuth(){
  if(!isVercelAuthRuntime())throw new Error('Administrative authentication is unavailable in this runtime.');
  if(!authPromise){
    authPromise=createAdminAuth().catch(error=>{authPromise=undefined;throw error;});
  }
  return authPromise;
}

export async function getVerifiedAdminSession(requestHeaders:Headers){
  if(!isVercelAuthConfigured())return null;
  const auth=await getAuth();
  const session=await auth.api.getSession({headers:requestHeaders,query:{disableCookieCache:true}});
  if(!session||!isAllowedVerifiedAdmin(session.user.email,session.user.emailVerified))return null;
  return session;
}

export function safeAdminReturnPath(value:unknown){
  if(typeof value!=='string'||value.length>2048||!value.startsWith('/')||value.startsWith('//'))return '/admin';
  try{
    const url=new URL(value,'https://quiz.invalid');
    if(url.origin!=='https://quiz.invalid'||!/^\/admin(?:\/|$)/.test(url.pathname)
      ||/^\/admin\/(?:login|logout)(?:\/|$)/.test(url.pathname))return '/admin';
    return `${url.pathname}${url.search}${url.hash}`;
  }catch{return '/admin';}
}
