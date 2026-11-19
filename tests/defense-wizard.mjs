import assert from 'node:assert/strict';
import {DefenseGame,TROOPS,hiddenRoll,seedFromRunId} from '../defense-engine.js';
import {recordGame,verifyReplay,verifyRunReplay} from '../defense-replay.js';
import {verifyReplay as serverReplay} from '../supabase/functions/defense-reward/replay.js';
let runId;
for(let i=0;i<100000;i++){const id=`wizard-fixture-${i}`;if(hiddenRoll(seedFromRunId(id),1)<.01){runId=id;break;}}
assert.ok(runId);const seed=seedFromRunId(runId);let game=new DefenseGame({},seed);const commands=recordGame(game);
assert.equal(game.wizardAvailable,true);assert.equal(game.slots.filter(Boolean).length,0);
assert.equal(game.recruit(3,'wizard').ok,false);assert.equal(game.gold,200);
assert.equal(game.recruit(0,'wizard').ok,true);assert.equal(game.gold,200);assert.equal(game.slots[0].members[0].hp,TROOPS.archer.hp);assert.equal(TROOPS.wizard.damage,TROOPS.archer.damage);
assert.equal(game.recruit(1,'wizard').ok,false);assert.equal(game.slots[0].counts[0],1);
assert.deepEqual(serverReplay(commands,3,runId),verifyReplay(commands,3,runId));
assert.throws(()=>verifyReplay(commands,3,'not-the-winning-run'),'Cannot forge wizard unlock with another run');
game.sell(0);assert.equal(game.recruit(1,'wizard').ok,false);for(let wave=2;wave<=10;wave++)game.rollHidden(wave);assert.equal(game.wizardAvailable,false);
assert.equal(new DefenseGame({},seed).wizardAvailable,true,'Reset must preserve roll when using same run seed');
// Distribution sanity check; probability is a fixed1% per eligible wave.
let first=0,any=0;for(let i=0;i<50000;i++){const s=seedFromRunId(`distribution-${i}`);if(hiddenRoll(s,1)<.01)first++;if(Array.from({length:10},(_,j)=>hiddenRoll(s,j+1)).some(x=>x<.01))any++;}
assert.ok(first>400&&first<600);assert.ok(any>4300&&any<5300);
function battlefield(g){g.phase='battle';g.plan=[];g.pending=0;for(let lane=0;lane<3;lane++){g.spawn({kind:'raider',lane});const e=g.enemies.at(-1);e.y=.66;e.hp=e.maxHp=1000;e.speed=0;e.damage=0;}}
game=new DefenseGame({},seed);game.recruit(0,'wizard');battlefield(game);for(let i=0;i<24;i++)game.step(1/60);assert.ok(game.enemies.every(e=>e.hp===988),'One fire cast hits every visible enemy');assert.equal(game.effects.filter(e=>e.type==='wizard').length,3);
game=new DefenseGame();game.recruit(3,'infantry');battlefield(game);for(let i=0;i<145;i++)game.step(1/60);assert.ok(game.enemies.every(e=>e.hp<1000),'Infantry attacks all three lanes');assert.ok(game.enemies[0].hp<game.enemies[1].hp,'Other lanes take70% damage');
assert.equal(verifyRunReplay([],2,'2026-11-20T00:00:00Z','x').points,0,'Keep prior hard-mode sessions settleable');
console.log(`PASS: deterministic1% roll (${first}/50000 first waves), one-only free wall placement, no repeat, seeded server replay, global fire and infantry lane rotation`);
