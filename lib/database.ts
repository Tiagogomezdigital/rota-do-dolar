import {env} from 'cloudflare:workers';
import {getTursoDatabase} from './libsql-d1';
function isVercel(){return process.env.QUIZ_RUNTIME==='vercel'||process.env.VERCEL==='1';}
export function database():D1Database{
  if(isVercel())return getTursoDatabase();
  if(!env.DB)throw new Error('DB unavailable');
  return env.DB;
}
export function adminEmails():string[]{
  return ((isVercel()?process.env.ADMIN_EMAILS:env.ADMIN_EMAILS)??'').split(',').map(s=>s.trim().toLowerCase()).filter(Boolean);
}
