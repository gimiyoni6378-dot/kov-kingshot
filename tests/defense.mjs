import assert from 'node:assert/strict';
import {DefenseGame,combined,wavePlan,highestTier,squadPower,START_GOLD} from '../defense-engine.js';
assert.deepEqual(combined([5,0,0]),[0,1,0]);assert.deepEqual(combined([0,5,0]),[0,0,1]);assert.deepEqual(combined([5,4,0]),[0,0,1]);
let g=new DefenseGame();assert.equal(START_GOLD,200);assert.equal(g.gold,200);assert.equal(g.wave,1);assert.ok(g.slots.every(slot=>slot===null));assert.equal(g.start(),false);
assert.equal(g.recruit(2,'cavalry').ok,false);assert.equal(g.recruit(5,'archer').ok,false);assert.equal(g.gold,200);
g.recruit(3,'infantry');const before=g.gold;assert.equal(g.recruit(3,'cavalry').ok,false);assert.equal(g.gold,before);
for(let i=0;i<4;i++)assert.equal(g.recruit(3,'infantry').ok,true);
assert.equal(g.gold,50);assert.deepEqual(g.slots[3].counts,[0,1,0]);assert.equal(highestTier(g.slots[3]),2);assert.equal(squadPower(g.slots[3]),6);
assert.equal(g.start(),true);const gold=g.gold;assert.equal(g.recruit(0,'archer').ok,false);assert.equal(g.sell(3).ok,false);assert.equal(g.refundValue(3),0);assert.equal(g.gold,gold);assert.equal(g.start(),false);
// Isolated tier-cap fixture; this is not the legitimate balance simulation.
g=new DefenseGame();g.gold=100000;for(let i=0;i<25;i++)assert.equal(g.recruit(0,'archer').ok,true);assert.deepEqual(g.slots[0].counts,[0,0,1]);
for(let i=25;i<125;i++)assert.equal(g.recruit(0,'archer').ok,true);assert.deepEqual(g.slots[0].counts,[0,0,5]);assert.equal(g.recruit(0,'archer').ok,false);
const refund=Math.floor(g.slots[0].spent*.7),oldGold=g.gold;assert.equal(g.refundValue(0),refund);g.sell(0);assert.equal(g.gold,oldGold+refund);assert.equal(g.slots[0],null);assert.equal(g.sell(0).ok,false);assert.equal(g.gold,oldGold+refund);assert.equal(g.start(),false);
g.reset();assert.equal(g.gold,200);assert.ok(g.slots.every(slot=>slot===null));
for(let w=1;w<=10;w++){const bosses=wavePlan(w).filter(e=>e.kind!=='raider');assert.equal(bosses.length,[5,10].includes(w)?1:0);if(w===5)assert.equal(bosses[0].kind,'captain');if(w===10)assert.equal(bosses[0].kind,'warlord');}
const {simulate}=await import('../scripts/simulate-defense.mjs');
const winning=simulate([.1,.1,.8],.8,'focus',50);assert.equal(winning.won,true);assert.equal(winning.startingGold,200);assert.equal(winning.startingUnits,0);
assert.equal(simulate([1,0,0],1,'spread',7).won,false);
// A legally purchased opening can clear wave 1; no repeated reward or skipped preparation.
g=new DefenseGame();g.recruit(0,'archer');g.recruit(1,'archer');g.recruit(3,'infantry');g.recruit(4,'infantry');g.start();for(let i=0;i<10000&&g.phase==='battle';i++)g.step(.05);
assert.equal(g.phase,'cleared');assert.equal(g.reward,70);const earned=g.gold;g.step(1);assert.equal(g.gold,earned);assert.equal(g.next(),true);assert.equal(g.next(),false);
g=new DefenseGame();g.recruit(3,'infantry');g.wave=10;g.start();for(let t=0;t<1800&&g.phase==='battle';t++)g.step(.1);assert.equal(g.phase,'lost');assert.equal(g.health,0);const lostGold=g.gold;g.step(100);assert.equal(g.gold,lostGold);
console.log('PASS: empty 200G start/reset, placement, funds, merges, capacity, refund/no double refund, bosses, legal ten-wave win, failure and one-time rewards');
