const menuButton = document.querySelector('.menu-toggle');
const menu = document.querySelector('.main-nav');

menuButton.addEventListener('click', () => {
  const expanded = menu.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(expanded));
  menuButton.setAttribute('aria-label', expanded ? '메뉴 닫기' : '메뉴 열기');
});

menu.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    menu.classList.remove('open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', '메뉴 열기');
  });
});

const copyButton = document.querySelector('#copy-message');
copyButton.addEventListener('click', async () => {
  const hint = document.querySelector('#copy-hint');
  const message = '안녕하세요! KOV 이주에 관심이 있어 문의드립니다.';
  try {
    await navigator.clipboard.writeText(message);
    hint.textContent = '문의 문구를 복사했어요. 게임에서 KOV 간부에게 보내주세요!';
  } catch {
    hint.textContent = `게임 내 KOV 간부에게 보내주세요: “${message}”`;
  }
});
