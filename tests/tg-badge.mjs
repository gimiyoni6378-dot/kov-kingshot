import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {tgIconForRank,renderRankEmblem} from '../tg-badge.js';
for(let i=1;i<=8;i++){
 const path=tgIconForRank(`TG${i}`);assert.ok(path);assert.ok(existsSync(new URL(`../${path}`,import.meta.url)));
}
for(const label of ['Lv.1','Lv.30','TG9','TG10','TG0','TG11','TG1evil',''])assert.equal(tgIconForRank(label),null);
function element(tag){return {tag,style:{},hidden:false,listeners:{},classList:{toggle(){}},addEventListener(type,fn){this.listeners[type]=fn},removeAttribute(name){delete this[name]}};}
globalThis.document={createElement:element};
const children=[element('svg')];
const container={dataset:{},querySelector(selector){return children.find(el=>selector==='svg'?el.tag==='svg':el.className===selector.slice(1))},append(el){children.push(el)},classList:{toggle(){}}};
renderRankEmblem(container,{isTG:false,label:'Lv.1'});assert.equal(children[0].style.display,'');
renderRankEmblem(container,{isTG:true,label:'TG1'});const img=container.querySelector('.tg-rank-icon'),fallback=container.querySelector('.tg-rank-fallback');assert.equal(img.src,'./assets/tg/tg-1.webp');assert.equal(img.hidden,false);assert.equal(children[0].style.display,'none');
renderRankEmblem(container,{isTG:true,label:'TG8'});assert.equal(img.src,'./assets/tg/tg-8.webp');
img.listeners.error();assert.equal(img.hidden,true);assert.equal(fallback.hidden,false);assert.equal(fallback.textContent,'TG8');
renderRankEmblem(container,{isTG:true,label:'TG9'});assert.equal(fallback.textContent,'TG9');assert.equal(fallback.hidden,false);assert.equal(img.hidden,true);
renderRankEmblem(container,{isTG:true,label:'TG10'});assert.equal(fallback.textContent,'TG10');
renderRankEmblem(container,{isTG:false,label:'Lv.30'});assert.equal(children[0].style.display,'');assert.equal(img.hidden,true);assert.equal(fallback.hidden,true);
img.listeners.error();assert.equal(fallback.hidden,true);
console.log('PASS: all TG icon mappings, text fallbacks, load errors and return to normal levels');
