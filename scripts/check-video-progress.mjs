import assert from 'node:assert/strict';
import {getVideoProgress} from '../lib/video-progress.ts';

const interval=(start,end)=>({start,end});
const repeated=[interval(0,30),interval(0,30),interval(10,30)];
assert.deepEqual(getVideoProgress(repeated,60),{watched:30,unlocked:false},'Replaying the first half cannot unlock the pitch.');
assert.deepEqual(getVideoProgress([interval(0,30),interval(60,90)],60),{watched:60,unlocked:false},'A seek leaves the skipped section unwatched even when total unique playback reaches 60 seconds.');
assert.deepEqual(getVideoProgress([interval(30,60)],60),{watched:30,unlocked:false},'Starting at the pitch cannot unlock the button.');
assert.deepEqual(getVideoProgress([interval(30,60),interval(0,35)],60),{watched:60,unlocked:true},'Actually returning to watch the gap completes coverage.');
assert.deepEqual(getVideoProgress([interval(0,59.9)],60),{watched:59.9,unlocked:false});
assert.deepEqual(getVideoProgress([interval(0,60)],60),{watched:60,unlocked:true},'Normal playback unlocks when the pitch is reached.');
assert.deepEqual(getVideoProgress([interval(0,20),interval(20,40),interval(40,60)],60),{watched:60,unlocked:true},'Adjacent media ranges join without double counting.');

// The component remounts its player when the source or reveal time changes.
assert.equal(getVideoProgress([],60).unlocked,false,'A new source starts with no playback coverage.');
assert.equal(getVideoProgress([interval(0,60)],90).unlocked,false,'A changed pitch uses the new threshold.');
for(const delay of [null,undefined,NaN,Infinity,-1])assert.equal(getVideoProgress([interval(0,120)],delay).unlocked,false,'Missing or invalid pitch settings stay blocked.');
assert.equal(getVideoProgress([],0).unlocked,false,'A zero threshold still requires actual playback.');
assert.equal(getVideoProgress([interval(0,0.25)],0).unlocked,true);
assert.deepEqual(getVideoProgress([interval(-5,20),interval(0,NaN),interval(3,2),interval(0,0)],0),{watched:0,unlocked:false},'Invalid ranges cannot unlock the button.');
assert.deepEqual(repeated,[interval(0,30),interval(0,30),interval(10,30)],'The media range input is never mutated.');
console.log('PASS: unique playback coverage, repeated segments, seeks, normal pitch release and fresh configuration.');
