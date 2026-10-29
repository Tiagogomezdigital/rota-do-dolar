import {fileURLToPath} from 'node:url';

const [command,...args]=process.argv.slice(2);
if(!['dev','build','start'].includes(command))throw new Error('Expected dev, build or start.');
process.env.QUIZ_RUNTIME='vercel';
const cliUrl=new URL('../node_modules/next/dist/bin/next',import.meta.url);
const cli=fileURLToPath(cliUrl);
process.argv=[process.execPath,cli,command,...(command==='start'?[]:['--webpack']),...args];
await import(cliUrl.href);
