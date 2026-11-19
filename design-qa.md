# Castle defense prototype design QA

final result: passed

Scope: the user-requested playable **2D adaptation** of the selected in-conversation game screenshot, with ten waves, cavalry replacing the mage, 궁병 wording, five-to-one merges through tier 3, and bosses at waves 5/10. This is not a claim of pixel-identical recreation or animated 3D gameplay.

## Source visual truth

- Selected reference: the generated KOV castle-defense concept screenshot displayed in this conversation immediately before the implementation request (castle, upper archer placements, ground infantry, parchment unit tray and green start button).
- Preserved derived environment truth: `assets/defense/battlefield.png`, 1210×1300.
- Character truths: `assets/defense/troops.png`, 1254×1254, and `assets/defense/enemies.png`, 2172×724.
- The original all-in-one concept screenshot is only available inline in the conversation, not as a local PNG. Therefore this review compares the adapted composition and the preserved production art rather than asserting a pixel-diff score against that screenshot.

## Rendered evidence

- Live route: https://gimiyoni6378-dot.github.io/kov-kingshot/defense.html
- Browser-rendered screenshot: `/workspace/shared/kov-defense-ready.jpg`, 600×1229.
- Browser viewport: 1180×757 CSS px, DPR 1. The centered portrait game measures 600 CSS px wide. Screenshot captures the entire game shell beyond the viewport. No density scaling was applied.
- State: wave 1 preparation, infantry merged from five tier-1 recruits into one tier-2 unit; a mounted cavalry unit placed in ground slot six. Gold 80. Start enabled.
- Full-view comparison: the production environment and final screenshot were opened together in one image-view tool response. The environment is rendered without cropping/stretching; battlement pads align with platforms and the gate/road remain visible. The portrait composition preserves the reference's castle/world/deployment-tray/start-button hierarchy.
- Focus regions: battlement troop scale and stage labels; merged infantry and mounted cavalry; lower portrait cards and legible troop names/costs. These were inspected at the 600px shell size in browser screenshots rather than only at reduced full-page scale.

## Required surfaces

- Typography: Noto Sans KR, bold Korean display labels, readable 궁병/보병/기병 and costs. Real HTML text is used for editable UI. Mobile squad labels were increased from 8 to 10px.
- Spacing/layout: single portrait screen, six aligned pads, three equally sized unit cards, one primary start button. No horizontal overflow at the tested viewport. Empty foreground is the enemy approach path, not an accidental blank section.
- Colors: gold/cream/terracotta UI, moss-green actions, sky-blue deployment accents. World palette comes from the supplied generated source artwork.
- Image quality: actual generated raster environment, friendly sprites and enemy/boss sprites, intact PNGs. No emoji or CSS-drawn replacement characters. Sprite rectangles retain horses and full bodies. Mild generated edge fringe is not prominent at gameplay scale (P3 refinement).
- Copy: ten-wave count and requested troop names are correct. Merge explanation matches five same-tier members on one pad, through tier 3. Test-only / no real activity points is visible.

## Comparison history

1. First browser capture: troop sprites appeared too small relative to the scene (P2); small-screen squad labels used 8px (P2).
2. Fix: standard unit height increased from 142 to 186 source-space pixels; mounted height from 155 to 207; tier growth retained. Mobile squad label set to 10px.
3. Post-fix capture: `/workspace/shared/kov-defense-ready.jpg`. Units now read clearly on battlements/grass without covering the gate or controls. The current capture is the larger post-fix build.

No actionable P0/P1/P2 finding remains in the inspected desktop portrait game. Physical-phone viewport/touch performance is a remaining test gap, not a verified result.

## Interaction verification

Browser: loaded all art; selected infantry; recruited three additional members into the initial two to trigger tier-2 merge; selected/placed cavalry; gold deduction 230→80; automatic wave combat; 2× toggle; pause/resume; wave-1 clear and one-time gold reward; next-wave preparation displayed wave 2. Final browser app errors: none. Chrome-extension metadata errors were excluded as unrelated to application code.

