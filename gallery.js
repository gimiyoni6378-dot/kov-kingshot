import {openComments} from './comments.js?v=1';
import {client, user, authReady, showAuth, friendly} from './auth.js?v=2';
const $ = (selector) => document.querySelector(selector);
const menu = $('.main-nav');
$('.menu-toggle').addEventListener('click', () => {
  const open = menu.classList.toggle('open');
  $('.menu-toggle').setAttribute('aria-expanded', String(open));
});
const status = (selector,message) => { $(selector).textContent = message; };
let page = 0, selectedPost, previewUrl;
const pageSize = 12;
$('#write-button').addEventListener('click', () => {
  if (!client || !user) return showAuth();
  status('#write-status',''); $('#write-dialog').showModal();
});
document.addEventListener('kov:session', () => {
  if (selectedPost) $('#delete-button').hidden = selectedPost.author_id !== user?.id;
});
function imageUrl(path) { return client.storage.from('gallery').getPublicUrl(path).data.publicUrl; }
function renderPost(post) {
  const button = document.createElement('button');
  button.type = 'button'; button.className = 'post-card';
  const image = document.createElement('img'); image.src = imageUrl(post.image_path); image.alt = post.title; image.loading = 'lazy';
  const copy = document.createElement('div'); copy.className = 'post-card-copy';
  const title = document.createElement('h3'); title.textContent = post.title;
  const meta = document.createElement('p'); meta.textContent = `${post.nickname} · ${new Date(post.created_at).toLocaleDateString('ko-KR')}`;
  copy.append(title, meta); button.append(image, copy);
  button.addEventListener('click', () => {
    selectedPost = post;
    $('#detail-title').textContent = post.title; $('#detail-body').textContent = post.body;
    $('#detail-author').textContent = meta.textContent;
    $('#detail-image').src = image.src; $('#detail-image').alt = post.title;
    $('#delete-button').hidden = post.author_id !== user?.id;
    status('#detail-status', ''); $('#detail-dialog').showModal(); openComments(post.id);
  });
  return button;
}
async function loadPosts(reset = false) {
  if (!client) return;
  $('#more-button').disabled = true;
  if (reset) { page = 0; $('#post-grid').replaceChildren(); }
  status('#status', page ? '' : '사진을 불러오고 있어요.');
  try {
    const {data, error, count} = await client.from('gallery_posts').select('*', {count:'exact'})
      .order('created_at', {ascending:false}).order('id', {ascending:false}).range(page * pageSize, (page + 1) * pageSize - 1);
    if (error) throw error;
    data.forEach(post => $('#post-grid').append(renderPost(post)));
    $('#post-count').textContent = `${count}개의 기록`;
    status('#status', count ? '' : '아직 등록된 사진이 없어요. KOV의 첫 순간을 남겨주세요.');
    page += 1; $('#more-button').hidden = page * pageSize >= count;
  } catch(error) { status('#status', friendly(error)); }
  finally { $('#more-button').disabled = false; }
}
$('#more-button').addEventListener('click', () => loadPosts());
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
    status('#write-status', friendly(error));
  } finally { $('#post-submit').disabled = false; }
});
$('#delete-button').addEventListener('click', async () => {
  if (!selectedPost || selectedPost.author_id !== user?.id || !confirm('이 사진과 글을 삭제할까요? 글과 연결된 댓글의 포인트도 회수돼요.')) return;
  $('#delete-button').disabled = true;
  try {
    const {data,error} = await client.from('gallery_posts').delete().eq('id',selectedPost.id).eq('author_id',user.id).select('id');
    if (error) throw error;
    if (!data.length) throw new Error('permission denied');
    const removal = await client.storage.from('gallery').remove([selectedPost.image_path]);
    $('#detail-dialog').close(); selectedPost = null; await loadPosts(true);
    if (removal.error) status('#status','글은 삭제됐어요. 사진 파일 정리는 관리자 확인이 필요해요.');
  } catch(error) { status('#detail-status',friendly(error)); }
  finally { $('#delete-button').disabled = false; }
});

if (await authReady) await loadPosts(true);
else status('#status','갤러리에 연결하지 못했어요. 새로고침 후 다시 시도해주세요.');
