// The referenced Kingshot Data page provides original images for TG1–TG8.
// TG9/TG10 have no source image: keep an honest text badge rather than reuse another tier.
export function tgIconForRank(label) {
  const match = /^TG([1-9]|10)$/.exec(label);
  if (!match || Number(match[1]) > 8) return null;
  return `./assets/tg/tg-${Number(match[1])}.webp`;
}
export function renderRankEmblem(container, rank) {
  const original = container.querySelector('svg');
  let image = container.querySelector('.tg-rank-icon');
  let fallback = container.querySelector('.tg-rank-fallback');
  if (!image) {
    image = document.createElement('img');
    image.className = 'tg-rank-icon'; image.width=48; image.height=48; image.alt='';
    image.hidden=true; container.append(image);
    image.addEventListener('error', () => {if(container.dataset.tgRank){image.hidden=true;fallback.hidden=false;}});
  }
  if (!fallback) {
    fallback=document.createElement('span'); fallback.className='tg-rank-fallback';fallback.hidden=true;container.append(fallback);
  }
  // Adjacent text announces the actual rank. The emblem is decorative.
  original.style.display=rank.isTG?'none':''; image.hidden=true; fallback.hidden=true;
  container.dataset.tgRank=rank.isTG?rank.label:'';
  container.classList.toggle('has-tg-icon',rank.isTG);
  if (!rank.isTG) {image.removeAttribute('src');return;}
  fallback.textContent=rank.label;
  const source=tgIconForRank(rank.label);
  if (source) {image.hidden=false;image.src=source;}
  else {image.removeAttribute('src');fallback.hidden=false;}
}
