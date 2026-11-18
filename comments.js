import {client,user,showAuth,friendly} from './auth.js?v=2';
const $=selector=>document.querySelector(selector);
let postId,offset=0,version=0,loading=false;
function setupError(error){return /PGRST205|42P01/.test(error?.code||'')?'댓글 기능을 준비하고 있어요. 설정 완료 후 다시 이용해주세요.':friendly(error);}
function updateSession(){
 $('#comment-form').hidden=!user;$('#comment-login').hidden=Boolean(user);
 for(const button of document.querySelectorAll('[data-comment-owner]'))button.hidden=button.dataset.commentOwner!==user?.id;
}
document.addEventListener('kov:session',updateSession);
$('#comment-login').addEventListener('click',showAuth);
export function openComments(id){postId=id;$('#comment-body').value='';updateSession();load(true);}
async function load(reset=false){
 if(!postId || (loading&&!reset))return;
 if(reset){version++;offset=0;$('#comments-list').replaceChildren();$('#comments-more').hidden=true;}
 const ticket=version,id=postId;loading=true;$('#comments-more').disabled=true;
 $('#comments-status').textContent=reset?'댓글을 불러오고 있어요.':'';
 try{
  const {data,error,count}=await client.from('gallery_comments').select('*',{count:'exact'}).eq('post_id',id).order('created_at').order('id').range(offset,offset+19);
  if(ticket!==version)return;if(error)throw error;
  for(const comment of data){
   const li=document.createElement('li'),meta=document.createElement('div'),name=document.createElement('strong'),time=document.createElement('time'),body=document.createElement('p'),remove=document.createElement('button');
   meta.className='comment-meta';name.textContent=comment.nickname;time.dateTime=comment.created_at;time.textContent=new Date(comment.created_at).toLocaleDateString('ko-KR',{timeZone:'Asia/Seoul'});name.append(time);
   body.textContent=comment.body;remove.type='button';remove.className='text-button';remove.textContent='삭제';remove.setAttribute('aria-label',`${comment.nickname}의 댓글 삭제`);remove.dataset.commentOwner=comment.author_id;remove.hidden=comment.author_id!==user?.id;
   remove.addEventListener('click',async()=>{
    if(comment.author_id!==user?.id || !confirm('댓글을 삭제할까요? 지급된 1P도 회수돼요.'))return;
    remove.disabled=true;
    try{
     const {data,error}=await client.from('gallery_comments').delete().eq('id',comment.id).eq('author_id',user.id).select('id');
     if(error)throw error;if(!data.length)throw new Error('permission denied');
     if(id===postId)await load(true);
    }catch(error){$('#comments-status').textContent=setupError(error);remove.disabled=false;}
   });
   meta.append(name,remove);li.append(meta,body);$('#comments-list').append(li);
  }
  offset+=data.length;$('#comments-more').hidden=offset>=count;$('#comments-status').textContent=count?`댓글 ${count}개`:'첫 이야기를 남겨주세요.';
 }catch(error){if(ticket===version)$('#comments-status').textContent=setupError(error);}
 finally{if(ticket===version){loading=false;$('#comments-more').disabled=false;}}
}
$('#comments-more').addEventListener('click',()=>load());
$('#comment-form').addEventListener('submit',async event=>{
 event.preventDefault();if(!user)return showAuth();
 const body=$('#comment-body').value.trim(),id=postId;if(!body)return $('#comments-status').textContent='댓글 내용을 입력해주세요.';
 $('#comment-submit').disabled=true;
 try{
  const {error}=await client.from('gallery_comments').insert({post_id:id,author_id:user.id,nickname:(user.user_metadata?.nickname||'KOV 멤버').slice(0,24),body});
  if(error)throw error;
  if(id===postId){$('#comment-body').value='';await load(true);$('#comments-status').textContent='댓글을 등록했어요. +1P가 쌓였어요.';}
 }catch(error){if(id===postId)$('#comments-status').textContent=setupError(error);}
 finally{$('#comment-submit').disabled=false;}
});
updateSession();
