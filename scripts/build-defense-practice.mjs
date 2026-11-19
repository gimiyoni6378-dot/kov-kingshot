import {readFile,writeFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
let js=await readFile(new URL('defense.js',root),'utf8');
js=js.replace("from './defense-account.js?v=6'", "from './defense-practice-account.js?v=1'")
 .replace('플레이 기록 확인 · 포인트 적립 중…','테스트 기록을 정리하고 있어요…')
 .replace('`${settled.cleared}단계 클리어 · +${settled.awarded}P 적립 완료 · 보유 ${Number(settled.points).toLocaleString(\'ko-KR\')}P`','`${settled.cleared}단계 클리어 · 테스트 전용으로 포인트는 적립되지 않아요.`')
 .replace('정산 예정 ${rewardForStage(clearedStage)}P','테스트 전용 · 실제 포인트 적립 없음')
 .replace('종료 시 ${rewardForStage(clearedStage)}P','테스트 전용 · 실제 포인트 적립 없음')
 .replace('정산하고 다시 도전','다시 테스트하기')
 .replace('game.reset(seedFromRunId(runId));updateUI();',"game.reset(seedFromRunId(runId));selectType('wizard');updateUI();")
 .replace('200골드로 새 도전을 시작해요.','화염 마법사를 성벽 빈자리에 배치해보세요.');
if(js.includes("from './defense-account.js")||js.includes('P 적립 완료'))throw new Error('Practice build must not use real account adapter or reward messaging');
await writeFile(new URL('defense-practice.js',root),js);
let html=await readFile(new URL('defense.html',root),'utf8');
html=html.replace('<title>KOV 성벽 지키기 · 병사 배치 디펜스</title>','<title>화염 마법사 플레이 테스트 · KOV</title>')
 .replace('defense.css?v=9','defense.css?v=10')
 .replace('200골드로 병사를 모집해 빈자리에 배치해주세요.','화염 마법사가 선택됐어요. 성벽의 빈 배치칸을 눌러보세요.')
 .replace('<h1>성벽 지키기</h1>','<h1>마법사 테스트</h1>')
 .replace('<section class="game-account">','<p class="practice-banner">화염 마법사 확정 등장 · HP 420 / 공격력 72<br>로그인 없이 배치·전투를 시험해보세요. 실제 계정 포인트는 적립되지 않아요.</p><section class="game-account">')
 .replace('<a href="./mypage.html">내 포인트 →</a>','<a href="./defense.html">실제 게임 →</a>')
 .replace(/<nav aria-label="게임 계정">[\s\S]*?<\/nav>/,'<nav aria-label="테스트 메뉴"><button id="practice-reset" type="button">처음부터 테스트</button><a href="./index.html">홈</a></nav>')
 .replace(/<p class="point-rewards">[\s\S]*?<\/p>/,'<p class="point-rewards">테스트 전용 · 실제 계정 포인트 적립 없음</p>')
 .replace('회원 전용 · 계정 포인트 적립','테스트 전용 · 포인트 적립 없음')
 .replace('회원 전용 게임','화염 마법사 플레이 테스트')
 .replace('종료하고 포인트 받기','테스트 종료')
 .replace('이번 도전 종료 · 보상 정산','테스트 종료')
 .replace('매 웨이브 준비 시 1% 확률로 화염 마법사가 합류하며,','이 테스트에서는 처음부터 화염 마법사가 확정 합류하며,')
 .replace('로그인한 계정으로 플레이해요. 종료 시 최고 클리어 단계에 따라 5단계 30P, 6~8단계 40P, 9단계 50P, 10단계 100P를 한 번 적립해요. 게임 금화는 포인트와 별개예요.','로그인 없이 조작을 시험하는 테스트 페이지예요. 실제 회원 기록이나 포인트에는 반영되지 않아요.')
 .replace(/<dialog id="auth-dialog">[\s\S]*?<\/dialog>/,'')
 .replace(/<dialog id="auth-dialog" class="gallery-dialog">[\s\S]*?<\/dialog>/,'')
 .replace(/<dialog id="reset-dialog" class="gallery-dialog">[\s\S]*?<\/dialog>/,'')
 .replace('<script src="./gallery-config.js"></script>','')
 .replace('src="./defense.js?v=15"','src="./defense-practice.js?v=1"');
if(html.includes('gallery-config.js')||html.includes('id="auth-form"'))throw new Error('Practice page must not initialize account services');
await writeFile(new URL('defense-practice.html',root),html);
