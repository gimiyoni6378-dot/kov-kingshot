import {rankForPoints} from './ranks.js?v=1';
import {paintAuthorRank} from './author-ranks.js?v=1';
// Personal activity RPC also works for new members who have never posted.
export function createMemberHeader(container,getClient,getUser){
 let generation=0,timer=null,lastId=null,label=null,badge;
 function setMember(member){
  generation++;clearTimeout(timer);
  if(lastId!==member?.id)label=null;lastId=member?.id;
  container.replaceChildren();container.classList.add('member-identity');
  if(!member){badge=null;return;}
  badge=document.createElement('span');const name=document.createElement('span');name.className='member-nickname';name.textContent=member.user_metadata?.nickname||'KOV 멤버';
  if(label)paintAuthorRank(badge,label);else{badge.className='author-rank rank-loading';badge.textContent='등급 확인 중';}
  container.append(badge,name);
  // Supabase auth callbacks must not await another Supabase request.
  timer=setTimeout(()=>{void refresh();},0);
 }
 async function refresh(){
  const member=getUser(),client=getClient();if(!member||!client||!badge)return;
  const id=member.id,ticket=++generation,target=badge;
  try{
   const {data,error}=await client.rpc('kov_my_activity');if(error||!Number.isFinite(Number(data?.points)))throw error||new Error('Invalid points');
   if(ticket!==generation||getUser()?.id!==id||target!==badge)return;
   label=rankForPoints(data.points).label;paintAuthorRank(target,label);
  }catch{if(ticket===generation&&getUser()?.id===id&&target===badge){label=null;paintAuthorRank(target,null);}}
 }
 document.querySelector('.menu-toggle')?.addEventListener('click',()=>{if(document.querySelector('.main-nav.open'))void refresh();});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)void refresh();});
 return {setMember,refresh};
}
