import {DefenseGame,TROOPS,SLOTS,unitCount,highestTier} from './defense-engine.js?v=1';
const $=s=>document.querySelector(s),canvas=$('#world'),ctx=canvas.getContext('2d');
const game=new DefenseGame();let selected='archer',selectedSlot=null,paused=false,speed=1,lastTime=0,assetsReady=false,noticeTime=0,reportedPhase='',reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const troopRects={archer:[[58,40,330,320],[458,40,330,320],[865,35,345,325]],infantry:[[65,430,290,330],[468,430,305,330],[883,412,310,348]],cavalry:[[48,810,325,400],[457,810,327,400],[862,790,350,420]]};
const enemyRects={raider:[140,165,423,477],captain:[698,85,629,573],warlord:[1444,11,707,660]};
const images={};
function loadImage(key,path){return new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>{images[key]=image;resolve();};image.onerror=()=>reject(new Error(path));image.src=path;});}
function tell(text){$('#hint').textContent=text;noticeTime=performance.now()+4500;}
const slotButtons=SLOTS.map((position,index)=>{
 const button=document.createElement('button');button.type='button';button.className='slot';button.style.left=`${position.x*100}%`;button.style.top=`${position.y*100}%`;
 const plus=document.createElement('span');plus.className='slot-plus';plus.textContent='+';plus.setAttribute('aria-hidden','true');const tag=document.createElement('span');tag.className='slot-tag';button.append(plus,tag);
 button.addEventListener('click',()=>{selectedSlot=index;const result=game.recruit(index,selected);tell(result.message);if(result.merged)mergeFlash={index,until:performance.now()+900};updateUI();});
 $('#slots').append(button);return button;
});
let mergeFlash=null;
for(const button of document.querySelectorAll('[data-troop]'))button.addEventListener('click',()=>{
 selected=button.dataset.troop;for(const peer of document.querySelectorAll('[data-troop]')){const active=peer===button;peer.classList.toggle('selected',active);peer.setAttribute('aria-pressed',String(active));}
 tell(selected==='archer'?'궁병을 성벽 위 자리에 배치하세요.':`${TROOPS[selected].name}을 성문 앞 자리에 배치하세요.`);updateUI();
});
$('#sell').addEventListener('click',()=>{if(selectedSlot!==null)tell(game.sell(selectedSlot).message);updateUI();});
$('#settings').addEventListener('click',()=>{if(game.phase==='battle'&&!paused)togglePause();$('#help').showModal();});
$('#speed').addEventListener('click',()=>{speed=speed===1?2:1;$('#speed').textContent=`${speed}×`;$('#speed').setAttribute('aria-label',`현재 ${speed}배속, 클릭하여 ${speed===1?2:1}배로 변경`);});
function togglePause(){if(game.phase!=='battle')return;paused=!paused;$('#pause').innerHTML=`<i class="bi bi-${paused?'play':'pause'}-fill" aria-hidden="true"></i>`;$('#pause').setAttribute('aria-label',paused?'전투 이어하기':'일시정지');tell(paused?'전투를 일시정지했어요. 재생 버튼으로 이어가세요.':'다시 성벽을 지켜주세요.');updateUI();}
$('#pause').addEventListener('click',togglePause);
document.addEventListener('visibilitychange',()=>{if(document.hidden&&game.phase==='battle'&&!paused)togglePause();});
$('#start').addEventListener('click',()=>{
 if(game.phase==='battle'){togglePause();return;}
 if(game.start()){paused=false;reportedPhase='';tell(`${game.wave}웨이브 시작! 병사들이 자동으로 싸워요.`);updateUI();}
});
$('#result-action').addEventListener('click',()=>{
 if(game.phase==='cleared'){game.next();}else game.reset();
 reportedPhase='';selectedSlot=null;paused=false;$('#result').hidden=true;tell(`${game.wave}웨이브를 준비하세요. 병사를 보충하면 더 강해져요.`);updateUI();
});
function updateUI(){
 $('#gold').textContent=Math.floor(game.gold).toLocaleString('ko-KR');$('#wave').textContent=`WAVE ${game.wave} / 10`;$('#health-fill').style.width=`${game.health}%`;$('#health-label').textContent=`성문 ${Math.ceil(game.health)}%`;
 const battle=game.phase==='battle';$('#pause').disabled=!battle;$('#start').disabled=!assetsReady||!['prep','battle'].includes(game.phase);$('#start').textContent=!assetsReady?'전장 준비 중…':battle?(paused?'전투 이어하기':'자동 전투 중 · 일시정지'):'전투 시작';
 $('#boss-alert').hidden=![5,10].includes(game.wave);$('#boss-alert').textContent=game.wave===5?'중간보스 · 쌍도끼 약탈 대장':'최종보스 · 철갑 전쟁군주';
 for(const [index,button] of slotButtons.entries()){
  const slot=game.slots[index];button.disabled=game.phase!=='prep';button.classList.toggle('occupied',Boolean(slot));button.classList.toggle('compatible',game.phase==='prep'&&(SLOTS[index].wall===(selected==='archer'))&&(!slot||slot.type===selected));button.classList.toggle('selected-slot',selectedSlot===index);
  button.querySelector('.slot-plus').hidden=Boolean(slot);button.querySelector('.slot-tag').hidden=!slot;
  if(slot){button.querySelector('.slot-tag').textContent=`${TROOPS[slot.type].name} ${highestTier(slot)}단계 · ${unitCount(slot)}명`;button.setAttribute('aria-label',`${index+1}번 ${TROOPS[slot.type].name} 부대: 1단계 ${slot.counts[0]}명, 2단계 ${slot.counts[1]}명, 3단계 ${slot.counts[2]}명. 같은 병사 1명 추가`);}
  else button.setAttribute('aria-label',`${index+1}번 ${SLOTS[index].wall?'성벽 궁병':'성문 앞 보병·기병'} 빈자리 배치`);
 }
 const selectedArmy=selectedSlot!==null?game.slots[selectedSlot]:null;
 $('#sell').hidden=game.phase!=='prep'||!selectedArmy;
 $('#squad-summary').textContent=selectedArmy?`1단계 ${selectedArmy.counts[0]} · 2단계 ${selectedArmy.counts[1]} · 3단계 ${selectedArmy.counts[2]}`:'같은 병종 · 같은 단계 5명 → 자동 합체';
 for(const card of document.querySelectorAll('[data-troop]'))card.disabled=game.phase!=='prep'||!assetsReady;
 if(['cleared','lost','won'].includes(game.phase)&&reportedPhase!==game.phase){
  reportedPhase=game.phase;$('#result').hidden=false;
  $('#result-kicker').textContent=game.phase==='won'?'VICTORY · KOV 1887':game.phase==='cleared'?'WAVE CLEAR':'DEFENSE FAILED';
  $('#result-title').textContent=game.phase==='won'?'1887의 성벽을 지켰어요!':game.phase==='cleared'?`${game.wave}웨이브 방어 성공!`:'성문이 무너졌어요';
  $('#result-copy').textContent=game.phase==='lost'?'병력을 합체하고 다시 도전해보세요.':`클리어 보상 금화 +${game.reward}\n${game.phase==='won'?`10웨이브 완주 · ${game.kills}명 격퇴`:'병력을 보충하고 다음 웨이브를 준비하세요.'}`;
  $('#result-action').textContent=game.phase==='cleared'?'다음 웨이브 준비 →':'처음부터 다시 도전';
 }
}
function sprite(image,rect,x,y,height){const width=height*rect[2]/rect[3];ctx.drawImage(image,...rect,x-width/2,y-height,width,height);}
function draw(){
 if(!assetsReady)return;
 const W=canvas.width,H=canvas.height;ctx.clearRect(0,0,W,H);ctx.drawImage(images.background,0,0,W,H);
 const time=performance.now()/1000;
 // Draw soldiers and enemies in ground-depth order. All characters are real raster sprites.
 const actors=[];
 game.slots.forEach((slot,index)=>{
  if(!slot)return;const units=[];slot.counts.forEach((count,tier)=>{for(let j=0;j<count;j++)units.push(tier);});
  units.forEach((tier,j)=>{
   const side=(j-(units.length-1)/2),spread=Math.min(39,118/Math.max(1,units.length-1));
   const y=SLOTS[index].y*H+(j%2?10:0);const x=SLOTS[index].x*W+side*spread;
   const offset=!reduced&&game.phase==='battle'&&!paused?Math.sin(time*5+j)*2:0;
   actors.push({y,draw:()=>sprite(images.troops,troopRects[slot.type][tier],x,y+offset,(slot.type==='cavalry'?207:186)+tier*15)});
  });
 });
 for(const enemy of game.enemies){
  const boss=enemy.kind!=='raider',height=boss?(enemy.kind==='warlord'?258:215):126;
  const sway=!reduced&&!paused?Math.sin(time*7+enemy.id)*3:0;
  actors.push({y:enemy.y*H,draw:()=>{
   sprite(images.enemies,enemyRects[enemy.kind],enemy.x*W+sway,enemy.y*H,height);
   if(enemy.hp<enemy.maxHp||boss){const barWidth=boss?115:54,x=enemy.x*W-barWidth/2,y=enemy.y*H-height-10;ctx.fillStyle='#4d3528b8';ctx.fillRect(x,y,barWidth,7);ctx.fillStyle=boss?'#b9432e':'#d98343';ctx.fillRect(x,y,barWidth*enemy.hp/enemy.maxHp,7);}
  }});
 }
 actors.sort((a,b)=>a.y-b.y).forEach(actor=>actor.draw());
 for(const fx of game.effects){
  const alpha=fx.life/fx.total;ctx.globalAlpha=alpha;
  if(fx.type==='archer'){
   const f=1-alpha,x=(fx.x+(fx.tx-fx.x)*f)*W,y=(fx.y+(fx.ty-fx.y)*f)*H-60;
   const angle=Math.atan2(fx.ty-fx.y,fx.tx-fx.x);ctx.strokeStyle='#ffdf91';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-Math.cos(angle)*30,y-Math.sin(angle)*30);ctx.stroke();
  }else if(fx.type==='impact'){
   ctx.fillStyle='#ffb05c';ctx.beginPath();ctx.arc(fx.x*W,fx.y*H,(1-alpha)*45,0,Math.PI*2);ctx.fill();
  }else{
   const x=fx.tx*W,y=fx.ty*H-70;ctx.strokeStyle=fx.type==='cavalry'?'#a7e4ff':'#fff0b6';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(x-18,y+22);ctx.lineTo(x+18,y-22);ctx.stroke();
  }
 }
 ctx.globalAlpha=1;
 if(mergeFlash&&performance.now()<mergeFlash.until){const p=SLOTS[mergeFlash.index];ctx.strokeStyle='#ffe17c';ctx.lineWidth=6;ctx.beginPath();ctx.ellipse(p.x*W,p.y*H,78,34,0,0,Math.PI*2);ctx.stroke();}
}
let lastUI=0;
function frame(now){
 const dt=Math.min((now-lastTime)/1000,.1);lastTime=now;
 if(!paused&&assetsReady&&game.phase==='battle'){for(let i=0;i<speed;i++)game.step(dt);}
 if(now-lastUI>100){updateUI();lastUI=now;}
 draw();requestAnimationFrame(frame);
}
async function init(){
 try{
  await Promise.all([loadImage('background','./assets/defense/battlefield.png'),loadImage('troops','./assets/defense/troops.png'),loadImage('enemies','./assets/defense/enemies.png')]);
  // Build portrait tiles from the same transparent sprite source; no external art dependency.
  for(const element of document.querySelectorAll('[data-portrait]')){
   const rect=troopRects[element.dataset.portrait][0];
   element.style.backgroundImage='url("./assets/defense/troops.png")';
   element.style.backgroundSize=`${1254/rect[2]*100}% ${1254/rect[3]*100}%`;
   element.style.backgroundPosition=`${rect[0]/(1254-rect[2])*100}% ${rect[1]/(1254-rect[3])*100}%`;
  }
  assetsReady=true;$('#loading').hidden=true;updateUI();lastTime=performance.now();requestAnimationFrame(frame);
 }catch(error){$('#loading').querySelector('p').textContent='전장 이미지를 불러오지 못했어요. 새로고침해주세요.';console.error(error);}
}
updateUI();init();
