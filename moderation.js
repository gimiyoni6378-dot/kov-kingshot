import {PROFANITY_PATTERNS,ALLOWED_WORDS} from './moderation-rules.js?v=1';
const patterns=PROFANITY_PATTERNS.map(source=>new RegExp(source,'u'));
export const LANGUAGE_NOTICE='욕설이나 비하 표현이 포함되어 있어요. 표현을 수정한 뒤 다시 등록해주세요.';
export function containsProfanity(input){
 let value=String(input||'').normalize('NFKC').toLowerCase().replace(/[\u200b-\u200f\u202a-\u202e\u2060-\u206f\ufeff]/g,'');
 for(const word of ALLOWED_WORDS)value=value.replaceAll(word,' ');
 return patterns.some(pattern=>pattern.test(value));
}
export function moderationError(error){return String(error?.message||'').includes('KOV_PROFANITY')?LANGUAGE_NOTICE:null;}
export function bindLanguageValidation(inputs,status){
 function check(){
  let blocked=false;
  for(const input of inputs){const bad=containsProfanity(input.value);input.setCustomValidity(bad?LANGUAGE_NOTICE:'');input.setAttribute('aria-invalid',String(bad));blocked||=bad;}
  if(blocked){status.textContent=LANGUAGE_NOTICE;status.dataset.languageNotice='true';}
  else if(status.dataset.languageNotice){status.textContent='';delete status.dataset.languageNotice;}
  return !blocked;
 }
 for(const input of inputs){input.addEventListener('input',event=>{if(!event.isComposing)check();});input.addEventListener('compositionend',check);}
 return check;
}
