import assert from 'node:assert/strict';
import {rankForPoints,LEVEL_STEP,TG_STEP} from '../ranks.js';
for(let level=1;level<=30;level++){
 const floor=(level-1)*LEVEL_STEP;
 assert.equal(rankForPoints(floor).label,`Lv.${level}`);
 if(level>1)assert.equal(rankForPoints(floor-1).label,`Lv.${level-1}`);
}
for(let tg=1;tg<=10;tg++){
 const floor=29*LEVEL_STEP+tg*TG_STEP;
 assert.equal(rankForPoints(floor).label,`TG${tg}`);
 assert.equal(rankForPoints(floor-1).label,tg===1?'Lv.30':`TG${tg-1}`);
}
assert.equal(rankForPoints(0).remaining,100);
assert.equal(rankForPoints(2900).remaining,1000);
assert.equal(rankForPoints(3400).progress,50);
assert.equal(rankForPoints(12900).next,null);
assert.equal(rankForPoints(99999).label,'TG10');
assert.equal(rankForPoints(-20).label,'Lv.1');
for(let p=0;p<=15000;p++){
 const r=rankForPoints(p);assert.ok(r.progress>=0&&r.progress<=100);
 if(r.next!==null){assert.ok(r.next>p);assert.equal(r.remaining,r.next-p);}
}
console.log('PASS: all Lv/TG boundaries, progress, cap and next-rank calculations');
