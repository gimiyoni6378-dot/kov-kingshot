# KOV 성벽 지키기 prototype

Open `defense.html`. For local preview use `npm run dev -- --host 0.0.0.0 --port 4173 --strictPort` (the dev server opens the defense prototype at `/`). The existing homepage is still `index.html`.

- Ten waves; red raiders throughout, captain on 5, warlord on 10.
- Six fixed pads. Archers go on the wall; infantry/cavalry in front of the gate.
- Recruit one tier-1 unit per click. Five same-type same-tier units on the same pad become one next-tier unit. Five tier-2 units produce tier 3. A pad caps at five tier-3 units; units do not mix types in a pad.
- Recruits can be placed between waves. Auto-combat earns game gold from kills and one-time clear rewards. Full squad recall returns 70% recruitment cost. Infantry reduces gate damage in its lane; cavalry attacks faster; archers support across lanes.
- 1×/2× speed, pause/resume, pause on tab hide, failure/restart and 10-wave victory.
- No live point award or live account data. This is a visual/play prototype and must not be used to award points from a client-reported score. Server-authoritative game sessions and rewards are a separate integration.
- State resets on reload; this is intentional for the prototype. Balance is provisional. Troops are 2D sprites with simple motion/projectiles, rather than animated 3D rigs.

`node tests/defense.mjs` exercises legal recruitment through all ten waves and checks resource limits, all merge levels, max capacity, placement constraints, bosses, victory/failure, and duplicate reward protection.

## Combat and visual revision

Each soldier now has HP and can die. Merge carries the weighted remaining-HP ratio into the upgrade; dead soldiers cannot be refunded. Surviving units recover 20% max HP after a completed wave.

| Type | Tier 1 HP / damage | Tier 2 HP / damage | Tier 3 HP / damage |
| --- | --- | --- | --- |
| 궁병 | 70 / 12 | 420 / 72 | 2,520 / 432 |
| 보병 | 200 / 17 | 1,200 / 102 | 7,200 / 612 |
| 기병 | 140 / 23 | 840 / 138 | 5,040 / 828 |

Attacks every 0.9 / 1.1 / 0.65 seconds respectively, damage is per member before target defenses. Archers support all lanes, ignore 20 percentage points of armor, and pierce a second target for 30% damage. Infantry blocks its lane, reduces incoming damage 40%, and ignores 55 armor percentage points. Cavalry reduces damage 10%; every six seconds it deals a double-damage charge, 60% splash, and reduces the primary target's armor by 50 percentage points for three seconds. Bosses throw at the ground line before reaching melee; an absent front line exposes archers. Shield raiders appear from wave 4. Boss HP is 6,000 / 15,000.

Normal kills award 7 game gold; captain/warlord kills 85 / 170. Stage clear rewards: 60, 70, 75, 85, 120, 110, 130, 145, 160, 220. Starting budget is 400, of which the starter army costs 170, leaving 230. Refunds stay at 70% of living units' paid cost.

`node scripts/simulate-defense.mjs --save` records 108 deterministic scripted policies: twelve troop mixes × three spending fractions × three placement priorities, stepped at 60 Hz. `defense-simulation.json` records each run. `defense-balance-comparison.json` records four gold settings and the previous commit baseline. Old build: 95 reached wave 10 / 85 finished; current: 51 reached wave 10 / 17 finished. These are policy-suite counts, not an estimate of human win probability; there is no random reward drop or paywall. The final boss is beatable by multiple legal mixed policies. Pure-type recruitment policies in this suite do not finish.

Additional tests: `node tests/defense-combat.mjs` and `node tests/defense-visuals.mjs`. They check individual HP/deaths, preservation of injury through merge, armor/role effects, delayed impact resolution, formation anchors, uniform portrait scaling and stride frame selection.
