import {renderRankEmblem} from './tg-badge.js?v=1';
import {client,user,authReady,showAuth,friendly} from './auth.js?v=2';
import {rankForPoints,LEVEL_STEP,TG_STEP} from './ranks.js?v=1';
const $ = selector => document.querySelector(selector);
const menu = $('.main-nav');
$('.menu-toggle').addEventListener('click',()=>$('.menu-toggle').setAttribute('aria-expanded',String(menu.classList.toggle('open'))));
$('#gate-login').addEventListener('click',showAuth);
const format = number => Number(number).toLocaleString('ko-KR');
$('#rank-rules').textContent = `Lv.1~30은 ${format(LEVEL_STEP)}P마다, 이후 TG1~TG10은 ${format(TG_STEP)}P마다 성장해요.`;
const kindLabels = {post:'갤러리 글 등록',comment:'댓글 등록',attendance:'출석체크',post_deleted:'글 삭제 · 포인트 회수',comment_deleted:'댓글 삭제 · 포인트 회수'};
let generation=0,historyPage=0,loadingHistory=false,ready=false;
function errorMessage(error){return /PGRST202|PGRST205|42883|42P01/.test(error?.code||'') ? '포인트 기능을 준비하고 있어요. 설정 완료 후 다시 방문해주세요.' : friendly(error);}
async function loadHistory(reset=false){
 if(!user || (loadingHistory&&!reset)) return;
 loadingHistory=true; $('#history-more').disabled=true;
 const member=user.id, ticket=generation;
 if(reset){historyPage=0;$('#point-history').replaceChildren();}
 try{
  const {data,error,count}=await client.from('point_events').select('id,kind,delta,created_at',{count:'exact'}).eq('user_id',member).order('created_at',{ascending:false}).order('id',{ascending:false}).range(historyPage*20,(historyPage+1)*20-1);
  if(ticket!==generation || user?.id!==member)return;
  if(error)throw error;
  for(const event of data){
   const li=document.createElement('li'),text=document.createElement('span'),time=document.createElement('time'),amount=document.createElement('b');
   text.textContent=kindLabels[event.kind]||'활동 포인트';time.dateTime=event.created_at;time.textContent=new Date(event.created_at).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'});
   amount.textContent=`${event.delta>0?'+':''}${format(event.delta)}P`;if(event.delta<0)amount.className='negative';
   text.append(time);li.append(text,amount);$('#point-history').append(li);
  }
  historyPage++;$('#history-more').hidden=historyPage*20>=count;$('#history-status').textContent=count?'':'첫 활동을 시작하고 포인트를 모아보세요.';
 }catch(error){if(ticket===generation)$('#history-status').textContent=errorMessage(error);}
 finally{if(ticket===generation){loadingHistory=false;$('#history-more').disabled=false;}}
}
async function refresh(){
 const ticket=++generation;$('#member-content').hidden=true;$('#login-gate').hidden=Boolean(user);$('#member-status').textContent='';$('#point-history').replaceChildren();$('#history-more').hidden=true;
 if(!user)return;
 const member=user.id;$('#member-status').textContent='내 기록을 불러오고 있어요.';
 try{
  const {data,error}=await client.rpc('kov_my_activity');
  if(ticket!==generation || user?.id!==member)return;
  if(error)throw error;
  const rank=rankForPoints(data.points);
  renderRankEmblem($('.castle-emblem'),rank);
  $('#my-nickname').textContent=user.user_metadata?.nickname||'KOV 멤버';$('#my-rank').textContent=rank.label;
  $('.rank-panel').classList.toggle('is-tg',rank.isTG);$('#my-points').textContent=format(data.points);
  $('#rank-target').textContent=rank.nextLabel?`다음 등급 ${rank.nextLabel}`:'최고 등급 달성';$('#rank-percent').textContent=`${rank.progress}%`;
  $('#rank-progress').value=rank.progress;$('#rank-remaining').textContent=rank.nextLabel?`${format(rank.remaining)}P를 더 모으면 ${rank.nextLabel}이 돼요.`:'TG10! KOV와 함께 쌓아온 멋진 기록이에요.';
  $('#today-date').textContent=`${data.today} · 한국 시간`;$('#check-in').disabled=data.checked_in;$('#check-in').textContent=data.checked_in?'오늘 출석 완료 ✓':'오늘 출석하고 +1P';
  $('#my-posts').textContent=format(data.posts);$('#my-comments').textContent=format(data.comments);$('#my-attendance').textContent=format(data.attendance_days);
  $('#member-content').hidden=false;$('#member-status').textContent='';await loadHistory(true);
 }catch(error){if(ticket===generation)$('#member-status').textContent=errorMessage(error);}
}
$('#check-in').addEventListener('click',async()=>{
 if(!user)return showAuth();
 $('#check-in').disabled=true;const member=user.id;
 try{
  const {data,error}=await client.rpc('kov_check_in');if(error)throw error;if(user?.id!==member)return;
  await refresh();$('#member-status').textContent=data?'출석 완료! 1P가 쌓였어요.':'오늘은 이미 출석했어요.';
 }catch(error){$('#member-status').textContent=errorMessage(error);$('#check-in').disabled=false;}
});
$('#history-more').addEventListener('click',()=>loadHistory());
let lastUserId;
document.addEventListener('kov:session',()=>{if(ready && lastUserId!==user?.id){lastUserId=user?.id;refresh();}});
if(await authReady){ready=true;lastUserId=user?.id;await refresh();}
else $('#member-status').textContent='회원 서비스에 연결하지 못했어요. 새로고침 후 다시 시도해주세요.';
// Catch a new KST day and activity performed in another tab.
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&ready&&user)refresh();});
