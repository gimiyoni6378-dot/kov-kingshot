# KOV 성벽 지키기

Open `defense.html`. For local preview use `npm run dev -- --host 0.0.0.0 --port 4173 --strictPort` (the dev server opens the defense prototype at `/`). The existing homepage is still `index.html`.

- Ten waves; red raiders throughout, captain on 5, warlord on 10.
- Six fixed pads. Archers go on the wall; infantry/cavalry in front of the gate.
- Recruit one tier-1 unit per click. Five same-type same-tier units on the same pad become one next-tier unit. Five tier-2 units produce tier 3. A pad caps at five tier-3 units; units do not mix types in a pad.
- Recruits can be placed between waves. Auto-combat earns game gold from kills and one-time clear rewards. Full squad recall returns 70% recruitment cost. Infantry blocks its lane and absorbs attacks with damage reduction; cavalry attacks faster; archers support across lanes.
- 1×/2× speed, pause/resume, pause on tab hide, failure/restart and 10-wave victory.
- Login is required. `supabase/003-defense-rewards.sql` and the `defense-reward` Edge Function must be deployed before play/rewards work. See `supabase/DEFENSE-SETUP.md`. The server replays legal commands and atomically awards the final highest-clear reward: stage5=30P, 6–8=40P, 9=50P, 10=100P; earlier=0P.
- Battlefield state resets on reload; completed-wave and pending settlement records are stored per account in this browser and retried on reconnect. Balance is provisional. Troops are 2D sprites with simple motion/projectiles, rather than animated 3D rigs.

`node tests/defense.mjs` exercises legal recruitment through all ten waves and checks resource limits, all merge levels, max capacity, placement constraints, bosses, victory/failure, and duplicate reward protection.

## Combat and visual revision

Each soldier now has HP and can die. Merge carries the weighted remaining-HP ratio into the upgrade; dead soldiers cannot be refunded. Surviving units recover 20% max HP after a completed wave.

| Type | Tier 1 HP / damage | Tier 2 HP / damage | Tier 3 HP / damage |
| --- | --- | --- | --- |
| 궁병 | 70 / 12 | 420 / 72 | 2,520 / 432 |
| 보병 | 200 / 17 | 1,200 / 102 | 7,200 / 612 |
| 기병 | 140 / 23 | 840 / 138 | 5,040 / 828 |

Attacks every 0.9 / 1.1 / 0.65 seconds respectively, damage is per member before target defenses. Archers support all lanes, ignore 20 percentage points of armor, and pierce a second target for 30% damage. Infantry blocks its lane, reduces incoming damage 40%, and ignores 55 armor percentage points. Cavalry reduces damage 10%; every six seconds it deals a double-damage charge, 60% splash, and reduces the primary target's armor by 50 percentage points for three seconds. Bosses throw at the ground line before reaching melee; an absent front line exposes archers. Shield raiders appear from wave 4. Boss HP is 6,000 / 15,000.

Normal kills award 8 game gold; captain/warlord kills 102 / 204. Stage clear rewards: 70, 80, 90, 100, 145, 135, 155, 175, 195, 265. Every new/reset game starts with 200 gold and NO units. Refunds stay at 70% of living units' paid cost.

`node scripts/simulate-defense.mjs --save` records 108 deterministic scripted policies: twelve troop mixes × three spending fractions × three placement priorities, stepped at 60 Hz. `defense-simulation.json` records each run. `defense-balance-comparison.json` records four gold settings and the previous commit baseline. Old build: 95 reached wave 10 / 85 finished; current: 51 reached wave 10 / 17 finished. These are policy-suite counts, not an estimate of human win probability; there is no random reward drop or paywall. The final boss is beatable by multiple legal mixed policies. Pure-type recruitment policies in this suite do not finish.

Additional tests: `node tests/defense-combat.mjs` and `node tests/defense-visuals.mjs`. They check individual HP/deaths, preservation of injury through merge, armor/role effects, delayed impact resolution, formation anchors, uniform portrait scaling and stride frame selection.

## Empty opening and explicit army controls

Every run now starts with zero soldiers and exactly 200 gold, including failure/victory reset. An empty army cannot start wave 1. Clicking an empty pad recruits one selected troop; clicking an occupied pad only selects it and costs nothing. The visible army action buttons then allow one additional recruit or a full-squad refund. The refund button shows the exact 70% amount before acting. Dead members cannot be refunded, and the engine rejects a second refund or a refund during battle.

`defense-controls.js` separates free selection from recruitment; `tests/defense-controls.mjs` checks that selection does not spend money. Simulation output version 3 records actual starting gold/unit counts on every policy result and the full effective balance. All 108 current runs use the empty 200G start. No simulated policy uses refunds. At 60 Hz, 30 reach wave 10 and exactly 17 clear. Reward-factor candidates and the old opening comparison are saved in `defense-balance-comparison.json`. These are deterministic scripted outcomes, not a measured human win rate.

## Contextual squad controls

Recruit and recall actions live inside the battlefield, vertically stacked below the selected occupied pad. Selecting another pad reanchors the menu; changing troop type, refunding the squad, or starting battle hides it. Accessible button labels include the pad, troop and gold amount. The gate-health/wave strip is in normal document flow above the canvas, so it cannot cover wall soldiers. Boss alerts occupy a second strip row. Touch controls retain 44px targets; small screens use a smaller menu offset to remain within the battlefield.
