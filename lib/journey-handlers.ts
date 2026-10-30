import {database} from '@/lib/database';
import {env} from 'cloudflare:workers';
import type {QuizDefinition} from '@/lib/quiz-definition';
import {isJourneyOriginAllowed,journeyMigrationResponse,type JourneyMigrationSettings} from '@/lib/journey-migration';
import {readLimitedText,RequestBodyTooLargeError} from '@/lib/request-body';
import {logBackendError} from '@/lib/backend-log';
import {readJourneySnapshot} from '@/lib/journey-snapshot';
const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
type Session={id:string;content_version:string;current_step:number;furthest_step:number;last_seen:number;completed_at:number|null;cta_clicked_at:number|null;started_at:number|null};
/** Each route supplies a fixed server-side definition; request bodies cannot select a quiz. */
export function createJourneyHandlers(quiz:QuizDefinition){
 const {cookieName,cookiePath,contentVersion:CONTENT_VERSION,questions,offerStep:OFFER_STEP,processStep:PROCESS_STEP,processDurationMs:PROCESS_DURATION_MS,storyStep:STORY_STEP,declinedStep:DECLINED_STEP}=quiz;
 function sid(req:Request){const id=req.headers.get('cookie')?.split(';').map(x=>x.trim()).find(x=>x.startsWith(cookieName+'='))?.slice(cookieName.length+1);return id&&/^[0-9a-f-]{36}$/.test(id)?id:null;}
 const reply=(data:unknown,status=200,extra={})=>Response.json(data,{status,headers:{...headers,...extra}});
 // New quiz editions must never write to the preserved Sites D1 database.
 const unavailableInSites=()=>quiz.id!=='tiago'&&process.env.QUIZ_RUNTIME!=='vercel'&&process.env.VERCEL!=='1';
 async function find(req:Request){const id=sid(req);return id?database().prepare('SELECT * FROM sessions WHERE id = ? AND content_version = ?').bind(id,CONTENT_VERSION).first<Session>():null;}
 async function snapshot(req:Request){const id=sid(req);return id?readJourneySnapshot(database(),id,CONTENT_VERSION):null;}
 async function conflict(req:Request){const current=await snapshot(req);return reply({error:'Sua jornada foi atualizada em outra aba. Continue a partir da etapa atual.',...(current??{})},409);}
 function migrationSettings():JourneyMigrationSettings{
  if(quiz.id!=='tiago'||process.env.QUIZ_RUNTIME||process.env.VERCEL)return {isSitesRuntime:false};
  const flags=env as {JOURNEY_FORWARD_ORIGIN?:unknown;JOURNEY_WRITE_PAUSED?:unknown};
  return {isSitesRuntime:true,forwardOrigin:flags.JOURNEY_FORWARD_ORIGIN,writePaused:flags.JOURNEY_WRITE_PAUSED};
 }
 async function GET(req:Request){try{if(unavailableInSites())return reply({error:'Não foi possível recuperar seu progresso. Tente novamente.'},503);const forwarded=await journeyMigrationResponse(req,migrationSettings());if(forwarded)return forwarded;return reply(await snapshot(req)??{step:0,answers:{},completed:false,ctaClicked:false,revision:0});}catch(e){logBackendError('journey read failed',e);return reply({error:'Não foi possível recuperar seu progresso. Tente novamente.'},503);}}
 async function POST(req:Request){
  try{
   if(!isJourneyOriginAllowed(req))return reply({error:'Origem não permitida.'},403);
   if(unavailableInSites())return reply({error:'Não conseguimos salvar agora. Sua escolha está mantida; tente novamente.'},503);
   if(!req.headers.get('content-type')?.includes('application/json'))return reply({error:'Formato inválido.'},415);
   const raw=await readLimitedText(req,2048);
   let body:Record<string,unknown>;try{body=JSON.parse(raw);}catch{return reply({error:'Requisição inválida.'},400);}
   if(!body||Array.isArray(body)||typeof body!=='object')return reply({error:'Requisição inválida.'},400);
   const forwarded=await journeyMigrationResponse(req,migrationSettings(),raw);if(forwarded)return forwarded;
   const db=database(),now=Date.now();
   if(body.action==='init'){
    const current=await snapshot(req);if(current)return reply(current);
    const id=crypto.randomUUID();const source=typeof body.source==='string'&&/^[\w .:-]{1,80}$/.test(body.source)?body.source:'direto';const device=body.device==='mobile'?'mobile':'desktop';
    await db.batch([db.prepare('INSERT INTO sessions (id,content_version,created_at,last_seen,source,device) VALUES (?,?,?,?,?,?)').bind(id,CONTENT_VERSION,now,now,source,device),db.prepare('INSERT INTO step_views (session_id,step,first_seen) VALUES (?,0,?)').bind(id,now)]);
    return reply({step:0,answers:{},completed:false,ctaClicked:false,revision:now},201,{'Set-Cookie':`${cookieName}=${id}; Path=${cookiePath}; HttpOnly; SameSite=Lax; Max-Age=2592000${new URL(req.url).protocol==='https:'?'; Secure':''}`});
   }
   const s=await find(req);
   if(!s)return reply({error:'Sua sessão expirou. Recarregue a página para começar novamente.'},409);
   if(body.expectedStep!==undefined){
    if(!Number.isInteger(body.expectedStep))return reply({error:'Etapa inválida.'},400);
    if(body.expectedStep!==s.current_step)return conflict(req);
   }
   if(body.expectedRevision!==undefined){
    if(!Number.isSafeInteger(body.expectedRevision)||(body.expectedRevision as number)<0)return reply({error:'Revisão inválida.'},400);
    if(body.expectedRevision!==s.last_seen)return conflict(req);
   }
   // last_seen is a monotonically increasing revision for conditional writes.
   const nextSeen=Math.max(now,s.last_seen+1);
   let target=s.current_step;const writes:D1PreparedStatement[]=[];
   if(body.action==='answer'){
    const qi=questions.findIndex(q=>q.id===body.questionId);const question=questions[qi];
    if(!question||!question.options.some(o=>o.id===body.optionId)||qi+1>s.furthest_step)return reply({error:'Resposta inválida para esta etapa.'},400);
    if(qi+1!==s.current_step)return conflict(req);
    target=question.id==='compromisso'&&body.optionId==='nao'?DECLINED_STEP:qi+2;
    writes.push(db.prepare('INSERT INTO answers (session_id,question_id,option_id,answered_at) SELECT ?,?,?,? FROM sessions WHERE id=? AND current_step=? AND last_seen=? ON CONFLICT(session_id,question_id) DO UPDATE SET option_id=excluded.option_id,answered_at=excluded.answered_at').bind(s.id,question.id,body.optionId,now,s.id,s.current_step,s.last_seen));
   }else if(body.action==='view'){
    if(!Number.isInteger(body.step))return reply({error:'Etapa inválida.'},400);
    target=body.step as number;
    if(s.current_step===DECLINED_STEP&&target!==1)return reply({error:'Volte ao questionário para escolher se deseja continuar.'},400);
    if(target<0||target>OFFER_STEP||target>s.furthest_step+1)return reply({error:'Etapa indisponível.'},400);
    // Question advancement requires an answer; revisits of already reached stages are allowed.
    if(target>s.furthest_step && target>1 && target<=PROCESS_STEP)return reply({error:'Responda antes de continuar.'},400);
    if(target>=STORY_STEP){
     const prerequisites=await db.prepare('SELECT (SELECT COUNT(*) FROM answers WHERE session_id=?) AS answer_count,(SELECT option_id FROM answers WHERE session_id=? AND question_id=?) AS commitment,(SELECT first_seen FROM step_views WHERE session_id=? AND step=?) AS processing_started').bind(s.id,s.id,'compromisso',s.id,PROCESS_STEP).first<{answer_count:number;commitment:string|null;processing_started:number|null}>();
     if(prerequisites?.answer_count!==questions.length||prerequisites.commitment!=='sim')return reply({error:'Conclua as perguntas antes de continuar.'},400);
     if(prerequisites.processing_started===null||now-prerequisites.processing_started<PROCESS_DURATION_MS)return reply({error:'Aguarde a preparação da sua jornada terminar.'},400);
    }
   }else if(body.action==='cta'){
    if(!s.completed_at)return reply({error:'Conclua as etapas antes de registrar interesse.'},400);
    if(s.current_step!==OFFER_STEP)return conflict(req);
    const result=await db.prepare('UPDATE sessions SET cta_clicked_at=COALESCE(cta_clicked_at,?),last_seen=? WHERE id=? AND current_step=? AND last_seen=?').bind(now,nextSeen,s.id,s.current_step,s.last_seen).run();
    if(!result.meta.changes)return conflict(req);
    return reply({ok:true,revision:nextSeen});
   }else return reply({error:'Ação inválida.'},400);
   const updateIndex=writes.length;
   writes.push(db.prepare('UPDATE sessions SET current_step=?,furthest_step=MAX(furthest_step,?),last_seen=?,started_at=CASE WHEN ?>0 THEN COALESCE(started_at,?) ELSE started_at END,completed_at=CASE WHEN ?=? THEN COALESCE(completed_at,?) ELSE completed_at END WHERE id=? AND current_step=? AND last_seen=?').bind(target,target===DECLINED_STEP?1:target,nextSeen,target,now,target,OFFER_STEP,now,s.id,s.current_step,s.last_seen));
   writes.push(db.prepare('INSERT OR IGNORE INTO step_views (session_id,step,first_seen) SELECT ?,?,? FROM sessions WHERE id=? AND current_step=? AND last_seen=?').bind(s.id,target,now,s.id,target,nextSeen));
   // D1 batches execute transactionally: an outdated request changes neither the answer nor the cursor.
   const results=await db.batch(writes);
   if(!results[updateIndex].meta.changes)return conflict(req);
   return reply({ok:true,step:target,revision:nextSeen});
  }catch(e){if(e instanceof RequestBodyTooLargeError)return reply({error:'Requisição muito grande.'},413);logBackendError('journey write failed',e);return reply({error:'Não conseguimos salvar agora. Sua escolha está mantida; tente novamente.'},503);}
 }
 return {GET,POST};
}
