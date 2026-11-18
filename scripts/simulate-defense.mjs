import {DefenseGame,TROOPS} from '../defense-engine.js';
const weightsList=[[1,0,0],[0,1,0],[0,0,1],[.8,.1,.1],[.1,.8,.1],[.1,.1,.8],[.5,.4,.1],[.5,.1,.4],[.3,.5,.2],[.3,.2,.5],[.4,.3,.3],[1,1,1]];
const budgetFractions=[.55,.8,1];const methods=['spread','focus','random'];
function rng(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let n=Math.imul(seed^seed>>>15,1|seed);n^=n+Math.imul(n^n>>>7,61|n);return((n^n>>>14)>>>0)/4294967296;};}
export function simulate(weights,budgetFraction,method,seed=1,balance={},GameClass=DefenseGame){
 const game=new GameClass(balance),random=rng(seed);let recruits=0;const startingGold=game.gold,startingUnits=game.slots.reduce((n,slot)=>n+(slot?.members?.length||0),0);
 for(let wave=1;wave<=10;wave++){
  const budget=game.gold*budgetFraction;let spent=0;
  for(let step=0;step<200;step++){
   const choices=Object.entries(TROOPS).filter(([type,spec],i)=>weights[i]>0&&spec.cost<=game.gold&&spent+spec.cost<=budget);
   if(!choices.length)break;
   const total=choices.reduce((sum,[type])=>sum+weights[Object.keys(TROOPS).indexOf(type)],0);let value=random()*total;
   const type=(choices.find(([type])=>(value-=weights[Object.keys(TROOPS).indexOf(type)])<=0)||choices.at(-1))[0];
   let slots=(type==='archer'?[0,1,2]:[3,4,5]).filter(i=>!game.slots[i]||game.slots[i].type===type);
   if(method==='spread')slots.sort((a,b)=>(game.slots[a]?.spent||0)-(game.slots[b]?.spent||0));
   else if(method==='focus')slots.sort((a,b)=>(game.slots[b]?.spent||0)-(game.slots[a]?.spent||0));
   else slots.sort(()=>random()-.5);
   let success=false;
   for(const index of slots){const result=game.recruit(index,type);if(result.ok){success=true;spent+=TROOPS[type].cost;recruits++;break;}}
   if(!success)break;
  }
  if(!game.start())return {reached:wave,won:false,health:Math.round(game.health),deaths:game.deaths,recruits,startingGold,startingUnits};let ticks=0;
  while(game.phase==='battle'&&ticks++<18000)game.step(1/60);
  if(game.phase==='lost'||game.phase==='battle')return{reached:wave,won:false,health:Math.round(game.health),deaths:game.deaths,recruits,startingGold,startingUnits};
  if(game.phase==='won')return{reached:10,won:true,health:Math.round(game.health),deaths:game.deaths,recruits,startingGold,startingUnits};
  game.next();
 }
}
export function runBatch(balance={},GameClass=DefenseGame){
 const results=[];let id=0;
 for(const weights of weightsList)for(const budget of budgetFractions)for(const method of methods)results.push({weights,budget,method,...simulate(weights,budget,method,++id,balance,GameClass)});
 const initialGame=new GameClass(balance);const startingConditions={gold:initialGame.gold,units:initialGame.slots.reduce((n,slot)=>n+(slot?.members?.length||0),0)};
 return {version:3,startingConditions,note:'Deterministic scripted recruitment strategies, not a human win probability.',balance:initialGame.balance||balance,simulationTick:1/60,refundUsed:false,cases:results.length,reached10:results.filter(r=>r.reached===10).length,cleared10:results.filter(r=>r.won).length,results};
}
if(process.argv[1]?.endsWith('simulate-defense.mjs')){
 const batch=runBatch();
 console.log(JSON.stringify({cases:batch.cases,reached10:batch.reached10,cleared10:batch.cleared10,byWeights:weightsList.map(weights=>({weights,reached10:batch.results.filter(r=>JSON.stringify(r.weights)===JSON.stringify(weights)&&r.reached===10).length,won:batch.results.filter(r=>JSON.stringify(r.weights)===JSON.stringify(weights)&&r.won).length})),winningExamples:batch.results.filter(r=>r.won).slice(0,5)},null,2));
 if(process.argv.includes('--save')){const {writeFileSync}=await import('node:fs');writeFileSync(new URL('../defense-simulation.json',import.meta.url),JSON.stringify(batch,null,2));}
}
