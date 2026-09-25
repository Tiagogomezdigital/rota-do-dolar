import {adminAccess,privateHeaders} from '@/lib/admin-auth';
import {database} from '@/lib/database';
import {CONTENT_VERSION} from '@/lib/content';
export const dynamic='force-dynamic';
const reply=(data:unknown,status=200)=>Response.json(data,{status,headers:privateHeaders});
export async function GET(req:Request){
 try{
  const access=await adminAccess();if(!access.user)return reply({error:'Entre na sua conta para continuar.'},401);if(!access.allowed)return reply({error:'Sua conta não tem acesso a este painel.'},403);
  const db=database(),url=new URL(req.url),id=url.searchParams.get('session');
  if(id){
   if(!/^[0-9a-f-]{36}$/.test(id))return reply({error:'Sessão inválida.'},400);
   const session=await db.prepare('SELECT id,created_at,started_at,last_seen,current_step,completed_at,cta_clicked_at,source,device FROM sessions WHERE id=? AND content_version=?').bind(id,CONTENT_VERSION).first();
   if(!session)return reply({error:'Sessão não encontrada.'},404);
   const answers=await db.prepare('SELECT question_id,option_id,answered_at FROM answers WHERE session_id=? ORDER BY answered_at').bind(id).all();
   return reply({session,answers:answers.results});
  }
  const range=url.searchParams.get('range')??'7';if(!['1','7','30','all'].includes(range))return reply({error:'Período inválido.'},400);
  const page=Math.min(100000,Math.max(0,Number(url.searchParams.get('page'))||0));if(!Number.isInteger(page))return reply({error:'Página inválida.'},400);
  const now=Date.now(),since=range==='all'?0:now-Number(range)*86400000;
  const filter='s.created_at>=? AND s.content_version=?';const values=[since,CONTENT_VERSION];
  const [totals,choices,funnel,sessions]=await db.batch([
   db.prepare(`SELECT COUNT(*) visits,SUM(started_at IS NOT NULL) started,SUM(completed_at IS NOT NULL) completed,SUM(cta_clicked_at IS NOT NULL) cta,SUM(started_at IS NOT NULL AND completed_at IS NULL AND last_seen<?) abandoned FROM sessions s WHERE ${filter}`).bind(now-1800000,...values),
   db.prepare(`SELECT a.question_id,a.option_id,COUNT(*) n FROM answers a JOIN sessions s ON s.id=a.session_id WHERE ${filter} GROUP BY a.question_id,a.option_id`).bind(...values),
   db.prepare(`SELECT v.step,COUNT(*) n FROM step_views v JOIN sessions s ON s.id=v.session_id WHERE ${filter} GROUP BY v.step ORDER BY v.step`).bind(...values),
   db.prepare(`SELECT s.id,s.created_at,s.started_at,s.last_seen,s.current_step,s.completed_at,s.cta_clicked_at,s.source,s.device,(SELECT COUNT(*) FROM answers a WHERE a.session_id=s.id) answer_count FROM sessions s WHERE ${filter} ORDER BY s.created_at DESC,s.id DESC LIMIT 20 OFFSET ?`).bind(...values,page*20),
  ]);
  return reply({totals:totals.results[0],choices:choices.results,funnel:funnel.results,sessions:sessions.results,page,generatedAt:now,range});
 }catch(e){console.error('admin read failed',e);return reply({error:'Não foi possível carregar as respostas. Tente atualizar em instantes.'},503);}
}
