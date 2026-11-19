import {writeFileSync} from 'node:fs';
import {runBatch} from './simulate-defense.mjs';
import {DefenseGame as Previous,STANDARD_BALANCE as before} from '../defense-engine-v4.js';
const base=runBatch({},Previous);
const configs=[{},{lateGrowth:.28,captainHp:7800,warlordHp:24000},{lateGrowth:.28,captainHp:7800,warlordHp:24000,rewardFactor:.94},{lateGrowth:.32,captainHp:8500,warlordHp:26000,rewardFactor:.94},{hpScale:1.55},{hpScale:1.62,lateGrowth:.25}];
const candidates=configs.map(config=>{const s=runBatch({...before,...config});return {balance:s.balance,reached10:s.reached10,cleared10:s.cleared10,mixedWins:s.results.filter(r=>r.won&&r.weights.filter(w=>w>0).length>1).length};});
const report={note:'108 scripted strategies without mage placement, not human win probabilities',baseline:{reached10:base.reached10,cleared10:base.cleared10},selected:1,candidates};
writeFileSync(new URL('../defense-cavalry-comparison.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
