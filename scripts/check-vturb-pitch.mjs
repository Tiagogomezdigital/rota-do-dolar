import assert from 'node:assert/strict';
import {registerVturbPitch} from '../lib/vturb-pitch.ts';
import {content} from '../lib/content.ts';

const calls=[];
const player={displayHiddenElements:(...args)=>calls.push(args)};
const selector='#thanks-pitch-offer';
for(const time of [null,undefined,NaN,Infinity,-1,'318']){
  assert.equal(registerVturbPitch(player,time,selector),false,'Invalid timing must stay hidden.');
}
for(const unavailable of [null,undefined,{}, {displayHiddenElements:1}]){
  assert.equal(registerVturbPitch(unavailable,318,selector),false,'An unavailable SDK cannot unlock the CTA.');
}
assert.equal(calls.length,0,'Invalid input must never schedule a reveal.');
assert.equal(registerVturbPitch(player,318,selector),true);
assert.deepEqual(calls,[[318,[selector],{display:'block',persist:false}]],'Use the video SDK at 5:18 without persisting an earlier unlock.');
assert.equal(content.thanks.video.revealAtSeconds,318);
assert.equal(content.thanks.showButtonImmediately,false);
assert.equal(content.thanks.video.ctaMode,'after-playback');
assert.equal(content.thanks.video.vturb.id,'vid-6ae2fcace18a71ff77483cdb');
assert.equal(content.thanks.destination,'https://affiliates.express/zj6w12ob9r');
assert.equal(content.offer.video.ctaMode,'immediate','The main quiz VSL must retain its immediate checkout.');
console.log('PASS: VTurb pitch at 318 seconds, hidden by default, no persistent unlock, correct video and affiliate destination.');
