type BackendEvent='journey read failed'|'journey write failed'|'admin read failed';

const errorNames=new Set([
  'Error','TypeError','RangeError','SyntaxError','AbortError','TimeoutError',
  'LibsqlError','LibsqlBatchError','HttpServerError','ResponseError',
]);
const errorCodes=new Set([
  'SQLITE_ERROR','SQLITE_BUSY','SQLITE_LOCKED','SQLITE_CONSTRAINT',
  'SQLITE_CONSTRAINT_UNIQUE','SQLITE_CONSTRAINT_FOREIGNKEY',
  'SQLITE_CONSTRAINT_NOTNULL','SQLITE_CONSTRAINT_PRIMARYKEY',
  'SQLITE_IOERR','SQLITE_FULL','SQLITE_CANTOPEN','SQLITE_READONLY',
  'SQLITE_CORRUPT','SQLITE_NOTADB','SQLITE_TOOBIG','SQLITE_INTERRUPT','SQLITE_AUTH',
  'HRANA_PROTO_ERROR','HRANA_CLOSED_ERROR','HRANA_WEBSOCKET_ERROR',
  'SERVER_ERROR','PROTOCOL_VERSION_ERROR','INTERNAL_ERROR','UNKNOWN','TRANSACTION_CLOSED',
  'URL_INVALID','URL_PARAM_NOT_SUPPORTED','URL_SCHEME_NOT_SUPPORTED',
  'ECONNRESET','ECONNREFUSED','ENOTFOUND','ETIMEDOUT',
]);

function field(error:unknown,key:'name'|'code'|'status'):unknown{
  try{return error&&typeof error==='object'?(error as Record<string,unknown>)[key]:undefined;}
  catch{return undefined;}
}

/** Provider messages and causes may contain SQL, request details or response bodies. */
export function logBackendError(event:BackendEvent,error:unknown):void{
  const name=field(error,'name'),code=field(error,'code'),status=field(error,'status');
  const details:{name:string;code?:string;status?:number}={
    name:typeof name==='string'&&errorNames.has(name)?name:'UnknownError',
  };
  if(typeof code==='string'&&errorCodes.has(code))details.code=code;
  if(typeof status==='number'&&Number.isInteger(status)&&status>=100&&status<=599)details.status=status;
  console.error(event,details);
}
