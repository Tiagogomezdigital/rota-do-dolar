'use client';
import {useState} from 'react';
import {authClient} from '@/lib/auth-client';
import {Button} from '@/components/ui/button';

export default function SignInButton({returnTo}:{returnTo:string}){
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  async function signIn(){
    if(busy)return;
    setBusy(true);setError('');
    try{
      const result=await authClient.signIn.social({provider:'vercel',callbackURL:returnTo,errorCallbackURL:'/admin/login?error=oauth'});
      if(result.error)throw new Error('sign-in failed');
    }catch{
      setError('Não foi possível iniciar a entrada. Tente novamente em instantes.');
      setBusy(false);
    }
  }
  return <><Button className="cta" disabled={busy} onClick={()=>void signIn()}>{busy?'Abrindo entrada segura…':'Entrar com Vercel'}</Button>{error&&<p className="error" role="alert">{error}</p>}</>;
}