Engine tests: `node tests/defense.mjs` passed placement constraints, unavailable funds, tier-2/tier-3 merges, max capacity, refunds, ten legal waves, captain/warlord appearances, ten-wave victory, defeat, and duplicate clear reward protection. `node tests/ranks.mjs` passed existing rank regressions.

Local preview relay failed to open port 4173 and reported stopped. No infrastructure bypass was used. Visual and interaction QA used the authorized GitHub Pages deployment instead.

## Implementation checklist

- [x] Production art placed and visually inspected.
- [x] Requested troop names, cavalry, merges and ten-wave progression.
- [x] Distinct wave-5 and wave-10 bosses.
- [x] Real browser core journey and application console checks.
- [x] Engine regression coverage.
- [ ] Physical phone touch/performance pass.
- [ ] Optional future production server-authoritative rewards and persistence.

## Follow-up polish

P3: refine sprite animation frames and masking edges; tune wave balance after play feedback. This prototype uses sprite movement/bobbing/projectiles rather than full skeletal animation. Reload resets a run and real activity point awards are intentionally not implemented in this play prototype.


# Revision: user visual, combat and difficulty feedback

final result: passed

This section supersedes the initial prototype QA above for the current build.

## Source and compared evidence

- User feedback against the selected concept: armies must stand together on stone pads; enemies need a run cycle; recruitment cards should show undistorted torsos; attacks should show sword/arrow/hoof effects. Added requests: individual HP/casualties, meaningful unit roles, harder progression and limited gold.
- Source art: `assets/defense/battlefield.png`, `troops.png`, `stone-pad.png`, `enemy-run.png`, and `combat-fx.png`. All newly generated sheets were opened and inspected. The concept remains available in the conversation; no claim of pixel-identical 3D animation is made.
- Prior implementation: `/workspace/shared/kov-defense-before-corrections.jpg`, 600×1229.
- Final implementation: `/workspace/shared/kov-defense-corrected.jpg`, 600×1282.
- Both implementation captures were opened together in a single image-view response for before/after comparison. Focus inspection covered the ground pads and four-member formation, portrait source crops, and expanded infantry HP/damage table.
- Browser viewport 1180×757 CSS px, DPR 1; 600px portrait shell. Same density; no resampling. Final state: wave 1 preparation, four tier-1 infantry grouped on one stone platform, mounted cavalry on the right platform, archer card selected; gold 110. Added stats produce the intentional 53px height increase from the original capture.

## Findings, fixes and post-fix inspection

- [P1 fixed] Translation-only enemy movement: replaced by a four-frame run atlas for each enemy/boss, indexed by traveled distance with fixed row scale and per-frame foot anchors. Live battle was observed with distinct stride/passing poses. Pause freezes the combat clock and gait. This is sprite animation, not skeletal 3D.
- [P2 fixed] Ground troops standing on bare grass/floating: real sandstone platform sprite at all three ground pads. Feet use a compact ellipse formation and trimmed source contact lines; four visible infantry stand within the stone floor. Wall troops remain aligned to existing stone platforms.
- [P2 fixed] Full-body portraits stretched into fixed card boxes: torso-centered source windows with equal X/Y scale; browser computed backgrounds measure 772.873×772.873 for every 1254×1254 source at the inspected width. ResizeObserver recalculates source framing. Full legs/horse body no longer occupy the cards.
- [P2 fixed] Generic attack strokes: real arrow asset flies along an arcing path, sword crescent changes angle/follow-through, and hoof marks expand with dust on cavalry hits. Effects resolve after a projectile/swing delay. Effect source shapes were visually inspected; browser combat had no rendering errors. All three short-lived impacts were not captured as separate stills in this pass (remaining observation gap).
- [P1 fixed] No unit HP or meaningful loss: real per-member HP, casualty removal, injured-merge ratio, living-unit refund accounting and 20% end-wave recovery. In browser, five tier-1 infantry merged into one tier-2 member with HP 1200/1200; expanded table displayed 200/17, 1200/102, 7200/612.
- [P2 fixed] Role/economy balance: shield enemies, infantry mitigation/armor counter, archer lane support/pierce, cavalry charge/splash/armor break, and boss ranged pressure make front-line composition matter. Recruitment and stage rewards are shared between the actual engine and simulations.
- [P2 fixed] Selection information ambiguity: changing the recruitment card clears the previous army selection; selected army health is explicitly prefixed with its troop name. Final browser capture confirms the generic merge message after switching back to archer.

