import {readFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {createClient} from '@libsql/client';

const definitions={
  sessions:{columns:['id','content_version','created_at','started_at','last_seen','current_step','furthest_step','completed_at','cta_clicked_at','source','device'],key:['id'],strings:['id','content_version','source','device'],nullable:['started_at','completed_at','cta_clicked_at']},
  answers:{columns:['session_id','question_id','option_id','answered_at'],key:['session_id','question_id'],strings:['session_id','question_id','option_id'],nullable:[]},
  step_views:{columns:['session_id','step','first_seen'],key:['session_id','step'],strings:['session_id'],nullable:[]},
};
const tableNames=Object.keys(definitions);
const flags=new Set(['--schema-only','--verify-only','--allow-extra-target-rows','--allow-local']);
const values=new Set(['--input','--env-file']);
const options={};
for(let index=0;index<process.argv.slice(2).length;index++){
  const args=process.argv.slice(2),name=args[index];
  if(flags.has(name))options[name]=true;
  else if(values.has(name)&&args[index+1]&&!args[index+1].startsWith('--'))options[name]=args[++index];
  else throw new Error('Usage: node scripts/import-quiz-data.mjs --schema-only | --input <private-backup.json> [--verify-only] [--env-file .env.local]');
}
if(!options['--schema-only']&&!options['--input'])throw new Error('Choose --schema-only or provide an explicit --input backup.');
if(options['--schema-only']&&(options['--input']||options['--verify-only']))throw new Error('--schema-only cannot be combined with an import or verification.');
const envPath=resolve(options['--env-file']||'.env.local');
if(existsSync(envPath))process.loadEnvFile(envPath);

function chunks(rows,size=100){const result=[];for(let start=0;start<rows.length;start+=size)result.push(rows.slice(start,start+size));return result;}
function keyOf(row,definition){return JSON.stringify(definition.key.map(column=>row[column]));}
function readSnapshot(snapshot){
  const tables={};
  for(const name of tableNames){
    const definition=definitions[name],entry=snapshot.tables?.[name],rows=Array.isArray(entry)?entry:entry?.rows;
    if(!Array.isArray(rows))throw new Error(`The backup is missing table ${name}.`);
    if(entry?.columns&&(!Array.isArray(entry.columns)||entry.columns.length!==definition.columns.length||entry.columns.some(column=>!definition.columns.includes(column))))throw new Error(`The source schema changed in ${name}; review the migration before importing.`);
    const seen=new Set();
    tables[name]=rows.map((row,index)=>{
      if(!row||typeof row!=='object'||Array.isArray(row))throw new Error(`Invalid ${name} row ${index}.`);
      if(Object.keys(row).some(column=>!definition.columns.includes(column)))throw new Error(`An unknown source column was found in ${name}; no source fields may be silently dropped.`);
      const output={};
      for(const column of definition.columns){
        const value=row[column];
        const valid=definition.strings.includes(column)?typeof value==='string':
          (definition.nullable.includes(column)&&value===null)||(typeof value==='number'&&Number.isSafeInteger(value));
        if(!valid)throw new Error(`Invalid ${name} column ${column} at row ${index}.`);
        output[column]=value;
      }
      const key=keyOf(output,definition);
      if(seen.has(key))throw new Error(`The backup contains duplicate ${name} primary keys.`);
      seen.add(key);return output;
    });
  }
  const ids=new Set(tables.sessions.map(row=>row.id));
  for(const name of ['answers','step_views'])if(tables[name].some(row=>!ids.has(row.session_id)))throw new Error(`The backup contains orphan rows in ${name}; capture a consistent snapshot first.`);
  return tables;
}
function sourceMetrics(tables){
  const metrics=new Map(),versions=new Map();
  for(const row of tables.sessions){
    versions.set(row.id,row.content_version);
    if(!metrics.has(row.content_version))metrics.set(row.content_version,{visits:0,started:0,completed:0,cta:0,answers:0,views:0});
    const item=metrics.get(row.content_version);item.visits++;item.started+=row.started_at!==null?1:0;item.completed+=row.completed_at!==null?1:0;item.cta+=row.cta_clicked_at!==null?1:0;
  }
  for(const row of tables.answers)metrics.get(versions.get(row.session_id)).answers++;
  for(const row of tables.step_views)metrics.get(versions.get(row.session_id)).views++;
  return Object.fromEntries([...metrics].sort(([left],[right])=>left.localeCompare(right)));
}
async function assertNotNewer(client,tables){
  const source=new Map(tables.sessions.map(row=>[row.id,row.last_seen]));
  for(const rows of chunks(tables.sessions)){
    const result=await client.execute({sql:`SELECT id,last_seen FROM sessions WHERE id IN (${rows.map(()=>'?').join(',')})`,args:rows.map(row=>row.id)});
    if(result.rows.some(row=>Number(row.last_seen)>source.get(row.id)))throw new Error('The target has newer visitor progress than this backup. Capture a new snapshot before importing.');
  }
}
async function importRows(client,tables){
  await assertNotNewer(client,tables);
  const sessions=new Map(tables.sessions.map(row=>[row.id,row]));
  for(const name of tableNames){
    const definition=definitions[name],columns=definition.columns;
    for(const rows of chunks(tables[name])){
      const statements=rows.map(row=>{
        const args=columns.map(column=>row[column]);
        if(name==='sessions')return {
          sql:`INSERT INTO sessions (${columns.join(',')}) VALUES (${columns.map(()=>'?').join(',')}) ON CONFLICT(id) DO UPDATE SET ${columns.filter(column=>column!=='id').map(column=>`${column}=excluded.${column}`).join(',')} WHERE excluded.last_seen>=sessions.last_seen`,args,
        };
        const conflict=name==='answers'?
          'ON CONFLICT(session_id,question_id) DO UPDATE SET option_id=excluded.option_id,answered_at=excluded.answered_at WHERE excluded.answered_at>=answers.answered_at':
          'ON CONFLICT(session_id,step) DO UPDATE SET first_seen=MIN(step_views.first_seen,excluded.first_seen)';
        return {sql:`INSERT INTO ${name} (${columns.join(',')}) SELECT ${columns.map(()=>'?').join(',')} FROM sessions WHERE id=? AND last_seen<=? ${conflict}`,args:[...args,row.session_id,sessions.get(row.session_id).last_seen]};
      });
      await client.batch(statements,'write');
    }
  }
}
async function verify(client,tables){
  const counts={};
  for(const name of tableNames){
    const definition=definitions[name],expected=new Map(tables[name].map(row=>[keyOf(row,definition),row]));
    const count=await client.execute(`SELECT COUNT(*) n FROM ${name}`);counts[name]=Number(count.rows[0].n);
    if(counts[name]<tables[name].length||!options['--allow-extra-target-rows']&&counts[name]!==tables[name].length)throw new Error(`Count mismatch in ${name}; no existing target rows were deleted.`);
    for(const rows of chunks(tables[name])){
      const predicate=rows.map(()=>`(${definition.key.map(column=>`${column}=?`).join(' AND ')})`).join(' OR ');
      const result=await client.execute({sql:`SELECT ${definition.columns.join(',')} FROM ${name} WHERE ${predicate}`,args:rows.flatMap(row=>definition.key.map(column=>row[column]))});
      if(result.rows.length!==rows.length)throw new Error(`Missing imported records in ${name}.`);
      for(const row of result.rows){
        const original=expected.get(keyOf(row,definition));
        if(!original||definition.columns.some(column=>row[column]!==original[column]))throw new Error(`Field verification failed in ${name}; verify that writes are paused during cutover.`);
      }
    }
  }
  const foreignKeys=await client.execute('PRAGMA foreign_key_check');
  if(foreignKeys.rows.length)throw new Error('The target database has foreign key violations.');
  const metrics={};
  const grouped=await client.execute('SELECT content_version,COUNT(*) visits,SUM(started_at IS NOT NULL) started,SUM(completed_at IS NOT NULL) completed,SUM(cta_clicked_at IS NOT NULL) cta FROM sessions GROUP BY content_version');
  for(const row of grouped.rows)metrics[row.content_version]={visits:Number(row.visits),started:Number(row.started),completed:Number(row.completed),cta:Number(row.cta),answers:0,views:0};
  for(const [name,column] of [['answers','answers'],['step_views','views']]){
    const result=await client.execute(`SELECT s.content_version,COUNT(*) n FROM ${name} a JOIN sessions s ON s.id=a.session_id GROUP BY s.content_version`);
    for(const row of result.rows)metrics[row.content_version][column]=Number(row.n);
  }
  const expected=sourceMetrics(tables);
  for(const [edition,totals] of Object.entries(expected))for(const [metric,value] of Object.entries(totals)){
    const actual=metrics[edition]?.[metric];
    if(actual===undefined||(options['--allow-extra-target-rows']?actual<value:actual!==value))throw new Error('Edition metrics differ from the source snapshot.');
  }
  return {counts,sourceMetrics:expected,targetMetrics:metrics,foreignKeyViolations:0};
}

let client;
try{
  const url=process.env.TURSO_DATABASE_URL,authToken=process.env.TURSO_AUTH_TOKEN;
  const local=typeof url==='string'&&url.startsWith('file:');
  if(!url||(!local&&!authToken))throw new Error('TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be configured.');
  if(local&&!options['--allow-local'])throw new Error('Local files require the explicit --allow-local test flag.');
  if(!local&&!/^(libsql|https):\/\//.test(url))throw new Error('A remote libSQL database is required.');
  let tables,input;
  if(options['--input']){input=await readFile(resolve(options['--input']),'utf8');tables=readSnapshot(JSON.parse(input));}
  client=createClient({url,authToken,intMode:'number'});
  if(!options['--verify-only']){
    const schemaPath=fileURLToPath(new URL('../db/quiz-schema.sql',import.meta.url));
    await client.executeMultiple(await readFile(schemaPath,'utf8'));
  }
  if(options['--schema-only'])console.log(JSON.stringify({status:'schema-ready',tables:tableNames}));
  else{
    if(!options['--verify-only'])await importRows(client,tables);
    const result=await verify(client,tables);
    console.log(JSON.stringify({status:options['--verify-only']?'verified':'imported-and-verified',snapshotSha256:createHash('sha256').update(input).digest('hex'),...result}));
  }
}catch(error){
  let message=error instanceof Error?error.message:'Quiz data migration failed.';
  if(process.env.TURSO_AUTH_TOKEN)message=message.split(process.env.TURSO_AUTH_TOKEN).join('[redacted]');
  console.error(message);process.exitCode=1;
}finally{client?.close();}
