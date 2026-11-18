const $ = (selector) => document.querySelector(selector);
const menu = $('.main-nav');
$('.menu-toggle').addEventListener('click', () => {
  const open = menu.classList.toggle('open');
  $('.menu-toggle').setAttribute('aria-expanded', String(open));
});
document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
const config = window.KOV_GALLERY_CONFIG || {};
let client, user, signup = false, page = 0, selectedPost, previewUrl;
const pageSize = 12;
const redirectTo = new URL('./gallery.html', location.href).href;
const status = (selector, message) => { $(selector).textContent = message; };
function friendly(error) {
  const message = error?.message || '';
  if (/invalid login credentials/i.test(message)) return '이메일이나 비밀번호를 확인해주세요.';
  if (/email not confirmed/i.test(message)) return '이메일에 도착한 확인 링크를 먼저 눌러주세요.';
  if (/rate limit|too many/i.test(message)) return '요청이 많아요. 잠시 후 다시 시도해주세요.';
  if (/already registered/i.test(message)) return '이미 가입한 이메일이에요. 로그인해주세요.';
  if (/relation|schema cache|row.level|permission denied|bucket not found/i.test(message)) return '갤러리 저장소 설정 중이에요. 잠시 후 다시 이용해주세요.';
  if (/fetch|network/i.test(message)) return '연결을 확인하고 다시 시도해주세요.';
  return '처리하지 못했어요. 잠시 후 다시 시도해주세요.';
}
function setMember(session) {
  user = session?.user || null;
  $('#member-name').textContent = user ? (user.user_metadata?.nickname || 'KOV 멤버') : '';
  $('#auth-button').hidden = Boolean(user);
  $('#logout-button').hidden = !user;
  if (selectedPost) $('#delete-button').hidden = selectedPost.author_id !== user?.id;
}
function requireClient() {
  if (client) return true;
  status('#status', '갤러리 연결을 준비하고 있어요. 잠시 후 다시 방문해주세요.');
  return false;
}
function showAuth() {
  if (!requireClient()) return;
  status('#auth-status', '');
  $('#auth-dialog').showModal();
}
$('#auth-button').addEventListener('click', showAuth);
$('#write-button').addEventListener('click', () => {
  if (!requireClient()) return;
  if (!user) return showAuth();
  status('#write-status', '');
  $('#write-dialog').showModal();
});
$('#auth-switch').addEventListener('click', () => {
  signup = !signup;
  $('#nickname-label').hidden = !signup;
  $('#nickname').required = signup;
  $('#auth-title').textContent = signup ? 'KOV에 오신 걸 환영해요.' : '다시 만나요.';
  $('#auth-description').textContent = signup ? '게임 닉네임으로 함께 기록해요.' : '로그인하고 KOV의 순간을 나눠보세요.';
  $('#auth-submit').textContent = signup ? '회원가입' : '로그인';
  $('#auth-switch').textContent = signup ? '이미 계정이 있나요? 로그인' : '처음 오셨나요? 회원가입';
  $('#password').autocomplete = signup ? 'new-password' : 'current-password';
  $('#reset-password').hidden = signup;
  status('#auth-status', '');
});
$('#auth-form').addEventListener('submit', async event => {
  event.preventDefault();
  $('#auth-submit').disabled = true;
  status('#auth-status', '처리 중이에요…');
  try {
    const credentials = {email: $('#email').value.trim(), password: $('#password').value};
    let result;
    if (signup) {
      const nickname = $('#nickname').value.trim();
      if (!nickname) throw new Error('nickname');
      result = await client.auth.signUp({...credentials, options: {emailRedirectTo: redirectTo, data: {nickname}}});
    } else result = await client.auth.signInWithPassword(credentials);
    if (result.error) throw result.error;
    $('#password').value = '';
    if (result.data.session) { setMember(result.data.session); $('#auth-dialog').close(); }
    else status('#auth-status', '확인 메일을 보냈어요. 이메일의 링크를 누르면 가입이 완료돼요.');
  } catch(error) { status('#auth-status', error.message === 'nickname' ? '게임 닉네임을 입력해주세요.' : friendly(error)); }
  finally { $('#auth-submit').disabled = false; }
});
$('#logout-button').addEventListener('click', async () => {
  const {error} = await client.auth.signOut();
  if (error) status('#status', friendly(error));
  else { setMember(null); $('#write-dialog').close(); }
});
$('#reset-password').addEventListener('click', async () => {
  if (!$('#email').reportValidity()) return;
  $('#reset-password').disabled = true;
  try {
    const {error} = await client.auth.resetPasswordForEmail($('#email').value.trim(), {redirectTo});
    if (error) throw error;
    status('#auth-status', '이메일로 비밀번호 재설정 링크를 보냈어요.');
  } catch(error) { status('#auth-status', friendly(error)); }
  finally { $('#reset-password').disabled = false; }
});
$('#reset-form').addEventListener('submit', async event => {
  event.preventDefault();
  const button = $('#reset-form button[type=submit]'); button.disabled = true;
  try {
    const {error} = await client.auth.updateUser({password: $('#new-password').value});
    if (error) throw error;
    $('#new-password').value = '';
    status('#reset-status', '변경했어요. 새 비밀번호로 로그인할 수 있어요.');
  } catch(error) { status('#reset-status', friendly(error)); }
  finally { button.disabled = false; }
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
    status('#detail-status', ''); $('#detail-dialog').showModal();
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
    $('#write-dialog').close(); await loadPosts(true);
  } catch(error) {
    if (uploadedPath) await client.storage.from('gallery').remove([uploadedPath]);
    status('#write-status', friendly(error));
  } finally { $('#post-submit').disabled = false; }
});
$('#delete-button').addEventListener('click', async () => {
  if (!selectedPost || selectedPost.author_id !== user?.id || !confirm('이 사진과 글을 삭제할까요?')) return;
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
async function init() {
  if (!config.url || !config.publicKey) return requireClient();
  try {
    const {createClient} = await import('https://esm.sh/@supabase/supabase-js@2.49.8');
    client = createClient(config.url,config.publicKey);
    client.auth.onAuthStateChange((event,session) => {
      setMember(session);
      if (event === 'PASSWORD_RECOVERY') $('#reset-dialog').showModal();
    });
    const {data,error} = await client.auth.getSession();
    if (error) throw error;
    setMember(data.session);
    await loadPosts(true);
  } catch(error) { status('#status','갤러리에 연결하지 못했어요. 연결을 확인하고 새로고침해주세요.'); }
}
init();
