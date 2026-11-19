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

Attacks every 0.9 / 1.1 / 0.65 seconds respectively, damage is per member before target defenses. Archers support all lanes, ignore 20 percentage points of armor, and pierce a second target for 30% damage. Infantry blocks its lane, reduces incoming damage 40%, and ignores 55 armor percentage points. Cavalry reduces damage 10%; every six seconds it deals a double-damage charge, 60% splash, and reduces the primary target's armor by 50 percentage points for three seconds. Bosses throw at the ground line before reaching melee; an absent front line exposes archers. Shield raiders appear from wave 4. Current boss HP is 7,344 / 19,440 (base 6,800 / 18,000 × 1.08).

Normal kills award 8 game gold; captain/warlord kills 97 / 194. Stage clear rewards: 70, 80, 85, 95, 135, 125, 145, 165, 185, 250. Every new/reset game starts with 200 gold and NO units. Refunds stay at 70% of living units' paid cost.

`node scripts/simulate-defense.mjs --save` records 108 deterministic scripted policies: twelve troop mixes × three spending fractions × three placement priorities, stepped at 60 Hz. `defense-simulation.json` records each run. `defense-balance-comparison.json` records four gold settings and the previous commit baseline. The previous empty-opening build had 30 reach wave 10 / 17 finish; the hard balance has 15 reach wave 10 / 4 finish. `defense-hard-comparison.json` compares six candidates. These are policy-suite counts, not an estimate of human win probability; there is no random reward drop or paywall. The final boss is beatable by multiple legal mixed policies. Pure-type recruitment policies in this suite do not finish.

Additional tests: `node tests/defense-combat.mjs` and `node tests/defense-visuals.mjs`. They check individual HP/deaths, preservation of injury through merge, armor/role effects, delayed impact resolution, formation anchors, uniform portrait scaling and stride frame selection.

## Empty opening and explicit army controls

Every run now starts with zero soldiers and exactly 200 gold, including failure/victory reset. An empty army cannot start wave 1. Clicking an empty pad recruits one selected troop; clicking an occupied pad only selects it and costs nothing. The visible army action buttons then allow one additional recruit or a full-squad refund. The refund button shows the exact 70% amount before acting. Dead members cannot be refunded, and the engine rejects a second refund or a refund during battle.

`defense-controls.js` separates free selection from recruitment; `tests/defense-controls.mjs` checks that selection does not spend money. Simulation output version 3 records actual starting gold/unit counts on every policy result and the full effective balance. All 108 current runs use the empty 200G start. No simulated policy uses refunds. After hard balancing, at 60 Hz, 15 reach wave 10 and 4 clear. Reward-factor candidates and the old opening comparison are saved in `defense-balance-comparison.json`. These are deterministic scripted outcomes, not a measured human win rate.

## Contextual squad controls

Recruit and recall actions live inside the battlefield, vertically stacked below the selected occupied pad. Selecting another pad reanchors the menu; changing troop type, refunding the squad, or starting battle hides it. Accessible button labels include the pad, troop and gold amount. The gate-health/wave strip is in normal document flow above the canvas, so it cannot cover wall soldiers. Boss alerts occupy a second strip row. Touch controls retain 44px targets; small screens use a smaller menu offset to remain within the battlefield.

## Hard balance / balance version 2

Player feedback prompted an increase from 17/108 to 4/108 sampled completions. Player stats, roles, summon prices, refunds, start gold and point awards are unchanged. Enemy HP has a 1.08 multiplier; ordinary enemy post-wave3 growth rises from .14 to .20. Wave10 raiders have 627.264 HP versus 479.16 previously (about31% more). Boss effective HP rises from6000/15000 to7344/19440. Reward factor drops from1.02 to.97. Normal kill gold rounds to8 in both builds. Compare candidates with `node scripts/compare-defense-difficulty.mjs`.

The frontend checks the Edge Function's balance version before allowing a new game, so redeploying the site first cannot start a game against an old verifier. The Edge Function also retains the v1 engine for pending sessions created before `LEGACY_SESSION_CUTOFF`; new sessions cannot request the easier legacy rules. DB schema and envelope version remain unchanged. Redeploy the generated `supabase/defense-reward-dashboard.ts` after this upgrade; no SQL rerun is required.

## Cross-lane infantry and hidden fire mage / balance version3

Infantry now rotates its attacks across all lanes within its existing .15 vertical range. It still blocks only its own lane. Attacks against another lane deal70% damage; its own lane keeps full damage and existing armor penetration. All enemy effective HP is multiplied by1.3 relative to version2 (hpScale1.08→1.404); reward factor, starting gold and normal troop base stats remain unchanged. Captain effective HP9547.2, warlord25272. The108-policy suite without mage placement has25 reach stage10 and9 finish, including two mixed policies; previous version2 had15/4. Pure infantry is now a viable strategy. Reproduce candidate comparison with scripts/compare-defense-wizard.mjs.

A fire mage rolls exactly once per stage preparation at1%, stopping permanently after the first unlock in a run. The reserve persists if not placed immediately. It is a free, single-use, nonmerging ally with first-merge archer stats: HP420, damage72, interval.9s, all spawned enemies targeted with delayed fire damage, wall pads0–2 only. Recall refunds0 and consumes the character permanently; death does not allow another summon. The mage is not in normal gold recruitment.

The RNG seed derives from the server-issued run UUID, not a client score or Math.random. The server derives the same seed from its owned run record and replays every unlock/placement. Refreshing a run does not reroll the1% chance. The50,000-seed sanity test found470 first-stage unlocks (0.94%); this is a deterministic sample, not a changed probability. Over ten eligible stages, theoretical chance of at least one appearance is about9.56%.

The shared renderer is defense-renderer.js. Generated transparent artwork is assets/defense/fire-mage.png; fire effects use layered flame shapes and glow rather than a line. tests/defense-wizard-preview.html is a visual fixture with a naturally successful fixed seed, no account calls or real rewards, and a clearly labeled demonstration. It uses the actual renderer.

Redeploy the latest generated defense-reward-dashboard.ts. No SQL changes. New frontend requires server balance_version3; v1/v2 engines remain in the verifier to settle compatible pending sessions.

## Fire mage stat clarification / balance version4

The requested first stage means the FIRST MERGE of five archers, which the normal engine names tier2. Mage base HP/attack are therefore420/72, not70/12. Its .9s global fire attack and all unlock/placement rules are unchanged. v3 is retained in the verifier for pending weaker-mage runs. New sessions require server balance_version4. No SQL change. The9/108 nonmage policy result remains a baseline that does not model rare-mage use.

## Cross-lane cavalry / balance version5

Cavalry now uses the same rotating lane selection as infantry: full own-lane damage,70% primary damage against another lane, within its existing .32 vertical range. Its .65s attack interval, six-second double-damage charge, splash and three-second armor break remain. It still blocks its own lane.

Uncompensated change allowed31/108 scripted wins versus9 previously. Selected compensation keeps early enemy HP and gold rewards unchanged: post-wave3 HP growth.20→.28; captain base6800→7800 (effective10951.2); warlord18000→24000 (effective33696). The nonmage suite now reaches stage10 in36/108 cases and wins6/108, four with mixed recruitment. See defense-cavalry-comparison.json and scripts/compare-defense-cavalry.mjs. These are policy counts, not human probabilities.

The verifier retains v4, with the prior cavalry pattern and420/72 mage, for existing runs. Deploy the latest generated function (GET balance_version5); no SQL migration.
