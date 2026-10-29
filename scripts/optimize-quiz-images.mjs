import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import sharp from 'sharp';

// Originals and WebP fallbacks remain intact. Content hashes make long-lived cache safe.
const directory='public/tiago-gomes/images';
await fs.mkdir(path.join(directory,'optimized'),{recursive:true});
const report=[];
for(const name of ['tiago-rota-do-dolar','tiago-momentos-hero']){
 for(const width of [576,768,960,1152,1536]){
  const image=await sharp(path.join(directory,`${name}.png`)).resize({width,withoutEnlargement:true}).avif({quality:65,effort:6,chromaSubsampling:'4:4:4'}).toBuffer();
  const sha256=createHash('sha256').update(image).digest('hex');
  const hash=sha256.slice(0,12);
  const filename=`${name}-${width}.${hash}.avif`;
  await fs.writeFile(path.join(directory,'optimized',filename),image);
  const fallback=await fs.stat(path.join(directory,`${name}-${width}.webp`)).catch(error=>{
   if(error.code==='ENOENT')return null;
   throw error;
  });
  report.push({name,width,src:`/tiago-gomes/images/optimized/${filename}`,bytes:image.length,sha256,...(fallback?{webpBytes:fallback.size,savingsPercent:Number((100*(1-image.length/fallback.size)).toFixed(1))}:{})});
 }
}
await fs.mkdir('outputs/performance',{recursive:true});
await fs.writeFile('outputs/performance/images.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
