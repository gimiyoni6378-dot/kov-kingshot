import {readFile,writeFile} from 'node:fs/promises';
const engine=await readFile(new URL('../defense-engine.js',import.meta.url),'utf8');
const replay=(await readFile(new URL('../defense-replay.js',import.meta.url),'utf8')).replace("import {DefenseGame} from './defense-engine.js';",'');
await writeFile(new URL('../supabase/functions/defense-reward/replay.js',import.meta.url),engine+'\n'+replay);
const handler=(await readFile(new URL('../supabase/functions/defense-reward/index.ts',import.meta.url),'utf8')).replace("import {verifyReplay,REPLAY_VERSION} from './replay.js';",'');
await writeFile(new URL('../supabase/defense-reward-dashboard.ts',import.meta.url),engine.replace(/export /g,'')+'\n'+replay.replace(/export /g,'')+'\n'+handler);
