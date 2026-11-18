import assert from 'node:assert/strict';
import {DefenseGame} from '../defense-engine.js';
import {recordGame,verifyReplay,rewardForStage} from '../defense-replay.js';
import {simulate} from '../scripts/simulate-defense.mjs';
assert.deepEqual(Array.from({length:11},(_,stage)=>rewardForStage(stage)),[0,0,0,0,0,30,40,40,40,50,100]);
const checkpoints=[];let commands;
class Recorded extends DefenseGame{
 constructor(balance){super(balance);commands=recordGame(this);}
 step(dt){const previous=this.phase;super.step(dt);if(previous==='battle'&&['cleared','won'].includes(this.phase))checkpoints.push({stage:this.wave,commands:structuredClone(commands)});}
}
assert.equal(simulate([.8,.1,.1],1,'focus',35,{},Recorded).won,true);
assert.equal(checkpoints.length,10);
for(const point of checkpoints){const result=verifyReplay(point.commands);assert.equal(result.cleared,point.stage);assert.equal(result.points,rewardForStage(point.stage));assert.ok(result.ticks>0);}
assert.equal(verifyReplay([]).points,0);
assert.equal(verifyReplay([{op:'recruit',slot:0,type:'archer'},{op:'sell',slot:0}]).points,0);
assert.throws(()=>verifyReplay([{op:'recruit',slot:5,type:'archer'}]));
assert.throws(()=>verifyReplay([{op:'next'}]));
assert.throws(()=>verifyReplay([{op:'award',points:100,cleared:10}]));
assert.throws(()=>verifyReplay(Array(3001).fill({op:'next'})));
const tampered=structuredClone(checkpoints[9].commands);tampered[0].type='cavalry';assert.throws(()=>verifyReplay(tampered));
console.log('PASS: legal full replay, all ten reward boundaries, refunds, invalid placement/advancement, forged scores and oversized replays');
