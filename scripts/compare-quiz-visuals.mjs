/**
 * Compare recorded screenshots and browser measurements without opening a browser.
 *
 *   node scripts/compare-quiz-visuals.mjs
 *   node scripts/compare-quiz-visuals.mjs --before outputs/performance/before/browser --after outputs/performance/after/browser --out outputs/performance/visual-comparison.json
 *
 * Uses the existing sharp dependency. It does not alter snapshots or mask photos,
 * videos, animations or anti-aliasing. All pixel differences are reported, including
 * those expected from image compression and the live VTurb player. Inspect their
 * bounds and screenshots before deciding whether they are a visual regression.
 * A zero exit code means files, recorded geometry, checkout URL and captured errors
 * are consistent; it does not certify that different pixels are visually acceptable.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';

const root=fileURLToPath(new URL('../',import.meta.url));
const defaults={
  before:'outputs/performance/before/browser',
  after:'outputs/performance/after/browser',
  out:'outputs/performance/visual-comparison.json',
};

function options(args){
  const config={...defaults};
  for(let i=0;i<args.length;i++){
    const option=args[i];
    if(option==='--help')return null;
    if(!['--before','--after','--out'].includes(option))throw new Error(`Unknown argument: ${option}`);
    const value=args[++i];
    if(!value||value.startsWith('--'))throw new Error(`Missing value for ${option}`);
    config[option.slice(2)]=value;
  }
  return Object.fromEntries(Object.entries(config).map(([key,value])=>[key,path.resolve(root,value)]));
}

async function comparePixels(before,after,name){
  const [a,b]=await Promise.all([before,after].map(directory=>sharp(path.join(directory,name)).removeAlpha().toColourspace('srgb').raw().toBuffer({resolveWithObject:true})));
  const dimensionsMatch=a.info.width===b.info.width&&a.info.height===b.info.height&&a.info.channels===b.info.channels;
  if(!dimensionsMatch)return {name,dimensionsMatch,beforeDimensions:a.info,afterDimensions:b.info};
  const {width,height,channels}=a.info;
  let differentPixels=0,sumAbsoluteDifference=0,maxChannelDifference=0;
  let left=width,top=height,right=-1,bottom=-1;
  for(let offset=0;offset<a.data.length;offset+=channels){
    let pixelDifference=0;
    for(let channel=0;channel<channels;channel++){
      const difference=Math.abs(a.data[offset+channel]-b.data[offset+channel]);
      sumAbsoluteDifference+=difference;
      maxChannelDifference=Math.max(maxChannelDifference,difference);
      pixelDifference=Math.max(pixelDifference,difference);
    }
    if(pixelDifference===0)continue;
    differentPixels++;
    const pixel=offset/channels,x=pixel%width,y=Math.floor(pixel/width);
    left=Math.min(left,x);right=Math.max(right,x);
    top=Math.min(top,y);bottom=Math.max(bottom,y);
  }
  return {
    name,dimensionsMatch,width,height,differentPixels,
    differentPercent:differentPixels/(width*height)*100,
    meanAbsoluteChannelDifference:sumAbsoluteDifference/a.data.length,
    maxChannelDifference,
    // Inclusive coordinates in screenshot pixels, not CSS viewport coordinates.
    differenceBounds:differentPixels?{left,top,right,bottom}:null,
  };
}

async function main(){
  const config=options(process.argv.slice(2));
  if(!config){console.log('node scripts/compare-quiz-visuals.mjs [--before DIR] [--after DIR] [--out FILE]\nDefaults: outputs/performance/{before,after}/browser and outputs/performance/visual-comparison.json');return;}
  if(config.before===config.after)throw new Error('Before and after must be different snapshot directories.');
  const [before,after,beforeFiles,afterFiles]=await Promise.all([
    fs.readFile(path.join(config.before,'results.json'),'utf8').then(JSON.parse),
    fs.readFile(path.join(config.after,'results.json'),'utf8').then(JSON.parse),
    fs.readdir(config.before),fs.readdir(config.after),
  ]);
  if(!Array.isArray(before.measurements)||!Array.isArray(after.measurements))throw new Error('Both results.json files must contain a measurements array.');
  const key=measurement=>`${measurement.step}:${measurement.width}`;
  const beforeMeasurements=new Map(before.measurements.map(value=>[key(value),value]));
  const afterMeasurements=new Map(after.measurements.map(value=>[key(value),value]));
  if(beforeMeasurements.size!==before.measurements.length||afterMeasurements.size!==after.measurements.length)throw new Error('Duplicate step/width measurements cannot be compared unambiguously.');
  const geometryDifferences=[];
  for(const id of new Set([...beforeMeasurements.keys(),...afterMeasurements.keys()])){
    const a=beforeMeasurements.get(id),b=afterMeasurements.get(id);
    if(JSON.stringify(a)!==JSON.stringify(b))geometryDifferences.push({id,before:a??null,after:b??null});
  }
  const beforePng=new Set(beforeFiles.filter(name=>name.endsWith('.png')));
  const afterPng=new Set(afterFiles.filter(name=>name.endsWith('.png')));
  const missingBefore=[...afterPng].filter(name=>!beforePng.has(name));
  const missingAfter=[...beforePng].filter(name=>!afterPng.has(name));
  const pixels=[];
  for(const name of [...beforePng].filter(name=>afterPng.has(name)).sort())pixels.push(await comparePixels(config.before,config.after,name));
  const dimensionsDifferent=pixels.filter(value=>!value.dimensionsMatch).length;
  const identical=pixels.filter(value=>value.differentPixels===0).length;
  const checkoutMatches=before.checkoutUrl===after.checkoutUrl;
  const errors={before:before.errors??null,after:after.errors??null};
  const capturedErrorsMissing=!Array.isArray(errors.before)||!Array.isArray(errors.after);
  const checksPass=!geometryDifferences.length&&!missingBefore.length&&!missingAfter.length&&!dimensionsDifferent&&checkoutMatches&&!capturedErrorsMissing&&!errors.before.length&&!errors.after.length;
  const report={
    generatedAt:new Date().toISOString(),
    inputs:{before:path.relative(root,config.before),after:path.relative(root,config.after)},
    summary:{
      checksPass,
      beforeMeasurements:before.measurements.length,afterMeasurements:after.measurements.length,
      geometryDifferences:geometryDifferences.length,
      screenshotPairs:pixels.length,pixelIdentical:identical,pixelDifferent:pixels.length-identical-dimensionsDifferent,dimensionsDifferent,
      checkoutMatches,capturedErrorsMissing,
      note:'Pixel differences are unmasked and require review. Video frames and image encoding can differ without changing layout.',
    },
    missingBefore,missingAfter,geometryDifferences,errors,pixels,
  };
  // Do not allow an output path to replace either evidence file or screenshot.
  const protectedFiles=new Set([config.before,config.after].flatMap(directory=>['results.json',...beforePng,...afterPng].map(name=>path.join(directory,name))));
  if(protectedFiles.has(config.out))throw new Error('The output path cannot overwrite an input measurement or screenshot.');
  await fs.mkdir(path.dirname(config.out),{recursive:true});
  await fs.writeFile(config.out,JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report.summary,null,2));
  console.log(`Report: ${config.out}`);
  if(!checksPass)process.exitCode=1;
}

main().catch(error=>{console.error(error.message);process.exitCode=1;});
