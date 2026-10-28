import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createClient} from '@libsql/client/web';

const args=process.argv.slice(2);
if(args.length!==2||args[0]!=='--env-file')throw new Error('Use --env-file <private-env-file>.');
process.loadEnvFile(resolve(args[1]));
const url=process.env.TURSO_DATABASE_URL,authToken=process.env.TURSO_AUTH_TOKEN;
if(!url||!authToken||!/^(libsql|https):\/\//.test(url))throw new Error('An explicit remote database is required.');
const client=createClient({url,authToken});
try{
 await client.executeMultiple(await readFile(new URL('../db/auth-schema.sql',import.meta.url),'utf8'));
 const result=await client.execute("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'auth_%' ORDER BY name");
 console.log(JSON.stringify({status:'auth-schema-ready',tables:result.rows.map(row=>row.name)}));
}catch{console.error('Authentication schema initialization failed.');process.exitCode=1;}
finally{client.close();}
