import {hiddenRoll,seedFromRunId} from './defense-engine.js?v=7';
import {verifyReplay,BALANCE_VERSION} from './defense-replay.js?v=5';
// Non-UUID fixture ID cannot be submitted as a real account game session.
let candidate=0;
while(hiddenRoll(seedFromRunId(`fire-mage-practice:${candidate}`),1)>=.01)candidate++;
export const PRACTICE_RUN_ID=`fire-mage-practice:${candidate}`;
export function createAccountGame(onSessionChange,onRunReady){
 let ready=false;
 function restart(){ready=false;onSessionChange();onRunReady(PRACTICE_RUN_ID);ready=true;document.querySelector('#account-gate').hidden=true;document.querySelector('#game-member').textContent='테스트 전용 · 화염 마법사 확정 등장';}
 document.querySelector('#practice-reset').addEventListener('click',restart);
 queueMicrotask(restart);
 return {get ready(){return ready;},restart,checkpoint(){},async settle(commands){
  const result=verifyReplay(commands,BALANCE_VERSION,PRACTICE_RUN_ID);ready=false;
  return {...result,awarded:0,points:0};
 }};
}
