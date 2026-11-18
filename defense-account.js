import {client,user,authReady,showAuth,friendly} from './auth.js?v=2';
import {REPLAY_VERSION} from './defense-replay.js';
const $=s=>document.querySelector(s);
export function createAccountGame(onSessionChange){
 let run=null,member=null,ticket=0,busy=false;
 const key=id=>`kov-defense-pending:${id}`;
 const storage={get(id){try{return JSON.parse(localStorage.getItem(key(id))||'null');}catch{return null;}},set(id,value){try{localStorage.setItem(key(id),JSON.stringify(value));}catch{}},remove(id){try{localStorage.removeItem(key(id));}catch{}}};
 function message(text){$('#account-status').textContent=text;}
 function gate(text){$('#account-gate').hidden=false;message(text);}
 async function open(){
  const attempt=++ticket;run=null;member=user?.id||null;const id=member;onSessionChange();
  $('#account-retry').hidden=!member;$('#game-login').hidden=Boolean(member);
  if(!member){gate('로그인하고 성벽을 지켜보세요. 보상은 내 계정에 적립돼요.');return;}
  gate('게임 계정을 연결하고 있어요…');
  try{
   const pending=storage.get(id);
   if(pending){const {data,error}=await client.functions.invoke('defense-reward',{body:pending});if(error||data?.error)throw new Error('이전 게임의 보상 저장이 남아 있어요. 다시 연결을 눌러 재시도해주세요.');storage.remove(id);}
   if(attempt!==ticket||user?.id!==id)return;
   const {data,error}=await client.rpc('kov_defense_begin');
   if(attempt!==ticket||user?.id!==member)return;
   if(error||!data?.id)throw new Error('게임 보상 서버 설정이 필요해요. 운영자가 설정을 마치면 다시 연결해주세요.');
   run=data;$('#account-gate').hidden=true;
   $('#game-member').textContent=`${user.user_metadata?.nickname||'KOV 멤버'}의 도전`;
  }catch(error){if(attempt===ticket)gate(error.message||friendly(error));}
 }
 async function settle(commands){
  if(busy||!run||user?.id!==member)throw new Error('계정 연결을 확인해주세요.');
  busy=true;const id=member,runId=run.id;
  const body={run_id:runId,version:REPLAY_VERSION,commands:structuredClone(commands)};
  storage.set(id,body);
  try{
   const {data,error}=await client.functions.invoke('defense-reward',{body});
   if(error||data?.error)throw new Error(data?.error||'보상을 저장하지 못했어요. 다시 눌러 재시도해주세요.');
   storage.remove(id);
   if(user?.id!==id||run?.id!==runId)throw new Error('계정이 변경됐어요. 마이페이지에서 적립 내역을 확인해주세요.');
   run=null;return data;
  }finally{busy=false;}
 }
 $('#account-retry').addEventListener('click',()=>open());
 $('#game-login').addEventListener('click',showAuth);
 let previous;
 document.addEventListener('kov:session',()=>{if(previous!==user?.id){previous=user?.id;open();}});
 authReady.then(ok=>{if(ok&&previous===undefined){previous=user?.id;open();}else if(!ok)gate('회원 서비스에 연결하지 못했어요. 새로고침해주세요.');});
 return {get ready(){return Boolean(run)&&member===user?.id&&!busy;},settle,restart:open,checkpoint(commands){if(run&&member===user?.id)storage.set(member,{run_id:run.id,version:REPLAY_VERSION,commands:structuredClone(commands)});}};
}
