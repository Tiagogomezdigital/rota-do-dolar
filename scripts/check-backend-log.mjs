import assert from 'node:assert/strict';
import {logBackendError} from '../lib/backend-log.ts';

const captured=[],original=console.error;
console.error=(...args)=>captured.push(args);
try{
  const sensitive=new Error('Bearer synthetic-private-token; SELECT * FROM sessions; cookie=private-cookie');
  Object.assign(sensitive,{
    name:'LibsqlError',code:'SQLITE_BUSY',status:503,
    cause:{message:'synthetic-private-token',sql:'SELECT * FROM sessions',args:['private-cookie']},
    headers:{authorization:'Bearer synthetic-private-token'},
  });
  logBackendError('journey write failed',sensitive);
  assert.deepEqual(captured.pop(),['journey write failed',{name:'LibsqlError',code:'SQLITE_BUSY',status:503}]);

  logBackendError('admin read failed',{
    name:'synthetic-private-token',code:'SQLITE_synthetic-private-token',status:'503 private-cookie',
    message:'SELECT private-data',stack:'synthetic-private-token',cause:sensitive,
  });
  assert.deepEqual(captured.pop(),['admin read failed',{name:'UnknownError'}]);

  // Unexpected error shapes/getters must not break the original error response.
  const unreadable=Object.defineProperties({},Object.fromEntries(['name','code','status'].map(key=>[key,{get(){throw sensitive;}}])));
  for(const error of [unreadable,null,'synthetic-private-token',42]){
    logBackendError('journey read failed',error);
    assert.deepEqual(captured.pop(),['journey read failed',{name:'UnknownError'}]);
  }
  for(const status of [-1,0,99,600,Infinity,NaN,503.5]){
    logBackendError('admin read failed',{name:'TypeError',status});
    assert.deepEqual(captured.pop(),['admin read failed',{name:'TypeError'}]);
  }
  logBackendError('journey write failed',sensitive);
  assert.doesNotMatch(JSON.stringify(captured),/synthetic-private-token|private-cookie|SELECT|message|stack|cause|headers|authorization|args/);
}finally{console.error=original;}
console.log('PASS: backend logs retain only fixed event, known name/code and numeric status; messages, causes, SQL, tokens and cookies are excluded.');
