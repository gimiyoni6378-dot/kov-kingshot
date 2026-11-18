# KOV defense prototype artwork

All three PNGs are generated assets for the approved KOV castle-defense concept, created 2026-11-19. They are not extracted official game sprites.

- `battlefield.png`: generated environment layer derived from the selected in-conversation screenshot, with troops/UI removed. Original generated image copied intact.
- `troops.png`: generated friendly unit sheet, 1254×1254 RGBA, rows 궁병 / 보병 / 기병, columns tiers 1 / 2 / 3. Original copied intact; source rectangles are in `defense.js`.
- `enemies.png`: generated enemy sheet, 2172×724 RGBA, normal red raider / stage-5 captain / stage-10 warlord. Original copied intact; source rectangles are in `defense.js`.

Canvas source rectangles display each sprite without altering the source image. Characters move as 2D sprites, with simple projectile and hit effects, not skeletal 3D animation. Bootstrap Icons 1.11.3 supplies UI icons. Noto Sans KR supplies Korean text.

The requested gameplay variations are applied over the selected screenshot: ten waves, cavalry replacing the mage, Korean label 궁병, five-to-one merges to tier 3, bosses at 5 and 10. This build is a local browser simulation. Game gold, results and rewards are not connected to the live activity ledger.
