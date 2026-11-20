import {POSTS_PER_PAGE,SEARCH_FIELDS,literalSearch,pageGroup} from './board-utils.js?v=1';
import {bindLanguageValidation,moderationError} from './moderation.js?v=1';
import {canDeletePost,deleteGalleryPost} from './gallery-delete.js?v=1';
import {openComments} from './comments.js?v=6';
import {authorIdentity,refreshAuthorRanks} from './author-ranks.js?v=1';
import {client, user, authReady, showAuth, friendly} from './auth.js?v=3';
const $ = (selector) => document.querySelector(selector);
const menu = $('.main-nav');
$('.menu-toggle').addEventListener('click', () => {
  const open = menu.classList.toggle('open');
  $('.menu-toggle').setAttribute('aria-expanded', String(open));
});
const status = (selector,message) => { $(selector).textContent = message; };
let page = 0, selectedPost, previewUrl, deletingPostId=null;
const pageSize=POSTS_PER_PAGE;let keyword='',searchField='title',postsVersion=0;
const checkPostLanguage=bindLanguageValidation([$('#post-title'),$('#post-body')],$('#write-status'));
$('#write-button').addEventListener('click', () => {
  if (!client || !user) return showAuth();
  status('#write-status',''); $('#write-dialog').showModal();
});
document.addEventListener('kov:session', () => {
  if (selectedPost) $('#delete-button').hidden = !canDeletePost(selectedPost,user);
  for(const button of document.querySelectorAll('[data-post-owner]'))button.hidden=button.dataset.postOwner!==user?.id;
});
function imageUrl(path) { return client.storage.from('gallery').getPublicUrl(path).data.publicUrl; }
function renderPost(post,number){
 const entry=document.createElement('li');entry.className='post-entry post-row';
 const sequence=document.createElement('span');sequence.className='post-number';sequence.textContent=number;
 const button=document.createElement('button');button.type='button';button.className='post-open';
 const title=document.createElement('h3');title.textContent=post.title;button.append(title);
 const author=document.createElement('span');author.className='board-author';author.append(authorIdentity(post));
 const date=document.createElement('time');date.className='post-date';date.dateTime=post.created_at;date.textContent=new Date(post.created_at).toLocaleDateString('ko-KR',{timeZone:'Asia/Seoul'});
 const remove=document.createElement('button');remove.type='button';remove.className='post-delete-button row-delete';remove.textContent='글 삭제';remove.dataset.postOwner=post.author_id;remove.dataset.postId=post.id;remove.hidden=!canDeletePost(post,user);remove.setAttribute('aria-label',`${post.title} · 글 삭제`);remove.addEventListener('click',()=>removePost(post));
 button.addEventListener('click',()=>{
  selectedPost=post;$('#detail-title').textContent=post.title;$('#detail-body').textContent=post.body;
  $('#detail-author').replaceChildren(authorIdentity(post),date.cloneNode(true));
  $('#detail-image').src=imageUrl(post.image_path);$('#detail-image').alt=post.title;
  $('#delete-button').hidden=!canDeletePost(post,user);$('#delete-button').dataset.postId=post.id;
  status('#detail-status','');$('#detail-dialog').showModal();openComments(post.id);
 });
 entry.append(sequence,button,author,date,remove);return entry;
}
function renderPagination(count){
 const total=Math.max(1,Math.ceil(count/pageSize)),group=pageGroup(page,total),container=$('#page-numbers');container.replaceChildren();
 $('#board-pagination').hidden=count===0;$('#page-info').textContent=count?`${page+1} / ${total} 페이지`:'';
 for(const index of group.pages){const button=document.createElement('button');button.type='button';button.className='page-number';button.textContent=index+1;button.setAttribute('aria-label',`${index+1}페이지`);if(index===page)button.setAttribute('aria-current','page');button.addEventListener('click',()=>{page=index;loadPosts();});container.append(button);}
 for(const [selector,target] of [['#pages-previous',group.previous],['#pages-next',group.next]]){const button=$(selector);button.disabled=target===null;button.onclick=()=>{if(target!==null){page=target;loadPosts();}};}
}
async function loadPosts(reset=false){
 if(!client)return;if(reset)page=0;const ticket=++postsVersion;
 $('#post-grid').replaceChildren();$('#board-pagination').hidden=true;status('#status','게시글을 불러오고 있어요.');
 try{
  let query=client.from('gallery_posts').select('*',{count:'exact'});
  if(keyword)query=query.ilike(searchField,`%${literalSearch(keyword)}%`);
  const {data,error,count}=await query.order('created_at',{ascending:false}).order('id',{ascending:false}).range(page*pageSize,(page+1)*pageSize-1);
  if(ticket!==postsVersion)return;if(error)throw error;
  const last=Math.max(0,Math.ceil(count/pageSize)-1);if(page>last){page=last;return loadPosts();}
  data.forEach((post,index)=>$('#post-grid').append(renderPost(post,count-page*pageSize-index)));
  void refreshAuthorRanks(client);$('#post-count').textContent=`${count}개의 글`;
  status('#status',count?'':keyword?'검색 결과가 없어요. 다른 검색어로 찾아보세요.':'첫 사진과 이야기를 남겨주세요.');
  $('#search-summary').textContent=keyword?`${SEARCH_FIELDS[searchField]} ‘${keyword}’ 검색 결과 ${count}건`:'';
  $('#search-reset').hidden=!keyword;renderPagination(count);
 }catch(error){if(ticket===postsVersion)status('#status',friendly(error));}
}
$('#post-search').addEventListener('submit',event=>{event.preventDefault();const field=$('#search-field').value;searchField=Object.hasOwn(SEARCH_FIELDS,field)?field:'title';keyword=$('#search-query').value.trim().slice(0,100);loadPosts(true);});
$('#search-reset').addEventListener('click',()=>{$('#search-query').value='';keyword='';loadPosts(true);});
$('#photo').addEventListener('change', () => {
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  const file = $('#photo').files[0];
  $('#photo-preview').hidden = true; status('#write-status', '');
  if (!file) return;
  if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
    status('#write-status', '5MB 이하 JPG, PNG, WebP 사진을 선택해주세요.'); $('#photo').value = ''; return;
  }
  previewUrl = URL.createObjectURL(file); $('#photo-preview').src = previewUrl; $('#photo-preview').hidden = false;
});
$('#post-form').addEventListener('submit', async event => {
  event.preventDefault(); if (!user) { $('#write-dialog').close(); return showAuth(); }
  const file = $('#photo').files[0], title = $('#post-title').value.trim(), body = $('#post-body').value.trim();
  if(!checkPostLanguage())return;
  if (!file || !title || !body) return status('#write-status','사진, 제목, 이야기를 모두 입력해주세요.');
  $('#post-submit').disabled = true; status('#write-status', '사진과 글을 올리고 있어요…');
  let uploadedPath;
  try {
    const path = `${user.id}/${crypto.randomUUID()}.${({'image/jpeg':'jpg','image/png':'png','image/webp':'webp'})[file.type]}`;
    const upload = await client.storage.from('gallery').upload(path,file,{contentType:file.type,upsert:false});
    if (upload.error) throw upload.error;
    uploadedPath = path;
    const {error} = await client.from('gallery_posts').insert({author_id:user.id,nickname:(user.user_metadata?.nickname || 'KOV 멤버').slice(0,24),title,body,image_path:path});
    if (error) throw error;
    uploadedPath = null;
    $('#post-form').reset(); $('#photo-preview').hidden = true;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    $('#write-dialog').close(); await loadPosts(true); status('#status','글을 등록했어요. 마이페이지에서 활동 포인트를 확인해보세요.');
  } catch(error) {
    if (uploadedPath) await client.storage.from('gallery').remove([uploadedPath]);
    status('#write-status', moderationError(error)||friendly(error));
  } finally { $('#post-submit').disabled = false; }
});
async function removePost(post){
 if(deletingPostId||!canDeletePost(post,user))return;
 if(!confirm('이 사진과 글을 삭제할까요? 연결된 댓글도 삭제되고, 글·댓글로 받은 포인트가 회수돼요.'))return;
 deletingPostId=post.id;
 for(const button of document.querySelectorAll('[data-post-id]'))if(button.dataset.postId===post.id)button.disabled=true;
 try{
  const result=await deleteGalleryPost(client,post,user);
  if(selectedPost?.id===post.id){$('#detail-dialog').close();selectedPost=null;}
  await loadPosts(true);
  status('#status',result.cleanupFailed?'글은 삭제됐어요. 사진 파일 정리는 관리자 확인이 필요해요.':'게시물을 삭제했어요.');
 }catch(error){status(selectedPost?.id===post.id&&$('#detail-dialog').open?'#detail-status':'#status',friendly(error));}
 finally{deletingPostId=null;for(const button of document.querySelectorAll('[data-post-id]'))button.disabled=false;}
}
$('#delete-button').addEventListener('click',()=>{if(selectedPost)removePost(selectedPost);});

if (await authReady) await loadPosts(true);
else status('#status','갤러리에 연결하지 못했어요. 새로고침 후 다시 시도해주세요.');
// Reflect points earned in another tab when returning from the game/mypage.
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&client)void refreshAuthorRanks(client);});
