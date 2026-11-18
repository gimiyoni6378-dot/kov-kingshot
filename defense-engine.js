export const TROOPS={
 archer:{name:'궁병',cost:40,damage:12,interval:.9,range:.58,lane:false,row:0},
 infantry:{name:'보병',cost:30,damage:17,interval:1.1,range:.29,lane:true,row:1},
 cavalry:{name:'기병',cost:60,damage:23,interval:.65,range:.49,lane:true,row:2}
};
export const SLOTS=[{x:.28,y:.255,wall:true},{x:.5,y:.255,wall:true},{x:.72,y:.255,wall:true},{x:.27,y:.585,wall:false},{x:.5,y:.585,wall:false},{x:.73,y:.585,wall:false}];
export function combined(counts){
 const result=[...counts];
 for(let tier=0;tier<2;tier++){result[tier+1]+=Math.floor(result[tier]/5);result[tier]%=5;}
 return result;
}
export function squadPower(slot){return slot?slot.counts.reduce((sum,count,index)=>sum+count*[1,6,36][index],0):0;}
export function unitCount(slot){return slot?.counts.reduce((sum,count)=>sum+count,0)||0;}
export function highestTier(slot){return slot?slot.counts[2]?3:slot.counts[1]?2:1:0;}
export function wavePlan(wave){
 const number=5+wave*2;
 const plan=Array.from({length:number},(_,i)=>({at:i*.95,kind:'raider',lane:i%3}));
 if(wave===5||wave===10)plan.push({at:number*.95+1.2,kind:wave===5?'captain':'warlord',lane:1});
 return plan;
}
export class DefenseGame{
 constructor(){this.reset();}
 reset(){
  this.wave=1;this.phase='prep';this.gold=400;this.health=100;this.kills=0;this.enemies=[];this.effects=[];this.slots=Array(6).fill(null);this.clock=0;this.id=0;this.reward=0;
  this.recruit(0,'archer');this.recruit(1,'archer');this.recruit(3,'infantry');this.recruit(3,'infantry');this.recruit(4,'infantry');
 }
 recruit(index,type){
  if(this.phase!=='prep')return {ok:false,message:'웨이브 사이에 병사를 배치할 수 있어요.'};
  const position=SLOTS[index],spec=TROOPS[type];
  if(!position||!spec)return {ok:false,message:'배치할 병사와 자리를 선택해주세요.'};
  if(position.wall!==(type==='archer'))return {ok:false,message:type==='archer'?'궁병은 성벽 위에 배치해주세요.':'보병과 기병은 성문 앞에 배치해주세요.'};
  let slot=this.slots[index];
  if(slot&&slot.type!==type)return {ok:false,message:'다른 병종이 있어요. 해당 부대를 회수한 뒤 배치해주세요.'};
  if(slot&&slot.counts[2]>=5)return {ok:false,message:'이 자리는 3단계 5명으로 가득 찼어요.'};
  if(this.gold<spec.cost)return {ok:false,message:'금화가 부족해요. 웨이브를 방어해 금화를 모아주세요.'};
  if(!slot)slot=this.slots[index]={type,counts:[0,0,0],spent:0,cooldown:0};
  slot.counts[0]++;const merged=slot.counts[0]>=5;const mergedTier=merged?(slot.counts[1]===4?3:2):null;slot.counts=combined(slot.counts);slot.spent+=spec.cost;this.gold-=spec.cost;
  return {ok:true,merged,tier:mergedTier||highestTier(slot),message:merged?`${spec.name} 합체! ${mergedTier}단계로 성장했어요.`:`${spec.name} 1명 배치 · 5명 모이면 자동 합체`};
 }
 sell(index){
  if(this.phase!=='prep'||!this.slots[index])return {ok:false,message:'준비 중인 부대를 선택해주세요.'};
  const gold=Math.floor(this.slots[index].spent*.7);this.gold+=gold;this.slots[index]=null;
  return {ok:true,message:`부대를 회수하고 금화 ${gold}를 돌려받았어요.`};
 }
 start(){
  if(this.phase!=='prep')return false;
  if(!this.slots.some(Boolean))return false;
  this.phase='battle';this.clock=0;this.plan=wavePlan(this.wave);this.pending=0;this.enemies=[];this.effects=[];
  this.slots.forEach(slot=>{if(slot)slot.cooldown=.12;});return true;
 }
 next(){if(this.phase!=='cleared')return false;this.wave++;this.phase='prep';return true;}
 spawn(entry){
  const boss=entry.kind!=='raider';const hp=entry.kind==='warlord'?6500:entry.kind==='captain'?1600:42+this.wave*20;
  const enemy={id:++this.id,kind:entry.kind,lane:entry.lane,x:[.32,.5,.68][entry.lane],y:1.08,hp,maxHp:hp,speed:boss?.016:.029+this.wave*.0013,attackClock:0,damage:entry.kind==='warlord'?12:entry.kind==='captain'?7:3};
  this.enemies.push(enemy);
 }
 step(dt){
  if(this.phase!=='battle')return;
  dt=Math.max(0,Math.min(dt,.1));this.clock+=dt;
  while(this.pending<this.plan.length&&this.plan[this.pending].at<=this.clock)this.spawn(this.plan[this.pending++]);
  this.effects=this.effects.filter(effect=>(effect.life-=dt)>0);
  for(const [index,slot] of this.slots.entries()){
   if(!slot)continue;slot.cooldown-=dt;if(slot.cooldown>0)continue;
   const spec=TROOPS[slot.type];
   const candidates=this.enemies.filter(e=>e.hp>0&&(!spec.lane||Math.abs(e.lane-(index%3))<=0)&&e.y<=SLOTS[index].y+spec.range);
   const target=candidates.sort((a,b)=>a.y-b.y)[0];
   if(!target)continue;
   const damage=spec.damage*squadPower(slot);target.hp-=damage;slot.cooldown=spec.interval;
   this.effects.push({type:slot.type,x:SLOTS[index].x,y:SLOTS[index].y,tx:target.x,ty:target.y,life:.3,total:.3});
   if(target.hp<=0){this.gold+=target.kind==='raider'?16:target.kind==='captain'?180:350;this.kills++;}
  }
  this.enemies=this.enemies.filter(e=>e.hp>0);
  for(const enemy of this.enemies){
   const defender=this.slots[enemy.lane+3];
   const stop=defender?.type==='infantry'?.645:.61;
   if(enemy.y>stop){enemy.y=Math.max(stop,enemy.y-enemy.speed*dt);continue;}
   enemy.attackClock-=dt;
   if(enemy.attackClock<=0){
    enemy.attackClock=1.25;
    const reduction=defender?.type==='infantry'?.55:1;
    this.health=Math.max(0,this.health-enemy.damage*reduction);
    this.effects.push({type:'impact',x:enemy.x,y:.52,life:.3,total:.3});
   }
  }
  if(this.health<=0){this.phase='lost';return;}
  if(this.pending>=this.plan.length&&this.enemies.length===0){
   this.reward=100+this.wave*30;this.gold+=this.reward;this.phase=this.wave===10?'won':'cleared';
  }
 }
}
