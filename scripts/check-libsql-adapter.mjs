import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';
import {createClient} from '@libsql/client';
import {LibsqlD1Database} from '../lib/libsql-d1.ts';
import {readJourneySnapshot} from '../lib/journey-snapshot.ts';

const directory=await mkdtemp(join(tmpdir(),'rota-libsql-check-'));
const url=pathToFileURL(join(directory,'quiz.db')).href;
const clientA=createClient({url,intMode:'number'}),clientB=createClient({url,intMode:'number'});
try{
  await clientA.executeMultiple(await readFile(new URL('../db/quiz-schema.sql',import.meta.url),'utf8'));
  await clientA.execute('PRAGMA busy_timeout=2000');
  await clientB.execute('PRAGMA busy_timeout=2000');
  const a=new LibsqlD1Database(clientA),b=new LibsqlD1Database(clientB);

  const template=a.prepare('SELECT ? AS label,? AS flag,? AS empty');
  const bound=template.bind('original',true,null);
  const other=template.bind('other',false,null);
  assert.deepEqual(await bound.first(),{label:'original',flag:1,empty:null});
  assert.equal(await other.first('label'),'other');
  assert.deepEqual(await bound.raw({columnNames:true}),[['label','flag','empty'],['original',1,null]]);
  assert.equal(await a.prepare('SELECT id FROM sessions').first(),null);
  assert.throws(()=>template.bind(undefined),/Unsupported SQL binding/);

  // A later SQL failure must roll back earlier statements in the same D1-compatible batch.
  await clientA.execute('CREATE TABLE rollback_probe(id TEXT PRIMARY KEY,value INTEGER NOT NULL)');
  await assert.rejects(a.batch([
    a.prepare('INSERT INTO rollback_probe(id,value) VALUES (?,?)').bind('must-rollback',1),
    a.prepare('INSERT INTO rollback_probe(id,value) VALUES (?,?)').bind('invalid',null),
  ]));
  assert.equal(await a.prepare('SELECT COUNT(*) n FROM rollback_probe').first('n'),0);
  await assert.rejects(a.batch([b.prepare('SELECT 1')]),/same database/);
  await assert.rejects(a.readBatch([b.prepare('SELECT 1')]),/same database/);

  // Reports must remain readable while another connection holds the writer lock.
  await clientA.execute('CREATE TABLE report_probe(id TEXT PRIMARY KEY,value INTEGER NOT NULL)');
  await clientA.execute("INSERT INTO report_probe(id,value) VALUES ('report',0)");
  const writer=await clientB.transaction('write');
  try{
    await writer.execute("UPDATE report_probe SET value=1 WHERE id='report'");
    const report=await a.readBatch([a.prepare('SELECT value FROM report_probe WHERE id=?').bind('report')]);
    assert.equal(report[0].results[0].value,0,'Read transactions see committed rows without requesting the writer lock.');
    assert.equal(report[0].meta.changes,0);
    await writer.commit();
  }finally{writer.close();}
  assert.equal(await a.prepare('SELECT value FROM report_probe').first('value'),1);
  await assert.rejects(a.readBatch([a.prepare('UPDATE report_probe SET value=2')]),/Read batches only accept SELECT/);
  assert.equal(await a.prepare('SELECT value FROM report_probe').first('value'),1);

  const timestamp=1793160000000;
  await a.prepare('INSERT INTO sessions(id,content_version,created_at,last_seen,current_step,furthest_step) VALUES (?,?,?,?,2,2)').bind('test-snapshot','test-edition',timestamp,timestamp).run();
  assert.equal(await readJourneySnapshot(a,'missing-session','test-edition'),null);
  assert.equal(await readJourneySnapshot(a,'test-snapshot','other-edition'),null);
  assert.deepEqual(await readJourneySnapshot(a,'test-snapshot','test-edition'),{step:2,answers:{},completed:false,ctaClicked:false,revision:timestamp});
  await a.batch([
    a.prepare('INSERT INTO answers(session_id,question_id,option_id,answered_at) VALUES (?,?,?,?)').bind('test-snapshot','compromisso','sim',timestamp),
    a.prepare('INSERT INTO answers(session_id,question_id,option_id,answered_at) VALUES (?,?,?,?)').bind('test-snapshot','genero','homem',timestamp),
  ]);
  // Commit on another connection after the read, before its SDK promise resolves.
  // A split session/answer read would combine the old revision with the new answer.
  let snapshotReads=0;
  const interleaved=new LibsqlD1Database({execute:async statement=>{
    snapshotReads++;
    const result=await clientA.execute(statement);
    if(snapshotReads===1)await b.batch([
      b.prepare('UPDATE answers SET option_id=?,answered_at=? WHERE session_id=? AND question_id=?').bind('mulher',timestamp+1,'test-snapshot','genero'),
      b.prepare('UPDATE sessions SET current_step=16,furthest_step=16,last_seen=?,completed_at=?,cta_clicked_at=? WHERE id=?').bind(timestamp+1,timestamp+1,timestamp+1,'test-snapshot'),
    ]);
    return result;
  }});
  assert.deepEqual(await readJourneySnapshot(interleaved,'test-snapshot','test-edition'),{step:2,answers:{compromisso:'sim',genero:'homem'},completed:false,ctaClicked:false,revision:timestamp});
  assert.equal(snapshotReads,1,'Read the session and answers in one database operation.');
  assert.deepEqual(await readJourneySnapshot(a,'test-snapshot','test-edition'),{step:16,answers:{compromisso:'sim',genero:'mulher'},completed:true,ctaClicked:true,revision:timestamp+1});

  const init=await a.prepare('INSERT INTO sessions(id,content_version,created_at,last_seen,current_step,furthest_step) VALUES (?,?,?,?,2,2)').bind('test-cas','test-edition',timestamp,timestamp).run();
  assert.equal(init.meta.changes,1);
  const staleA=await a.prepare('SELECT current_step,last_seen FROM sessions WHERE id=?').bind('test-cas').first();
  const staleB=await b.prepare('SELECT current_step,last_seen FROM sessions WHERE id=?').bind('test-cas').first();
  assert.deepEqual(staleA,staleB);
  const statements=(db,optionId)=>[
    db.prepare('INSERT INTO answers(session_id,question_id,option_id,answered_at) SELECT ?,?,?,? FROM sessions WHERE id=? AND current_step=? AND last_seen=? ON CONFLICT(session_id,question_id) DO UPDATE SET option_id=excluded.option_id,answered_at=excluded.answered_at').bind('test-cas','genero',optionId,timestamp+1,'test-cas',2,timestamp),
    db.prepare('UPDATE sessions SET current_step=3,furthest_step=3,last_seen=? WHERE id=? AND current_step=? AND last_seen=?').bind(timestamp+1,'test-cas',2,timestamp),
    db.prepare('INSERT OR IGNORE INTO step_views(session_id,step,first_seen) SELECT ?,?,? FROM sessions WHERE id=? AND current_step=? AND last_seen=?').bind('test-cas',3,timestamp+1,'test-cas',3,timestamp+1),
  ];
  const raced=await Promise.all([a.batch(statements(a,'first')),b.batch(statements(b,'second'))]);
  assert.deepEqual(raced.map(result=>result[1].meta.changes).sort(),[0,1]);
  const winner=raced[0][1].meta.changes?'first':'second';
  assert.equal(await a.prepare('SELECT option_id FROM answers WHERE session_id=? AND question_id=?').bind('test-cas','genero').first('option_id'),winner);
  assert.equal(await a.prepare('SELECT COUNT(*) n FROM step_views WHERE session_id=?').bind('test-cas').first('n'),1);

  // Exercise the actual import command against a separate local database, never the provisioned cloud DB.
  const fixture={tables:{
    sessions:{rows:[
      {id:'original-old',content_version:'original-edition',created_at:timestamp,started_at:null,last_seen:timestamp+2,current_step:0,furthest_step:0,completed_at:null,cta_clicked_at:null,source:'',device:'desktop'},
      {id:'original-current',content_version:'current-edition',created_at:timestamp+1,started_at:timestamp+2,last_seen:timestamp+9,current_step:16,furthest_step:16,completed_at:timestamp+8,cta_clicked_at:timestamp+9,source:'fixture',device:'mobile'},
    ]},
    answers:{rows:[{session_id:'original-old',question_id:'old-question',option_id:'historical-option',answered_at:timestamp+1},{session_id:'original-current',question_id:'compromisso',option_id:'sim',answered_at:timestamp+3}]},
    step_views:{rows:[{session_id:'original-old',step:0,first_seen:timestamp},{session_id:'original-current',step:16,first_seen:timestamp+8}]},
  }};
  const input=join(directory,'backup.json'),importUrl=pathToFileURL(join(directory,'import.db')).href,emptyEnv=join(directory,'empty.env');
  await writeFile(input,JSON.stringify(fixture));
  await writeFile(emptyEnv,'');
  const runImport=()=>spawnSync(process.execPath,[resolve('scripts/import-quiz-data.mjs'),'--input',input,'--env-file',emptyEnv,'--allow-local'],{
    cwd:resolve('.'),encoding:'utf8',env:{...process.env,TURSO_DATABASE_URL:importUrl,TURSO_AUTH_TOKEN:''},
  });
  const first=runImport();assert.equal(first.status,0,first.stderr);assert.deepEqual(JSON.parse(first.stdout).counts,{sessions:2,answers:2,step_views:2});
  const again=runImport();assert.equal(again.status,0,again.stderr);assert.deepEqual(JSON.parse(again.stdout).counts,{sessions:2,answers:2,step_views:2});
  const imported=createClient({url:importUrl,intMode:'number'});
  try{
    const old=await imported.execute({sql:'SELECT * FROM sessions WHERE id=?',args:['original-old']});
    assert.equal(old.rows[0].content_version,'original-edition');assert.equal(old.rows[0].source,'');assert.equal(old.rows[0].created_at,timestamp);assert.equal(old.rows[0].started_at,null);
    await imported.execute({sql:'UPDATE sessions SET last_seen=? WHERE id=?',args:[timestamp+100,'original-current']});
    const stale=runImport();assert.equal(stale.status,1);assert.match(stale.stderr,/newer visitor progress/);
    assert.equal(Number((await imported.execute({sql:'SELECT last_seen FROM sessions WHERE id=?',args:['original-current']})).rows[0].last_seen),timestamp+100);
  }finally{imported.close();}
  fixture.tables.answers.rows.push({session_id:'missing-parent',question_id:'test',option_id:'test',answered_at:timestamp});
  await writeFile(input,JSON.stringify(fixture));
  const orphan=runImport();assert.equal(orphan.status,1);assert.match(orphan.stderr,/orphan rows/);

  console.log('PASS: libSQL bindings/results, read-only reports without writer lock, consistent journey snapshots, transactional rollback, concurrent CAS, idempotent migration, all editions/timestamps, stale snapshot protection and orphan rejection.');
}finally{
  clientA.close();clientB.close();await rm(directory,{recursive:true,force:true,maxRetries:10,retryDelay:100});
}
