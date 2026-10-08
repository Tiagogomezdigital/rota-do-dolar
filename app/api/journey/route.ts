import {database} from '@/lib/database';
import {CONTENT_VERSION,questions,OFFER_STEP,PROCESS_STEP,STORY_STEP} from '@/lib/content';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const cookieName='journey_session';
type Session={id:string;content_version:string;current_step:number;furthest_step:number;completed_at:number|null;cta_clicked_at:number|null;started_at:number|null};
function sid(req:Request){const id=req.headers.get('cookie')?.split(';').map(x=>x.trim()).find(x=>x.startsWith(cookieName+'='))?.slice(cookieName.length+1);return id&&/^[0-9a-f-]{36}$/.test(id)?id:null;}
const reply=(data:unknown,status=200,extra={})=>Response.json(data,{status,headers:{...headers,...extra}});
async function find(req:Request){const id=sid(req);return id?database().prepare('SELECT * FROM sessions WHERE id = ? AND content_version = ?').bind(id,CONTENT_VERSION).first<Session>():null;}
async function snapshot(session:Session){const rows=await database().prepare('SELECT question_id,option_id FROM answers WHERE session_id = ?').bind(session.id).all<{question_id:string;option_id:string}>();return {step:session.current_step,answers:Object.fromEntries(rows.results.map(r=>[r.question_id,r.option_id])),completed:!!session.completed_at,ctaClicked:!!session.cta_clicked_at};}
export async function GET(req:Request){try{const s=await find(req);return reply(s?await snapshot(s):{step:0,answers:{},completed:false,ctaClicked:false});}catch(e){console.error('journey read failed',e);return reply({error:'Não foi possível recuperar seu progresso. Tente novamente.'},503);}}
export async function POST(req:Request){
 try{
  const origin=req.headers.get('origin');if(!origin||![new URL(req.url).origin,'https://4yousite.com.br','https://www.4yousite.com.br'].includes(origin))return reply({error:'Origem não permitida.'},403);
  if(!req.headers.get('content-type')?.includes('application/json'))return reply({error:'Formato inválido.'},415);
  const raw=await req.text();if(raw.length>2048)return reply({error:'Requisição muito grande.'},413);
  let body:Record<string,unknown>;try{body=JSON.parse(raw);}catch{return reply({error:'Requisição inválida.'},400);}
  if(!body||Array.isArray(body)||typeof body!=='object')return reply({error:'Requisição inválida.'},400);
  const db=database(),now=Date.now();let s=await find(req);
  if(body.action==='init'){
   if(s)return reply(await snapshot(s));
   const id=crypto.randomUUID();const source=typeof body.source==='string'&&/^[\w .:-]{1,80}$/.test(body.source)?body.source:'direto';const device=body.device==='mobile'?'mobile':'desktop';
   await db.batch([db.prepare('INSERT INTO sessions (id,content_version,created_at,last_seen,source,device) VALUES (?,?,?,?,?,?)').bind(id,CONTENT_VERSION,now,now,source,device),db.prepare('INSERT INTO step_views (session_id,step,first_seen) VALUES (?,0,?)').bind(id,now)]);
   return reply({step:0,answers:{},completed:false,ctaClicked:false},201,{'Set-Cookie':`${cookieName}=${id}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000${new URL(req.url).protocol==='https:'?'; Secure':''}`});
  }
  if(!s)return reply({error:'Sua sessão expirou. Recarregue a página para começar novamente.'},409);
  let target=s.current_step;const writes:D1PreparedStatement[]=[];
  if(body.action==='answer'){
   const qi=questions.findIndex(q=>q.id===body.questionId);const question=questions[qi];
   if(!question||!question.options.some(o=>o.id===body.optionId)||qi+1>s.furthest_step)return reply({error:'Resposta inválida para esta etapa.'},400);
   target=qi+2;
   writes.push(db.prepare('INSERT INTO answers (session_id,question_id,option_id,answered_at) VALUES (?,?,?,?) ON CONFLICT(session_id,question_id) DO UPDATE SET option_id=excluded.option_id,answered_at=excluded.answered_at').bind(s.id,question.id,body.optionId,now));
  }else if(body.action==='view'){
   if(!Number.isInteger(body.step))return reply({error:'Etapa inválida.'},400);
   target=body.step as number;
   if(target<0||target>OFFER_STEP||target>s.furthest_step+1)return reply({error:'Etapa indisponível.'},400);
   // Question advancement requires an answer; revisits of already reached stages are allowed.
   if(target>s.furthest_step && target>1 && target<=PROCESS_STEP)return reply({error:'Responda antes de continuar.'},400);
   if(target>=STORY_STEP){const count=await db.prepare('SELECT COUNT(*) n FROM answers WHERE session_id=?').bind(s.id).first<{n:number}>();if(count?.n!==questions.length)return reply({error:'Conclua as perguntas antes de continuar.'},400);}
  }else if(body.action==='cta'){
   if(!s.completed_at)return reply({error:'Conclua as etapas antes de registrar interesse.'},400);
   await db.prepare('UPDATE sessions SET cta_clicked_at=COALESCE(cta_clicked_at,?),last_seen=? WHERE id=?').bind(now,now,s.id).run();return reply({ok:true});
  }else return reply({error:'Ação inválida.'},400);
  writes.push(db.prepare('UPDATE sessions SET current_step=?,furthest_step=MAX(furthest_step,?),last_seen=?,started_at=CASE WHEN ?>0 THEN COALESCE(started_at,?) ELSE started_at END,completed_at=CASE WHEN ?=? THEN COALESCE(completed_at,?) ELSE completed_at END WHERE id=?').bind(target,target,now,target,now,target,OFFER_STEP,now,s.id));
  writes.push(db.prepare('INSERT OR IGNORE INTO step_views (session_id,step,first_seen) VALUES (?,?,?)').bind(s.id,target,now));
  await db.batch(writes);return reply({ok:true,step:target});
 }catch(e){console.error('journey write failed',e);return reply({error:'Não conseguimos salvar agora. Sua escolha está mantida; tente novamente.'},503);}
}
