import {writeFileSync} from 'node:fs';
import {runBatch} from './simulate-defense.mjs';
import {STANDARD_BALANCE as baseline} from '../defense-engine-v1.js';
import {DefenseGame as HardVersion} from '../defense-engine-v2.js';
const configs=[baseline,{rewardFactor:.97,lateGrowth:.18,captainHp:6600,warlordHp:18000},{rewardFactor:.95,lateGrowth:.2,captainHp:7000,warlordHp:19000},{rewardFactor:.92,lateGrowth:.2,captainHp:7000,warlordHp:20000},{rewardFactor:.97,hpScale:1.08,lateGrowth:.2,captainHp:6800,warlordHp:18000},{rewardFactor:.95,lateGrowth:.24,captainHp:7200,warlordHp:21000}];
const candidates=configs.map(config=>{const suite=runBatch({...baseline,...config},HardVersion);return {config:suite.balance,reached10:suite.reached10,cleared10:suite.cleared10,reached5:suite.results.filter(r=>r.reached>=5).length,winners:suite.results.filter(r=>r.won)};});
writeFileSync(new URL('../defense-hard-comparison.json',import.meta.url),JSON.stringify({note:'108 deterministic scripted strategies; not human win probability',selected:4,candidates},null,2)+'\n');
console.log(JSON.stringify(candidates.map(({config,reached10,cleared10})=>({config,reached10,cleared10})),null,2));
