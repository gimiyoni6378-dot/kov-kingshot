import {TROOPS,SLOTS,squadHealth} from './defense-engine.js?v=7';
import {formation,RUN_FRAMES,runFrame,FX_RECTS} from './defense-visuals.js?v=1';
const troopRects={archer:[[58,40,330,299],[458,40,330,299],[865,35,345,305]],infantry:[[65,430,290,306],[468,430,305,308],[883,412,310,327]],cavalry:[[48,810,325,380],[457,810,327,379],[862,790,350,400]]};
export function createDefenseRenderer({canvas,game,images,reduced=false,getMergeFlash=()=>null}){
const ctx=canvas.getContext('2d');
function sprite(image,rect,x,y,height,rotation=0){
 const width=height*rect[2]/rect[3];ctx.save();ctx.translate(x,y);ctx.rotate(rotation);ctx.drawImage(image,...rect,-width/2,-height,width,height);ctx.restore();
}
function fxImage(name,x,y,height,rotation=0,alpha=1){
 const rect=FX_RECTS[name],width=height*rect[2]/rect[3];ctx.save();ctx.globalAlpha=alpha;ctx.translate(x,y);ctx.rotate(rotation);ctx.drawImage(images.fx,...rect,-width/2,-height/2,width,height);ctx.restore();
}
function hpBar(x,y,width,health,color){
 ctx.fillStyle='#3b302bcc';ctx.fillRect(x-width/2,y,width,6);ctx.fillStyle=color;ctx.fillRect(x-width/2,y,width*Math.max(0,Math.min(1,health)),6);
}
function draw(){
 if(!images.background)return;
 const mergeFlash=getMergeFlash();
 const W=canvas.width,H=canvas.height;ctx.clearRect(0,0,W,H);ctx.drawImage(images.background,0,0,W,H);
 const time=game.clock;
 // Ground pads are painted as actual sandstone artwork before their armies.
 for(let index=3;index<6;index++){
  const pos=SLOTS[index],scale=248/1645;
  ctx.drawImage(images.pad,130,30,1645,755,pos.x*W-821*scale,pos.y*H-300*scale,1645*scale,755*scale);
 }
 const actors=[];
 game.slots.forEach((slot,index)=>{
  if(!slot)return;
  const units=slot.members;const positions=formation(units.length);
  const attack=game.effects.find(effect=>effect.index===index&&TROOPS[effect.type]);
  units.forEach((member,j)=>{
   const tier=member.tier-1,point=positions[j];let x=SLOTS[index].x*W+point.x,y=SLOTS[index].y*H+point.y-(SLOTS[index].wall?10:0);
   const progress=attack?1-attack.life/attack.total:0;
   // Feet are fixed on the inner stone surface; only cavalry deliberately charges out.
   if(attack&&slot.type==='cavalry'){
    const lunge=Math.sin(progress*Math.PI)*(attack.charged?1:.35);x+=(attack.tx-SLOTS[index].x)*W*lunge*.6;y+=Math.min(150,(attack.ty-SLOTS[index].y)*H)*lunge;
   }
   const lean=attack&&slot.type==='infantry'&&!reduced?Math.sin(progress*Math.PI*2)*.065:0;
   actors.push({y,draw:()=>{
    if(slot.type==='wizard')sprite(images.wizard,[0,0,images.wizard.naturalWidth,images.wizard.naturalHeight],x,y,190);else sprite(images.troops,troopRects[slot.type][tier],x,y,(slot.type==='cavalry'?194:173)+tier*13,lean);
    if(member.hp<member.maxHp)hpBar(x,y-((slot.type==='cavalry'?194:173)+tier*13)-8,52,member.hp/member.maxHp,'#7fbc4f');
   }});
  });
 });
 for(const enemy of game.enemies){
  const boss=enemy.kind!=='raider';const baseHeight=boss?(enemy.kind==='warlord'?252:214):147;
  const perspective=.8+.2*Math.max(0,Math.min(1,(enemy.y-.53)/.55));
  const frame=RUN_FRAMES[enemy.kind][runFrame(enemy.distance,reduced)];
  const scale=baseHeight/310*perspective;
  const bob=!reduced&&enemy.moving?Math.abs(Math.sin(enemy.distance/.018*Math.PI*2))*3:0;
  actors.push({y:enemy.y*H,draw:()=>{
   // Fixed per-row scale and foot anchors prevent frame-to-frame size changes.
   ctx.drawImage(images.run,...frame.rect,enemy.x*W-frame.foot[0]*scale,enemy.y*H-frame.foot[1]*scale-bob,frame.rect[2]*scale,frame.rect[3]*scale);
   if(enemy.hp<enemy.maxHp||boss)hpBar(enemy.x*W,enemy.y*H-baseHeight*perspective-12,boss?115:54,enemy.hp/enemy.maxHp,boss?'#b9432e':'#d98343');
   if(enemy.shielded){ctx.font='700 20px "Noto Sans KR",sans-serif';ctx.textAlign='center';ctx.fillStyle='#493f33d9';ctx.fillRect(enemy.x*W-31,enemy.y*H-baseHeight*perspective-43,62,24);ctx.fillStyle=enemy.brokenUntil>game.clock?'#fbd881':'#dbecf3';ctx.fillText(enemy.brokenUntil>game.clock?'약화':'철갑',enemy.x*W,enemy.y*H-baseHeight*perspective-24);}
  }});
  if(enemy.moving&&!reduced&&runFrame(enemy.distance)===1)fxImage('dust',enemy.x*W,enemy.y*H+3,37,0,.22);
 }
 actors.sort((a,b)=>a.y-b.y).forEach(actor=>actor.draw());
 for(const fx of game.effects){
  const progress=1-fx.life/fx.total,alpha=Math.sin(progress*Math.PI);
  if(fx.type==='archer'){
   const start={x:fx.x*W,y:fx.y*H-105},end={x:fx.tx*W,y:fx.ty*H-72};
   const x=start.x+(end.x-start.x)*progress,y=start.y+(end.y-start.y)*progress-Math.sin(progress*Math.PI)*55;
   const angle=Math.atan2(end.y-start.y-Math.cos(progress*Math.PI)*55,end.x-start.x)+Math.PI/2;
   fxImage('arrow',x,y,87,angle,1);
  }else if(fx.type==='wizard'){
   const x=fx.tx*W,y=fx.ty*H-45;
   ctx.save();ctx.globalCompositeOperation='screen';
   const glow=ctx.createRadialGradient(x,y,3,x,y,75);glow.addColorStop(0,'#fff6b9');glow.addColorStop(.3,'#ffb42b');glow.addColorStop(.65,'#f34d13aa');glow.addColorStop(1,'#df290000');ctx.fillStyle=glow;ctx.globalAlpha=alpha;ctx.beginPath();ctx.ellipse(x,y,70,85,0,0,Math.PI*2);ctx.fill();
   for(let n=0;n<7;n++){const shift=(n-3)*13,wave=Math.sin(progress*11+n);ctx.globalAlpha=alpha*(.65+n*.04);ctx.fillStyle=n%2?'#fff0a0':'#ff6b16';ctx.beginPath();ctx.moveTo(x+shift-10,y+30);ctx.bezierCurveTo(x+shift-25,y-5,x+shift+wave*20,y-55-progress*45,x+shift+7,y-85-progress*20);ctx.bezierCurveTo(x+shift+28,y-25,x+shift+20,y+12,x+shift+8,y+30);ctx.closePath();ctx.fill();}ctx.restore();
  }else if(fx.type==='infantry'){
   fxImage(progress<.55?'slash':'strongSlash',fx.tx*W,fx.ty*H-70,150,(progress-.5)*1.1,alpha*.95);
  }else if(fx.type==='cavalry'){
   const strength=fx.charged?1:.65;
   fxImage('hoof',fx.tx*W,fx.ty*H-12,(115+progress*70)*strength,0,alpha);
   fxImage('dust',fx.tx*W,fx.ty*H-10,(100+progress*80)*strength,0,alpha*.55);
  }else if(['hit','hurt','impact'].includes(fx.type)){
   fxImage('hit',fx.x*W,fx.y*H,fx.type==='impact'?135:70,progress*.4,alpha*(fx.type==='hurt'?.65:1));
  }else if(fx.type==='defeat'){
   fxImage('dust',fx.x*W,fx.y*H-25,100+progress*50,0,(1-progress)*.7);
  }else if(fx.type==='enemyVolley'){
   const x=(fx.x+(fx.tx-fx.x)*progress)*W,y=(fx.y+(fx.ty-fx.y)*progress)*H-65;
   fxImage('arrow',x,y,95,Math.atan2(fx.ty-fx.y,fx.tx-fx.x)+Math.PI/2,1);
  }
 }
 if(mergeFlash&&performance.now()<mergeFlash.until){const p=SLOTS[mergeFlash.index];fxImage('hit',p.x*W,p.y*H-70,155,0,.65);}
}
return draw;
}