## Required surfaces

- Typography: Korean labels remain crisp. Collapsible tier stats show per-member values and ability wording. No squeezed portraits or text wraps hide the primary start control.
- Layout: stone pads and groups align; portrait cards keep the original three-card hierarchy; stats are compact/collapsible. No horizontal overflow at the tested desktop viewport. No physical-phone viewport/performance claim is made.
- Color: retained the existing gold/cream/green palette. Muted health tracks and distinct ally/enemy HP fills communicate health; image effects keep the same warm game art direction.
- Image quality: all game figures/pads/FX use raster artwork, no replacement emoji/CSS character art. Four-frame gait is substantially improved but remains limited-frame animation; faint generated edge fringes are P3 polish.
- Content: 궁병/보병/기병; ten waves; bosses 5/10; explicit no-real-point-award label. HP/damage/abilities match the engine. Clear gold is 60,70,75,85,120,110,130,145,160,220; normal kill 7.

## Verification and limits

Browser tested: load all sheets, troop selection, four-member grouping, five-to-one merge with HP, cavalry placement, expanded stats, 2× battle, pause/resume, and gait rendering. Final application console errors: none (unrelated extension errors excluded). The scene was left at preparation for the user.

Automated checks passed: `tests/defense.mjs`, `defense-combat.mjs`, `defense-visuals.mjs`, `defense-balance.mjs`, and existing `tests/ranks.mjs`. The balance suite uses 108 deterministic 60Hz recruitment policies. Previous engine: 95 reached wave 10 / 85 cleared. Revised engine: 51 reached / 17 cleared. These are strategy-suite counts, not human win probabilities or a concurrency load test. Current simulation output and reward comparisons are saved in the repository.

Residual gaps: physical phone touch/GPU/first-load performance, real 20-user concurrent session testing, frame-by-frame inspection of all short-lived FX, persistence, production reward verification. None is represented as completed. The browser runs combat locally; no real account or activity ledger is changed by the prototype.

No actionable P0/P1/P2 issue remains within this inspected revision scope. Suggested P3 follow-up: smoother animation frames and additional sprite-edge cleanup after player feedback.


# Revision: empty 200G opening and explicit refunds

final result: passed

User-requested change supersedes all historical starter-army/balance counts above: every fresh/reset game now begins with **zero soldiers and 200 gold**. Empty pads in the new source state are intentional. The same 108 policy definitions, seeds and 60Hz simulation tick were retained. Every output row records its actual startingGold=200 and startingUnits=0. Current results: 30/108 reach wave 10, 17/108 clear. Gold was recalibrated with rewardFactor=1.02; no alternate starting army or hidden money is injected in the actual balance simulation. The previous opening is reproduced separately only as a labeled comparison case.

## Browser evidence

- Live route: https://gimiyoni6378-dot.github.io/kov-kingshot/defense.html
- Opening screenshot: `/workspace/shared/kov-defense-empty-start.jpg`, 600×718 (header and battlefield crop). Shows wallet 200, six empty pads, no soldiers. Start remains disabled until an army is deployed.
- Refund controls screenshot: `/workspace/shared/kov-defense-refund-controls.jpg`, 592×557 (deployment section crop; heading overhang is clipped by the deliberate section crop). Shows separate add-one and **부대 회수 · +56G** actions for two archers. Actual game layout is not clipped.
- Browser viewport 1180×757 CSS px, DPR 1; portrait shell 600px, no density normalization. Existing background, sprites, bust portraits and typography preserved. The new controls are real 44px-minimum buttons and wrap on narrow screens.

## Verified interaction sequence

