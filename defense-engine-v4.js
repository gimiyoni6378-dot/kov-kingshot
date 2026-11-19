export const TROOPS={
 archer:{name:'궁병',cost:40,hp:70,damage:12,interval:.9,range:.58,lane:false,row:0,armor:0,role:'관통 지원',description:'세 갈래 길을 지원해요. 적 방어율 20%p를 무시하며 뒤의 적 1명에게 공격력 30%의 관통 피해를 줘요.'},
 infantry:{name:'보병',cost:30,hp:200,damage:17,interval:1.1,range:.15,lane:false,row:1,armor:.4,role:'방패 방어',description:'자기 길을 막으며 세 갈래 길의 적을 공격해요. 다른 길에는 70% 피해를 주며, 받는 피해를 40% 줄여요. 근접 공격은 적 방어율 55%p를 무시해 방패병에게 강해요.'},
 wizard:{name:'화염 마법사',cost:0,hp:420,damage:72,interval:.9,range:2,lane:false,row:3,armor:0,role:'히든 · 전장 전체 화염',description:'매 웨이브 준비 시 1% 확률로 단 한 번 합류해요. 성벽에 무료 배치하며, 나타난 모든 적에게 화염 피해를 줘요. 궁병 5명의 첫 합체와 같은 HP·공격력을 가져요. 합체와 추가 모집은 없어요.'},
 cavalry:{name:'기병',cost:60,hp:140,damage:23,interval:.65,range:.32,lane:true,row:2,armor:.1,role:'광역 돌진',description:'6초마다 2배 피해로 돌진해 방어율을 3초간 50%p 낮추고, 주변 적에게 공격력 60%의 피해를 줘요.'}
};
export const START_GOLD=200;
export function seedFromRunId(id){let value=2166136261;for(const char of String(id))value=Math.imul(value^char.charCodeAt(0),16777619);return value>>>0;}
export function hiddenRoll(seed,wave){let n=(seed+Math.imul(wave,0x6D2B79F5))|0;n=Math.imul(n^n>>>15,n|1);n^=n+Math.imul(n^n>>>7,n|61);return ((n^n>>>14)>>>0)/4294967296;}
export const isWallTroop=type=>type==='archer'||type==='wizard';
export const CLEAR_GOLD=[70,80,90,100,140,130,150,170,190,260];
export const STANDARD_BALANCE={rewardFactor:.97,hpScale:1.404,lateGrowth:.2,captainHp:6800,warlordHp:18000,crossLaneDamage:.7};
export const SLOTS=[{x:.28,y:.255,wall:true},{x:.5,y:.255,wall:true},{x:.72,y:.255,wall:true},{x:.27,y:.585,wall:false},{x:.5,y:.585,wall:false},{x:.73,y:.585,wall:false}];
export function unitStats(type,tier=1){
 const spec=TROOPS[type];if(!spec||![1,2,3].includes(tier))return null;
 const factor=[1,6,36][tier-1];return {hp:spec.hp*factor,damage:spec.damage*factor,interval:spec.interval,armor:spec.armor};
}
export function combined(counts){const result=[...counts];for(let tier=0;tier<2;tier++){result[tier+1]+=Math.floor(result[tier]/5);result[tier]%=5;}return result;}
export function squadPower(slot){return slot?slot.counts.reduce((sum,count,index)=>sum+count*[1,6,36][index],0):0;}
export function unitCount(slot){return slot?.counts.reduce((sum,count)=>sum+count,0)||0;}
export function highestTier(slot){return slot?slot.counts[2]?3:slot.counts[1]?2:1:0;}
export function squadHealth(slot){return slot?.members?.reduce((totals,unit)=>({hp:totals.hp+unit.hp,maxHp:totals.maxHp+unit.maxHp}),{hp:0,maxHp:0})||{hp:0,maxHp:0};}
export function wavePlan(wave){
 const number=5+wave*2+Math.floor(Math.max(0,wave-3)*.5);const plan=Array.from({length:number},(_,i)=>({at:i*.95,kind:'raider',lane:i%3,shielded:wave>=4&&i%4===3}));
 if(wave===5||wave===10)plan.push({at:number*.95+1.2,kind:wave===5?'captain':'warlord',lane:1});return plan;
}
export class DefenseGame{
 constructor(balance={},seed=0){this.balance={...STANDARD_BALANCE,...balance};this.reset(seed);}
 reset(seed=0){
  this.seed=seed>>>0;this.wizardUnlocked=false;this.wizardUsed=false;this.wizardAvailable=false;this.rollHidden(1);
  this.wave=1;this.phase='prep';this.gold=START_GOLD;this.health=100;this.kills=0;this.deaths=0;this.enemies=[];this.effects=[];this.strikes=[];this.slots=Array(6).fill(null);this.clock=0;this.id=0;this.reward=0;
 }
 rollHidden(wave){if(!this.wizardUnlocked&&hiddenRoll(this.seed,wave)<.01){this.wizardUnlocked=true;this.wizardAvailable=true;this.wizardWave=wave;}}
 refreshSquad(index){
  const slot=this.slots[index];if(!slot)return;
  slot.members=slot.members.filter(unit=>unit.hp>0);
  if(!slot.members.length){this.slots[index]=null;return;}
  slot.counts=[0,0,0];slot.spent=0;
  for(const member of slot.members){slot.counts[member.tier-1]++;slot.spent+=member.paid;}
 }
 recruit(index,type){
  if(this.phase!=='prep')return {ok:false,message:'웨이브 사이에 병사를 배치할 수 있어요.'};
  const position=SLOTS[index],spec=TROOPS[type];if(!position||!spec)return {ok:false,message:'배치할 병사와 자리를 선택해주세요.'};
  if(position.wall!==isWallTroop(type))return {ok:false,message:type==='archer'?'궁병은 성벽 위에 배치해주세요.':'보병과 기병은 성문 앞에 배치해주세요.'};
  if(type==='wizard'&&(!this.wizardAvailable||this.wizardUsed))return {ok:false,message:'합류한 화염 마법사는 한 번만 배치할 수 있어요.'};
  let slot=this.slots[index];if(slot&&slot.type!==type)return {ok:false,message:'다른 병종이 있어요. 해당 부대를 회수한 뒤 배치해주세요.'};
  if(slot&&slot.counts[2]>=5)return {ok:false,message:'이 자리는 3단계 5명으로 가득 찼어요.'};
  if(this.gold<spec.cost)return {ok:false,message:'금화가 부족해요. 웨이브를 방어해 금화를 모아주세요.'};
  if(!slot)slot=this.slots[index]={type,counts:[0,0,0],members:[],spent:0,cooldown:0,chargeCooldown:0};
  if(type==='wizard'){this.wizardAvailable=false;this.wizardUsed=true;}
  slot.members.push({id:++this.id,tier:1,hp:spec.hp,maxHp:spec.hp,paid:spec.cost});this.gold-=spec.cost;let mergedTier=null;
  for(let tier=1;tier<=2;tier++){
   const candidates=slot.members.filter(unit=>unit.tier===tier);
   if(candidates.length<5)continue;
   const merging=candidates.slice(0,5),ids=new Set(merging.map(unit=>unit.id));
   const ratio=merging.reduce((sum,unit)=>sum+unit.hp,0)/merging.reduce((sum,unit)=>sum+unit.maxHp,0);
   const maxHp=unitStats(type,tier+1).hp;slot.members=slot.members.filter(unit=>!ids.has(unit.id));
   slot.members.push({id:++this.id,tier:tier+1,hp:maxHp*ratio,maxHp,paid:merging.reduce((sum,unit)=>sum+unit.paid,0)});mergedTier=tier+1;
  }
  this.refreshSquad(index);return {ok:true,merged:mergedTier!==null,tier:mergedTier||highestTier(slot),message:mergedTier?`${spec.name} 합체! ${mergedTier}단계로 성장했어요.`:`${spec.name} 1명 배치 · 5명 모이면 자동 합체`};
 }
 refundValue(index){return this.phase==='prep'&&this.slots[index]?Math.floor(this.slots[index].spent*.7):0;}
 sell(index){
  if(this.phase!=='prep'||!this.slots[index])return {ok:false,message:'준비 중인 부대를 선택해주세요.'};
  const gold=this.refundValue(index);this.gold+=gold;this.slots[index]=null;return {ok:true,refund:gold,message:`살아남은 부대를 회수하고 금화 ${gold}를 돌려받았어요.`};
 }
 start(){
  if(this.phase!=='prep'||!this.slots.some(Boolean))return false;
  this.phase='battle';this.clock=0;this.plan=wavePlan(this.wave);this.pending=0;this.enemies=[];this.effects=[];this.strikes=[];
  this.slots.forEach(slot=>{if(slot){slot.cooldown=.12;slot.chargeCooldown=0;}});return true;
 }
 next(){if(this.phase!=='cleared')return false;this.wave++;this.phase='prep';this.rollHidden(this.wave);return true;}
 spawn(entry){
  const hp=(entry.kind==='warlord'?this.balance.warlordHp:entry.kind==='captain'?this.balance.captainHp:(42+this.wave*20)*(1+Math.max(0,this.wave-3)*this.balance.lateGrowth))*this.balance.hpScale;
  this.enemies.push({id:++this.id,kind:entry.kind,lane:entry.lane,x:[.32,.5,.68][entry.lane],y:1.08,hp,maxHp:hp,speed:entry.kind==='raider'?.029+this.wave*.0013:.016,attackClock:0,rangedClock:2,distance:0,moving:true,shielded:Boolean(entry.shielded),brokenUntil:0,armor:entry.kind==='warlord'?.25:entry.kind==='captain'?.15:entry.shielded?.7:0,damage:entry.kind==='warlord'?400:entry.kind==='captain'?160:8+this.wave*2});
 }
 damageEnemy(enemy,amount,penetrate=false){
  if(!enemy||enemy.hp<=0)return;const armor=Math.max(0,enemy.armor-(enemy.brokenUntil>this.clock?.5:0)-(penetrate===true?.2:Number(penetrate)||0));enemy.hp=Math.max(0,enemy.hp-amount*(1-armor));
  this.effects.push({type:'hit',x:enemy.x,y:enemy.y-.035,life:.24,total:.24});
  if(enemy.hp===0){this.gold+=Math.round((enemy.kind==='raider'?8:enemy.kind==='captain'?100:200)*this.balance.rewardFactor);this.kills++;this.effects.push({type:'defeat',x:enemy.x,y:enemy.y,life:.4,total:.4});}
 }
 damageSquad(index,rawDamage){
  const slot=this.slots[index];if(!slot)return;
  let remaining=rawDamage*(1-TROOPS[slot.type].armor);
  for(const unit of slot.members){if(remaining<=0)break;const hit=Math.min(unit.hp,remaining);unit.hp-=hit;remaining-=hit;if(unit.hp<=0)this.deaths++;}
  this.effects.push({type:'hurt',x:SLOTS[index].x,y:SLOTS[index].y-.035,life:.28,total:.28});this.refreshSquad(index);
 }
 resolveStrike(strike){
  const target=this.enemies.find(enemy=>enemy.id===strike.target&&enemy.hp>0);if(!target)return;
  if(strike.charged)target.brokenUntil=this.clock+3;
  this.damageEnemy(target,strike.damage*(strike.charged?2:1),strike.type==='infantry'?.55:strike.type==='archer');
  if(strike.type==='archer'){
   const behind=this.enemies.filter(enemy=>enemy.id!==target.id&&enemy.hp>0&&enemy.lane===target.lane&&enemy.y>target.y&&enemy.y-target.y<.15).sort((a,b)=>a.y-b.y)[0];
   if(behind)this.damageEnemy(behind,strike.damage*.3,true);
  }
  if(strike.charged)for(const enemy of this.enemies)if(enemy.id!==target.id&&enemy.hp>0&&Math.hypot(enemy.x-target.x,enemy.y-target.y)<.18)this.damageEnemy(enemy,strike.damage*.6);
 }
 step(dt){
  if(this.phase!=='battle')return;dt=Math.max(0,Math.min(dt,.1));this.clock+=dt;
  while(this.pending<this.plan.length&&this.plan[this.pending].at<=this.clock)this.spawn(this.plan[this.pending++]);
  this.effects=this.effects.filter(effect=>(effect.life-=dt)>0);
  const due=this.strikes.filter(strike=>(strike.delay-=dt)<=0);this.strikes=this.strikes.filter(strike=>strike.delay>0);due.forEach(strike=>this.resolveStrike(strike));
  this.enemies=this.enemies.filter(enemy=>enemy.hp>0);
  for(const [index,slot] of this.slots.entries()){
   if(!slot)continue;slot.cooldown-=dt;slot.chargeCooldown-=dt;if(slot.cooldown>0)continue;
   const spec=TROOPS[slot.type];
   const candidates=this.enemies.filter(enemy=>enemy.hp>0&&(!spec.lane||enemy.lane===index%3)&&enemy.y<=SLOTS[index].y+spec.range).sort((a,b)=>a.y-b.y);
   const target=slot.type==='infantry'?(candidates.find(enemy=>enemy.lane===(slot.targetLane??index%3))||candidates[0]):candidates[0];
   if(!target)continue;
   if(slot.type==='wizard'){
    slot.cooldown=spec.interval;
    for(const enemy of candidates){this.effects.push({type:'wizard',index,x:SLOTS[index].x,y:SLOTS[index].y,tx:enemy.x,ty:enemy.y,life:.55,total:.55});this.strikes.push({type:'wizard',target:enemy.id,damage:spec.damage,charged:false,delay:.25});}
    continue;
   }
   if(slot.type==='infantry')slot.targetLane=(target.lane+1)%3;
   const charged=slot.type==='cavalry'&&slot.chargeCooldown<=0;if(charged)slot.chargeCooldown=6;
   slot.cooldown=spec.interval;const total=slot.type==='archer'?.34:slot.type==='infantry'?.42:.52;
   this.effects.push({type:slot.type,index,x:SLOTS[index].x,y:SLOTS[index].y,tx:target.x,ty:target.y,charged,life:total,total});
   this.strikes.push({type:slot.type,target:target.id,damage:spec.damage*squadPower(slot)*(slot.type==='infantry'&&target.lane!==index%3?this.balance.crossLaneDamage:1),charged,delay:slot.type==='archer'?.27:slot.type==='infantry'?.15:.24});
  }
  for(const enemy of this.enemies){
   // Bosses pressure unprotected archers before reaching the gate. A ground line draws fire.
   if(enemy.kind!=='raider'&&enemy.y<.94){
    enemy.rangedClock-=dt;
    if(enemy.rangedClock<=0){
     enemy.rangedClock=enemy.kind==='warlord'?2.6:3.5;
     const front=[enemy.lane+3,...[3,4,5].filter(i=>i!==enemy.lane+3)].find(i=>this.slots[i]);
     const back=[0,1,2].filter(i=>this.slots[i]).sort((a,b)=>squadHealth(this.slots[a]).hp-squadHealth(this.slots[b]).hp)[0];
     const target=front??back;
     if(target!==undefined){
      this.damageSquad(target,enemy.damage*(front!==undefined?.75:4));
      this.effects.push({type:'enemyVolley',x:enemy.x,y:enemy.y-.06,tx:SLOTS[target].x,ty:SLOTS[target].y,life:.38,total:.38});
     }
    }
   }
   const defender=this.slots[enemy.lane+3];const stop=defender?.members.length?.645:.53;
   if(enemy.y>stop){const movement=Math.min(enemy.y-stop,enemy.speed*dt);enemy.y-=movement;enemy.distance+=movement;enemy.moving=true;continue;}
   enemy.moving=false;enemy.attackClock-=dt;if(enemy.attackClock>0)continue;
   enemy.attackClock=enemy.kind==='warlord'?2.4:enemy.kind==='captain'?1.8:1.25;
   if(defender){
    this.damageSquad(enemy.lane+3,enemy.damage);
    if(enemy.kind==='captain')for(const i of [3,4,5])if(i!==enemy.lane+3&&this.slots[i])this.damageSquad(i,enemy.damage*.25);
    if(enemy.kind==='warlord')for(const [i,slot] of this.slots.entries())if(slot&&i!==enemy.lane+3)this.damageSquad(i,enemy.damage*(i<3?.15:.45));
   }else{
    const gateDamage=enemy.kind==='warlord'?12:enemy.kind==='captain'?7:3;
    this.health=Math.max(0,this.health-gateDamage);this.effects.push({type:'impact',x:enemy.x,y:.52,life:.4,total:.4});
   }
  }
  if(this.health<=0){this.phase='lost';return;}
  if(this.pending>=this.plan.length&&this.enemies.length===0&&this.strikes.length===0){
   this.reward=Math.round(CLEAR_GOLD[this.wave-1]*this.balance.rewardFactor/5)*5;this.gold+=this.reward;this.phase=this.wave===10?'won':'cleared';
   for(const slot of this.slots)if(slot)for(const unit of slot.members)unit.hp=Math.min(unit.maxHp,unit.hp+unit.maxHp*.2);
  }
 }
}
