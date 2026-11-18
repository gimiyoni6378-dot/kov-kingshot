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
