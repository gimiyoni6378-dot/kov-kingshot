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
