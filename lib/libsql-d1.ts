import {createClient,type Client,type InValue,type ResultSet} from '@libsql/client/web';

let tursoClient:Client|undefined;
let tursoDatabase:LibsqlD1Database|undefined;

/** No connection or secret is read while Next.js evaluates this module at build time. */
export function getTursoClient():Client{
  if(!tursoClient){
    const testRuntime=process.env.VERCEL_ENV!=='production'
      &&(process.env.QUIZ_RUNTIME==='vercel'||!!process.env.VERCEL);
    const url=testRuntime?process.env.QUIZ_TEST_TURSO_DATABASE_URL:process.env.TURSO_DATABASE_URL;
    const authToken=testRuntime?process.env.QUIZ_TEST_TURSO_AUTH_TOKEN:process.env.TURSO_AUTH_TOKEN;
    if(!url||!authToken)throw new Error(testRuntime?'The isolated quiz test database is not configured.':'The quiz database is not configured.');
    if(!/^(libsql|https):\/\//.test(url))throw new Error('A remote quiz database is required.');
    tursoClient=createClient({url,authToken,intMode:'number'});
  }
  return tursoClient;
}

export function getTursoDatabase():D1Database{
  if(!tursoDatabase)tursoDatabase=new LibsqlD1Database(getTursoClient());
  return tursoDatabase;
}

function bindValue(value:unknown):InValue{
  if(value===null||typeof value==='string'||typeof value==='bigint')return value;
  if(typeof value==='number'){
    if(!Number.isFinite(value))throw new TypeError('SQL numbers must be finite.');
    return value;
  }
  if(typeof value==='boolean')return value?1:0;
  if(value instanceof ArrayBuffer)return value;
  if(ArrayBuffer.isView(value))return new Uint8Array(value.buffer,value.byteOffset,value.byteLength);
  throw new TypeError('Unsupported SQL binding value.');
}

function safeNumber(value:bigint|number|undefined):number{
  if(value===undefined)return 0;
  const result=Number(value);
  if(!Number.isSafeInteger(result))throw new RangeError('The SQL integer exceeds JavaScript safe precision.');
  return result;
}

function d1Result<T>(result:ResultSet,duration:number):D1Result<T>{
  const changes=result.rowsAffected;
  return {
    success:true,
    results:result.rows.map(row=>Object.fromEntries(result.columns.map((name,index)=>[name,row[index]])) as T),
    meta:{changes,last_row_id:safeNumber(result.lastInsertRowid),changed_db:changes>0,duration,
      rows_read:result.rows.length,rows_written:changes,size_after:0},
  };
}

/** The application's D1 operations backed by libSQL; batches stay a single write transaction. */
export class LibsqlD1Database implements D1Database{
  readonly client:Client;
  constructor(client:Client){this.client=client;}
  prepare(sql:string):D1PreparedStatement{return new LibsqlD1Statement(this,sql,[]);}
  async batch<T=unknown>(statements:D1PreparedStatement[]):Promise<D1Result<T>[]>{
    const queries=statements.map(statement=>{
      if(!(statement instanceof LibsqlD1Statement)||statement.owner!==this){
        throw new TypeError('A batch must contain statements prepared by the same database.');
      }
      return {sql:statement.sql,args:statement.args};
    });
    if(!queries.length)return [];
    const start=performance.now();
    const results=await this.client.batch(queries,'write');
    const duration=performance.now()-start;
    return results.map(result=>d1Result<T>(result,duration));
  }
  exec(_query:string):Promise<D1ExecResult>{
    return Promise.reject(new Error('D1 exec is not used by this application; use the schema migration script.'));
  }
  withSession(_constraintOrBookmark?:D1SessionBookmark|D1SessionConstraint):D1DatabaseSession{
    throw new Error('D1 session bookmarks are not supported by the libSQL adapter.');
  }
  dump():Promise<ArrayBuffer>{
    return Promise.reject(new Error('D1 dump is not supported by the libSQL adapter.'));
  }
}

class LibsqlD1Statement implements D1PreparedStatement{
  readonly owner:LibsqlD1Database;
  readonly sql:string;
  readonly args:InValue[];
  constructor(owner:LibsqlD1Database,sql:string,args:InValue[]){this.owner=owner;this.sql=sql;this.args=args;}
  bind(...values:unknown[]):D1PreparedStatement{return new LibsqlD1Statement(this.owner,this.sql,values.map(bindValue));}
  first<T=unknown>(colName:string):Promise<T|null>;
  first<T=Record<string,unknown>>():Promise<T|null>;
  async first<T=Record<string,unknown>>(colName?:string):Promise<T|null>{
    const result=await this.all<Record<string,unknown>>(),row=result.results[0];
    if(!row)return null;
    if(colName===undefined)return row as T;
    if(!Object.hasOwn(row,colName))throw new Error('The requested SQL result column does not exist.');
    return row[colName] as T;
  }
  async all<T=Record<string,unknown>>():Promise<D1Result<T>>{
    const start=performance.now();
    return d1Result<T>(await this.owner.client.execute({sql:this.sql,args:this.args}),performance.now()-start);
  }
  run<T=Record<string,unknown>>():Promise<D1Result<T>>{return this.all<T>();}
  raw<T=unknown[]>(options:{columnNames:true}):Promise<[string[],...T[]]>;
  raw<T=unknown[]>(options?:{columnNames?:false}):Promise<T[]>;
  async raw<T=unknown[]>(options?:{columnNames?:boolean}):Promise<[string[],...T[]]|T[]>{
    const result=await this.owner.client.execute({sql:this.sql,args:this.args});
    const rows=result.rows.map(row=>result.columns.map((_,index)=>row[index])) as T[];
    return options?.columnNames?[result.columns,...rows]:rows;
  }
}
