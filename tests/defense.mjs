import assert from 'node:assert/strict';
import {DefenseGame,combined,TROOPS,wavePlan,highestTier,squadPower} from '../defense-engine.js';
assert.deepEqual(combined([5,0,0]),[0,1,0]);assert.deepEqual(combined([0,5,0]),[0,0,1]);assert.deepEqual(combined([5,4,0]),[0,0,1]);
let g=new DefenseGame();assert.equal(g.gold,230);assert.equal(g.wave,1);assert.equal(g.slots[3].counts[0],2);
assert.equal(g.recruit(2,'cavalry').ok,false);assert.equal(g.recruit(5,'archer').ok,false);
const before=g.gold;assert.equal(g.recruit(3,'cavalry').ok,false);assert.equal(g.gold,before);
for(let i=0;i<3;i++)assert.equal(g.recruit(3,'infantry').ok,true);
assert.deepEqual(g.slots[3].counts,[0,1,0]);assert.equal(highestTier(g.slots[3]),2);assert.equal(squadPower(g.slots[3]),6);
assert.equal(g.start(),true);const gold=g.gold;assert.equal(g.recruit(0,'archer').ok,false);assert.equal(g.sell(0).ok,false);assert.equal(g.gold,gold);assert.equal(g.start(),false);
g=new DefenseGame();g.slots.fill(null);g.gold=100000;for(let i=0;i<25;i++)assert.equal(g.recruit(0,'archer').ok,true);assert.deepEqual(g.slots[0].counts,[0,0,1]);
for(let i=25;i<125;i++)assert.equal(g.recruit(0,'archer').ok,true);assert.deepEqual(g.slots[0].counts,[0,0,5]);assert.equal(g.recruit(0,'archer').ok,false);assert.equal(g.slots[0].counts[2],5);
const refund=Math.floor(g.slots[0].spent*.7),oldGold=g.gold;g.sell(0);assert.equal(g.gold,oldGold+refund);assert.equal(g.slots[0],null);assert.equal(g.start(),false);
for(let w=1;w<=10;w++){const bosses=wavePlan(w).filter(e=>e.kind!=='raider');assert.equal(bosses.length,[5,10].includes(w)?1:0);if(w===5)assert.equal(bosses[0].kind,'captain');if(w===10)assert.equal(bosses[0].kind,'warlord');}
// A mixed legal recruitment policy can win; the old archer-only policy now fails.
const {simulate,runBatch}=await import('../scripts/simulate-defense.mjs');
assert.equal(simulate([.8,.1,.1],1,'focus',35).won,true);
assert.equal(simulate([1,0,0],1,'spread',7).won,false);
// Reward only once, no transition skipping.
g=new DefenseGame();g.start();for(let i=0;i<10000&&g.phase==='battle';i++)g.step(.05);
assert.equal(g.phase,'cleared');assert.equal(g.reward,60);const earned=g.gold;g.step(1);assert.equal(g.gold,earned);assert.equal(g.next(),true);assert.equal(g.next(),false);
// An underfunded force can lose; dead state is stable and does not grant a reward.
g=new DefenseGame();g.slots.fill(null);g.gold=30;g.recruit(3,'infantry');g.wave=10;g.start();for(let t=0;t<1800&&g.phase==='battle';t++)g.step(.1);assert.equal(g.phase,'lost');assert.equal(g.health,0);const lostGold=g.gold;g.step(100);assert.equal(g.gold,lostGold);
console.log('PASS: placement rules, funds, merges through tier 3, capacity, refunds, ten waves, both bosses, victory, loss and one-time rewards');
