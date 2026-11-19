import assert from 'node:assert/strict';
import {DefenseGame} from '../defense-engine.js';
import {recordGame,verifyReplay,rewardForStage,verifyRunReplay,LEGACY_SESSION_CUTOFF} from '../defense-replay.js';
import {simulate} from '../scripts/simulate-defense.mjs';
import {verifyReplay as serverReplay} from '../supabase/functions/defense-reward/replay.js';
assert.deepEqual(Array.from({length:11},(_,stage)=>rewardForStage(stage)),[0,0,0,0,0,30,40,40,40,50,100]);
const checkpoints=[];let commands;
class Recorded extends DefenseGame{
 constructor(balance){super(balance);commands=recordGame(this);}
 step(dt){const previous=this.phase;super.step(dt);if(previous==='battle'&&['cleared','won'].includes(this.phase))checkpoints.push({stage:this.wave,commands:structuredClone(commands)});}
}
assert.equal(simulate([.3,.5,.2],1,'focus',80,{},Recorded).won,true);
assert.equal(checkpoints.length,10);
for(const point of checkpoints){const result=verifyReplay(point.commands);assert.deepEqual(serverReplay(point.commands),result);assert.equal(result.cleared,point.stage);assert.equal(result.points,rewardForStage(point.stage));assert.ok(result.ticks>0);}
assert.equal(verifyReplay([]).points,0);
assert.equal(verifyReplay([{op:'recruit',slot:0,type:'archer'},{op:'sell',slot:0}]).points,0);
assert.throws(()=>verifyReplay([{op:'recruit',slot:5,type:'archer'}]));
assert.throws(()=>verifyReplay([{op:'next'}]));
assert.throws(()=>verifyReplay([{op:'award',points:100,cleared:10}]));
assert.throws(()=>verifyReplay(Array(3001).fill({op:'next'})));
const tampered=structuredClone(checkpoints[9].commands);tampered[0].type='cavalry';assert.throws(()=>verifyReplay(tampered));
console.log('PASS: legal full replay, all ten reward boundaries, refunds, invalid placement/advancement, forged scores and oversized replays');

assert.throws(()=>verifyRunReplay([],1,LEGACY_SESSION_CUTOFF),/Legacy rules expired/);
assert.equal(verifyRunReplay([],1,'2026-11-18T17:00:00Z').points,0);
assert.equal(verifyRunReplay([],2,'2026-11-19T00:00:00Z').points,0);
assert.throws(()=>verifyReplay([],5),/Unsupported/);
const {DefenseGame:Legacy}=await import('../defense-engine-v1.js');
let oldCommands;
class OldRecorded extends Legacy{constructor(balance){super(balance);oldCommands=recordGame(this);}}
assert.equal(simulate([.8,.1,.1],1,'focus',35,{},OldRecorded).won,true);
assert.equal(verifyRunReplay(oldCommands,1,'2026-11-18T17:00:00Z').points,100);assert.deepEqual(serverReplay(oldCommands,1),verifyReplay(oldCommands,1));
console.log('PASS: legacy pending replay, cutoff blocks new easy-rule sessions, current balance accepted');
