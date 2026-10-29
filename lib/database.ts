import {env} from 'cloudflare:workers';
import {getTursoDatabase,LibsqlD1Database} from './libsql-d1';
function isVercel(){return process.env.QUIZ_RUNTIME==='vercel'||process.env.VERCEL==='1';}
export function database():D1Database{
  if(isVercel())return getTursoDatabase();
  if(!env.DB)throw new Error('DB unavailable');
  return env.DB;
}
export function adminEmails():string[]{
  return ((isVercel()?process.env.ADMIN_EMAILS:env.ADMIN_EMAILS)??'').split(',').map(s=>s.trim().toLowerCase()).filter(Boolean);
}
/** Keep the Sites D1 behavior while avoiding a Turso writer lock for read-only reports. */
export function readBatch<T=unknown>(db:D1Database,statements:D1PreparedStatement[]):Promise<D1Result<T>[]>{
  return db instanceof LibsqlD1Database?db.readBatch<T>(statements):db.batch<T>(statements);
}
