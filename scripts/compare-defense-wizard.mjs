import {writeFileSync} from 'node:fs';
import {runBatch} from './simulate-defense.mjs';
import {DefenseGame as Previous} from '../defense-engine-v2.js';
import {DefenseGame as InfantryVersion} from '../defense-engine-v3.js';
const baseline=runBatch({},Previous);
const candidates=[{crossLaneDamage:1},{crossLaneDamage:.8},{crossLaneDamage:.7},{crossLaneDamage:.6},{crossLaneDamage:.7,lateGrowth:.24,warlordHp:21000}].map(config=>{const s=runBatch(config,InfantryVersion);return {balance:s.balance,reached10:s.reached10,cleared10:s.cleared10,mixedWins:s.results.filter(r=>r.won&&r.weights.filter(w=>w>0).length>1).length};});
const data={note:'108 deterministic scripted strategies without hidden-mage placement; not human win rates',baseline:{reached10:baseline.reached10,cleared10:baseline.cleared10},selected:2,candidates};writeFileSync(new URL('../defense-wizard-comparison.json',import.meta.url),JSON.stringify(data,null,2)+'\n');console.log(JSON.stringify(data,null,2));
