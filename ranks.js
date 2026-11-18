// Website ranks only; unrelated to a player's actual in-game castle level.
// Adjust these increments to change the rank curve; point balances stay intact.
export const LEVEL_STEP = 100;
export const TG_STEP = 1000;
export function rankForPoints(input) {
  const points = Math.max(0, Math.floor(Number(input) || 0));
  const level30 = 29 * LEVEL_STEP;
  const tg = Math.min(10, Math.floor((points - level30) / TG_STEP));
  const label = points < level30 + TG_STEP ? `Lv.${Math.min(30,Math.floor(points/LEVEL_STEP)+1)}` : `TG${tg}`;
  const floor = label.startsWith('TG') ? level30 + tg * TG_STEP : (Number(label.slice(3))-1) * LEVEL_STEP;
  const next = label === 'TG10' ? null : label.startsWith('TG') ? level30 + (tg+1)*TG_STEP : label === 'Lv.30' ? level30+TG_STEP : floor+LEVEL_STEP;
  const nextLabel = label === 'TG10' ? null : label === 'Lv.30' ? 'TG1' : label.startsWith('TG') ? `TG${tg+1}` : `Lv.${Number(label.slice(3))+1}`;
  return {label, points, next, nextLabel, remaining:next===null?0:next-points, progress:next===null?100:Math.min(100,Math.floor((points-floor)/(next-floor)*100)), isTG:label.startsWith('TG')};
}
