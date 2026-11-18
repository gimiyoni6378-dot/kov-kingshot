import assert from 'node:assert/strict';
import {DefenseGame,unitStats,squadHealth} from '../defense-engine.js';
assert.deepEqual([1,2,3].map(t=>unitStats('archer',t).hp),[70,420,2520]);
assert.deepEqual([1,2,3].map(t=>unitStats('infantry',t).damage),[17,102,612]);
assert.deepEqual([1,2,3].map(t=>unitStats('cavalry',t).hp),[140,840,5040]);
let g=new DefenseGame();g.recruit(3,'infantry');g.recruit(3,'infantry');const old=squadHealth(g.slots[3]).hp;g.damageSquad(3,100);assert.equal(squadHealth(g.slots[3]).hp,old-60,'Infantry reduces damage by 40%');
for(let i=0;i<3;i++)g.recruit(3,'infantry');assert.equal(g.slots[3].members.length,1);assert.equal(g.slots[3].members[0].maxHp,1200);assert.equal(g.slots[3].members[0].hp,1128,'Merge preserves wound fraction');
g.damageSquad(3,100000);assert.equal(g.slots[3],null);assert.equal(g.deaths,1);assert.equal(g.sell(3).ok,false,'Cannot refund dead members');
function prepare(){const x=new DefenseGame();x.enemies=[];x.spawn({kind:'raider',lane:1,shielded:true});x.enemies[0].y=.7;x.spawn({kind:'raider',lane:1});x.enemies[1].y=.74;return x;}
g=prepare();const hp=g.enemies[0].hp;g.resolveStrike({target:g.enemies[0].id,type:'archer',damage:12});assert.ok(Math.abs(g.enemies[0].hp-(hp-6))<1e-9);assert.ok(g.enemies[1].hp<g.enemies[1].maxHp,'Arrow pierces a second unit');
g=prepare();g.resolveStrike({target:g.enemies[0].id,type:'infantry',damage:17});assert.ok(Math.abs(g.enemies[0].hp-(hp-14.45))<1e-9,'Infantry breaks through shield armor');
g=prepare();g.resolveStrike({target:g.enemies[0].id,type:'cavalry',damage:23,charged:true});assert.equal(g.enemies[0].brokenUntil,3);assert.ok(g.enemies[1].hp<g.enemies[1].maxHp,'Charge damages nearby enemies');
g=new DefenseGame();g.recruit(0,'archer');g.recruit(4,'infantry');g.start();g.plan=[];g.pending=0;g.spawn({kind:'captain',lane:1});const boss=g.enemies[0];boss.y=.9;boss.rangedClock=0;const archer=g.slots[0].members[0].hp;g.step(.1);assert.equal(g.slots[0].members[0].hp,archer);assert.ok(squadHealth(g.slots[4]).hp<200,'Ground line draws boss ranged pressure');
// Hits are queued so projectile/swing precedes damage; health and death are real.
g=new DefenseGame();g.recruit(0,'archer');g.start();g.plan=[];g.pending=0;g.spawn({kind:'raider',lane:0});g.enemies[0].y=.7;g.slots[0].cooldown=0;g.step(.01);assert.ok(g.strikes.length>0);assert.equal(g.enemies[0].hp,g.enemies[0].maxHp);for(let i=0;i<10;i++)g.step(.05);assert.ok(g.effects.some(e=>['hit','defeat'].includes(e.type))||g.kills>0);
console.log('PASS: tier stats, armor, casualties, merge wounds, pierce, shield counter, charge AoE/armor break, boss targeting and delayed hits');
