import assert from 'node:assert/strict';
import {DefenseGame,TROOPS} from '../defense-engine.js';
import {DefenseGame as Previous,TROOPS as oldTroops} from '../defense-engine-v4.js';
import {recordGame,verifyReplay,BALANCE_VERSION} from '../defense-replay.js';
import {verifyReplay as serverReplay} from '../supabase/functions/defense-reward/replay.js';
const g=new DefenseGame();g.recruit(3,'cavalry');g.phase='battle';g.plan=[];g.pending=0;g.slots[3].chargeCooldown=999;
for(let lane=0;lane<3;lane++){g.spawn({kind:'raider',lane});Object.assign(g.enemies.at(-1),{y:.66,hp:1000,maxHp:1000,speed:0,damage:0});}
for(let i=0;i<95;i++)g.step(1/60);
assert.ok(Math.abs(g.enemies[0].hp-977)<1e-8);for(const e of g.enemies.slice(1))assert.ok(Math.abs(e.hp-983.9)<1e-8,'Other lanes take70% damage');
g.slots[3].chargeCooldown=0;for(let i=0;i<50;i++)g.step(1/60);assert.ok(g.enemies.some(e=>e.brokenUntil>g.clock),'Cross-lane targeting retains charge armor break');
assert.equal(TROOPS.cavalry.lane,false);assert.equal(oldTroops.cavalry.lane,true);
for(const [Version,Game] of [[4,Previous],[BALANCE_VERSION,DefenseGame]]){
 const game=new Game(),commands=recordGame(game);game.recruit(3,'cavalry');game.recruit(0,'archer');game.start();while(game.phase==='battle')game.step(1/60);
 assert.deepEqual(verifyReplay(commands,Version),serverReplay(commands,Version));
 assert.equal(verifyReplay(commands,Version).phase,game.phase);
}
console.log('PASS: cavalry rotates all lanes, full own-lane/70% cross-lane damage, retained charge/debuff and v4/current server replay parity');
