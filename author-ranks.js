import {tgIconForRank} from './tg-badge.js?v=2';
const known=new Map();
let sequence=0;
export function paintAuthorRank(badge,label){
 badge.replaceChildren();badge.className='author-rank';
 if(!/^Lv\.([1-9]|[12]\d|30)$|^TG([1-9]|10)$/.test(label||'')){
  badge.textContent='등급 미확인';badge.classList.add('rank-unavailable');badge.title='작성자 등급을 불러오지 못했어요.';return;
 }
 badge.title=`KOV 활동 등급 ${label}`;
 if(label.startsWith('TG')){
  badge.classList.add('is-tg');const tier=Number(label.slice(2));
  if(tier<=8){const icon=document.createElement('img');icon.src=tgIconForRank(label);icon.alt='';icon.width=22;icon.height=22;icon.addEventListener('error',()=>{icon.hidden=true;});badge.append(icon);}
  else {const icon=document.createElement('span');icon.className='author-tg-generated';icon.dataset.tier=String(tier);icon.setAttribute('aria-hidden','true');badge.append(icon);}
 }
 const text=document.createElement('span');text.textContent=label;badge.append(text);
}
export function authorIdentity(author){
 const wrapper=document.createElement('span');wrapper.className='author-identity';
 const badge=document.createElement('span');badge.dataset.rankAuthor=author.author_id;
 const nickname=document.createElement('span');nickname.className='author-nickname';nickname.textContent=author.nickname;
 if(known.has(author.author_id))paintAuthorRank(badge,known.get(author.author_id));
 else{badge.className='author-rank rank-loading';badge.textContent='등급 확인 중';}
 wrapper.append(badge,nickname);return wrapper;
}
// One batch per page, rather than a request for every nickname. Refresh on
// content changes so newly earned/reversed points update existing badges too.
export async function refreshAuthorRanks(client){
 const ticket=++sequence;
 const ids=[...new Set([...document.querySelectorAll('[data-rank-author]')].map(el=>el.dataset.rankAuthor))];
 if(!ids.length)return;
 const labels=new Map();let failed=false;
 for(let i=0;i<ids.length;i+=100){
  try{const {data,error}=await client.rpc('kov_author_ranks',{p_authors:ids.slice(i,i+100)});if(error)throw error;
   for(const item of data||[])labels.set(item.author_id,item.rank_label);
  }catch{failed=true;}
 }
 if(ticket!==sequence)return;
 for(const id of ids){if(labels.has(id))known.set(id,labels.get(id));else known.delete(id);}
 for(const badge of document.querySelectorAll('[data-rank-author]')){
  if(ids.includes(badge.dataset.rankAuthor))paintAuthorRank(badge,labels.get(badge.dataset.rankAuthor));
 }
 let status=document.querySelector('#author-rank-status');
 if(!status){status=document.createElement('p');status.id='author-rank-status';status.className='author-rank-status';status.setAttribute('role','status');document.querySelector('.gallery-toolbar')?.after(status);}
 status.textContent=failed?'작성자 등급을 불러오지 못했어요. 등급 조회 설정과 연결 상태를 확인해주세요.':'';status.hidden=!failed;
}
