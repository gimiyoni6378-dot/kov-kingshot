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
