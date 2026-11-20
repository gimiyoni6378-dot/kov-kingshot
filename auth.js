import {createAdminAccess} from './admin-access.js?v=1';
import {createMemberHeader} from './member-header.js?v=1';
const $ = selector => document.querySelector(selector);
document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
const config = window.KOV_GALLERY_CONFIG || {};
export let client, user;
const memberHeader=createMemberHeader($('#member-name'),()=>client,()=>user);
const adminAccess=createAdminAccess(()=>client,()=>user);
let signup = false;
const redirectTo = new URL('./gallery.html', location.href).href;
const status = (selector, message) => { $(selector).textContent = message; };
export function friendly(error) {
  const message = error?.message || '';
  if (/invalid login credentials/i.test(message)) return '이메일이나 비밀번호를 확인해주세요.';
  if (/email address.*not authorized|email.*not allowed/i.test(message)) return '확인 메일 발송 설정이 필요해요. 운영자에게 문의해주세요.';
  if (/email not confirmed/i.test(message)) return '이메일에 도착한 확인 링크를 먼저 눌러주세요.';
  if (/rate limit|too many/i.test(message)) return '요청이 많아요. 잠시 후 다시 시도해주세요.';
  if (/already registered/i.test(message)) return '이미 가입한 이메일이에요. 로그인해주세요.';
  if (/relation|schema cache|row.level|permission denied|bucket not found/i.test(message)) return '갤러리 저장소 설정 중이에요. 잠시 후 다시 이용해주세요.';
  if (/fetch|network/i.test(message)) return '연결을 확인하고 다시 시도해주세요.';
  return '처리하지 못했어요. 잠시 후 다시 시도해주세요.';
}
function setMember(session) {
  user = session?.user || null;
  adminAccess.reset();
  memberHeader.setMember(user);
  $('#auth-button').hidden = Boolean(user);
  $('#logout-button').hidden = !user;
  if ($('#signup-button')) $('#signup-button').hidden = Boolean(user);
  document.dispatchEvent(new CustomEvent('kov:session'));
  // Supabase auth callbacks must return before issuing another API request.
  setTimeout(()=>adminAccess.refresh(),0);
}
function requireClient() {
  if (client) return true;
  status('#auth-status', '회원 서비스에 연결 중이에요. 잠시 후 다시 시도해주세요.');
  if (!$('#auth-dialog').open) $('#auth-dialog').showModal();
  return false;
}
export function showAuth() {
  if (!requireClient()) return;
  status('#auth-status', '');
  $('#auth-dialog').showModal();
}
$('#auth-button').addEventListener('click', showAuth);
function setMode(mode) {
  signup = mode;
  $('#nickname-label').hidden = !signup;
  $('#nickname').required = signup;
  $('#auth-title').textContent = signup ? 'KOV에 오신 걸 환영해요.' : '다시 만나요.';
  $('#auth-description').textContent = signup ? '게임 닉네임으로 함께 기록해요.' : '로그인하고 KOV의 순간을 나눠보세요.';
  $('#auth-submit').textContent = signup ? '회원가입' : '로그인';
  $('#auth-switch').textContent = signup ? '이미 계정이 있나요? 로그인' : '처음 오셨나요? 회원가입';
  $('#password').autocomplete = signup ? 'new-password' : 'current-password';
  $('#reset-password').hidden = signup;
  status('#auth-status', '');
}
$('#auth-switch').addEventListener('click', () => setMode(!signup));
$('#signup-button')?.addEventListener('click', () => {setMode(true); showAuth();});
$('#auth-button').addEventListener('click', () => setMode(false));
$('#auth-form').addEventListener('submit', async event => {
  event.preventDefault();
  if (!client) return requireClient();
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
  if (error) { showAuth(); status('#auth-status', friendly(error)); }
  else { setMember(null); $('#write-dialog')?.close(); }
});
$('#reset-password').addEventListener('click', async () => {
  if (!client) return requireClient();
  if (!$('#email').value.trim() || !$('#email').reportValidity()) return status('#auth-status','이메일을 입력해주세요.');
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

export const authReady = (async () => {
  try {
    const {createClient} = await import('https://esm.sh/@supabase/supabase-js@2.49.8');
    client = createClient(config.url, config.publicKey);
    client.auth.onAuthStateChange((event,session) => {
      setMember(session);
      if (event === 'PASSWORD_RECOVERY') $('#reset-dialog').showModal();
    });
    const {data,error} = await client.auth.getSession();
    if (error) throw error;
    setMember(data.session);
    return true;
  } catch {
    status('#auth-status','회원 서비스에 연결하지 못했어요. 새로고침 후 다시 시도해주세요.');
    return false;
  }
})();