1. Fresh load: gold200, occupied pads0, start disabled.
2. Empty top pad creates one archer: 200→160.
3. Clicking occupied pad selects freely: stays160, unit count stays1.
4. Explicit add-one: 160→120, two archers; refund displays56.
5. Refund: 120→176, pad becomes empty, start disabled, refund action disappears.
6. Buy five infantry using one empty-pad click plus four explicit add-one clicks: 176→26; five merge into one tier2 infantry, HP1200/1200; refund displays105.
7. Refund merged squad: 26→131; squad removed and action disappears.
8. Latest deployed accessibility label says selection / add / refund, rather than claiming occupied-pad clicks recruit.
9. Fresh reload again: gold200, occupied pads0, start disabled. Single archer refund separately confirmed at160→188.

Application error log: none after excluding unrelated extension messages. No account or real activity ledger is touched.

## Tests and review

Passing: defense-controls (free selection, exact70% refund, merge-paid basis, no dead-squad/double refund); defense-combat; defense engine (empty start/reset, placement, recruitment, legal ten-wave mixed win, failure and one-time rewards); defense-visuals; defense-balance (every one of108 starts empty/200G; about17 wins); current script output saves exactly17 wins. Recruitment/refund actions are intentionally preparation-only.

No new character/scene assets were changed. The revised opening and controls were reviewed in the browser; no actionable P0/P1/P2 issue remains in this scoped change. Physical-phone viewport/performance and human win rate remain unmeasured; scripted outcomes are not a probability claim.

## Contextual controls and unobstructed status strip

Moved the recruit/refund menu into the battlefield below the selected pad, with stacked buttons and explicit accessible labels. Gate HP and wave now occupy a normal-flow strip above the canvas. Live Pages review confirmed the strip bottom equals the battlefield top, and the selected-pad menu stays within the battlefield.

Browser checks: archer purchase 200→160, add 160→120, refund +56→176 and menu disappears; selecting the bottom-right infantry pad relocates the menu; starting battle hides it. The engine, combat, controls and visuals suites pass. Evidence: `/workspace/shared/kov-defense-contextual-controls.jpg`. Physical-phone viewport testing remains unmeasured; coarse-pointer CSS retains 44px action targets and reduces the offset on small screens.

## Member defense rewards integration

GitHub Pages build for a1f7109 completed successfully. Live browser review confirms login gate, disabled anonymous recruitment/start, game-to-mypage navigation and main navigation link back to the game. The wallet card exists in the deployed mypage DOM and remains private while signed out. Screenshot: `/workspace/shared/kov-defense-member-gate.jpg`. No application console errors observed; an unrelated browser-extension metadata error was excluded.

Passing: engine, combat, controls, visuals, rank tests; full deterministic replay through ten stages, each reward boundary, illegal command/forged score rejection; PGLite migration rerun, account isolation/RLS, service-only award, timing guard, final-balance totals and duplicate settlement tests. Edge TypeScript syntax checks passed. Live authenticated reward/wallet verification is pending the owner's SQL and Edge Function deployment; it has not been claimed as tested. Physical phone viewport testing remains unmeasured.

## Hard balance revision

Player feedback prompted a second balance pass. Six candidates were run against the same108 deterministic strategies, empty200G opening and fixed60Hz combat. Selected balance: rewardFactor.97, hpScale1.08, lateGrowth.20, captain base6800 and warlord base18000. Baseline:30 reach wave10 /17 finish. Selected:15 reach wave10 /4 finish;77 reach wave5. Zero-win candidate was rejected. These are scripted strategy counts, not human win-rate estimates. Comparisons are reproducible with scripts/compare-defense-difficulty.mjs and recorded in defense-hard-comparison.json.

Passing: balance, engine, controls, combat, visuals and replay tests; browser/server bundled replay parity for all ten clear stages and legacy recorded victory; legacy cutoff and unsupported-version checks; Edge TypeScript syntax. No layout changes or new art. Authenticated live hard-mode play and deployed Edge parity remain pending owner redeployment. Site now checks the server's balance version before opening a new game to prevent mismatched calculations. SQL is unchanged.

