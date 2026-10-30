import assert from 'node:assert/strict';
import {mkdir,writeFile,unlink} from 'node:fs/promises';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';

// These substitutions exist only in this temporary test bundle. They never
// change production authentication or connect to a local/remote database.
const mockState = `
export const state = {
  access: {user: null, allowed: false}, databaseCalls: 0, statements: [],
  batches: [], sessions: [], answers: [], databaseError: false, errors: []
};`;
const mockAuth = `
import {state} from 'admin-test-state';
export const adminAccess = async () => state.access;
export const privateHeaders = {'Cache-Control':'private, no-store','Vary':'Cookie','X-Content-Type-Options':'nosniff','X-Test-Private':'forwarded'};`;
const mockDatabase = `
import {state} from 'admin-test-state';
export function database() {
  state.databaseCalls++;
  if (state.databaseError) throw new Error('simulated database outage');
  return {prepare(sql) {
    const statement = {sql, args: [], bind(...args) {this.args=args; return this;},
      async first() {return state.sessions.find(row=>row.id===this.args[0]&&row.content_version===this.args[1])??null;},
      async all() {return {results:state.answers.filter(row=>row.session_id===this.args[0])};}
    };
    state.statements.push(statement);
    return statement;
  }};
}
export async function readBatch(_db, statements) {
  state.batches.push(statements);
  return statements.map((statement,index)=>({results:index===0?[{visits:1,started:1,completed:0,cta:0,declined:0,abandoned:0}]:[]}));
}`;
const mocks = new Map([
  ['admin-test-state',mockState],
  ['@/lib/admin-auth',mockAuth],
  ['@/lib/database',mockDatabase],
  ['@/lib/backend-log',`import {state} from 'admin-test-state';export const logBackendError=(...args)=>state.errors.push(args);`],
]);
const outputDirectory=resolve('outputs/admin-variants');
await mkdir(outputDirectory,{recursive:true});
const bundlePath=resolve(outputDirectory,`route-test-${process.pid}.mjs`);
const bundle=await build({
  stdin:{contents:"export {GET} from './app/api/admin/route.ts';export {quizzes,defaultQuiz} from './lib/quizzes/index.ts';export {state} from 'admin-test-state';",resolveDir:process.cwd(),loader:'ts'},
  bundle:true,platform:'node',format:'esm',target:'node24',write:false,
  plugins:[{name:'isolated-admin-test-mocks',setup(builder){
    builder.onResolve({filter:/^(admin-test-state|@\/lib\/(admin-auth|database|backend-log))$/},args=>({path:args.path,namespace:'admin-test'}));
    builder.onLoad({filter:/.*/,namespace:'admin-test'},args=>({contents:mocks.get(args.path),loader:'js'}));
  }}],
});
await writeFile(bundlePath,bundle.outputFiles[0].contents);
let cases=0;
try {
  const {GET,quizzes,defaultQuiz,state}=await import(pathToFileURL(bundlePath).href);
  const authorized={user:{email:'qa@example.invalid'},allowed:true};
  const sessionIds=['00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002'];
  state.sessions=quizzes.map((quiz,index)=>({id:sessionIds[index],content_version:quiz.contentVersion,current_step:2}));
  state.answers=quizzes.map((quiz,index)=>({session_id:sessionIds[index],question_id:quiz.questions[0].id,option_id:quiz.questions[0].options[0].id,answered_at:index+1}));
  assert.notEqual(quizzes[0].contentVersion,quizzes[1].contentVersion,'Editions must use distinct report partitions.');

  async function request(query,expectedStatus){
    state.databaseCalls=0;state.statements=[];state.batches=[];
    const response=await GET(new Request(`http://localhost/api/admin${query}`));
    assert.equal(response.status,expectedStatus,query);
    assert.equal(response.headers.get('Cache-Control'),'private, no-store');
    assert.equal(response.headers.get('Vary'),'Cookie');
    assert.equal(response.headers.get('X-Content-Type-Options'),'nosniff');
    assert.equal(response.headers.get('X-Test-Private'),'forwarded','The route must retain imported privateHeaders for every response.');
    cases++;
    return response.json();
  }

  await request('?quiz=unknown',401);
  assert.equal(state.databaseCalls,0,'Authentication must precede edition lookup and data access.');
  state.access={user:authorized.user,allowed:false};
  await request('?quiz=daniel',403);
  assert.equal(state.databaseCalls,0);
  await request('?quiz=unknown',403);
  assert.equal(state.databaseCalls,0);
  state.access=authorized;
  for(const query of ['?quiz=unknown','?quiz=']){
    await request(query,400);
    assert.equal(state.databaseCalls,0,'Unknown editions must not query data.');
  }

  for(const [query,quiz] of [['?range=all&page=2',defaultQuiz],...quizzes.map(quiz=>[`?quiz=${quiz.id}&range=all&page=2`,quiz])]){
    const report=await request(query,200);
    assert.equal(report.page,2);
    assert.equal(state.batches.length,1,'The overview must retain the read batch.');
    assert.equal(state.statements.length,4);
    for(const statement of state.statements){
      assert.match(statement.sql,/s\.created_at>=\? AND s\.content_version=\?/);
      assert.ok(statement.args.includes(quiz.contentVersion),'Every aggregate and session list must bind the chosen edition.');
      for(const other of quizzes.filter(other=>other.id!==quiz.id))assert.ok(!statement.args.includes(other.contentVersion));
    }
    assert.deepEqual(state.statements[0].args.slice(0,2),[quiz.declinedStep,quiz.declinedStep]);
    assert.equal(state.statements[0].args.at(-2),0,'The all-time range must keep its existing semantics.');
    assert.equal(state.statements[3].args.at(-1),40,'Pagination must remain scoped to the selected edition.');
  }

  for(const [index,quiz] of quizzes.entries()){
    const ownId=sessionIds[index],otherId=sessionIds[(index+1)%quizzes.length];
    const detail=await request(`?quiz=${quiz.id}&session=${ownId}`,200);
    assert.equal(detail.session.id,ownId);
    assert.equal(detail.answers.length,1);
    assert.equal(detail.answers[0].session_id,ownId);
    assert.match(state.statements[0].sql,/WHERE id=\? AND content_version=\?/);
    assert.deepEqual(state.statements[0].args,[ownId,quiz.contentVersion]);
    await request(`?quiz=${quiz.id}&session=${otherId}`,404);
    assert.equal(state.statements.length,1,'Cross-edition details must stop before reading any answers.');
  }
  const defaultDetail=await request(`?session=${sessionIds[0]}`,200);
  assert.equal(defaultDetail.session.content_version,defaultQuiz.contentVersion);
  await request(`?session=${sessionIds[1]}`,404);
  await request('?quiz=daniel&session=invalid',400);
  assert.equal(state.statements.length,0);
  state.databaseError=true;
  const unavailable=await request('?quiz=daniel',503);
  assert.match(unavailable.error,/Tente atualizar/);
  assert.equal(state.errors.length,1);
  console.log(`PASS admin variants: ${cases} requests; authentication, private headers, edition filters, details, pagination and unavailable database.`);
} finally {
  await unlink(bundlePath);
}
