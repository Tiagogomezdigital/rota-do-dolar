import {redirect} from 'next/navigation';
import {getChatGPTUser,chatGPTSignInPath} from '@/app/chatgpt-auth';
import {isVercelAuthConfigured,isVercelAuthRuntime,safeAdminReturnPath} from '@/lib/auth';
import SignInButton from './sign-in-button';

export const dynamic='force-dynamic';
export const metadata={title:'Entrada administrativa · Rota do Dólar',robots:{index:false,follow:false}};

export default async function AdminLogin({searchParams}:{searchParams:Promise<{return_to?:string;error?:string}>}){
  const params=await searchParams;
  const returnTo=safeAdminReturnPath(params.return_to);
  if(!isVercelAuthRuntime())redirect(chatGPTSignInPath(returnTo));
  const configured=isVercelAuthConfigured();
  if(configured&&await getChatGPTUser())redirect(returnTo);
  return <main className="quiz-shell script-quiz"><section className="quiz-content" style={{maxWidth:460,paddingTop:40}}><p className="eyebrow">ÁREA ADMINISTRATIVA</p><h1>Entre para acompanhar as respostas.</h1><p className="lead">Use uma das contas autorizadas para acessar o painel da Rota do Dólar.</p>{params.error&&<p className="error" role="alert">Não foi possível autorizar essa entrada. Confira se está usando uma conta permitida e tente novamente.</p>}{configured?<SignInButton returnTo={returnTo}/>:<p className="error" role="alert">A entrada administrativa está temporariamente indisponível. Tente novamente em instantes.</p>}<p className="micro"><a href="/">Voltar à experiência</a></p></section></main>;
}