## Public author rank badges

Gallery cards, post details and comments now place a current Lv/TG badge before the nickname. TG1–8 use the original icons; TG9/10 use the approved generated sprite. Batched rank reads refresh after content changes and on returning to the gallery. DOM unit checks cover safe nickname text, batch lookup, TG8/9/10 rendering and honest unavailable state. PGLite checks cover repeatable migration, post/comment-only public authors, private balance denial, anonymous access, batch size and all level/TG boundaries matching ranks.js. New SQL004 returns rank labels only. Live rank verification remains pending owner execution of004-author-ranks.sql; the code does not fabricate Lv1 when that setup is missing. No game Edge Function changes are needed.

## Comment1P and discoverable owner-only post deletion

New005 migration preserves all existing point events; future comments earn1P. Deletions reverse the original award, including legacy10P comments and post-cascade removals. Existing game/attendance/post rewards remain valid. PGLite tests verify migration reruns, historical event preservation, fresh awards, both reversal amounts, cascades, owner-only post deletion through authenticated RLS, unchanged other rewards and protected ledger writes.

Gallery card delete actions are siblings of the open-post button, avoiding nested buttons. The detail delete action moves to the sticky top header. Both are hidden for nonowners and rechecked on account changes. Shared deletion filters on both post ID and owner, treats zero deleted rows as denial, and only cleans up photos after successful DB deletion. Unit tests cover unauthenticated/other-owner rejection, exact filters, denied-deletion cleanup prevention and storage cleanup failure. Markup validation confirms one private detail-delete ID within the header. No real user posts were deleted during QA. Live1P verification awaits owner execution of005; function redeployment is unnecessary.

## Logged-in menu nickname rank

Shared auth header now renders current Lv/TG before the nickname using kov_my_activity, including members with no public content. Refresh is scheduled outside Supabase auth callbacks, runs when opening the mobile menu or returning to the tab, and discards results after logout/account changes. The existing compact badge styles are shared through rank-badges.css, including TG9/10 sprites. All auth imports and dependent entry cache versions were updated together to preserve a single auth client per page.

DOM unit checks pass for Lv2, TG10 icon, fresh-member Lv1, safe nickname text, account switching, logout clearing and delayed-result rejection. Existing author-badge/rank tests and JS syntax checks pass. No SQL or Edge Function change. A live signed-in mobile viewport was not available for verification.

## Infantry lane rotation and hidden fire mage

Implemented infantry rotation across three nearby lanes, full own-lane /70% cross-lane damage, and enemy HP1.3× relative to v2. Compare five candidates in defense-wizard-comparison.json; selected suite25/108 reach stage10 and9/108 finish (without hidden placement), including mixed armies. Hero tests cover wall-only free placement, single use even after recall, HP/attack parity with tier1 archer, global delayed fire damage, deterministic per-run rolls,50,000-seed distribution, forged unlock rejection and browser/server seeded replay parity. Existing engine, combat, controls, visual and reward tests pass. v1/v2 verifier compatibility retained; SQL unchanged. New front end checks balance_version3 before play. Live authenticated reward settlement awaits owner Edge redeployment.

Live Pages visual fixture verified after successful deployment5bc5131: red-cloaked mage sits on the left wall pad alongside the existing soldiers; animated fire reaches multiple enemies. No application console errors observed (unrelated extension metadata errors excluded). Screenshot `/workspace/shared/kov-fire-mage-preview.jpg` is a labeled fixed-seed visual fixture, not a real rewarded game. Physical-phone performance and authenticated v3 settlement remain unverified until owner function redeployment.

## Mage first-merge stat correction

Clarified requested first stage as the first merge of five archers (engine tier2). Mage now has420HP/72damage; .9s interval, all-target fire,1% one-only unlock and free wall placement remain. Tests verify exact parity with archer tier2,72 damage to every visible target, seeded replay parity, and retained v3 engine70/12 compatibility. Generated Edge code syntax passes. Server balance gate now requires4; owner redeployment pending. Nonmage policy balance is unchanged.
