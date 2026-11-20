# KOV 1887 — Kingshot Alliance Landing Page

A small, responsive Korean landing page concept for the KOV alliance in Kingshot kingdom 1887.

## Preview locally

Open `index.html` in a browser, or serve this folder with any static file server.

## Page contents

- KOV alliance introduction
- Server 1887 top-alliance message
- Korean-language communication and team unity highlights
- Migration inquiry section with a copyable message

## Assets

Kingshot artwork and logo are used for this fan-made alliance page. Game imagery belongs to its respective rights holders. See the [official Kingshot site](https://www.centurygames.com/games/kingshot/) and [Google Play listing](https://play.google.com/store/apps/details?id=com.run.tower.defense).

The alliance details and ranking wording were supplied by the page requester. Update them if they change.

## 성벽 지키기 회원·포인트 연결

메뉴의 성벽 지키기는 로그인한 회원용입니다. 실제 게임 시작/포인트 적립에는 [Supabase 설정 안내](supabase/DEFENSE-SETUP.md)의 SQL과 Edge Function 배포가 필요합니다. GitHub Pages 배포만으로 서버 설정이 적용되지는 않습니다.

## 글쓴이·댓글 작성자 등급

`supabase/004-author-ranks.sql`을 SQL Editor에서 한 번 실행하면 갤러리 목록·상세·댓글의 닉네임 앞에 현재 Lv/TG 등급이 표시됩니다. 이 조회는 공개된 글·댓글 작성자의 등급만 반환하며 포인트 잔액이나 이메일을 공개하지 않습니다. 게임 Edge Function 재배포는 필요 없습니다. 등급 기준을 바꾸면 `ranks.js`와 이 SQL 함수의 기준도 함께 변경하세요.

## 댓글 보상1P로 변경

기존 프로젝트는 `supabase/005-comment-one-point.sql`만 실행하세요. 신규 설치는002→003→004→005 순서이며005를 마지막에 실행해야 합니다. 이후 새 댓글은1P, 글은10P, 출석은1P입니다. 이미 받은 댓글 보상은 재계산하지 않습니다. 삭제 시 원래 지급액을 조회해 회수하므로 기존10P 댓글은10P, 새1P 댓글은1P만 회수됩니다. 게임 Edge Function은 변경하지 않습니다.

갤러리의 내 글 삭제는 목록 카드와 글 상세 상단에서 사용할 수 있습니다. 다른 계정에는 버튼이 숨겨지며, 실제 삭제는 gallery_delete RLS의 작성자 일치 조건으로 보호합니다. 글 삭제 시 연결 댓글 및 각각의 원래 지급 포인트도 함께 회수됩니다.

## 게시판 목록·검색

갤러리는 한 페이지에 10개 글을 보여줍니다. 페이지 번호는 1~10, 11~20처럼 10개씩 묶이며 이전/다음 묶음 버튼으로 이동합니다. 제목·내용·글쓴이(게시 당시 닉네임)로 부분 검색할 수 있고, 검색 후에도 같은 페이지 규칙을 적용합니다. 목록 제목을 누르면 사진·본문·댓글이 열립니다. 갤러리 상단의 닉네임·로그아웃은 숨기고 로그인·글쓰기 진입을 유지합니다.

## 한국어 욕설 제한

기존 프로젝트는 `supabase/006-content-language.sql` 전체를 SQL Editor에서 한 번 실행하세요. Edge Function 재배포는 필요 없습니다. 프런트엔드는 갤러리 제목·본문과 댓글을 등록하기 전에 검사하며, SQL 적용 후에는 직접 API로 등록하거나 수정하는 경우도 DB 트리거가 차단합니다. 차단된 글·댓글에는 포인트가 지급되지 않습니다. 기존 글·댓글은 변경하지 않습니다.

이는 목록 기반의 텍스트 필터로 모든 비하 표현이나 이미지 속 글자까지 판별하지는 않습니다. 정책은 `moderation/korean-policy.json`에서 관리하고, 변경 후 `node scripts/build-moderation.mjs`로 브라우저 규칙과 SQL을 함께 생성하세요. 변경된 SQL도 다시 실행해야 서버 규칙에 반영됩니다. 입력 중 한글 조합을 방해하지 않으며 허용어와 일반 문장 오탐을 검증합니다.

검증: `node tests/moderation.mjs`, `node tests/board-utils.mjs`, `node tests/gallery-delete.mjs`. 실제 갤러리 컨트롤러의 목록·검색·페이지 이동·상세 열기·업로드 전 차단 테스트는 `DOM_MODULE=<linkedom/worker.js 절대경로> node tests/gallery-board.mjs`, SQL 트리거·권한·포인트 검증은 `PGLITE_MODULE=<pglite/dist/index.js 절대경로> node tests/moderation-sql.mjs`로 실행합니다.

## 게시글 글자 수 제한

제목은 최대 50자, 본문은 최대 1,000자입니다. 한글 완성형 한 글자는 1자로 계산하며 공백과 문장부호도 입력창 제한에 포함합니다. 기존 프로젝트는 `supabase/007-post-length-limits.sql` 전체를 SQL Editor에서 실행하세요. 기존의 긴 글은 삭제하거나 자르지 않고 새로 등록하거나 수정하는 글에 DB 제한을 적용합니다. Edge Function 재배포는 필요 없습니다.
