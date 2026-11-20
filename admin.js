import {client,user,authReady} from './auth.js?v=4';
import {isAdmin} from './admin-access.js?v=1';
const $=selector=>document.querySelector(selector),format=value=>Number(value||0).toLocaleString('ko-KR');
$('.menu-toggle').addEventListener('click',()=>$('.menu-toggle').setAttribute('aria-expanded',String($('.main-nav').classList.toggle('open'))));
let page=0,query='',generation=0,total=0;
const date=value=>value?new Date(value).toLocaleString('ko-KR',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}):'기록 없음';
function clear(){++generation;$('#admin-content').hidden=true;$('#member-rows').replaceChildren();for(const id of ['stats-members','stats-recent','stats-points'])$('#'+id).textContent='—';$('#members-count').textContent='';$('#members-page').textContent='';}
function row(member){
 const tr=document.createElement('tr');
 for(const [value,cls] of [[member.nickname,''],[member.email,''],[member.rank_label,'rank'],[format(member.points)+' P','number'],[date(member.created_at),'admin-date'],[date(member.last_sign_in_at),'admin-date']]){
  const td=document.createElement('td');if(cls==='rank'){const badge=document.createElement('span');badge.className='admin-rank';badge.textContent=value;td.append(badge);}else{td.className=cls;td.textContent=value;}tr.append(td);
 }return tr;
}
async function load(){
 clear();const ticket=generation,member=user?.id;
 if(!member){$('#admin-status').textContent='로그인 후 관리자 계정으로 이용해주세요.';return;}
 if(!isAdmin){$('#admin-status').textContent='관리자 전용 페이지입니다. 권한 설정 전이라면 관리자 SQL을 먼저 적용해주세요.';return;}
 $('#admin-status').textContent='회원 정보를 불러오고 있습니다.';
 try{
  const {data,error}=await client.rpc('kov_admin_members',{p_query:query,p_page:page});
  if(ticket!==generation||user?.id!==member||!isAdmin)return;if(error)throw error;
  total=data.total;const pages=Math.max(1,Math.ceil(total/25));if(page>=pages){page=pages-1;return load();}
  $('#member-rows').replaceChildren(...data.members.map(row));$('#members-count').textContent=query?`검색 결과 ${format(total)}명`:`총 ${format(total)}명`;
  $('#stats-members').textContent=format(data.stats.members);$('#stats-recent').textContent=format(data.stats.recent);$('#stats-points').textContent=format(data.stats.points)+' P';
  $('#members-prev').disabled=page===0;$('#members-next').disabled=page+1>=pages;$('#members-page').textContent=`${page+1} / ${pages}`;$('#members-empty').hidden=total!==0;$('#member-reset').hidden=!query;
  $('#admin-content').hidden=false;$('#admin-status').textContent='';
 }catch(error){if(ticket===generation)$('#admin-status').textContent=error.code==='42501'?'관리 권한이 없습니다.':'회원 정보를 불러오지 못했습니다. 관리자 SQL 적용 여부와 연결 상태를 확인해주세요.';}
}
$('#member-search').addEventListener('submit',event=>{event.preventDefault();query=$('#member-query').value.trim().slice(0,100);page=0;load();});
$('#member-reset').addEventListener('click',()=>{$('#member-query').value='';query='';page=0;load();});
$('#admin-refresh').addEventListener('click',()=>load());
$('#members-prev').addEventListener('click',()=>{if(page>0){page--;load();}});$('#members-next').addEventListener('click',()=>{if((page+1)*25<total){page++;load();}});
document.addEventListener('kov:session',()=>{page=0;query='';$('#member-query').value='';clear();$('#admin-status').textContent='관리 권한을 확인하고 있습니다.';});
document.addEventListener('kov:admin',()=>load());
document.addEventListener('visibilitychange',()=>{if(document.hidden)clear();else load();});
if(await authReady)await load();else $('#admin-status').textContent='회원 서비스에 연결하지 못했습니다. 새로고침 후 다시 시도해주세요.';
