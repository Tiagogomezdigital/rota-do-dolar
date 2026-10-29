import {requireChatGPTUser,chatGPTSignOutPath} from '@/app/chatgpt-auth';
import {adminEmails} from '@/lib/database';
import Dashboard from './dashboard';
import Link from 'next/link';
export const dynamic='force-dynamic';
export const metadata={title:'Respostas · Rota do Dólar',robots:{index:false,follow:false}};
export default async function AdminPage(){
 const user=await requireChatGPTUser('/admin');
 if(!adminEmails().includes(user.email.toLowerCase()))return <main className="access-page"><div className="brand-square">↗</div><p className="eyebrow">ÁREA ADMINISTRATIVA</p><h1>Acesso restrito</h1><p>A conta {user.email} não está autorizada a visualizar as respostas.</p><a href={chatGPTSignOutPath('/admin')} target="_top">Entrar com outra conta</a><Link href="/" prefetch={false}>Voltar à página</Link></main>;
 return <Dashboard email={user.email}/>;
}
