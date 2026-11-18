import {DefenseGame} from './defense-engine.js';
export const REPLAY_VERSION=1;
export const rewardForStage=stage=>stage===10?100:stage===9?50:stage>=6&&stage<=8?40:stage===5?30:0;
// Only legal preparation commands are accepted. Battles are replayed at the
// same fixed 60 Hz as the browser; the client never supplies a trusted score.
export function verifyReplay(commands){
 if(!Array.isArray(commands)||commands.length>3000)throw new Error('Invalid replay');
 const game=new DefenseGame();let cleared=0,ticks=0;
 for(const cmd of commands){
  if(!cmd||typeof cmd!=='object')throw new Error('Invalid command');
  let ok=false;
  if(cmd.op==='recruit'&&Number.isInteger(cmd.slot)&&cmd.slot>=0&&cmd.slot<6&&['archer','infantry','cavalry'].includes(cmd.type))ok=game.recruit(cmd.slot,cmd.type).ok;
  else if(cmd.op==='sell'&&Number.isInteger(cmd.slot)&&cmd.slot>=0&&cmd.slot<6)ok=game.sell(cmd.slot).ok;
  else if(cmd.op==='next')ok=game.next();
  else if(cmd.op==='start'){
   ok=game.start();if(ok){let waveTicks=0;while(game.phase==='battle'&&waveTicks<36000){game.step(1/60);ticks++;waveTicks++;}if(game.phase==='battle')throw new Error('Battle timeout');if(['cleared','won'].includes(game.phase))cleared=game.wave;}
  }
  if(!ok)throw new Error('Illegal game action');
 }
 return {cleared,points:rewardForStage(cleared),ticks,phase:game.phase};
}
export function recordGame(game){
 const commands=[];
 for(const op of ['recruit','sell','start','next']){
  const original=game[op].bind(game);
  game[op]=(...args)=>{const result=original(...args);if(result===true||result?.ok)commands.push(op==='recruit'?{op,slot:args[0],type:args[1]}:op==='sell'?{op,slot:args[0]}:{op});return result;};
 }
 return commands;
}
