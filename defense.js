import {createAccountGame} from './defense-account.js?v=3';
import {recordGame,rewardForStage} from './defense-replay.js?v=2';
import {choosePad} from './defense-controls.js?v=1';
import {formation,portraitLayout,RUN_FRAMES,runFrame,FX_RECTS} from './defense-visuals.js?v=1';
import {DefenseGame,TROOPS,SLOTS,unitCount,highestTier,unitStats,squadHealth} from './defense-engine.js?v=4';
const $=s=>document.querySelector(s),canvas=$('#world'),ctx=canvas.getContext('2d');
const game=new DefenseGame();let selected='archer',selectedSlot=null,paused=false,speed=1,lastTime=0,assetsReady=false,noticeTime=0,reportedPhase='',reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let commands=recordGame(game),clearedStage=0,settled=null,settling=false,accumulator=0;
const account=createAccountGame(()=>{game.reset();commands.length=0;clearedStage=0;settled=null;selectedSlot=null;paused=false;reportedPhase='';$('#result').hidden=true;updateUI();});
async function finishRun(){
 if(settling||game.phase==='battle')return false;
 if(settled)return true;
 settling=true;updateUI();$('#reward-status').textContent='플레이 기록 확인 · 포인트 적립 중…';
 try{
  settled=await account.settle(commands);
  $('#reward-status').textContent=`${settled.cleared}단계 클리어 · +${settled.awarded}P 적립 완료 · 보유 ${Number(settled.points).toLocaleString('ko-KR')}P`;
  tell($('#reward-status').textContent);return true;
 }catch(error){$('#reward-status').textContent=error.message;tell(error.message);return false;}
 finally{settling=false;updateUI();}
}
async function endChallenge(){
 if(game.phase==='battle')return;
 $('#result').hidden=false;$('#result-title').textContent='이번 도전의 기록';$('#result-copy').textContent=`최고 ${clearedStage}단계 클리어 · 정산 예정 ${rewardForStage(clearedStage)}P`;$('#result-kicker').textContent='CHALLENGE RESULT';
 await finishRun();
}
$('#finish-game').addEventListener('click',endChallenge);$('#result-finish').addEventListener('click',endChallenge);
const troopRects={archer:[[58,40,330,299],[458,40,330,299],[865,35,345,305]],infantry:[[65,430,290,306],[468,430,305,308],[883,412,310,327]],cavalry:[[48,810,325,380],[457,810,327,379],[862,790,350,400]]};
const images={};
function loadImage(key,path){return new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>{images[key]=image;resolve();};image.onerror=()=>reject(new Error(path));image.src=path;});}
function tell(text){$('#hint').textContent=text;noticeTime=performance.now()+4500;}
const slotButtons=SLOTS.map((position,index)=>{
 const button=document.createElement('button');button.type='button';button.className='slot';button.style.left=`${position.x*100}%`;button.style.top=`${position.y*100}%`;button.classList.toggle('ground-slot',!position.wall);
 const plus=document.createElement('span');plus.className='slot-plus';plus.textContent='+';plus.setAttribute('aria-hidden','true');const tag=document.createElement('span');tag.className='slot-tag';button.append(plus,tag);
 button.addEventListener('click',()=>{selectedSlot=index;if(!account.ready)return;const result=choosePad(game,index,selected);if(result.action==='select')selectType(result.type);tell(result.message);if(result.merged)mergeFlash={index,until:performance.now()+900};updateUI();});
 $('#slots').append(button);return button;
});
let mergeFlash=null;
function selectType(type){
 selected=type;for(const peer of document.querySelectorAll('[data-troop]')){const active=peer.dataset.troop===type;peer.classList.toggle('selected',active);peer.setAttribute('aria-pressed',String(active));}
}
for(const button of document.querySelectorAll('[data-troop]'))button.addEventListener('click',()=>{
 selectType(button.dataset.troop);selectedSlot=null;
 tell(selected==='archer'?'빈 성벽 자리로 궁병을 배치하세요. 배치된 부대를 누르면 추가·회수할 수 있어요.':`빈 성문 앞 자리로 ${TROOPS[selected].name}을 배치하세요. 기존 부대는 눌러서 선택하세요.`);updateUI();
});
$('#add-unit').addEventListener('click',()=>{
 const army=selectedSlot===null?null:game.slots[selectedSlot];if(!army||!account.ready)return;
 const result=game.recruit(selectedSlot,army.type);tell(result.message);if(result.merged)mergeFlash={index:selectedSlot,until:performance.now()+900};updateUI();
});
$('#sell').addEventListener('click',()=>{
 if(selectedSlot===null||!account.ready)return;
 const result=game.sell(selectedSlot);tell(result.message);if(result.ok)selectedSlot=null;updateUI();
});
$('#settings').addEventListener('click',()=>{if(game.phase==='battle'&&!paused)togglePause();$('#help').showModal();});
$('#speed').addEventListener('click',()=>{speed=speed===1?2:1;$('#speed').textContent=`${speed}×`;$('#speed').setAttribute('aria-label',`현재 ${speed}배속, 클릭하여 ${speed===1?2:1}배로 변경`);});
function togglePause(){if(game.phase!=='battle')return;paused=!paused;$('#pause').innerHTML=`<i class="bi bi-${paused?'play':'pause'}-fill" aria-hidden="true"></i>`;$('#pause').setAttribute('aria-label',paused?'전투 이어하기':'일시정지');tell(paused?'전투를 일시정지했어요. 재생 버튼으로 이어가세요.':'다시 성벽을 지켜주세요.');updateUI();}
$('#pause').addEventListener('click',togglePause);
document.addEventListener('visibilitychange',()=>{if(document.hidden&&game.phase==='battle'&&!paused)togglePause();});
$('#start').addEventListener('click',()=>{
 if(game.phase==='battle'){togglePause();return;}
 if(!account.ready)return;
 if(game.start()){accumulator=0;paused=false;reportedPhase='';tell(`${game.wave}웨이브 시작! 병사들이 자동으로 싸워요.`);updateUI();}else tell('200골드로 병사를 먼저 배치해주세요.');
});
$('#result-action').addEventListener('click',async()=>{
 if(settling)return;
 if(game.phase==='cleared'&&!settled){game.next();}
 else {if(!await finishRun())return;await account.restart();}
 reportedPhase='';selectedSlot=null;paused=false;$('#reward-status').textContent='';$('#result').hidden=true;tell(game.wave===1?'200골드로 새 도전을 시작해요.':`${game.wave}웨이브 준비 · 생존 병사는 HP를 20% 회복했어요.`);updateUI();
});
let renderedStatsType=null;
function updateUnitStats(){
 if(renderedStatsType===selected)return;renderedStatsType=selected;
 const spec=TROOPS[selected];$('#unit-role').textContent=`${spec.name} · ${spec.role}`;$('#unit-ability').textContent=spec.description;
 $('#unit-summary').textContent=`1단계 HP ${spec.hp} · 공격 ${spec.damage} · ${spec.interval}초마다`;
 $('#unit-stat-table').replaceChildren();
 for(let tier=1;tier<=3;tier++){
  const stats=unitStats(selected,tier),row=document.createElement('tr');
  for(const value of [`${tier}단계`,stats.hp.toLocaleString('ko-KR'),stats.damage.toLocaleString('ko-KR')]){const cell=document.createElement('td');cell.textContent=value;row.append(cell);}
  $('#unit-stat-table').append(row);
 }
}
function updateUI(){
 $('#finish-game').disabled=!account.ready||game.phase==='battle'||settling;
 $('#result-finish').hidden=game.phase!=='cleared'||Boolean(settled);$('#result-finish').disabled=settling;$('#result-action').disabled=settling;
 $('#gold').textContent=Math.floor(game.gold).toLocaleString('ko-KR');$('#wave').textContent=`WAVE ${game.wave} / 10`;$('#health-fill').style.width=`${game.health}%`;$('#health-label').textContent=`성문 ${Math.ceil(game.health)}%`;
 const battle=game.phase==='battle';$('#pause').disabled=!battle;$('#start').disabled=!account.ready||!assetsReady||!['prep','battle'].includes(game.phase)||(game.phase==='prep'&&!game.slots.some(Boolean));$('#start').textContent=!assetsReady?'전장 준비 중…':battle?(paused?'전투 이어하기':'자동 전투 중 · 일시정지'):(game.slots.some(Boolean)?'전투 시작':'병사를 먼저 배치해주세요');
 $('#boss-alert').hidden=![5,10].includes(game.wave);$('#boss-alert').textContent=game.wave===5?'중간보스 · 쌍도끼 약탈 대장':'최종보스 · 철갑 전쟁군주';
 for(const [index,button] of slotButtons.entries()){
  const slot=game.slots[index];button.disabled=!account.ready||game.phase!=='prep';button.classList.toggle('occupied',Boolean(slot));button.classList.toggle('compatible',game.phase==='prep'&&(SLOTS[index].wall===(selected==='archer'))&&(!slot||slot.type===selected));button.classList.toggle('selected-slot',selectedSlot===index);
  button.querySelector('.slot-plus').hidden=Boolean(slot);button.querySelector('.slot-tag').hidden=!slot;
  if(slot){button.querySelector('.slot-tag').textContent=`${TROOPS[slot.type].name} ${highestTier(slot)}단계 · ${unitCount(slot)}명`;button.setAttribute('aria-label',`${index+1}번 ${TROOPS[slot.type].name} 부대: 1단계 ${slot.counts[0]}명, 2단계 ${slot.counts[1]}명, 3단계 ${slot.counts[2]}명. 부대 선택 · 추가 모집 및 회수`);}
  else button.setAttribute('aria-label',`${index+1}번 ${SLOTS[index].wall?'성벽 궁병':'성문 앞 보병·기병'} 빈자리 배치`);
 }
 const selectedArmy=selectedSlot!==null?game.slots[selectedSlot]:null;
 $('#army-actions').hidden=!account.ready||game.phase!=='prep'||!selectedArmy;
 $('#sell').hidden=!selectedArmy;
 if(selectedArmy){
  const position=SLOTS[selectedSlot],actions=$('#army-actions');
  actions.style.left=`${position.x*100}%`;actions.style.top=`calc(${position.y*100}% + var(--army-menu-offset,40px))`;
  const spec=TROOPS[selectedArmy.type];$('#sell').textContent=`회수 · +${game.refundValue(selectedSlot)}G`;
  $('#sell').setAttribute('aria-label',`${selectedSlot+1}번 ${spec.name} 부대 회수 · ${game.refundValue(selectedSlot)}골드 환급`);
  $('#add-unit').textContent=`추가 모집 · ${spec.cost}G`;
  $('#add-unit').setAttribute('aria-label',`${selectedSlot+1}번 ${spec.name} 1명 추가 모집 · ${spec.cost}골드`);
  $('#add-unit').disabled=game.phase!=='prep'||game.gold<spec.cost||selectedArmy.counts[2]>=5;
 }

 updateUnitStats();
 $('#squad-summary').textContent=selectedArmy?`${TROOPS[selectedArmy.type].name} 부대 · 1단계 ${selectedArmy.counts[0]} · 2단계 ${selectedArmy.counts[1]} · 3단계 ${selectedArmy.counts[2]} · HP ${Math.ceil(squadHealth(selectedArmy).hp)}/${squadHealth(selectedArmy).maxHp}`:'빈자리는 배치 · 기존 부대는 선택 → 추가 모집 / 회수';
 for(const card of document.querySelectorAll('[data-troop]'))card.disabled=!account.ready||game.phase!=='prep'||!assetsReady;
 if(['cleared','lost','won'].includes(game.phase)&&reportedPhase!==game.phase){
  reportedPhase=game.phase;account.checkpoint(commands);if(['cleared','won'].includes(game.phase))clearedStage=game.wave;$('#reward-status').textContent=`최고 ${clearedStage}단계 클리어 · 종료 시 ${rewardForStage(clearedStage)}P`;$('#result').hidden=false;
  $('#result-kicker').textContent=game.phase==='won'?'VICTORY · KOV 1887':game.phase==='cleared'?'WAVE CLEAR':'DEFENSE FAILED';
  $('#result-title').textContent=game.phase==='won'?'1887의 성벽을 지켰어요!':game.phase==='cleared'?`${game.wave}웨이브 방어 성공!`:'성문이 무너졌어요';
  $('#result-copy').textContent=game.phase==='lost'?'병력을 합체하고 다시 도전해보세요.':`클리어 보상 금화 +${game.reward}\n${game.phase==='won'?`10웨이브 완주 · ${game.kills}명 격퇴`:'병력을 보충하고 다음 웨이브를 준비하세요.'}`;
  $('#result-action').textContent=game.phase==='cleared'?'다음 웨이브 준비 →':'정산하고 다시 도전';
  if(['lost','won'].includes(game.phase))queueMicrotask(finishRun);
 }
 if(settled){$('#result-action').textContent='새 도전 시작';$('#result-finish').hidden=true;}
}
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
 if(!assetsReady)return;
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
    sprite(images.troops,troopRects[slot.type][tier],x,y,(slot.type==='cavalry'?194:173)+tier*13,lean);
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
let lastUI=0;
function frame(now){
 const dt=Math.min((now-lastTime)/1000,.1);lastTime=now;
 if(!paused&&assetsReady&&game.phase==='battle'){accumulator+=dt*speed;while(accumulator>=1/60&&game.phase==='battle'){game.step(1/60);accumulator-=1/60;}}
 if(now-lastUI>100){updateUI();lastUI=now;}
 draw();requestAnimationFrame(frame);
}
async function init(){
 try{
  await Promise.all([loadImage('background','./assets/defense/battlefield.png'),loadImage('troops','./assets/defense/troops.png'),loadImage('run','./assets/defense/enemy-run.png'),loadImage('pad','./assets/defense/stone-pad.png'),loadImage('fx','./assets/defense/combat-fx.png')]);
  // Uniform scale + a torso-focused crop: never stretch full-body sprites into cards.
  const updatePortrait=element=>{
   const layout=portraitLayout(element.dataset.portrait,element.clientWidth,element.clientHeight);if(!layout)return;
   element.style.backgroundImage='url("./assets/defense/troops.png")';
   element.style.backgroundSize=`${layout.imageWidth}px ${layout.imageHeight}px`;
   element.style.backgroundPosition=`${layout.x}px ${layout.y}px`;
  };
  const portraits=[...document.querySelectorAll('[data-portrait]')];portraits.forEach(updatePortrait);
  const portraitObserver=new ResizeObserver(entries=>entries.forEach(entry=>updatePortrait(entry.target)));portraits.forEach(element=>portraitObserver.observe(element));
  assetsReady=true;$('#loading').hidden=true;updateUI();lastTime=performance.now();requestAnimationFrame(frame);
 }catch(error){$('#loading').querySelector('p').textContent='전장 이미지를 불러오지 못했어요. 새로고침해주세요.';console.error(error);}
}
updateUI();init();
