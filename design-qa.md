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
