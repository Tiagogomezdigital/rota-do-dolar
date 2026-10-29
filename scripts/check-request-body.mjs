import assert from 'node:assert/strict';
import {readLimitedText,RequestBodyTooLargeError} from '../lib/request-body.ts';

const encoder=new TextEncoder(),limit=2048;
const request=(body,headers={})=>new Request('http://localhost/api/journey',{
  method:'POST',body,headers,duplex:'half',
});

assert.equal(await readLimitedText(request(null),limit),'');
assert.equal(await readLimitedText(request('a'.repeat(limit)),limit),'a'.repeat(limit));
await assert.rejects(readLimitedText(request('a'.repeat(limit+1)),limit),RequestBodyTooLargeError);
await assert.rejects(readLimitedText(request('é'.repeat(1025)),limit),RequestBodyTooLargeError);

// The decoder must preserve a code point split across network chunks.
const unicode='{"source":"olá 🌎"}',encoded=encoder.encode(unicode);
const split=new ReadableStream({start(controller){
  for(const byte of encoded)controller.enqueue(Uint8Array.of(byte));
  controller.close();
}});
assert.equal(await readLimitedText(request(split),limit),unicode);

// A large declared length is rejected without consuming a single body chunk.
let declaredPulled=0,declaredCancelled=false;
const declared=new ReadableStream({
  pull(controller){declaredPulled++;controller.enqueue(encoder.encode('x'));},
  cancel(){declaredCancelled=true;},
},{highWaterMark:0});
await assert.rejects(readLimitedText(request(declared,{'Content-Length':'99999999'}),limit),RequestBodyTooLargeError);
assert.equal(declaredPulled,0);
assert.equal(declaredCancelled,true);

// Missing or understated Content-Length cannot bypass the streaming byte cap.
for(const headers of [{},{'Content-Length':'1'}]){
  let reads=0,cancelled=false;
  const body=new ReadableStream({
    pull(controller){reads++;controller.enqueue(new Uint8Array(1024));},
    cancel(){cancelled=true;},
  },{highWaterMark:0});
  await assert.rejects(readLimitedText(request(body,headers),limit),RequestBodyTooLargeError);
  assert.equal(reads,3,'Stop reading immediately after exceeding the limit.');
  assert.equal(cancelled,true);
}

// A broken upload must propagate failure instead of yielding truncated JSON.
const broken=new ReadableStream({start(controller){controller.error(new Error('connection lost'));}});
await assert.rejects(readLimitedText(request(broken),limit),/connection lost/);
console.log('PASS: bounded body streaming, declared/actual byte limits, cancellation, split UTF-8 and upload failure.');
