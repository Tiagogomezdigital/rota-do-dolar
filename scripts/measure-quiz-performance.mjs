/**
 * Reproducible navigation measurements of a local production build using TEST data.
 *
 * Install the audit tool separately from application dependencies:
 *   npm install --prefix outputs/perf-tools --no-save --package-lock=false lighthouse@13.6.0
 *
 * Run alone, with the local server already configured for QUIZ_TEST_TURSO_*:
 *   node scripts/measure-quiz-performance.mjs --phase before --url http://localhost:5190/ --confirm-test-db
 *   node scripts/measure-quiz-performance.mjs --phase after --url http://localhost:5191/ --confirm-test-db
 * Optional: QUIZ_CHROME_PATH points to the Chrome executable; otherwise chrome-launcher discovers it.
 *
 * The confirmation is required because loading the real app initializes TEST sessions.
 * This runner cannot inspect the server's database binding. It never accepts a remote URL.
 * Use a new phase name for every repeat: existing evidence is never overwritten.
 *
 * Protocol: three mobile runs, then one desktop run, sequentially. Each uses a fresh
 * browser profile and Lighthouse's default throttling/storage reset for that preset.
 * No requests, third-party scripts, content, fonts, caches or traces are intercepted.
 * Keep Lighthouse/Chrome versions and machine conditions equivalent before/after.
 *
 * JSON/HTML reports, profiles and summary.json go under ignored outputs/performance/PHASE.
 * Times are milliseconds; transfer sizes are bytes; CLS is unitless; scores are 0..100.
 * `ttfb` is Lighthouse's modeled navigation timeToFirstByte; `serverResponseTime` is
 * its observed server-response-time audit. Neither is real-user p75 or serverless capacity.
 * Navigation runs do not measure INP; TBT is the lab main-thread metric, not an INP substitute.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';

const projectRoot=fileURLToPath(new URL('../',import.meta.url));
const toolsDirectory=path.join(projectRoot,'outputs','perf-tools');
const help=`Usage:
  node scripts/measure-quiz-performance.mjs --phase NAME --url http://localhost:5190/ --confirm-test-db

Options:
  --phase NAME         Report folder name, lowercase letters/digits/hyphens (default: before).
  --url URL            Local production-build URL (default: http://localhost:5190/).
  --confirm-test-db    Confirm this local server uses only the TEST database.
  --help              Show these instructions without loading tools or opening Chrome.

Environment:
  QUIZ_CHROME_PATH    Optional Chrome executable path.

Install tools in isolation:
  npm install --prefix outputs/perf-tools --no-save --package-lock=false lighthouse@13.6.0

Runs exactly 3 mobile + 1 desktop audits, sequentially, with fresh browser profiles.
Reports are saved to outputs/performance/NAME; an existing nonempty folder is rejected.
Do not run concurrent builds, browser tests or other Lighthouse audits during measurement.
`;

function options(args){
  const result={phase:'before',url:'http://localhost:5190/',confirmed:false,help:false};
  for(let i=0;i<args.length;i++){
    const arg=args[i];
    if(arg==='--help'){result.help=true;continue;}
    if(arg==='--confirm-test-db'){result.confirmed=true;continue;}
    if(arg==='--phase'||arg==='--url'){
      const value=args[++i];
      if(!value||value.startsWith('--'))throw new Error(`Missing value for ${arg}.`);
      result[arg.slice(2)]=value;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}. Use --help.`);
  }
  return result;
}

function isolatedModule(require,specifier){
  const resolved=require.resolve(specifier);
  const relative=path.relative(path.join(toolsDirectory,'node_modules'),resolved);
  if(relative.startsWith('..')||path.isAbsolute(relative))throw new Error(`${specifier} must be installed inside outputs/perf-tools, not application dependencies.`);
  return pathToFileURL(resolved).href;
}

async function main(){
  const config=options(process.argv.slice(2));
  if(config.help){console.log(help);return;}
  if(!/^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/.test(config.phase))throw new Error('Unsafe phase name. Use 1–64 lowercase letters, digits or internal hyphens.');
  const url=new URL(config.url);
  if(!['http:','https:'].includes(url.protocol)||!['localhost','127.0.0.1','[::1]'].includes(url.hostname)||url.username||url.password||url.hash)throw new Error('Use an HTTP(S) localhost/loopback URL without credentials or a fragment. Remote audits are not supported by this runner.');
  if(!config.confirmed)throw new Error('Pass --confirm-test-db only after confirming the local server uses QUIZ_TEST_TURSO_*. Loading the app creates TEST sessions.');

  const require=createRequire(path.join(toolsDirectory,'package.json'));
  let lighthouse,launch,desktopConfig;
  try{
    ({default:lighthouse}=await import(isolatedModule(require,'lighthouse')));
    ({launch}=await import(isolatedModule(require,'chrome-launcher')));
    ({default:desktopConfig}=await import(isolatedModule(require,'lighthouse/core/config/desktop-config.js')));
  }catch(error){
    throw new Error(`Audit tools unavailable: ${error.message}\nInstall: npm install --prefix outputs/perf-tools --no-save --package-lock=false lighthouse@13.6.0`);
  }

  const folder=path.join(projectRoot,'outputs','performance',config.phase);
  await fs.mkdir(folder,{recursive:true});
  if((await fs.readdir(folder)).length)throw new Error(`Report folder already contains evidence: ${folder}. Choose a new --phase.`);

  const results=[];
  let runtimeFailure=false;
  for(const mode of ['mobile','mobile','mobile','desktop']){
    const index=results.filter(result=>result.mode===mode).length+1;
    const profile=await fs.mkdtemp(path.join(folder,`chrome-${mode}-${index}-`));
    const chrome=await launch({
      chromePath:process.env.QUIZ_CHROME_PATH||undefined,
      chromeFlags:['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check'],
      userDataDir:profile,
    });
    try{
      const run=await lighthouse(url.href,{
        port:chrome.port,
        output:['json','html'],
        logLevel:'error',
        onlyCategories:['performance','accessibility','best-practices'],
      },mode==='desktop'?desktopConfig:undefined);
      if(!run)throw new Error(`Lighthouse returned no report for ${mode}-${index}. No automatic retry was performed.`);
      const lhr=run.lhr;
      await fs.writeFile(path.join(folder,`${mode}-${index}.json`),JSON.stringify(lhr,null,2));
      await fs.writeFile(path.join(folder,`${mode}-${index}.html`),run.report[1]);
      const value=id=>lhr.audits[id]?.numericValue??null;
      const score=id=>typeof lhr.categories[id]?.score==='number'?lhr.categories[id].score*100:null;
      const network=lhr.audits['network-requests']?.details?.items;
      const metrics={
        mode,index,version:lhr.lighthouseVersion,
        performance:score('performance'),accessibility:score('accessibility'),bestPractices:score('best-practices'),
        lcp:value('largest-contentful-paint'),fcp:value('first-contentful-paint'),
        cls:value('cumulative-layout-shift'),tbt:value('total-blocking-time'),speedIndex:value('speed-index'),
        ttfb:lhr.audits.metrics?.details?.items?.[0]?.timeToFirstByte??null,
        serverResponseTime:value('server-response-time'),
        transfer:value('total-byte-weight'),
        requests:Array.isArray(network)?network.length:null,
        scriptTransfer:Array.isArray(network)?network.filter(request=>request.resourceType==='Script').reduce((sum,request)=>sum+(request.transferSize||0),0):null,
        settings:lhr.configSettings,errors:lhr.runtimeError||null,
        url:lhr.finalDisplayedUrl||lhr.finalUrl||url.href,fetchTime:lhr.fetchTime,
        environment:lhr.environment,warnings:lhr.runWarnings||[],
      };
      runtimeFailure ||= !!lhr.runtimeError;
      results.push(metrics);
      console.log(JSON.stringify(metrics));
      await fs.writeFile(path.join(folder,'summary.json'),JSON.stringify(results,null,2));
    }finally{
      await chrome.kill();
    }
  }
  if(runtimeFailure)throw new Error('At least one Lighthouse run reported a runtime error. Inspect the saved reports; do not treat this phase as a complete passing measurement.');
  console.log(`Saved ${results.length} audits to ${folder}`);
}

main().catch(error=>{console.error(error.message);process.exitCode=1;});
